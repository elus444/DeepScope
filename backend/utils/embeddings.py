import os
from google import genai
from utils.logger import api_logger

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY") or "dummy-key-for-startup")

def get_embedding(text: str, model: str = None):
    """
    Get embedding vector for text using Gemini
    """
    if model is None:
        model = os.getenv("EMBEDDING_MODEL", "text-embedding-004")

    api_logger.debug(f"🔢 Generating embedding - Model: {model}, Text length: {len(text)} chars")

    response = client.models.embed_content(
        model=model,
        contents=text,
    )

    embedding = response.embeddings[0].values
    api_logger.debug(f"✅ Embedding generated | Dimensions: {len(embedding)}")

    return embedding

def call_gemini(prompt: str, model: str = None):
    """
    Generic Gemini API call wrapper for agents
    """
    if model is None:
        model = os.getenv("LLM_MODEL", "gemini-2.5-flash")

    response = client.models.generate_content(
        model=model,
        contents=prompt,
    )
    return response.text
