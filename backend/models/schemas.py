from pydantic import BaseModel
from typing import Optional, List


class DocumentOut(BaseModel):
    id: str
    filename: str
    file_type: str
    character_count: int
    chunk_count: int
    created_at: str


class ChatSessionOut(BaseModel):
    id: str
    title: str
    created_at: str


class ChatSessionCreate(BaseModel):
    title: Optional[str] = None


class CitationOut(BaseModel):
    index: int
    chunk_id: str
    filename: str
    content: str
    similarity: float


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    sources: List[CitationOut]
    created_at: str


class AskRequest(BaseModel):
    query: str
    top_k: int = 5
    document_id: Optional[str] = None
