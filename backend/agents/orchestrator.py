"""
Orchestrator: Coordinates the multi-agent workflow using LangGraph

Uses LangGraph's state graph for conditional routing and visualization.
"""
from typing import Optional, Iterator
from supabase import Client
from agents.langgraph_workflow import agent_workflow
from agents.agent_state import AgentState


def _build_initial_state(
    query: str,
    supabase: Client,
    top_k: int,
    document_id: Optional[str],
    conversation_context: str,
) -> AgentState:
    return {
        # Input
        "query": query,
        "top_k": top_k,
        "document_id": document_id,
        "conversation_context": conversation_context,
        "supabase": supabase,

        # Outputs (will be populated by agents)
        "chunks": [],
        "citations": [],
        "num_chunks_found": 0,
        "initial_summary": "",
        "critique": "",
        "has_gaps": False,
        "suggestions": [],
        "final_answer": "",
        "editing_applied": False,

        # Metadata
        "workflow_log": [],
        "status": "initialized",
        "error_message": None,

        # Execution flags
        "research_complete": False,
        "summary_complete": False,
        "critique_complete": False,
        "editor_complete": False,
    }


class Orchestrator:
    def __init__(self):
        self.workflow = agent_workflow

    def process_query(
        self,
        query: str,
        supabase: Client,
        top_k: int = 5,
        document_id: Optional[str] = None,
        conversation_context: str = "",
    ):
        """
        Process a user query through the LangGraph multi-agent pipeline

        Workflow (with conditional routing):
        1. Research Agent -> Retrieve relevant chunks (Postgres/pgvector,
           scoped to the calling user via `supabase`)
        2. Summarizer Agent -> Create initial summary (with conversation context)
        3. Critic Agent -> Evaluate and provide feedback
        4. Conditional:
           - If gaps found -> Editor Agent polishes answer
           - If no gaps -> Skip to end (use initial summary)

        Args:
            query: User's question
            supabase: Client authenticated as the calling user
            top_k: Number of chunks to retrieve
            document_id: Optional single document to restrict the search to
            conversation_context: Previous conversation history for follow-up queries

        Returns:
            dict containing final answer and workflow metadata
        """
        initial_state = _build_initial_state(query, supabase, top_k, document_id, conversation_context)

        try:
            final_state = self.workflow.invoke(initial_state)
            return self._format_result(final_state)
        except Exception as e:
            return {
                "status": "error",
                "answer": f"Error in LangGraph workflow: {str(e)}",
                "workflow_log": [],
                "citations": [],
                "metadata": {}
            }

    def stream_query(
        self,
        query: str,
        supabase: Client,
        top_k: int = 5,
        document_id: Optional[str] = None,
        conversation_context: str = "",
    ) -> Iterator[AgentState]:
        """
        Same pipeline as process_query, but yields the state after every
        node finishes (LangGraph's `stream_mode="values"`) instead of
        only returning the final result. The caller diffs consecutive
        states' `*_complete` flags to know which agent just finished --
        that's what powers the frontend's live pipeline visualization.
        The final yielded state is the same as process_query's result.
        """
        initial_state = _build_initial_state(query, supabase, top_k, document_id, conversation_context)
        yield from self.workflow.stream(initial_state, stream_mode="values")

    def _format_result(self, final_state: AgentState) -> dict:
        if final_state.get("status") == "error":
            return {
                "status": "error",
                "answer": final_state.get("error_message", "Unknown error occurred"),
                "workflow_log": final_state.get("workflow_log", []),
                "citations": [],
            }

        return {
            "status": "success",
            "answer": final_state["final_answer"],
            "citations": final_state.get("citations", []),
            "workflow_log": final_state.get("workflow_log", []),
            "metadata": {
                "num_chunks": final_state.get("num_chunks_found", 0),
                "initial_summary_length": len(final_state.get("initial_summary", "")),
                "final_answer_length": len(final_state["final_answer"]),
                "critique_applied": final_state.get("critique_complete", False),
                "editing_applied": final_state.get("editing_applied", False),
                "has_gaps": final_state.get("has_gaps", False),
                "workflow_type": "langgraph"
            }
        }

    def format_result(self, final_state: AgentState) -> dict:
        """Public wrapper so callers driving stream_query can format the last state."""
        return self._format_result(final_state)

    def get_workflow_diagram(self) -> str:
        """
        Get visual representation of the workflow

        Returns:
            Mermaid markdown diagram
        """
        from agents.langgraph_workflow import get_workflow_visualization
        return get_workflow_visualization()
