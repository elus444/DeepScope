"""
Shared helper for turning retrieved chunks into a numbered source list.

Every agent that sees the retrieved context (summarizer, critic, editor)
uses the SAME numbering, so a [2] the summarizer writes still means the
same source by the time the editor revises the answer, and the frontend
can resolve it to the same citation card the user clicks on.
"""
from typing import List, Dict


def build_numbered_context(citations: List[Dict]) -> str:
    return "\n\n".join(f"[{c['index']}] {c['content']}" for c in citations)
