import React from "react";
import { Settings2, Users, Zap, Sparkles } from "lucide-react";

export default function Controls({
  models,
  selectedModel,
  onModelChange,
  useMultiface,
  onMultifaceChange,
  provider,
  onProviderChange,
  geminiAvailable,
  localAvailable,
  onAnalyze,
  canAnalyze,
  isAnalyzing,
}) {
  const useGemini = provider === "gemini";
  const useLocal = provider === "local";
  const canUseGemini = geminiAvailable && !isAnalyzing;
  const canUseLocal = localAvailable && !isAnalyzing;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Provider row */}
      <div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          ANALYSIS PROVIDER
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* LOCAL MODEL */}
          <button
            onClick={() => onProviderChange("local")}
            disabled={!canUseLocal}
            title={!localAvailable ? "Local models are not available on the backend" : ""}
            style={{
              flex: "1 1 auto",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "10px 14px",
              background: useLocal ? "rgba(34,211,238,0.12)" : "var(--bg-elevated)",
              border: `1px solid ${useLocal ? "var(--accent)" : "var(--border-subtle)"}`,
              color: useLocal ? "var(--accent)" : "var(--text-secondary)",
              cursor: canUseLocal ? "pointer" : "not-allowed",
              opacity: localAvailable ? 1 : 0.55,
              fontSize: 12, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.05em",
              transition: "all 0.2s ease",
              boxShadow: useLocal ? "0 0 12px rgba(34,211,238,0.15)" : "none",
            }}
          >
            <Settings2 size={12} />
            IN-HOUSE
          </button>

          {/* GEMINI AI */}
          <button
            onClick={() => onProviderChange("gemini")}
            disabled={!canUseGemini}
            title={!geminiAvailable ? "GEMINI_API_KEY not configured" : ""}
            style={{
              flex: "1 1 auto",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "10px 14px",
              background: useGemini ? "rgba(99,102,241,0.18)" : "var(--bg-elevated)",
              border: `1px solid ${useGemini ? "rgba(99,102,241,0.7)" : "var(--border-subtle)"}`,
              color: useGemini ? "#a78bfa" : "var(--text-secondary)",
              cursor: canUseGemini ? "pointer" : "not-allowed",
              opacity: geminiAvailable ? 1 : 0.55,
              fontSize: 12, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.05em",
              transition: "all 0.2s ease",
              boxShadow: useGemini ? "0 0 14px rgba(99,102,241,0.2)" : "none",
            }}
          >
            <Sparkles size={12} />
            GEMINI
            {geminiAvailable && (
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 5px #10b981" }} />
            )}
          </button>

        </div>
      </div>

      {/* Second row: model selector + multiface + analyze */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
        {/* Model selector — only for local mode */}
        {useLocal && (
          <div style={{ flex: "1 1 200px", minWidth: 160 }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              DETECTION MODEL
            </label>
            <div style={{ position: "relative" }}>
              <Settings2
                size={11}
                color="var(--text-muted)"
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={isAnalyzing}
                style={{
                  width: "100%",
                  padding: "9px 10px 9px 26px",
                  fontSize: 12,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  appearance: "none",
                  fontFamily: '"IBM Plex Mono", monospace',
                }}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} disabled={!m.available}>
                    {m.label} {m.available ? `(${m.size_mb}MB)` : "(missing)"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* AI provider label */}
        {useGemini && (
          <div style={{ flex: "1 1 200px", padding: "9px 14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)", fontSize: 12, color: "#a78bfa", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={12} />Gemini forensic vision analysis
          </div>
        )}
        {/* Multi-face toggle — only for local mode */}
        {useLocal && (
          <div style={{ flex: "0 0 auto" }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              MULTI-FACE
            </label>
            <button
              onClick={() => onMultifaceChange(!useMultiface)}
              disabled={isAnalyzing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 12px",
                background: useMultiface ? "rgba(34,211,238,0.12)" : "var(--bg-elevated)",
                border: `1px solid ${useMultiface ? "var(--accent)" : "var(--border-subtle)"}`,
                color: useMultiface ? "var(--accent)" : "var(--text-secondary)",
                cursor: isAnalyzing ? "not-allowed" : "pointer",
                fontSize: 12,
                fontFamily: '"IBM Plex Mono", monospace',
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              <Users size={12} />
              {useMultiface ? "ON" : "OFF"}
              <div
                style={{
                  width: 22,
                  height: 12,
                  borderRadius: 6,
                  background: useMultiface ? "var(--accent)" : "var(--border-subtle)",
                  position: "relative",
                  transition: "background 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: 2,
                    left: useMultiface ? 12 : 2,
                    transition: "left 0.2s ease",
                  }}
                />
              </div>
            </button>
          </div>
        )}

        {/* Analyze button */}
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 24px",
            background:
              canAnalyze && !isAnalyzing
                ? useGemini ? "rgba(99,102,241,0.9)" : "var(--accent)"
                : "var(--bg-elevated)",
            border: `1px solid ${
              canAnalyze && !isAnalyzing
                ? useGemini ? "rgba(99,102,241,0.9)" : "var(--accent)"
                : "var(--border-subtle)"
            }`,
            color: canAnalyze && !isAnalyzing ? (useLocal ? "#070c14" : "#fff") : "var(--text-muted)",
            cursor: canAnalyze && !isAnalyzing ? "pointer" : "not-allowed",
            fontSize: 13, fontWeight: 700,
            fontFamily: '"IBM Plex Mono", monospace',
            letterSpacing: "0.1em", textTransform: "uppercase",
            transition: "all 0.2s ease",
            boxShadow:
              canAnalyze && !isAnalyzing
                ? useGemini ? "0 0 16px rgba(99,102,241,0.3)" : "0 0 16px rgba(34,211,238,0.3)"
                : "none",
          }}
        >
          {useGemini ? <Sparkles size={13} /> : <Zap size={13} />}
          {isAnalyzing ? "ANALYZING..." : "ANALYZE"}
        </button>
      </div>
    </div>
  );
}
