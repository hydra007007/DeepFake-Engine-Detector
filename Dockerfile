# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline

COPY frontend/ .
RUN npm run build


# ── Stage 2: Python backend + serve frontend ─────────────────────────────────
FROM python:3.10-slim

LABEL maintainer="DeepFake Detection Engine"
LABEL description="AI-powered deepfake detection with React UI"

# System dependencies for OpenCV headless + build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install CPU-only PyTorch 2.4+ (supports numpy 2.x)
RUN pip install --no-cache-dir \
    torch==2.4.0 torchvision==0.19.0 \
    --index-url https://download.pytorch.org/whl/cpu

# Install ML/inference dependencies
RUN pip install --no-cache-dir \
    "timm>=0.9.0" \
    "opencv-python-headless>=4.8.0" \
    "facenet-pytorch>=2.5.3" \
    "scipy>=1.11.0" \
    "scikit-learn>=1.3.0" \
    "Pillow>=10.0.0" \
    "tqdm>=4.65.0"

# Install web framework + AI SDKs
RUN pip install --no-cache-dir \
    flask>=3.0.0 \
    flask-cors>=4.0.0 \
    gunicorn>=21.0.0 \
    google-genai>=1.0.0

# Copy Python source files
COPY app.py ./
COPY inference.py ./
COPY inference_video.py ./
COPY inference_tempral_video.py ./
COPY video_temporal_mfd1.py ./

# Copy models
COPY models/ ./models/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create upload temp directory
RUN mkdir -p /tmp/deepfake_uploads

# Non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app /tmp/deepfake_uploads
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Use gunicorn for production
CMD ["gunicorn", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "1", \
     "--threads", "4", \
     "--timeout", "600", \
     "--worker-class", "gthread", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "app:app"]
