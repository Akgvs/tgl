# RADIX Talent Match — Role 3: Profile Builder

Participant Brief: **RADIX Talent Match Hackathon (October 2026)**  
Role: **Role 3: Profile Builder (Plain Code & Shared Data Contract)**  
Stack: **Python (FastAPI + Pydantic v2) + React (TypeScript + TailwindCSS + Lucide Icons)**  
UI Aesthetic: Inspired by the **Placement Hub Portal** (Slate/Navy theme, Inter + Outfit typography, 12-category tags).

---

## 🎯 Role Mission & Architecture

According to the Hackathon Participant Brief (Pages 8-10, 13):
- **Role 3 Mission**: Build a full candidate profile that goes beyond the resume — hackathons, internships, certifications, preferred roles, and a CV attachment.
- **Input**: Extracted signals from **Role 2 (Resume Parsing)** and **Role 1 (JD Analytics)**.
- **Output**: Canonical `candidate_profile.json` formatted strictly to the Shared Data Contract, unlocking **Role 4 (Talent Check)** and **Role 5 (Skill Matching)**.

### The 12 RADIX Skill Categories

Every skill is categorized with exactly one `category_code`:
1. `COD` - Coding (Python, C++, Java, TypeScript, Go)
2. `DSA` - Data Structures & Algorithms
3. `OOD` - Object-Oriented Design (SOLID, Patterns)
4. `APTI` - Quantitative & Logical Aptitude
5. `COMM` - Communication & Technical Presentation
6. `AI` - Artificial Intelligence & Machine Learning
7. `CLOUD` - Cloud & DevOps (AWS, GCP, Docker, Kubernetes)
8. `SQL` - SQL & Relational Databases
9. `SWE` - Software Engineering & Testing
10. `SYSD` - System Design & Distributed Systems
11. `NETW` - Networking & Protocols (TCP/IP, REST, WebSockets)
12. `OS` - Operating Systems & Concurrency (Linux, Threads, epoll)
- Anything outside these twelve uses `OTHER`.

---

## 🚀 Running the Project

### 1. Python Backend (FastAPI on Port 8000)
```powershell
python -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
```
Endpoints:
- `GET /api/health` — Health check & contract status
- `GET /api/profile` — Active candidate profile
- `POST /api/profile` — Save/update profile & updates canonical JSON
- `POST /api/profile/ingest-analytics` — Ingest inbound payload from Role 2 / Role 1
- `GET /api/contract/export` — Role 4 & Role 5 canonical handoff
- `GET /api/contract/download` — Download `candidate_profile.json`
- `GET /api/talent-check-bars` — Company skillset thresholds snapshot
- **`POST /api/resume/extract-skills`** — Upload a resume (PDF/DOCX/TXT) and extract skills via Groq LLM

### 2. React Frontend (Vite on Port 5173)
```powershell
npm run dev
```
Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## 🤖 Groq LLM — Resume Skill Extraction Setup

The Resume Scanner uses **Groq** to extract skills intelligently from uploaded resumes using a hosted LLM.

### Step 1 — Obtain a Groq API Key

1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign in or create a free account.
3. Click **Create API key** and copy the key.

### Step 2 — Configure the Key Locally

Create a `.env` file in the project root (if it does not already exist):

```powershell
Copy-Item .env.example .env
```

Then open `.env` and fill in your key:

```
GROQ_API_KEY=gsk_your_actual_key_here
```

> ⚠️ **Never commit your real `.env` file to source control.**  
> The `.gitignore` already excludes it.

### Step 3 — Restart the Backend

After editing `.env`, restart the FastAPI server:

```powershell
python -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
```

`python-dotenv` automatically loads the `.env` file on startup.

### Step 4 — Test Resume Skill Extraction Locally

Upload any PDF, DOCX, or TXT resume on the **Resume Scanner** page in the UI, or call the endpoint directly:

```powershell
curl -X POST http://127.0.0.1:8000/api/resume/extract-skills `
  -F "file=@path\to\resume.pdf"
```

A successful response looks like:

```json
{
  "filename": "resume.pdf",
  "skills_extracted": 18,
  "skills": [
    {
      "skill_name": "React",
      "category_code": "SWE",
      "mention_type": "explicit",
      "confidence": "high",
      "evidence": "Built a real-time dashboard using React and TypeScript"
    }
  ]
}
```

**Troubleshooting:**
- HTTP 503 → `GROQ_API_KEY` is missing or empty — add it to `.env` and restart.
- HTTP 502 → Groq API returned an error — check your key and network connectivity.
- HTTP 415 → Unsupported file type — use PDF, DOCX, or TXT only.

---

## 📦 Benchmark Candidates (Page 11 of the Brief)

1. **Ananya Rao**: Systems-leaning generalist (Strong fit for SWE, C++, Linux, Raft)
2. **Karthik Subramaniam**: Data-leaning analyst (Strong fit for Data Scientist / Analyst, Python, SQL, ML)
3. **Priya Menon**: Entry-level support-oriented (Best fit for Oracle Financial Services Software)
4. **Rohan Verma**: Strong all-rounder (Competitive across SWE, Cloud, AI, and Systems)

---

## 🔗 Shared Data Contract Output (`data/candidate_profile.json`)

```json
{
  "name": "Ananya Rao",
  "email": "ananya.rao@example.com",
  "education": "B.Tech in Computer Science and Engineering, 2024, CGPA 8.9 / 10.0",
  "skills": [
    {
      "skill_name": "C++",
      "category_code": "COD",
      "evidence": "Implemented custom memory allocators in C++17",
      "confidence": "high"
    }
  ],
  "hackathons": [...],
  "internships": [...],
  "certifications": [...],
  "preferred_roles": ["Software Engineer (SWE)"],
  "cv_file": "ananya_rao_resume.pdf"
}
```
