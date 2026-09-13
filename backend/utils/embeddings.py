import os
from google import genai
from google.genai import types
from utils.logger import api_logger

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY") or "dummy-key-for-startup")

# gemini-embedding-2 outputs 3072-dim vectors natively. It uses Matryoshka
# representation learning, so truncating the output (via output_dimensionality)
# keeps nearly all retrieval quality while producing a smaller vector --
# 1536 was chosen because pgvector's HNSW index (used by the `chunks` table
# in Postgres) caps out at 2000 dimensions.
EMBEDDING_DIMENSIONS = 1536

def get_embedding(text: str, model: str = None):
    """
    Get embedding vector for text using Gemini
    """
    if model is None:
        model = os.getenv("EMBEDDING_MODEL", "gemini-embedding-2")

    api_logger.debug(f"🔢 Generating embedding - Model: {model}, Text length: {len(text)} chars")

    response = client.models.embed_content(
        model=model,
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIMENSIONS),
    )

    embedding = response.embeddings[0].values
    api_logger.debug(f"✅ Embedding generated | Dimensions: {len(embedding)}")

    return embedding

def call_gemini(prompt: str, model: str = None):
    """
    Generic Gemini API call wrapper for agents
    """
    if model is None:
        model = os.getenv("LLM_MODEL", "gemini-3.6-flash")

    response = client.models.generate_content(
        model=model,
        contents=prompt,
    )
    return response.text
