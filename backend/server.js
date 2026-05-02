const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10
  }
});

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY missing in .env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

app.get('/', (req, res) => {
  return res.send('Backend is running. Open http://localhost:5173 for frontend.');
});

app.get('/api/health', (req, res) => {
  return res.json({ ok: true, message: 'Backend is running' });
});

app.post('/api/screen', upload.array('resumes'), async (req, res) => {
  let finished = false;

  const safeJson = (status, payload) => {
    if (!finished && !res.headersSent) {
      finished = true;
      return res.status(status).json(payload);
    }
  };

  const timeout = setTimeout(() => {
    console.error('⏰ Request timed out before response finished');
    safeJson(504, { error: 'Request timed out while processing resumes.' });
  }, 120000);

  try {
    console.log('➡️ /api/screen route entered');

    const { jobDescription } = req.body;
    const files = req.files || [];

    console.log('Job description length:', jobDescription ? jobDescription.length : 0);
    console.log('Files received:', files.length);

    if (!jobDescription || !jobDescription.trim()) {
      clearTimeout(timeout);
      return safeJson(400, { error: 'Job description is required.' });
    }

    if (files.length === 0) {
      clearTimeout(timeout);
      return safeJson(400, { error: 'At least one resume file is required.' });
    }

    console.log('Generating job description embedding...');
    const jdEmbedRes = await embedModel.embedContent(jobDescription);
    const jdEmbedding = jdEmbedRes.embedding.values;
    console.log('✅ JD embedding generated');

    const candidates = [];

    for (const file of files) {
      console.log(`Processing file: ${file.originalname}`);

      if (file.mimetype !== 'application/pdf') {
        candidates.push({
          name: file.originalname,
          score: 0,
          reasoning: 'Only PDF files are supported.',
          learningPath: [],
          roleFit: [],
          status: 'error'
        });
        continue;
      }

      try {
        let resumeText = '';

        try {
          console.log(`Trying pdf-parse on ${file.originalname}`);
          const pdfData = await pdfParse(file.buffer);
          resumeText = (pdfData.text || '').trim();
          console.log(`pdf-parse text length for ${file.originalname}:`, resumeText.length);
        } catch (pdfErr) {
          console.error(`pdf-parse failed for ${file.originalname}:`, pdfErr.message);
        }

        if (!resumeText || resumeText.length < 50) {
          console.log(`Trying Gemini OCR fallback for ${file.originalname}`);
          const extractPrompt =
            'Extract the full plain text from this resume PDF. Return only plain text without markdown or explanation.';

          const extractResult = await chatModel.generateContent([
            extractPrompt,
            {
              inlineData: {
                data: file.buffer.toString('base64'),
                mimeType: 'application/pdf'
              }
            }
          ]);

          resumeText = (extractResult.response.text() || '').trim();
          console.log(`Gemini OCR text length for ${file.originalname}:`, resumeText.length);
        }

        if (!resumeText) {
          throw new Error('Could not extract text from resume.');
        }

        resumeText = resumeText.substring(0, 20000);

        console.log(`Generating embedding for ${file.originalname}`);
        const resumeEmbedRes = await embedModel.embedContent(resumeText);
        const resumeEmbedding = resumeEmbedRes.embedding.values;
        console.log(`✅ Resume embedding done for ${file.originalname}`);

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < jdEmbedding.length; i++) {
          dotProduct += jdEmbedding[i] * resumeEmbedding[i];
          normA += jdEmbedding[i] * jdEmbedding[i];
          normB += resumeEmbedding[i] * resumeEmbedding[i];
        }

        const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        const score = Math.max(0, Math.min(100, Math.round(similarity * 100)));

        console.log(`Generating recruiter analysis for ${file.originalname}`);
        const analysisPrompt = `
You are an expert technical recruiter.

Return ONLY valid JSON in this exact format:
{
  "reasoning": "1-2 sentence concise summary",
  "learningPath": [
    {
      "skill": "Skill name",
      "why": "Why this skill is needed",
      "how_to_learn": "Short practical way to learn it"
    }
  ],
  "roleFit": [
    {
      "role": "Role name",
      "why": "Why the candidate fits this role"
    }
  ]
}

Rules:
- Return only JSON.
- No markdown.
- learningPath maximum 5 items.
- roleFit maximum 4 items.

Job Description:
${jobDescription}

Candidate Resume:
${resumeText.substring(0, 5000)}
`;

        const analysisResult = await chatModel.generateContent(analysisPrompt);
        const rawAnalysis = (analysisResult.response.text() || '').trim();
        console.log(`Raw analysis received for ${file.originalname}`);

        let parsed;
        try {
          const cleaned = rawAnalysis.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch (err) {
          console.error(`JSON parse failed for ${file.originalname}:`, rawAnalysis);
          parsed = {
            reasoning: rawAnalysis || 'Analysis generated but format was invalid.',
            learningPath: [],
            roleFit: []
          };
        }

        candidates.push({
          name: file.originalname.replace(/\.pdf$/i, ''),
          score,
          reasoning: parsed.reasoning || 'No reasoning available.',
          learningPath: Array.isArray(parsed.learningPath) ? parsed.learningPath : [],
          roleFit: Array.isArray(parsed.roleFit) ? parsed.roleFit : [],
          status: 'success'
        });
      } catch (fileErr) {
        console.error(`❌ Error processing ${file.originalname}:`, fileErr);

        candidates.push({
          name: file.originalname.replace(/\.pdf$/i, ''),
          score: 0,
          reasoning: `Processing Error: ${fileErr.message || 'Unknown error'}`,
          learningPath: [],
          roleFit: [],
          status: 'error'
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    clearTimeout(timeout);
    console.log('✅ Sending final JSON response');
    return safeJson(200, {
      success: true,
      results: candidates
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error('❌ Fatal /api/screen error:', error);
    return safeJson(500, {
      error: error.message || 'Internal server error during screening.'
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled middleware error:', err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({
    error: err.message || 'Unhandled server error'
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});