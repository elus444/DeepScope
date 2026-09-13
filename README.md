# 🤖 AI Research Assistant with Multi-Agent Collaboration

An AI-powered **Multi-Agent Research Assistant** built with **Generative AI, Agentic AI, LangGraph, RAG, and pgvector**. It supports multi-format uploads, intelligent document analysis, and expert-like Q&A via Researcher, Summarizer, Critic, and Editor agents — offering deep, contextual, and interactive research insights, with each user's documents and conversations kept private to their own account.

This **Multi-Agent architecture** (Researcher, Summarizer, Critic, and Editor) simulates how real researchers process information. It integrates **FastAPI (backend), Next.js + TailwindCSS (frontend), Supabase (Postgres, pgvector, and Auth)**.

---

## ⚡ Free 1-Click Deployment

Deploy the entire stack for free with one click:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/elus444/DeepScope)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/elus444/DeepScope&root-directory=frontend)

You'll also need a free [Supabase](https://supabase.com) project (Postgres + pgvector + Auth) and a free [Gemini API key](https://aistudio.google.com/apikey) — see Environment Configuration below.

---

## 🚀 Features

- 🔐 **Real accounts** → Email/password auth via Supabase; every document, chat session, and message is private to the signed-in user
- 🧠 **Multi-Agent Workflow**
  - **Research Agent →** Finds relevant chunks via pgvector similarity search
  - **Summarizer Agent →** Creates concise summaries
  - **Critic Agent →** Identifies limitations and gaps
  - **Editor Agent →** Refines and formats final responses
- **📚 Multi-Document Support** → Upload and query PDFs, DOCX, HTML, or TXT files, searched individually or all at once
- **💬 Persistent Conversations** → Chat sessions and message history are stored in Postgres, not lost on restart
- **🧩 Chunking & Embeddings** → Splits documents into chunks and embeds them using Gemini models
- **⚡ pgvector Search** → HNSW-indexed semantic retrieval, isolated per user by Postgres Row Level Security
- **🔄 LangGraph Orchestration** → Structured multi-agent pipeline with conditional routing
- **🎨 Modern UI** → Responsive frontend built with Next.js and TailwindCSS

---

## 🏗️ Architecture

```
backend/                               # FastAPI Backend
├── agents/                            # Multi-Agent System
│   ├── agent_state.py                # Shared state for LangGraph
│   ├── critic_agent.py               # Validates response quality (Gemini)
│   ├── editor_agent.py               # Refines final output (Gemini)
│   ├── langgraph_nodes.py            # LangGraph node definitions
│   ├── langgraph_workflow.py         # Workflow graph construction
│   ├── orchestrator.py               # Main workflow orchestrator
│   ├── research_agent.py             # pgvector similarity search
│   └── summarizer_agent.py           # Summarization agent (Gemini)
│
├── models/
│   └── schemas.py                    # Pydantic request/response schemas
│
├── utils/
│   ├── document_parser.py            # Multi-format document parser
│   ├── embeddings.py                 # Gemini embedding generation
│   ├── supabase_auth.py              # Per-request, RLS-scoped Supabase client
│   └── logger.py                     # Logging configuration
│
├── config.py                          # Configuration loader
├── main.py                            # FastAPI application & routes
└── requirements.txt                   # Python dependencies

frontend/                              # Next.js Frontend
├── components/
│   └── ChatBox.tsx                   # Chat interface, document + session management
├── contexts/
│   └── AuthContext.tsx               # Supabase session state
├── lib/
│   ├── api.ts                        # Axios client (attaches Supabase access token)
│   └── supabaseClient.ts             # Browser Supabase client
├── pages/
│   ├── _app.tsx                      # App wrapper (AuthProvider)
│   ├── index.tsx                     # Main chat interface (protected route)
│   ├── login.tsx                     # Sign in
│   └── register.tsx                  # Sign up
└── styles/globals.css                # Global TailwindCSS styles
```

### Data & security model

There is no `SECRET_KEY`/service-role key on the backend, and no direct Postgres password either. Every database call the backend makes goes through Supabase's PostgREST API **using the caller's own access token**, so Postgres [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — scoped to `auth.uid()` — is the actual authorization boundary. A bug in the Python code can't leak one user's documents to another, because the database itself won't return rows that don't belong to the token making the request.

Embeddings are stored in a `vector(1536)` column with an HNSW index for fast approximate nearest-neighbor search; a `match_chunks` SQL function does the similarity search server-side, filtered to the caller's own chunks (and optionally one document) before it ever returns a row.

---

## ⚙️ Tech Stack

### 🖥️ Backend
- **FastAPI**: High-performance async API framework
- **PDFPlumber / python-docx / BeautifulSoup4**: Document text extraction

### 🎨 Frontend
- **Next.js 16**: React framework
- **TypeScript**: Type-safe development
- **TailwindCSS 4**: Utility-first styling
- **Supabase JS**: Auth + session management

### 🗄️ Database
- **Supabase (Postgres + pgvector)**: Documents, chunks (with embeddings), chat sessions, and messages, all RLS-isolated per user

### 🤖 AI
- **LangGraph**: Agent workflow orchestration
- **Gemini**: `gemini-3.6-flash` (LLM) and `gemini-embedding-2` (embeddings, truncated to 1536 dims)

---

## 🔧 Prerequisites

- Python 3.8+
- Node.js 18+
- A free [Supabase](https://supabase.com) project
- A free [Gemini API key](https://aistudio.google.com/apikey)

---

## ⚡ Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/elus444/DeepScope.git
cd DeepScope
```

### 2️⃣ Set up Supabase

Create a free project at [supabase.com](https://supabase.com), then run the migration in `supabase/schema.sql` against it (SQL Editor, or `apply_migration` if you're using the Supabase MCP) to create the `documents`, `chunks`, `chat_sessions`, and `chat_messages` tables, enable pgvector, and set up Row Level Security.

### 3️⃣ Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Linux/Mac
venv\Scripts\activate      # On Windows

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4️⃣ Environment Configuration

Create a `.env` file in the repo root (see `.env.example` for the full list):

```env
GEMINI_API_KEY=your_gemini_api_key
EMBEDDING_MODEL=gemini-embedding-2
LLM_MODEL=gemini-3.6-flash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend needs its own `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Visit:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

---

## 🧩 API Endpoints

All endpoints below (except `/health` and `/workflow/diagram`) require `Authorization: Bearer <supabase access token>` and only ever operate on the calling user's own data.

### Documents
- `GET /documents` — List your documents
- `POST /documents` — Upload a document (chunks + embeds it)
- `DELETE /documents/{document_id}` — Delete a document and its chunks

### Chat
- `GET /chat/sessions` — List your chat sessions
- `POST /chat/sessions` — Create a new chat session
- `DELETE /chat/sessions/{session_id}` — Delete a session
- `GET /chat/sessions/{session_id}/messages` — Get a session's message history
- `POST /chat/sessions/{session_id}/messages` — Ask a question (runs the multi-agent pipeline, persists both turns)

### Utilities
- `GET /health` — Health check
- `GET /workflow/diagram` — Get the LangGraph workflow as a Mermaid diagram

---

## 🧠 Multi-Agent Workflow

The system uses a sophisticated multi-agent pipeline:

1. **Research Agent**: Searches your documents via pgvector cosine similarity
2. **Summarizer Agent**: Condenses retrieved information
3. **Critic Agent**: Evaluates quality and completeness
4. **Editor Agent**: Produces final polished response (only when the critic finds gaps)

Agents communicate through a shared state managed by LangGraph, with conditional routing based on response quality.

---

## 🧾 Document Processing

Supported formats:
- **PDF**: Extracted using PDFPlumber
- **DOCX**: Parsed with python-docx
- **HTML**: Cleaned with BeautifulSoup4
- **TXT**: Direct text reading

Documents are:
1. Chunked into ~500 character segments
2. Embedded using Gemini's `gemini-embedding-2` (truncated to 1536 dims)
3. Stored in Postgres with an HNSW vector index
4. Retrieved via cosine similarity, scoped to the requesting user by Row Level Security

---

## 🌟 Future Scope

- An evaluation harness quantifying how much the Critic/Editor loop reduces hallucination vs. plain RAG
- Streaming responses (token-by-token instead of one final blob)
- Inline citations linking a claim back to its exact source passage
- LangSmith integration for agent evaluation
- Audio/video research input (Whisper API)

---

## 🪪 License

**MIT License** – Free to use and modify.
