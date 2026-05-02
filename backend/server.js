const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup multer for memory storage (for easy passing to pdf-parse)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Endpoint to handle resume uploads and job description
app.post('/api/screen', upload.array('resumes'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const files = req.files;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required.' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one resume file is required.' });
    }

    console.log(`Received job description and ${files.length} resumes.`);
    
    // Calculate Job Description Embedding
    const jdEmbedRes = await embedModel.embedContent(jobDescription);
    const jdEmbedding = jdEmbedRes.embedding.values;

    // Parse PDFs
    const candidates = [];
    const validFiles = [];
    const resumeTexts = [];
    
    for (const file of files) {
      if (file.mimetype !== 'application/pdf') {
        candidates.push({
          name: file.originalname,
          score: 0,
          reasoning: 'Error: File must be a PDF.',
          status: 'error'
        });
        continue;
      }
      
      try {
        let textContent = "";
        try {
          const pdfData = await pdfParse(file.buffer);
          textContent = pdfData.text ? pdfData.text.trim() : "";
        } catch (parseErr) {
          console.log(`pdf-parse failed on ${file.originalname}, attempting Gemini fallback...`);
        }

        // Fallback to Gemini vision/OCR if text is empty or too short (scanned PDF)
        if (textContent.length < 50) {
          console.log(`Extracted text is empty or too short for ${file.originalname}, falling back to Gemini OCR...`);
          const prompt = "Extract all the text from this resume PDF. Output ONLY the extracted text, no markdown or conversational filler.";
          const result = await chatModel.generateContent([
            prompt,
            {
              inlineData: {
                data: file.buffer.toString("base64"),
                mimeType: "application/pdf"
              }
            }
          ]);
          textContent = result.response.text();
        }

        if (!textContent || textContent.trim().length === 0) {
          throw new Error("Failed to extract text from PDF even with Gemini OCR.");
        }

        textContent = textContent.substring(0, 25000); // Truncate to avoid massive token usage
        
        validFiles.push(file);
        resumeTexts.push(textContent);
      } catch (err) {
        console.error(`Error parsing PDF ${file.originalname}:`, err);
        let errorMsg = err.message;
        if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
          errorMsg = 'Gemini API Rate Limit Exceeded. Please wait a minute and try again.';
        }
        candidates.push({
          name: file.originalname.replace('.pdf', ''),
          score: 0,
          reasoning: `Extraction Error: ${errorMsg}`,
          status: 'error'
        });
      }
    }

    if (resumeTexts.length > 0) {
      // Process each valid resume to compute score and reasoning
      const tasks = resumeTexts.map(async (text, index) => {
        const file = validFiles[index];
        
        try {
          const embedRes = await embedModel.embedContent(text);
          const embedding = embedRes.embedding.values;
          
          // Compute cosine similarity
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;
          for (let i = 0; i < jdEmbedding.length; i++) {
            dotProduct += jdEmbedding[i] * embedding[i];
            normA += jdEmbedding[i] * jdEmbedding[i];
            normB += embedding[i] * embedding[i];
          }
          // Normalize similarity to 0-1 range
          const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
          // Convert to percentage, clamped between 0 and 100
          const score = Math.max(0, Math.min(100, Math.round(similarity * 100)));

          // Generate Reasoning via Gemini
          const prompt = `System Instructions: You are an expert technical recruiter. Based on the job description and the candidate's resume, provide a concise 1-2 sentence explanation of why they are a good match or what they are lacking.\n\nJob Description:\n${jobDescription}\n\nCandidate Resume:\n${text.substring(0, 5000)}`;

          const result = await chatModel.generateContent(prompt);
          const reasoning = result.response.text().trim();

          candidates.push({
            name: file.originalname.replace('.pdf', ''),
            score,
            reasoning,
            status: 'success'
          });
        } catch (err) {
          console.error(`Error processing candidate ${file.originalname}:`, err);
          let errorMsg = err.message;
          if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
            errorMsg = 'Gemini API Rate Limit Exceeded. Please wait a minute and try again.';
          }
          candidates.push({
            name: file.originalname.replace('.pdf', ''),
            score: 0,
            reasoning: `API Error: ${errorMsg}`,
            status: 'error'
          });
        }
      });

      // Wait for all reasoning calls to finish
      await Promise.all(tasks);
    }

    // Sort by descending score
    candidates.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      results: candidates
    });

  } catch (error) {
    console.error('Error processing screening request:', error);
    res.status(500).json({ error: error.message || 'Internal server error during processing.' });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// The "catch-all" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
