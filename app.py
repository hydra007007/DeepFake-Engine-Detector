"""
DeepFake Detection Engine - Flask API Backend
"""
import os
import sys
import json
import tempfile
import logging
from pathlib import Path

import torch
import torch.nn as nn
import timm
import cv2
import numpy as np

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="frontend/dist", static_url_path="")
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024 * 1024  # 1 GB max upload

MODELS_DIR = Path("models")
AVAILABLE_MODELS = {
    "best_model_celeb_v1": "best_model_celeb_v1.pth",
    "best_model_500_v1": "best_model_500_v1.pth",
}

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"}


# ── Model definition (same architecture as training) ──────────────────────────

class FrequencyBranch(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.pool = nn.AdaptiveAvgPool2d((1, 1))

    def forward(self, x):
        gray = 0.299 * x[:, 0] + 0.587 * x[:, 1] + 0.114 * x[:, 2]
        fft = torch.fft.fft2(gray.unsqueeze(1))
        magnitude = torch.abs(torch.fft.fftshift(fft))
        magnitude = torch.log(magnitude + 1e-8)
        magnitude = (magnitude - magnitude.mean()) / (magnitude.std() + 1e-8)
        x = magnitude.repeat(1, 3, 1, 1)
        x = torch.relu(self.conv1(x))
        x = torch.relu(self.conv2(x))
        return self.pool(x).flatten(1)


class DeepfakeDetector(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = timm.create_model(
            "efficientnet_b0", pretrained=False, num_classes=0, global_pool="avg"
        )
        self.freq_branch = FrequencyBranch()
        with torch.no_grad():
            dummy = torch.randn(1, 3, 224, 224)
            backbone_dim = self.backbone(dummy).shape[1]
        self.classifier = nn.Sequential(
            nn.Linear(backbone_dim + 64, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 2),
        )

    def forward(self, x):
        rgb_feat = self.backbone(x)
        freq_feat = self.freq_branch(x)
        return self.classifier(torch.cat([rgb_feat, freq_feat], dim=1))


# ── Device & model cache ───────────────────────────────────────────────────────

def get_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


_single_models: dict = {}
_multi_detectors: dict = {}


def load_single_model(model_name: str):
    if model_name not in _single_models:
        filename = AVAILABLE_MODELS.get(model_name)
        if not filename:
            raise ValueError(f"Unknown model: {model_name}")
        model_path = MODELS_DIR / filename
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        device = get_device()
        logger.info(f"Loading model {model_name} on {device}...")
        model = DeepfakeDetector().to(device)
        ckpt = torch.load(str(model_path), map_location=device, weights_only=False)
        model.load_state_dict(ckpt["model_state_dict"])
        model.eval()
        _single_models[model_name] = (model, device)
        logger.info(f"Model {model_name} loaded (AUC: {ckpt.get('auc', 'N/A')})")
    return _single_models[model_name]


def load_multi_detector(model_name: str):
    if model_name not in _multi_detectors:
        filename = AVAILABLE_MODELS.get(model_name)
        if not filename:
            raise ValueError(f"Unknown model: {model_name}")
        model_path = MODELS_DIR / filename
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        device = get_device()
        logger.info(f"Loading multi-face detector with {model_name}...")
        from video_temporal_mfd1 import MultiFaceDeepfakeDetector
        detector = MultiFaceDeepfakeDetector(
            model_path=str(model_path), device=device
        )
        _multi_detectors[model_name] = detector
    return _multi_detectors[model_name]


# ── Inference helpers ──────────────────────────────────────────────────────────

def preprocess_bgr_frame(frame_bgr: np.ndarray) -> torch.Tensor:
    img = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224, 224)).astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img = (img - mean) / std
    return torch.from_numpy(img).permute(2, 0, 1).unsqueeze(0).float()


def ema_smooth(scores, alpha=0.6):
    if not scores:
        return scores
    out = [scores[0]]
    for x in scores[1:]:
        out.append(alpha * x + (1 - alpha) * out[-1])
    return out


def format_time(seconds: float) -> str:
    seconds = max(0.0, float(seconds))
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:05.2f}"


def scores_to_segments(scores, times, t_high=0.6, t_low=0.45, min_duration=0.5, merge_gap=0.35):
    segments = []
    in_seg = False
    start_t = None
    seg_scores = []
    for p, t in zip(scores, times):
        if not in_seg:
            if p >= t_high:
                in_seg, start_t, seg_scores = True, t, [p]
        else:
            seg_scores.append(p)
            if p <= t_low:
                segments.append([start_t, t, float(np.mean(seg_scores))])
                in_seg, start_t, seg_scores = False, None, []
    if in_seg and start_t is not None and times:
        segments.append([start_t, times[-1], float(np.mean(seg_scores))])
    segments = [s for s in segments if (s[1] - s[0]) >= min_duration]
    if not segments:
        return []
    merged = [segments[0]]
    for s in segments[1:]:
        prev = merged[-1]
        if s[0] - prev[1] <= merge_gap:
            pd, sd = max(prev[1] - prev[0], 1e-6), max(s[1] - s[0], 1e-6)
            prev[1] = max(prev[1], s[1])
            prev[2] = float((prev[2] * pd + s[2] * sd) / (pd + sd))
        else:
            merged.append(s)
    return merged


def run_predict_image(model, device, image_path: str) -> dict:
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not read image: {image_path}")
    x = preprocess_bgr_frame(img).to(device)
    with torch.no_grad():
        probs = torch.softmax(model(x), 1)
        fake_prob = probs[0, 1].item()
    return {
        "input_type": "image",
        "is_fake": fake_prob > 0.5,
        "confidence": round(fake_prob, 4),
    }


def run_predict_video(model, device, video_path: str, sample_fps=5, batch_size=16) -> dict:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Could not open video: {video_path}")
    vid_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / vid_fps if vid_fps > 0 else 0
    stride = max(int(round(vid_fps / sample_fps)), 1)
    frames, times = [], []
    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if idx % stride == 0:
            frames.append(frame)
            times.append(idx / vid_fps)
        idx += 1
    cap.release()
    if not frames:
        return {"input_type": "video", "video_is_fake": False, "overall_confidence": 0.0,
                "manipulated_segments": [], "duration_seconds": duration}
    scores = []
    model.eval()
    with torch.no_grad():
        for i in range(0, len(frames), batch_size):
            batch = frames[i: i + batch_size]
            xs = torch.cat([preprocess_bgr_frame(f) for f in batch], dim=0).to(device)
            probs = torch.softmax(model(xs), 1)[:, 1].cpu().numpy().tolist()
            scores.extend(probs)
    smooth = ema_smooth(scores, 0.6)
    k = max(1, int(0.1 * len(smooth)))
    overall_conf = float(np.mean(sorted(smooth, reverse=True)[:k]))
    segments = scores_to_segments(smooth, times)
    return {
        "input_type": "video",
        "video_is_fake": overall_conf > 0.5,
        "overall_confidence": round(overall_conf, 4),
        "duration_seconds": round(duration, 2),
        "frame_scores": [round(s, 4) for s in smooth],
        "frame_times": [round(t, 3) for t in times],
        "manipulated_segments": [
            {"start_time": format_time(s[0]), "end_time": format_time(s[1]),
             "start_seconds": round(s[0], 3), "end_seconds": round(s[1], 3),
             "confidence": round(s[2], 4)}
            for s in segments
        ],
    }


# ── Gemini AI analysis ────────────────────────────────────────────────────────

def analyze_with_gemini(file_path: str) -> dict:
    import base64
    import time as _time

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise RuntimeError("google-genai not installed")

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")

    client = genai.Client(api_key=api_key)

    suffix = Path(file_path).suffix.lower()
    is_video = suffix in VIDEO_EXTS

    PROMPT = (
        "You are an expert deepfake and AI-generated media forensics analyst. "
        "Analyze this media carefully for signs of deepfake manipulation or AI generation. "
        "Look for: facial artifacts, blurring around hairline/ears/neck, unnatural skin texture, "
        "eye glints/reflections, lighting inconsistencies, background warping, GAN fingerprints, "
        "temporal flickering (video), and any other manipulation indicators.\n\n"
        "Respond with ONLY a valid JSON object in this exact format, no other text:\n"
        "{\n"
        '  "is_fake": true or false,\n'
        '  "confidence": float between 0.0 and 1.0,\n'
        '  "verdict": "DEEPFAKE" or "AUTHENTIC",\n'
        '  "indicators": ["list of specific observations"],\n'
        '  "explanation": "one paragraph forensic analysis",\n'
        '  "face_count": integer or null\n'
        "}"
    )

    mime_map = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".webp": "image/webp", ".bmp": "image/bmp", ".tiff": "image/tiff",
        ".mp4": "video/mp4", ".avi": "video/x-msvideo", ".mov": "video/quicktime",
        ".mkv": "video/x-matroska", ".webm": "video/webm",
    }

    def _call(model_name: str):
        if is_video:
            logger.info(f"Uploading video via Files API ({model_name})")
            uploaded = client.files.upload(file=file_path)
            for _ in range(30):
                f = client.files.get(name=uploaded.name)
                if f.state.name == "ACTIVE":
                    break
                if f.state.name == "FAILED":
                    raise RuntimeError("Gemini video upload failed")
                _time.sleep(3)
            content = [types.Part.from_uri(file_uri=f.uri, mime_type=f.mime_type), PROMPT]
            resp = client.models.generate_content(model=model_name, contents=content)
            try:
                client.files.delete(name=uploaded.name)
            except Exception:
                pass
        else:
            mime = mime_map.get(suffix, "image/jpeg")
            with open(file_path, "rb") as fh:
                raw = fh.read()
            content = [
                types.Part.from_bytes(data=raw, mime_type=mime),
                PROMPT,
            ]
            resp = client.models.generate_content(model=model_name, contents=content)
        return resp

    response = None
    last_error = None
    for model_name in (
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        "gemini-2.5-flash-lite",
    ):
        try:
            response = _call(model_name)
            logger.info(f"Gemini succeeded with {model_name}")
            break
        except Exception as exc:
            s = str(exc)
            if any(k in s for k in ("429", "quota", "RESOURCE_EXHAUSTED", "rate", "limit")):
                logger.warning(f"Quota/rate issue with {model_name}: {s[:120]}")
                last_error = exc
            else:
                raise

    if response is None:
        raise RuntimeError(f"All Gemini models failed. Last: {last_error}")

    text = response.text.strip()
    for marker in ("```json", "```"):
        if marker in text:
            parts = text.split(marker)
            text = parts[1].split("```")[0].strip() if len(parts) > 1 else text
            break

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        logger.warning(f"Gemini non-JSON response: {text[:300]}")
        tl = text.lower()
        is_fake = any(w in tl for w in ("deepfake", "manipulated", "synthetic", "ai-generated"))
        result = {
            "is_fake": is_fake,
            "confidence": 0.8 if is_fake else 0.2,
            "verdict": "DEEPFAKE" if is_fake else "AUTHENTIC",
            "indicators": [],
            "explanation": text[:800],
            "face_count": None,
        }

    result["provider"] = "gemini"
    result["input_type"] = "video" if is_video else "image"
    if result.get("confidence", 0) > 1.0:
        result["confidence"] = round(result["confidence"] / 100.0, 4)
    return result


# ── API endpoints ──────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    device = get_device()
    models_status = {}
    for name, filename in AVAILABLE_MODELS.items():
        path = MODELS_DIR / filename
        models_status[name] = {
            "available": path.exists(),
            "size_mb": round(path.stat().st_size / 1024 / 1024, 1) if path.exists() else None,
        }
    return jsonify({
        "status": "ok",
        "device": str(device),
        "device_type": device.type,
        "models": models_status,
        "gemini_available": bool(os.environ.get("GEMINI_API_KEY", "").strip()),
    })


@app.route("/api/models")
def list_models():
    result = []
    for name, filename in AVAILABLE_MODELS.items():
        path = MODELS_DIR / filename
        result.append({
            "id": name,
            "label": name.replace("_", " ").title(),
            "filename": filename,
            "available": path.exists(),
            "size_mb": round(path.stat().st_size / 1024 / 1024, 1) if path.exists() else None,
        })
    return jsonify(result)


@app.route("/api/detect", methods=["POST"])
def detect():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    provider = request.form.get("provider", "local")
    model_name = request.form.get("model", "best_model_celeb_v1")
    use_multiface = request.form.get("multiface", "false").lower() == "true"

    suffix = Path(file.filename).suffix.lower()
    if suffix not in IMAGE_EXTS and suffix not in VIDEO_EXTS:
        return jsonify({"error": f"Unsupported file type: {suffix}"}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        if provider == "gemini":
            result = analyze_with_gemini(tmp_path)
        elif use_multiface:
            detector = load_multi_detector(model_name)
            if suffix in IMAGE_EXTS:
                result = detector.process_image(tmp_path)
            else:
                result = detector.process_video(tmp_path)
        else:
            model, device = load_single_model(model_name)
            if suffix in IMAGE_EXTS:
                result = run_predict_image(model, device, tmp_path)
            else:
                result = run_predict_video(model, device, tmp_path)
        return jsonify(result)
    except Exception as exc:
        logger.error(f"Detection failed: {exc}", exc_info=True)
        return jsonify({"error": str(exc)}), 500
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


# ── Serve React SPA ────────────────────────────────────────────────────────────

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    static_dir = Path(app.static_folder)
    target = static_dir / path
    if path and target.exists():
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting DeepFake Detection Engine on port {port}")
    logger.info(f"Device: {get_device()}")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
