FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for faiss-cpu and document parsers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for runtime data
RUN mkdir -p db/documents logs

# Expose port (Render sets PORT dynamically)
EXPOSE 8000

# Start the application
CMD ["python", "main.py"]
