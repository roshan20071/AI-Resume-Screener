#  AI-Powered Resume Screener (Recruiter POV)

**A high-performance MERN-stack application that uses semantic search to rank candidates against job descriptions.**

[Live Demo](https://ai-resume-screener-tex3.onrender.com/) | [LinkedIn Project Story](https://www.linkedin.com/in/roshangatadi/)

---

##  The Problem
Traditional Applicant Tracking Systems (ATS) rely on keyword matching, which often misses qualified candidates who use different terminology. This tool solves that by using **Natural Language Processing (NLP)** to understand the *meaning* and *context* of a candidate's experience.

##  Tech Stack
*   **Frontend:** React.js, Tailwind CSS (SaaS-inspired UI), Lucide Icons.
*   **Backend:** Node.js, Express.js.
*   **AI/ML:** OpenAI/Gemini Embeddings (`text-embedding-3-small` or `text-embedding-004`), GPT-4o-mini for reasoning.
*   **Deployment:** Render (PaaS).

##  How It Works (The "Brain")
The core of this project is built on **Vector Space Modeling**. Instead of searching for "React," the system maps the entire Resume and Job Description into a **high-dimensional vector space**.

1.  **PDF Parsing:** Extracts raw text from uploaded resumes using `pdf-parse`.
2.  **Vectorization:** Sends text to the LLM to generate 1536-dimensional embeddings.
3.  **Cosine Similarity:** Calculates the angular distance between the Job Description vector ($A$) and Resume vector ($B$) using the formula:
    $$\text{similarity} = \cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$
4.  **AI Reasoning:** A targeted prompt in **GPT-4o-mini** provides a 1-2 sentence explanation of the match logic for the recruiter.

##  Key Features
*    **Semantic Ranking:** Ranks by relevance, not just keywords.
*    **Bulk Processing:** Handles multiple PDFs in a single screening session.
*    **Recruiter Insights:** Provides "AI Reasoning" to justify the ranking.
*    **Mobile Responsive:** Fully optimized for all devices using a dynamic API routing.

##  Installation & Setup
1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/roshangatadi/ai-resume-screener.git](https://github.com/roshangatadi/ai-resume-screener.git)
    ```
2.  **Install dependencies:**
    ```bash
    cd frontend && npm install
    cd ../backend && npm install
    ```
3.  **Environment Variables:**
    Create a `.env` in the `/backend` folder:
    ```env
    OPENAI_API_KEY=your_key_here
    PORT=5000
    ```
4.  **Run locally:**
    ```bash
    npm run dev # for frontend
    node server.js # for backend
    ```

---

### **About the Author**
**Roshan Gatadi**
*   2nd Year B.Tech CSE (AI & ML) Student at **Woxsen University**.
*   Entrepreneur & Full-Stack Developer.
*   Junior Software Developer (AI Quality & Testing) at **micro1**.
*   Specializing in MERN stack and Agentic AI systems.

---
