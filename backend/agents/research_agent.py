"""
Research Agent: Retrieves relevant chunks via Postgres/pgvector (Supabase)
"""
from typing import Optional
from supabase import Client
from utils.embeddings import get_embedding
from utils.logger import agent_logger


class ResearchAgent:
    def __init__(self):
        self.name = "Research Agent"
        agent_logger.info(f"{self.name} initialized")

    def search(self, query: str, supabase: Client, top_k: int = 5, document_id: Optional[str] = None):
        """
        Search the caller's chunks for the ones most similar to the query.

        The `match_chunks` RPC runs entirely inside Postgres under the
        caller's own RLS-scoped session (see utils/supabase_auth.py),
        so this can never return another user's chunks even if
        document_id were spoofed.

        Args:
            query: User's question
            supabase: Client authenticated as the calling user
            top_k: Number of top results to return
            document_id: Optional single document to restrict the search to

        Returns:
            dict with retrieved chunks and citation metadata
        """
        agent_logger.info(
            f"{self.name}: Starting search for query='{query}', top_k={top_k}, document_id={document_id}"
        )

        query_embedding = get_embedding(query)

        response = supabase.rpc(
            "match_chunks",
            {
                "query_embedding": query_embedding,
                "match_count": top_k,
                "filter_document_id": document_id,
            },
        ).execute()

        rows = response.data or []

        if not rows:
            agent_logger.warning(f"{self.name}: No matching chunks found")
            return {
                "status": "error",
                "message": "No documents available",
                "chunks": [],
                "citations": [],
            }

        # `citations` is the numbered, structured form the rest of the
        # pipeline cites against ([1], [2], ...) and the frontend later
        # renders as clickable source cards -- `chunks` stays a plain
        # list of strings since that's all the summarizer/critic/editor
        # prompts need.
        citations = [
            {
                "index": i + 1,
                "chunk_id": row["chunk_id"],
                "filename": row["filename"],
                "content": row["content"],
                "similarity": row["similarity"],
            }
            for i, row in enumerate(rows)
        ]
        chunks = [c["content"] for c in citations]

        agent_logger.info(
            f"{self.name}: Retrieved {len(chunks)} chunks from {len(set(c['filename'] for c in citations))} source(s)"
        )

        return {
            "status": "success",
            "query": query,
            "chunks": chunks,
            "citations": citations,
            "num_results": len(chunks),
        }
