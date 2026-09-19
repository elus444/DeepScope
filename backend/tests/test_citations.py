"""Unit tests for utils.citations.build_numbered_context -- the shared
numbering every agent (summarizer/critic/editor) and the frontend's
citation chips all rely on staying consistent."""
from utils.citations import build_numbered_context


def test_empty_citations_returns_empty_string():
    assert build_numbered_context([]) == ""


def test_single_citation_formats_with_bracket_index():
    citations = [{"index": 1, "content": "The sky is blue."}]
    assert build_numbered_context(citations) == "[1] The sky is blue."


def test_multiple_citations_join_with_blank_line_and_keep_order():
    citations = [
        {"index": 1, "content": "First fact."},
        {"index": 2, "content": "Second fact."},
        {"index": 3, "content": "Third fact."},
    ]
    result = build_numbered_context(citations)
    assert result == "[1] First fact.\n\n[2] Second fact.\n\n[3] Third fact."


def test_index_is_whatever_the_caller_passed_not_recomputed():
    """The index in the output must be the caller's number, not the
    list position -- callers (e.g. a re-ranked subset) may legitimately
    pass indices out of order or with gaps, and every agent's citation
    numbers must still point at the same source."""
    citations = [
        {"index": 5, "content": "Out of order on purpose."},
        {"index": 2, "content": "Also out of order."},
    ]
    result = build_numbered_context(citations)
    assert result == "[5] Out of order on purpose.\n\n[2] Also out of order."
