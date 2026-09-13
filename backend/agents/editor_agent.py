"""
Editor Agent: Refines and polishes the final answer based on critic feedback
"""
import os
from google import genai
from google.genai import types
from utils.citations import build_numbered_context
from utils.logger import agent_logger


class EditorAgent:
    def __init__(self):
        self.name = "Editor Agent"
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY") or "dummy-key-for-startup")
        agent_logger.info(f"{self.name} initialized")

    def edit(self, query: str, summary: str, critique: str, citations: list[dict]):
        """
        Polish the summary based on critic feedback

        Args:
            query: Original user question
            summary: Initial summary from SummarizerAgent
            critique: Feedback from CriticAgent
            citations: Numbered {index, filename, content, ...} chunks -- the same
                numbering the SummarizerAgent cited against, so [2] means the
                same source in both the draft and the polished answer

        Returns:
            dict with final polished answer
        """
        agent_logger.info(f"{self.name}: Starting editing for query='{query}'")
        agent_logger.debug(f"{self.name}: Summary length: {len(summary)} chars, Critique length: {len(critique)} chars")

        if not summary:
            agent_logger.warning(f"{self.name}: No summary provided for editing")
            return {
                "status": "error",
                "message": "No summary to edit",
                "final_answer": ""
            }

        # Provide additional context for refinement
        context = build_numbered_context(citations)

        prompt = f"""You are an editor. Refine the answer to ensure it uses ONLY information from the document context.

Original Question: {query}

Initial Answer:
{summary}

Feedback:
{critique}

Document Context (THE ONLY SOURCE OF TRUTH):
{context}

CRITICAL RULES:
1. Use ONLY information from the Document Context above
2. If feedback mentions "hallucination" or "not in document", REMOVE that information
3. If feedback mentions missing info that IS in context, ADD it
4. DO NOT use general knowledge or external information
5. When in doubt, quote directly from the context
6. Cite the bracket number of every source a claim comes from, right after
   the claim -- e.g. "The deadline is March 1st [2]." Use multiple
   numbers if a sentence draws on more than one source, e.g. "[1][3]".
   Never invent a number that isn't in the context above, and never
   drop a citation that was already correct in the initial answer.

FOR SIMPLE QUESTIONS:
- Keep answer SHORT (1-2 sentences)
- Use exact wording from context when possible
- No extra explanations beyond what's in the context

FOR COMPLEX QUESTIONS:
- Provide comprehensive answer using ALL relevant info from context
- Do not add external examples or explanations
- Organize clearly, but content must come from context only

If the context doesn't contain enough information to fully answer the question, state: "Based on the document: <answer with available info>. Additional details not found in document."

Provide the corrected final answer (strictly from context, with citations):"""

        try:
            model = os.getenv("LLM_MODEL", "gemini-3.6-flash")
            agent_logger.info(f"{self.name}: 🤖 Invoking LLM - Model: {model}, Temperature: 0.3")

            response = self.client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are an expert editor who creates clear, comprehensive, and well-structured answers.",
                    temperature=0.3,
                ),
            )

            final_answer = response.text

            # Log token usage
            usage = response.usage_metadata
            agent_logger.info(
                f"{self.name}: ✅ LLM Response received | "
                f"Tokens: {usage.prompt_token_count} input + {usage.candidates_token_count} output = {usage.total_token_count} total | "
                f"Final answer length: {len(final_answer)} chars"
            )

            return {
                "status": "success",
                "final_answer": final_answer,
                "editing_applied": True
            }

        except Exception as e:
            agent_logger.error(f"{self.name}: Error during editing, using original summary: {str(e)}", exc_info=True)
            # If editing fails, return original summary
            return {
                "status": "warning",
                "message": f"Error during editing, using original summary: {str(e)}",
                "final_answer": summary,
                "editing_applied": False
            }
