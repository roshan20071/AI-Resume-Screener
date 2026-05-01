# AI Resume Screener

An intelligent, AI-powered resume screening dashboard designed for technical recruiters. Built with React, Tailwind CSS, Node.js, and Google Gemini AI.

## Features
- **Semantic Vector Matching:** Converts Job Descriptions and Resumes into embeddings (gemini-embedding-2) to calculate precise cosine similarity scores.
- **AI Reasoning:** Leverages Gemini 1.5 Flash to provide concise, 1-2 sentence human-readable reasoning for every candidate score.
- **Native OCR:** Automatically detects scanned image-based PDFs and uses Gemini's vision capabilities to extract text when standard parsers fail.
- **Modern Dashboard:** A sleek, fully responsive UI built with Vite and Tailwind CSS v4.

## Setup Instructions

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/roshan20071/AI-Resume-Screener.git
cd AI-Resume-Screener
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd backend
npm install
\`\`\`
Create a \`.env\` file in the \`backend\` directory and add your Google Gemini API key:
\`\`\`env
PORT=5000
GEMINI_API_KEY=your_google_ai_studio_api_key_here
\`\`\`
Start the backend server:
\`\`\`bash
node server.js
\`\`\`

### 3. Frontend Setup
Open a new terminal and navigate to the frontend folder:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Architecture
- **Frontend:** React, Vite, Tailwind CSS v4, Lucide React
- **Backend:** Node.js, Express, Multer (file handling), pdf-parse
- **AI Integration:** Google Generative AI SDK (@google/generative-ai)

## License
MIT License
