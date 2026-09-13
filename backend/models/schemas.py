from pydantic import BaseModel
from typing import Optional, List, Dict


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


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    sources: List[str]
    created_at: str


class AskRequest(BaseModel):
    query: str
    top_k: int = 5
    document_id: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    sources: List[str]
    workflow_log: List[str]
    metadata: Dict
