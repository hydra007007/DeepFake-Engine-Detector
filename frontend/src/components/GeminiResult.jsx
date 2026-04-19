import React from "react";
import { Sparkles, AlertTriangle, CheckCircle, Users } from "lucide-react";
import ConfidenceBar from "./ConfidenceBar.jsx";

export default function GeminiResult({ result }) {
  const isFake = result.is_fake;
  const conf = result.confidence ?? 0;
  const verdict = result.verdict || (isFake ? "DEEPFAKE" : "AUTHENTIC");
  const indicators = result.indicators || [];
  const explanation = result.explanation || "";
  const faceCount = result.face_count;

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Provider badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 10,
          color: "#a78bfa",
          letterSpacing: "0.1em",
        }}
      >
        <Sparkles size={12} />
        ANALYSIS BY GEMINI 2.0 FLASH VISION
        {faceCount != null && (
          <span style={{ marginLeft: 8, color: "var(--text-muted)" }}>
            <Users size={10} style={{ display: "inline", marginRight: 4 }} />
            {faceCount} face{faceCount !== 1 ? "s" : ""} detected
          </span>
        )}
      </div>

      {/* Verdict banner */}
      <div
        style={{
          padding: "22px 26px",
          background: isFake ? "var(--danger-dim)" : "var(--safe-dim)",
          border: `1px solid ${isFake ? "rgba(244,63,94,0.5)" : "rgba(16,185,129,0.5)"}`,
          borderRadius: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: isFake
            ? "0 0 24px rgba(244,63,94,0.1)"
            : "0 0 24px rgba(16,185,129,0.1)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              marginBottom: 6,
            }}
          >
            GEMINI VERDICT
          </div>
          <div
            className="readout"
            style={{
              fontSize: 36,
              letterSpacing: "0.06em",
              color: isFake ? "var(--danger)" : "var(--safe)",
            }}
          >
            {verdict}
          </div>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 3 }}>
              CONFIDENCE
            </div>
            <div
              className="readout"
              style={{ fontSize: 40, color: isFake ? "var(--danger)" : "var(--safe)", lineHeight: 1 }}
            >
              {Math.round(conf * 100)}
              <span style={{ fontSize: 18 }}>%</span>
            </div>
          </div>
          {isFake ? (
            <AlertTriangle size={40} color="var(--danger)" style={{ alignSelf: "center" }} />
          ) : (
            <CheckCircle size={40} color="var(--safe)" style={{ alignSelf: "center" }} />
          )}
        </div>
      </div>

      {/* Confidence bar */}
      <div
        style={{
          padding: "14px 18px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 4,
        }}
      >
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 8 }}>
          FAKE PROBABILITY SPECTRUM
        </div>
        <ConfidenceBar value={conf} isFake={isFake} size="lg" showPercent />
      </div>

      {/* Forensic indicators */}
      {indicators.length > 0 && (
        <div
          style={{
            padding: "14px 18px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            FORENSIC INDICATORS ({indicators.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {indicators.map((ind, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "7px 12px",
                  background: isFake
                    ? "rgba(244,63,94,0.06)"
                    : "rgba(16,185,129,0.05)",
                  border: `1px solid ${
                    isFake ? "rgba(244,63,94,0.15)" : "rgba(16,185,129,0.15)"
                  }`,
                  borderRadius: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: isFake ? "var(--danger)" : "var(--safe)",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {isFake ? "▸" : "✓"}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {ind}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI explanation */}
      {explanation && (
        <div
          style={{
            padding: "14px 18px",
            background: "rgba(99,102,241,0.05)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10,
              color: "#a78bfa",
              letterSpacing: "0.1em",
              marginBottom: 10,
            }}
          >
            <Sparkles size={11} />
            GEMINI FORENSIC ANALYSIS
          </div>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
