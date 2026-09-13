import os
import tempfile

import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client

from agents.orchestrator import Orchestrator
from models.schemas import (
    AskRequest,
    AskResponse,
    ChatSessionCreate,
    ChatSessionOut,
    DocumentOut,
    MessageOut,
)
from utils.document_parser import extract_text_from_file, chunk_text, SUPPORTED_EXTENSIONS
from utils.embeddings import get_embedding
from utils.logger import api_logger
from utils.supabase_auth import get_supabase, get_user_id

app = FastAPI(title="DeepScope API")

# CORS: use FRONTEND_URL env var in production, allow all in dev
frontend_url = os.getenv("FRONTEND_URL")
allowed_origins = [frontend_url] if frontend_url else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = Orchestrator()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/workflow/diagram")
def workflow_diagram():
    """Mermaid diagram of the multi-agent pipeline -- static, no auth needed."""
    return {"diagram": orchestrator.get_workflow_diagram()}


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

@app.get("/documents", response_model=list[DocumentOut])
def list_documents(supabase: Client = Depends(get_supabase)):
    """List the calling user's documents. RLS scopes this to their own rows."""
    result = supabase.table("documents").select("*").order("created_at", desc=True).execute()
    return result.data


@app.post("/documents", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    supabase: Client = Depends(get_supabase),
):
    """
    Upload a document: extract text, chunk it, embed each chunk with
    Gemini, and store the document + chunks in Postgres (pgvector).
    """
    filename = file.filename or "document"
    _, ext = os.path.splitext(filename)
    ext = ext.lower()

    api_logger.info(f"Upload request received: filename={filename}, extension={ext}")

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {ext}. Supported: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    temp_file.write(await file.read())
    temp_file.close()

    try:
        text, file_type = extract_text_from_file(temp_file.name)
        api_logger.info(f"Text extraction successful: {len(text)} characters extracted")

        chunks = chunk_text(text)
        if not chunks:
            raise HTTPException(status_code=400, detail="No text could be extracted from the file")

        api_logger.info(f"🔢 Generating embeddings for {len(chunks)} chunks")
        vectors = [get_embedding(c) for c in chunks]

        # Row order matters: user_id defaults to auth.uid() server-side
        # (see migration), so we never send it ourselves.
        doc_result = (
            supabase.table("documents")
            .insert(
                {
                    "filename": filename,
                    "file_type": file_type,
                    "character_count": len(text),
                    "chunk_count": len(chunks),
                }
            )
            .execute()
        )
        document = doc_result.data[0]

        chunk_rows = [
            {
                "document_id": document["id"],
                "chunk_index": i,
                "content": chunk,
                "embedding": vector,
            }
            for i, (chunk, vector) in enumerate(zip(chunks, vectors))
        ]
        supabase.table("chunks").insert(chunk_rows).execute()

        api_logger.info(f"Upload completed successfully: {filename} ({len(chunks)} chunks)")
        return document

    except ValueError as e:
        api_logger.error(f"ValueError during file processing: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        api_logger.error(f"Unexpected error during file processing: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)


@app.delete("/documents/{document_id}")
def delete_document(document_id: str, supabase: Client = Depends(get_supabase)):
    """Delete a document and its chunks (cascade). RLS enforces ownership."""
    result = (
        supabase.table("documents").delete().eq("id", document_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted", "id": document_id}


# ---------------------------------------------------------------------------
# Chat sessions
# ---------------------------------------------------------------------------

@app.get("/chat/sessions", response_model=list[ChatSessionOut])
def list_sessions(supabase: Client = Depends(get_supabase)):
    result = supabase.table("chat_sessions").select("*").order("created_at", desc=True).execute()
    return result.data


@app.post("/chat/sessions", response_model=ChatSessionOut)
def create_session(body: ChatSessionCreate, supabase: Client = Depends(get_supabase)):
    payload = {"title": body.title} if body.title else {}
    result = supabase.table("chat_sessions").insert(payload).execute()
    return result.data[0]


@app.delete("/chat/sessions/{session_id}")
def delete_session(session_id: str, supabase: Client = Depends(get_supabase)):
    result = supabase.table("chat_sessions").delete().eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted", "id": session_id}


@app.get("/chat/sessions/{session_id}/messages", response_model=list[MessageOut])
def get_messages(session_id: str, supabase: Client = Depends(get_supabase)):
    result = (
        supabase.table("chat_messages")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
    )
    return result.data


@app.post("/chat/sessions/{session_id}/messages", response_model=AskResponse)
def ask(
    session_id: str,
    req: AskRequest,
    supabase: Client = Depends(get_supabase),
    user_id: str = Depends(get_user_id),
):
    """
    Ask a question inside a chat session: runs the Research -> Summarize
    -> Critique -> Edit pipeline scoped to the caller's own documents,
    then persists both the user's question and the assistant's answer.
    """
    api_logger.info(f"[session={session_id}] Query: '{req.query}' (document_id={req.document_id})")

    # Build short conversation context from prior turns in this session,
    # so follow-up questions ("what about...") resolve correctly.
    history = (
        supabase.table("chat_messages")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .limit(6)
        .execute()
    )
    conversation_context = ""
    if history.data:
        turns = reversed(history.data)
        conversation_context = "Previous conversation:\n" + "\n".join(
            f"{'User' if t['role'] == 'user' else 'Assistant'}: {t['content']}" for t in turns
        )

    supabase.table("chat_messages").insert(
        {"session_id": session_id, "role": "user", "content": req.query, "sources": []}
    ).execute()

    result = orchestrator.process_query(
        query=req.query,
        supabase=supabase,
        top_k=req.top_k,
        document_id=req.document_id,
        conversation_context=conversation_context,
    )

    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["answer"])

    supabase.table("chat_messages").insert(
        {
            "session_id": session_id,
            "role": "assistant",
            "content": result["answer"],
            "sources": result.get("sources", []),
        }
    ).execute()

    return AskResponse(
        answer=result["answer"],
        sources=result.get("sources", []),
        workflow_log=result.get("workflow_log", []),
        metadata=result.get("metadata", {}),
    )


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
