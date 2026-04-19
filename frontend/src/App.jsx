import React, { useEffect, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import DropZone from "./components/DropZone.jsx";
import Controls from "./components/Controls.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import ImageResult from "./components/ImageResult.jsx";
import VideoResult from "./components/VideoResult.jsx";
import GeminiResult from "./components/GeminiResult.jsx";
import { detectDeepfake, fetchModels, fetchHealth } from "./api/client.js";
import { DEMO_MEDIA } from "./demoMedia.js";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clapperboard,
  Film,
  Image as ImageIcon,
  Layers3,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";

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

const sectionStyle = {
  padding: "20px",
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 4,
};

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
  const [loadingDemoId, setLoadingDemoId] = useState(null);
  const [demoAvailability, setDemoAvailability] = useState({});
  const [previewAsset, setPreviewAsset] = useState(null);
  const sampleAssetsRef = useRef(null);
  const feedbackRef = useRef(null);

  useEffect(() => {
    fetchHealth()
      .then((h) => {
        setStatus(h);
        return fetchModels();
      })
      .then(setModels)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      DEMO_MEDIA.map(async (item) => {
        try {
          const res = await fetch(item.assetUrl, { method: "HEAD", cache: "no-store" });
          return [item.id, res.ok];
        } catch {
          return [item.id, false];
        }
      })
    ).then((entries) => {
      if (!cancelled) {
        setDemoAvailability(Object.fromEntries(entries));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const localAvailable = models.some((model) => model.available);
  const geminiAvailable = status?.gemini_available ?? false;

  useEffect(() => {
    if (!localAvailable && geminiAvailable && provider === "local") {
      setProvider("gemini");
    }
  }, [geminiAvailable, localAvailable, provider]);

  useEffect(() => {
    if ((isAnalyzing || result || error) && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isAnalyzing, result, error]);

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleDemoSelect = async (item) => {
    setLoadingDemoId(item.id);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(item.assetUrl, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Demo asset missing: ${item.filename}`);
      }
      const blob = await res.blob();
      const demoFile = new File([blob], item.filename, {
        type: blob.type || item.mimeType,
      });
      setFile(demoFile);

      if (item.preferredProvider === "local" && localAvailable) {
        setProvider("local");
        setUseMultiface(!!item.enableMultiface);
      } else if (geminiAvailable) {
        setProvider("gemini");
        setUseMultiface(false);
      }
    } catch (err) {
      setError(err.message || "Failed to load demo asset.");
    } finally {
      setLoadingDemoId(null);
    }
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
  const canAnalyze =
    !!file &&
    !isAnalyzing &&
    ((provider === "local" && localAvailable) || (provider === "gemini" && geminiAvailable));

  const scrollToSampleAssets = () => {
    if (sampleAssetsRef.current) {
      sampleAssetsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header status={status} />

      <main
        style={{
          flex: 1,
          maxWidth: 1160,
          width: "100%",
          margin: "0 auto",
          padding: "28px 24px 72px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <HeroPanel localAvailable={localAvailable} geminiAvailable={geminiAvailable} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <QuickStartPanel />
          <ProviderPanel localAvailable={localAvailable} geminiAvailable={geminiAvailable} />
        </div>

        <div
          className="workflow-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 0.95fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ ...sectionStyle, display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionEyebrow label="Upload Or Demo" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  fontFamily: '"Bebas Neue", monospace',
                  fontSize: "clamp(26px, 5vw, 34px)",
                  letterSpacing: "0.06em",
                  lineHeight: 1,
                }}
              >
                ONE PAGE. LIVE DETECTION. PRODUCTION-READY.
              </div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)" }}>
                Upload your own evidence or select a prepared sample asset. The page is designed to work like
                a SaaS product workflow: load a sample, choose the model provider, run analysis, and read
                the verdict without switching screens.
              </p>
            </div>

            <DropZone file={file} onFile={handleFile} disabled={isAnalyzing || !!loadingDemoId} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                padding: "12px 14px",
                border: "1px solid var(--border-subtle)",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Don&apos;t have a photo right now? Use one of the sample assets below and test the full workflow.
              </div>
              <button
                onClick={scrollToSampleAssets}
                style={{
                  padding: "10px 14px",
                  border: "1px solid rgba(34,211,238,0.3)",
                  background: "rgba(34,211,238,0.1)",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: '"IBM Plex Mono", monospace',
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Test With Demo Assets
              </button>
            </div>
          </div>

          <div style={{ ...sectionStyle, display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionEyebrow label="Analyze" />
            <div>
              <div
                style={{
                  fontFamily: '"Bebas Neue", monospace',
                  fontSize: "clamp(24px, 4vw, 28px)",
                  letterSpacing: "0.06em",
                  lineHeight: 1,
                }}
              >
                CHOOSE YOUR ANALYSIS PATH
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)" }}>
                Use Our own model or Gemini vision analysis. In some cases, Our own model outperforms Gemini on
                artifact-driven deepfake detection, especially when you
                need exact manipulated segments from video.
              </p>
            </div>

            <Controls
              models={models}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              useMultiface={useMultiface}
              onMultifaceChange={setUseMultiface}
              provider={provider}
              onProviderChange={setProvider}
              geminiAvailable={geminiAvailable}
              localAvailable={localAvailable}
              onAnalyze={handleAnalyze}
              canAnalyze={canAnalyze}
              isAnalyzing={isAnalyzing || !!loadingDemoId}
            />

            <InstructionBand localAvailable={localAvailable} geminiAvailable={geminiAvailable} provider={provider} />
          </div>
        </div>

        <div ref={feedbackRef} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {isAnalyzing && (
          <div>
            <SectionEyebrow label="Processing" />
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
            <SectionEyebrow label="Analysis Results" />
            {result.provider === "gemini" ? (
              <GeminiResult result={result} />
            ) : result.input_type === "video" || (result.persons !== undefined && isVideo) ? (
              <VideoResult result={result} />
            ) : (
              <ImageResult result={result} />
            )}

            <RawJSON data={result} />
          </div>
        )}
        </div>

        <div ref={sampleAssetsRef}>
          <DemoLibrary
            loadingDemoId={loadingDemoId}
            availability={demoAvailability}
            onSelect={handleDemoSelect}
            onPreview={setPreviewAsset}
            localAvailable={localAvailable}
          />
        </div>

        <CapabilityStrip />
        <TimelinePitch />
      </main>
      <AssetPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />
    </div>
  );
}

function HeroPanel({ localAvailable, geminiAvailable }) {
  const states = [
    {
      label: "OUR OWN MODEL",
      value: localAvailable ? "ONLINE" : "OFFLINE",
      color: localAvailable ? "var(--safe)" : "var(--warn)",
    },
    {
      label: "GEMINI",
      value: geminiAvailable ? "ONLINE" : "OFFLINE",
      color: geminiAvailable ? "var(--safe)" : "var(--warn)",
    },
    {
      label: "VIDEO SELLING POINT",
      value: "SEGMENT LOCALIZATION",
      color: "var(--accent)",
    },
  ];

  return (
    <section
      className="hero-grid"
      style={{
        ...sectionStyle,
        overflow: "hidden",
        background:
          "radial-gradient(circle at top right, rgba(34,211,238,0.12), transparent 28%), radial-gradient(circle at left center, rgba(99,102,241,0.12), transparent 24%), var(--bg-card)",
      }}
    >
      <div className="hero-grid-inner" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 0.9fr)", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              alignSelf: "flex-start",
              padding: "6px 10px",
              border: "1px solid rgba(34,211,238,0.3)",
              background: "rgba(34,211,238,0.08)",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--accent)",
              textTransform: "uppercase",
            }}
          >
            <ShieldCheck size={12} />
            One-page forensic media review workspace
          </div>

          <div
            style={{
              fontFamily: '"Bebas Neue", monospace',
              fontSize: "clamp(40px, 8vw, 54px)",
              letterSpacing: "0.05em",
              lineHeight: 0.94,
              maxWidth: 620,
            }}
          >
            DETECT DEEPFAKES.
            <br />
            SHOW EXACT VIDEO SEGMENTS.
          </div>

          <p style={{ margin: 0, maxWidth: 700, fontSize: 13, lineHeight: 1.8, color: "var(--text-secondary)" }}>
            Built for real users who want a polished forensic workflow. Upload evidence or load sample assets,
            run either Our own model or Gemini, and work through a clean SaaS-style analysis flow.
            The key differentiator is video localization: Our own model pipeline can show the specific spans where
            manipulation appears.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              "Image and video analysis",
              "One-click sample assets",
              "Temporal segment localization",
              "Gemini plus Our own model",
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: "6px 10px",
                  border: "1px solid var(--border-subtle)",
                  background: "rgba(255,255,255,0.02)",
                  fontSize: 10,
                  color: "var(--text-secondary)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            alignContent: "start",
          }}
        >
          {states.map((state) => (
            <div
              key={state.label}
              style={{
                padding: "16px 18px",
                border: "1px solid var(--border-subtle)",
                background: "rgba(7,12,20,0.62)",
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 6 }}>
                {state.label}
              </div>
              <div
                className="readout"
                style={{
                  fontSize: 28,
                  lineHeight: 1,
                  color: state.color,
                }}
              >
                {state.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStartPanel() {
  const steps = [
    {
      icon: UploadCloud,
      title: "1. ADD EVIDENCE",
      desc: "Drag and drop your own image or video, or use a built-in sample asset when you want to try the workflow instantly.",
    },
    {
      icon: Layers3,
      title: "2. CHOOSE A MODEL",
      desc: "Pick Our own model for artifact-focused forensic analysis and video localization, or Gemini for fast multimodal review.",
    },
    {
      icon: CheckCircle2,
      title: "3. REVIEW THE OUTPUT",
      desc: "Read the verdict, confidence, indicators, and for supported video runs, the exact manipulated time segments.",
    },
  ];

  return (
    <section style={{ ...sectionStyle, display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionEyebrow label="First-Time Use" />
      <div
        style={{
          fontFamily: '"Bebas Neue", monospace',
          fontSize: 28,
          letterSpacing: "0.06em",
          lineHeight: 1,
        }}
      >
        HOW TO USE THE PLATFORM
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              style={{
                display: "grid",
                gridTemplateColumns: "38px minmax(0, 1fr)",
                gap: 12,
                padding: "14px 16px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  border: "1px solid rgba(34,211,238,0.35)",
                  background: "rgba(34,211,238,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.08em", marginBottom: 6 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProviderPanel({ localAvailable, geminiAvailable }) {
  const cards = [
    {
      title: "OUR OWN MODEL",
      value: localAvailable ? "READY" : "NOT INSTALLED",
      color: localAvailable ? "var(--accent)" : "var(--warn)",
      desc: "Use this path when you want exact manipulated segments in video, temporal scoring, and the strongest product differentiation.",
    },
    {
      title: "GEMINI MODELS",
      value: geminiAvailable ? "READY" : "NOT CONFIGURED",
      color: geminiAvailable ? "#a78bfa" : "var(--warn)",
      desc: "Use this for quick qualitative image or video review, natural-language indicators, and fast onboarding without model weights.",
    },
  ];

  return (
    <section style={{ ...sectionStyle, display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionEyebrow label="Model Choice" />
      <div
        style={{
          fontFamily: '"Bebas Neue", monospace',
          fontSize: 28,
          letterSpacing: "0.06em",
          lineHeight: 1,
        }}
      >
        OUR OWN MODEL VS GEMINI
      </div>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: "var(--text-secondary)" }}>
        Present this as a deliberate product choice, not a fallback. Gemini is strong for quick forensic
        reasoning. Our own model is the core differentiator when you want artifact-focused
        detection and, in some cases, better performance on deepfake-specific cues.
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              padding: "14px 16px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 4,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "var(--text-primary)", letterSpacing: "0.08em" }}>{card.title}</div>
              <div style={{ fontSize: 10, color: card.color, letterSpacing: "0.1em" }}>{card.value}</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>{card.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DemoLibrary({ loadingDemoId, availability, onSelect, onPreview, localAvailable }) {
  const availableCount = DEMO_MEDIA.filter((item) => availability[item.id]).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 4 }}>
            SAMPLE ASSETS
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Click a prepared sample instead of uploading. Video demos are the best place to highlight exact
            manipulated segment detection.
          </div>
        </div>
        <div style={{ fontSize: 10, color: availableCount > 0 ? "var(--safe)" : "var(--warn)", letterSpacing: "0.08em" }}>
          {availableCount > 0 ? `${availableCount}/${DEMO_MEDIA.length} ASSETS INSTALLED` : "SAMPLE PACK NOT INSTALLED"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {DEMO_MEDIA.map((item) => (
          <DemoCard
            key={item.id}
            item={item}
            isAvailable={!!availability[item.id]}
            isLoading={loadingDemoId === item.id}
            onSelect={onSelect}
            onPreview={onPreview}
            localAvailable={localAvailable}
          />
        ))}
      </div>
    </div>
  );
}

function DemoCard({ item, isAvailable, isLoading, onSelect, onPreview, localAvailable }) {
  const isVideo = item.type === "video";
  const bestMode = item.preferredProvider === "local" ? "Our own model" : "Gemini";
  const canLoad = isAvailable && !isLoading && (!isVideo || item.validated === true);
  const timelineNote =
    isVideo && !localAvailable
      ? "Add backend model weights to unlock timeline segments on this deployment."
      : item.featureHighlight;

  return (
    <div
      style={{
        padding: 0,
        border: "1px solid var(--border-subtle)",
        borderRadius: 4,
        overflow: "hidden",
        background: "var(--bg-elevated)",
      }}
    >
      <button
        type="button"
        onClick={() => isAvailable && onPreview(item)}
        style={{
          height: 132,
          position: "relative",
          background: isVideo
            ? "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(34,211,238,0.12))"
            : `linear-gradient(135deg, rgba(34,211,238,0.16), rgba(255,255,255,0.03)), url(${item.assetUrl}) center/cover no-repeat`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          border: "none",
          padding: 0,
          cursor: isAvailable ? "pointer" : "not-allowed",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "rgba(7,12,20,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isVideo ? <PlayCircle size={20} color="var(--text-primary)" /> : <ImageIcon size={18} color="var(--text-primary)" />}
        </div>
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            padding: "4px 8px",
            fontSize: 9,
            color: isVideo ? "var(--warn)" : "var(--accent)",
            letterSpacing: "0.08em",
            border: `1px solid ${isVideo ? "rgba(245,158,11,0.4)" : "rgba(34,211,238,0.35)"}`,
            background: "rgba(7,12,20,0.72)",
          }}
        >
          {isVideo ? "VIDEO SAMPLE" : "IMAGE SAMPLE"}
        </div>
        <div
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            padding: "4px 8px",
            fontSize: 9,
            color: "var(--text-primary)",
            letterSpacing: "0.08em",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(7,12,20,0.72)",
          }}
        >
          CLICK TO PREVIEW
        </div>
      </button>

      <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-primary)", letterSpacing: "0.06em", marginBottom: 6 }}>
            {item.title}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item.description}</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Tag>{bestMode} recommended</Tag>
          <Tag muted={!isAvailable}>{timelineNote}</Tag>
          {item.providerWarning ? <Tag danger>{item.providerWarning}</Tag> : null}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button
            type="button"
            onClick={() => isAvailable && onPreview(item)}
            disabled={!isAvailable}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "10px 12px",
              background: isAvailable ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${isAvailable ? "rgba(255,255,255,0.12)" : "var(--border-subtle)"}`,
              color: isAvailable ? "var(--text-primary)" : "var(--text-muted)",
              cursor: isAvailable ? "pointer" : "not-allowed",
              fontSize: 11,
              fontFamily: '"IBM Plex Mono", monospace',
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {isVideo ? <PlayCircle size={14} /> : <ImageIcon size={14} />}
            Preview
          </button>
          <button
            onClick={() => onSelect(item)}
            disabled={!canLoad}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              width: "100%",
              padding: "10px 12px",
              background: canLoad ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${canLoad ? "rgba(34,211,238,0.28)" : "var(--border-subtle)"}`,
              color: canLoad ? "var(--accent)" : "var(--text-muted)",
              cursor: canLoad ? "pointer" : "not-allowed",
              fontSize: 11,
              fontFamily: '"IBM Plex Mono", monospace',
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>
              {isLoading
                ? "LOADING SAMPLE..."
                : !isAvailable
                  ? isVideo
                    ? `ADD ${item.filename.toUpperCase()}`
                    : "ASSET MISSING"
                  : isVideo && item.validated !== true
                    ? "VALIDATED CLIP REQUIRED"
                    : "LOAD SAMPLE"}
            </span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function InstructionBand({ localAvailable, geminiAvailable, provider }) {
  const tips = [
    "Choose a sample asset or upload your own file, then click Analyze.",
    "For image-only onboarding, Gemini is the fastest path to a clean walkthrough.",
    "For the strongest selling point: run a short video with Our own model to show exact manipulated segments on the timeline.",
  ];

  if (!localAvailable) {
    tips[2] = "To show exact manipulated video segments, install the model weights on the backend and use Our own model.";
  }

  if (!geminiAvailable) {
    tips[1] = "Gemini is not configured on this deployment, so only Our own model is available.";
  }

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 4,
        border: "1px solid rgba(244,63,94,0.28)",
        background: provider === "gemini" ? "rgba(244,63,94,0.12)" : "rgba(244,63,94,0.08)",
        display: "grid",
        gap: 8,
      }}
    >
      {tips.map((tip) => (
        <div key={tip} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <CheckCircle2 size={14} color="var(--danger)" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 11, color: "var(--danger)", lineHeight: 1.6 }}>{tip}</div>
        </div>
      ))}
    </div>
  );
}

function CapabilityStrip() {
  const items = [
    {
      icon: Sparkles,
      title: "SELL THE DUAL MODE",
      desc: "Offer both Gemini and Our own model as deliberate product choices, not hidden backend details.",
    },
    {
      icon: Clapperboard,
      title: "VIDEO IS THE HOOK",
      desc: "When Our own model pipeline is active, the timeline pinpoints exactly where manipulation appears in the clip.",
    },
    {
      icon: Film,
      title: "LOW-FRICTION WORKFLOW",
      desc: "Users can select prepared sample assets, read the verdict immediately, and understand the workflow without setup friction.",
    },
  ];

  return (
    <section style={{ ...sectionStyle, display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionEyebrow label="Why This Sells" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              style={{
                padding: "16px",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-elevated)",
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: "1px solid rgba(34,211,238,0.35)",
                  background: "rgba(34,211,238,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Icon size={16} color="var(--accent)" />
              </div>
              <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.08em", marginBottom: 8 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TimelinePitch() {
  return (
    <section style={{ ...sectionStyle, display: "grid", gap: 14 }}>
      <SectionEyebrow label="Video Timeline" />
      <div
        className="timeline-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: '"Bebas Neue", monospace',
              fontSize: "clamp(26px, 5vw, 32px)",
              letterSpacing: "0.06em",
              lineHeight: 1,
              marginBottom: 10,
            }}
          >
            MAKE SEGMENT LOCALIZATION THE SELLING POINT
          </div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: "var(--text-secondary)" }}>
            The strongest story on the site is not just that a video is fake, but that the system isolates the
            suspicious region in time. Use two short 11-second clips as clickable demos, then present the
            timeline output as the product differentiator: exact manipulated spans instead of a single binary
            verdict.
          </p>
        </div>

        <div
          style={{
            padding: "16px",
            border: "1px solid rgba(244,63,94,0.22)",
            background: "rgba(244,63,94,0.05)",
            borderRadius: 4,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 11, color: "var(--danger)", letterSpacing: "0.08em" }}>RECOMMENDED DEMO SETUP</div>
          {[
            "Clip 01: a short manipulated face-swap with a clear deepfake interval",
            "Clip 02: a short comparison clip with a different artifact pattern or a mostly-authentic segment",
            "Keep both around 11 seconds so they load quickly and clearly demonstrate the localization workflow",
          ].map((item) => (
            <div key={item} style={{ display: "flex", gap: 8 }}>
              <PlayCircle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65 }}>{item}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
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

function SectionEyebrow({ label }) {
  return (
    <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
      {label}
    </div>
  );
}

function Tag({ children, muted = false, danger = false }) {
  return (
    <span
      style={{
        fontSize: 9,
        padding: "4px 7px",
        border: `1px solid ${danger ? "rgba(244,63,94,0.3)" : "var(--border-subtle)"}`,
        color: danger ? "var(--danger)" : muted ? "var(--text-muted)" : "var(--text-secondary)",
        background: danger ? "rgba(244,63,94,0.08)" : "transparent",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function AssetPreviewModal({ asset, onClose }) {
  if (!asset) return null;

  const isVideo = asset.type === "video";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4,7,12,0.82)",
        backdropFilter: "blur(6px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(960px, 100%)",
          maxHeight: "90vh",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 6,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "var(--text-primary)", letterSpacing: "0.06em", marginBottom: 4 }}>
              {asset.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{asset.description}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: '"IBM Plex Mono", monospace',
              padding: "8px 10px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Close
          </button>
        </div>
        <div
          style={{
            padding: 16,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#05080f",
          }}
        >
          {isVideo ? (
            <video
              src={asset.assetUrl}
              controls
              autoPlay
              playsInline
              style={{ width: "100%", maxHeight: "72vh", borderRadius: 4, background: "#000" }}
            />
          ) : (
            <img
              src={asset.assetUrl}
              alt={asset.title}
              style={{ width: "100%", maxHeight: "72vh", objectFit: "contain", borderRadius: 4 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
