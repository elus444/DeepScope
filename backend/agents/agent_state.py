"""
LangGraph State Definition for Multi-Agent Workflow
"""
from typing import TypedDict, List, Optional, Any


class AgentState(TypedDict):
    """
    State object passed between agents in the workflow

    This state is maintained throughout the entire agent pipeline
    and each agent can read from and write to it.
    """

    # Input
    query: str                          # User's question
    top_k: int                          # Number of chunks to retrieve
    document_id: Optional[str]          # Restrict search to one document (None = all of the user's docs)
    conversation_context: str           # Previous conversation history
    supabase: Any                       # Client authenticated as the calling user (supabase.Client)

    # Research Agent Output
    chunks: List[str]                   # Retrieved text chunks (plain text, for prompts)
    citations: List[Any]                # Numbered {index, chunk_id, filename, content, similarity}
    num_chunks_found: int                # Number of chunks retrieved

    # Summarizer Agent Output
    initial_summary: str                # First draft answer

    # Critic Agent Output
    critique: str                       # Quality evaluation
    has_gaps: bool                      # Whether answer needs improvement
    suggestions: List[str]              # Improvement suggestions

    # Editor Agent Output
    final_answer: str                   # Polished final answer
    editing_applied: bool               # Whether editing was needed

    # Workflow Metadata
    workflow_log: List[str]             # Progress logs (simple strings)
    status: str                         # Current workflow status
    error_message: Optional[str]        # Error details if any

    # Agent execution flags
    research_complete: bool
    summary_complete: bool
    critique_complete: bool
    editor_complete: bool
