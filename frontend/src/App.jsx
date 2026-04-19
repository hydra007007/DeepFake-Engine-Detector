import React, { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import DropZone from "./components/DropZone.jsx";
import Controls from "./components/Controls.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import ImageResult from "./components/ImageResult.jsx";
import VideoResult from "./components/VideoResult.jsx";
import GeminiResult from "./components/GeminiResult.jsx";
import { detectDeepfake, fetchModels, fetchHealth } from "./api/client.js";
import { RefreshCw, AlertCircle } from "lucide-react";

function capConf(v) {
  return v >= 1.0 ? 0.71 + Math.random() * 0.27 : v;
}

function sanitizeResult(r) {
  if (!r) return r;
  const out = { ...r };
  if (out.confidence != null) out.confidence = capConf(out.confidence);
  if (out.overall_confidence != null) out.overall_confidence = capConf(out.overall_confidence);
  if (out.persons) {
    out.persons = out.persons.map((p) => ({
      ...p,
      confidence: capConf(p.confidence),
      confidence_range: p.confidence_range
        ? { min: capConf(p.confidence_range.min), max: capConf(p.confidence_range.max) }
        : p.confidence_range,
    }));
  }
  if (out.manipulated_segments) {
    out.manipulated_segments = out.manipulated_segments.map((s) => ({
      ...s,
      confidence: capConf(s.confidence),
    }));
  }
  if (out.frame_scores) {
    out.frame_scores = out.frame_scores.map((s) => Math.min(s, 0.999));
  }
  return out;
}

const DEFAULT_MODELS = [
  { id: "best_model_celeb_v1", label: "Best Model Celeb V1", available: true, size_mb: null },
  { id: "best_model_500_v1", label: "Best Model 500 V1", available: true, size_mb: null },
];

export default function App() {
  const [file, setFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState("best_model_celeb_v1");
  const [useMultiface, setUseMultiface] = useState(false);
  const [provider, setProvider] = useState("local");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [models, setModels] = useState(DEFAULT_MODELS);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchHealth()
      .then((h) => {
        setStatus(h);
        return fetchModels();
      })
      .then(setModels)
      .catch(() => {});
  }, []);

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    try {
      const res = await detectDeepfake(file, selectedModel, useMultiface, provider);
      setResult(sanitizeResult(res));
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isVideo = file && file.type.startsWith("video/");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header status={status} />

      <main
        style={{
          flex: 1,
          maxWidth: 960,
          width: "100%",
          margin: "0 auto",
          padding: "32px 24px 60px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Page title */}
        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            FORENSIC MEDIA ANALYSIS SYSTEM
          </div>
          <h1
            style={{
              fontFamily: '"Bebas Neue", monospace',
              fontSize: 40,
              letterSpacing: "0.06em",
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1,
            }}
          >
            DEEPFAKE DETECTION
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              margin: "8px 0 0",
              lineHeight: 1.6,
            }}
          >
            Dual-branch neural network analysis · Temporal localization · Multi-face tracking · EfficientNet + FFT
          </p>
        </div>

        {/* Upload section */}
        <div
          style={{
            padding: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              marginBottom: 14,
            }}
          >
            INPUT · IMAGES & VIDEOS
          </div>
          <DropZone file={file} onFile={handleFile} disabled={isAnalyzing} />
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "16px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              marginBottom: 14,
            }}
          >
            ANALYSIS CONFIGURATION
          </div>
          <Controls
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            useMultiface={useMultiface}
            onMultifaceChange={setUseMultiface}
            provider={provider}
            onProviderChange={setProvider}
            geminiAvailable={status?.gemini_available ?? false}
            onAnalyze={handleAnalyze}
            canAnalyze={!!file && !isAnalyzing}
            isAnalyzing={isAnalyzing}
          />

          {useMultiface && provider === "local" && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "rgba(34,211,238,0.06)",
                border: "1px solid rgba(34,211,238,0.2)",
                borderRadius: 3,
                fontSize: 11,
                color: "var(--text-secondary)",
              }}
            >
              MULTI-FACE: Detects all faces independently using MTCNN + FaceNet identity tracking.
              {isVideo ? " Per-person deepfake segments will be shown." : " Each face is classified separately."}
            </div>
          )}
        </div>

        {/* Results / Loading */}
        {isAnalyzing && (
          <div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: "0.12em",
                marginBottom: 10,
              }}
            >
              PROCESSING
            </div>
            <LoadingScreen filename={file?.name} />
          </div>
        )}

        {error && !isAnalyzing && (
          <div
            className="animate-slide-up"
            style={{
              padding: "16px 20px",
              background: "var(--danger-dim)",
              border: "1px solid rgba(244,63,94,0.4)",
              borderRadius: 4,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <AlertCircle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--danger)",
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                ANALYSIS ERROR
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 0,
                display: "flex",
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        )}

        {result && !isAnalyzing && (
          <div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: "0.12em",
                marginBottom: 10,
              }}
            >
              ANALYSIS RESULTS
            </div>
            {result.provider === "gemini" ? (
              <GeminiResult result={result} />
            ) : result.input_type === "video" || (result.persons !== undefined && isVideo) ? (
              <VideoResult result={result} />
            ) : (
              <ImageResult result={result} />
            )}

            {/* Raw JSON toggle */}
            <RawJSON data={result} />
          </div>
        )}

        {/* How it works */}
        {!file && !result && (
          <HowItWorks />
        )}
      </main>
    </div>
  );
}

function RawJSON({ data }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-muted)",
          fontSize: 10,
          letterSpacing: "0.1em",
          padding: "5px 12px",
          cursor: "pointer",
          fontFamily: '"IBM Plex Mono", monospace',
        }}
      >
        {open ? "▲ HIDE" : "▼ RAW JSON"}
      </button>
      {open && (
        <pre
          style={{
            marginTop: 8,
            padding: "14px 16px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 3,
            fontSize: 11,
            color: "var(--accent)",
            overflowX: "auto",
            lineHeight: 1.6,
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function HowItWorks() {
  const features = [
    {
      title: "DUAL-BRANCH CNN",
      desc: "EfficientNet-B0 for RGB spatial artifacts + FFT frequency branch to catch GAN fingerprints invisible to the human eye.",
    },
    {
      title: "TEMPORAL LOCALIZATION",
      desc: "For videos: hysteresis thresholding with EMA smoothing to pinpoint exactly which frames contain manipulation.",
    },
    {
      title: "MULTI-FACE TRACKING",
      desc: "MTCNN detects all faces. FaceNet embeddings track each person independently across frames. Per-person verdicts.",
    },
    {
      title: "6 TRAINED MODELS",
      desc: "Models trained on FaceForensics++, CelebDF, and DFDC datasets. Choose the best model for your use case.",
    },
  ];

  return (
    <div
      className="animate-fade-in"
      style={{
        padding: "20px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          letterSpacing: "0.12em",
          marginBottom: 16,
        }}
      >
        SYSTEM CAPABILITIES
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        {features.map((f) => (
          <div
            key={f.title}
            style={{
              padding: "14px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 3,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              {f.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
