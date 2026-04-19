<div align="center">

# DeepFake Engine Detector

**AI-powered deepfake detection for images and videos — local neural network + Gemini AI analysis**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.4-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)](https://pytorch.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## Overview

DeepFake Engine Detector is a full-stack forensic media analysis system that combines a custom-trained dual-branch convolutional neural network with optional Gemini AI vision analysis. It supports images and videos, detects multiple faces independently, and precisely localises manipulated segments in videos down to the second.

The entire stack — React frontend, Flask API, and all ML inference — runs inside a single Docker container with no external dependencies at runtime.

---

## Features

| Feature | Description |
|---|---|
| **Dual-Branch CNN** | EfficientNet-B0 for RGB spatial artifacts + FFT frequency branch for GAN fingerprints |
| **Temporal Localisation** | Hysteresis thresholding + EMA smoothing to pinpoint exact manipulated segments in videos |
| **Multi-Face Tracking** | MTCNN detects all faces; FaceNet embeddings track each person across frames independently |
| **Per-Person Verdicts** | Each identity receives its own confidence score and fake/real classification |
| **Gemini AI Provider** | Optional Gemini 2.5 Flash vision analysis as a second opinion |
| **Multiple Trained Models** | Models trained on CelebDF and FaceForensics++ datasets |
| **Drag-and-Drop UI** | React frontend with live results, confidence bars, and video timeline |
| **Single Docker Image** | Multi-stage build — one `docker compose up` to run everything |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                  │
│  Drag-and-Drop → Provider Select → Results Visualisation │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP POST /api/detect
┌───────────────────────▼─────────────────────────────────┐
│                   Flask API (app.py)                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Local Model  │  │  Multi-Face  │  │  Gemini AI    │  │
│  │  Inference   │  │  Inference   │  │  (API call)   │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘  │
│         │                 │                              │
│  ┌──────▼─────────────────▼──────────────────────────┐  │
│  │           DeepfakeDetector (PyTorch)               │  │
│  │                                                    │  │
│  │  ┌─────────────────┐    ┌───────────────────────┐  │  │
│  │  │ EfficientNet-B0  │    │   Frequency Branch    │  │  │
│  │  │  (RGB spatial)  │    │  FFT → Conv → Pool    │  │  │
│  │  └────────┬────────┘    └──────────┬────────────┘  │  │
│  │           │   1280-dim             │   64-dim      │  │
│  │           └────────────┬───────────┘               │  │
│  │                   1344-dim concat                   │  │
│  │              Linear(512) → Linear(2)                │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Multi-Face Pipeline

```
Video/Image → MTCNN (detect all faces) → FaceNet embeddings
    → IoU + cosine similarity tracking → per-identity sequences
    → DeepfakeDetector per face → per-person fake/real verdict
    → Temporal segment localisation per person
```

---

## Quick Start (Docker)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A Gemini API key if you want AI analysis (optional) — get one free at [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/deepfake-engine-detector.git
cd deepfake-engine-detector
```

### 2. Add your model weights

Model weights are not included in this repository due to file size. Place your `.pth` files in the `models/` directory:

```
models/
├── best_model_celeb_v1.pth
└── best_model_500_v1.pth
```

> See [Training Your Own Model](#training-your-own-model) to generate weights, or download pre-trained weights from the releases page.

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional)
```

### 4. Run

```bash
docker compose up --build
```

Open **http://localhost:8000** in your browser.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | No | Google Gemini API key. Enables the Gemini AI analysis provider in the UI. |
| `PORT` | No | Server port (default: `8000`) |

---

## API Reference

Base URL: `http://localhost:8000`

### `GET /api/health`

Returns server status, device info, and model availability.

```json
{
  "status": "ok",
  "device": "cpu",
  "device_type": "cpu",
  "gemini_available": true,
  "models": {
    "best_model_celeb_v1": { "available": true, "size_mb": 18.3 },
    "best_model_500_v1":   { "available": true, "size_mb": 18.3 }
  }
}
```

### `GET /api/models`

Returns list of available detection models with metadata.

### `POST /api/detect`

Analyse a media file for deepfake manipulation.

**Form fields:**

| Field | Type | Values | Description |
|---|---|---|---|
| `file` | File | image or video | Media file to analyse |
| `provider` | string | `local`, `gemini` | Analysis provider |
| `model` | string | `best_model_celeb_v1`, `best_model_500_v1` | Model to use (local only) |
| `multiface` | string | `true`, `false` | Enable multi-face tracking (local only) |

**Supported formats:** JPEG, PNG, BMP, TIFF, WebP, MP4, AVI, MOV, MKV, WebM

**Response — single face image:**

```json
{
  "input_type": "image",
  "is_fake": true,
  "confidence": 0.9134
}
```

**Response — video:**

```json
{
  "input_type": "video",
  "video_is_fake": true,
  "overall_confidence": 0.8723,
  "duration_seconds": 12.4,
  "frame_scores": [0.12, 0.45, 0.87, ...],
  "frame_times": [0.0, 0.2, 0.4, ...],
  "manipulated_segments": [
    {
      "start_time": "00:00:03.20",
      "end_time": "00:00:08.60",
      "start_seconds": 3.2,
      "end_seconds": 8.6,
      "confidence": 0.912
    }
  ]
}
```

**Response — multi-face:**

```json
{
  "input_type": "video",
  "persons": [
    {
      "person_id": 0,
      "is_fake": true,
      "confidence": 0.88,
      "num_detections": 47,
      "confidence_range": { "min": 0.71, "max": 0.96 },
      "fake_segments": [...]
    }
  ],
  "summary": {
    "total_persons_detected": 2,
    "fake_persons": 1,
    "real_persons": 1,
    "frames_with_multiple_faces": 38
  }
}
```

---

## Models

| Model ID | Training Data | Notes |
|---|---|---|
| `best_model_celeb_v1` | CelebDF | Best for celebrity deepfakes, high-quality face swaps |
| `best_model_500_v1` | FaceForensics++ | General purpose, trained on 500 videos per class |

All models use the same **dual-branch architecture**: EfficientNet-B0 backbone (RGB spatial features, ~1280-dim) concatenated with a frequency branch (FFT → 2× Conv → AvgPool, 64-dim) → 1344-dim → Linear(512) → Linear(2).

---

## Training Your Own Model

### 1. Prepare data

Place videos in the data directory:

```
data/raw/
├── real/   ← real/authentic videos (.mp4, .avi)
└── fake/   ← deepfake videos (.mp4, .avi)
```

### 2. Install training dependencies

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run the pipeline

```bash
# Extract frames from videos
python extract_frames.py

# Detect and crop faces
python preprocess.py

# Train the model
python train.py
```

The best checkpoint saves to `models/best_model.pth`.

**Hardware support:** CUDA → MPS (Apple Silicon) → CPU (automatic fallback)

For CUDA training:

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

---

## Local Development (without Docker)

```bash
# Backend
python -m venv .venv
source .venv/bin/activate
pip install flask flask-cors torch==2.4.0 torchvision==0.19.0 timm facenet-pytorch scipy scikit-learn opencv-python Pillow tqdm google-genai gunicorn

# Frontend
cd frontend
npm install
npm run dev        # dev server on http://localhost:5173

# Backend (separate terminal)
cd ..
python app.py      # API on http://localhost:8000
```

The Vite dev server proxies `/api/*` to `http://localhost:8000`.

---

## Project Structure

```
deepfake-engine-detector/
├── app.py                    # Flask API + inline model definition
├── inference.py              # Single-image inference CLI
├── inference_video.py        # Basic video inference
├── inference_tempral_video.py # Temporal video inference with segment localisation
├── video_temporal_mfd1.py    # Multi-face deepfake detector
├── train.py                  # Model training script
├── preprocess.py             # Face extraction preprocessing
├── extract_frames.py         # Video frame extractor
├── download_data.py          # Dataset download helper
├── requirements.txt          # Python dependencies
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Docker Compose config
├── .env.example              # Environment variable template
├── models/                   # Model weights (not committed — see above)
│   └── .gitkeep
├── data/                     # Training data (not committed)
│   └── raw/
│       ├── real/
│       └── fake/
├── checkpoints/              # Training checkpoints (not committed)
├── results/                  # Inference outputs (not committed)
└── frontend/                 # React application
    ├── src/
    │   ├── App.jsx           # Root component + result routing
    │   ├── api/
    │   │   └── client.js     # API client
    │   └── components/
    │       ├── Controls.jsx       # Provider/model selector
    │       ├── DropZone.jsx       # Drag-and-drop upload
    │       ├── ImageResult.jsx    # Image analysis results
    │       ├── VideoResult.jsx    # Video results + timeline
    │       ├── GeminiResult.jsx   # Gemini AI results
    │       ├── ConfidenceBar.jsx  # Animated confidence bar
    │       ├── Timeline.jsx       # Video segment timeline
    │       ├── Header.jsx         # App header + status
    │       └── LoadingScreen.jsx  # Analysis loading state
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Docker Details

The image uses a **two-stage build**:

1. **Stage 1** (`node:20-alpine`) — builds the React frontend with Vite
2. **Stage 2** (`python:3.10-slim`) — installs PyTorch CPU, ML dependencies, copies built frontend

At runtime, Flask serves the React SPA as static files and exposes the API — no separate web server needed.

```
Image size: ~2.8 GB (PyTorch CPU accounts for most of it)
CPU-only build: no CUDA required in production
Workers: 1 gunicorn worker, 4 threads, 600s timeout for long video analysis
```

To build without cache:

```bash
docker compose build --no-cache
docker compose up -d
```

---

## Tech Stack

**Backend**
- Python 3.10, Flask 3, Gunicorn
- PyTorch 2.4 (CPU), timm, facenet-pytorch
- OpenCV, NumPy, SciPy

**Frontend**
- React 18, Vite 6
- Lucide React icons
- IBM Plex Mono, Bebas Neue fonts

**AI Providers**
- Local: custom dual-branch CNN (EfficientNet-B0 + FFT)
- Gemini: `google-genai` SDK, Gemini 2.5 Flash with automatic model fallback

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
Built with PyTorch · Trained on FaceForensics++ and CelebDF
</div>
