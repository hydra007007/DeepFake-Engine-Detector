import React, { useEffect, useState } from "react";

const MESSAGES = [
  "INITIALIZING NEURAL NETWORK...",
  "EXTRACTING FACIAL FEATURES...",
  "RUNNING FFT FREQUENCY ANALYSIS...",
  "PROCESSING EFFICIENTNET BACKBONE...",
  "APPLYING TEMPORAL SMOOTHING...",
  "ANALYZING DEEPFAKE ARTIFACTS...",
  "COMPUTING CONFIDENCE SCORES...",
];

export default function LoadingScreen({ filename }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MESSAGES.length);
    }, 1800);
    const dotTimer = setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 400);
    return () => {
      clearInterval(msgTimer);
      clearInterval(dotTimer);
    };
  }, []);

  return (
    <div
      className="scan-anim"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 4,
        padding: 40,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated rings */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 32,
          position: "relative",
          height: 80,
        }}
      >
        {[80, 60, 40].map((size, i) => (
          <div
            key={size}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              border: `1px solid rgba(34,211,238,${0.2 + i * 0.2})`,
              animation: `rotate ${1 + i * 0.4}s linear infinite`,
              borderTopColor: "var(--accent)",
            }}
          />
        ))}
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--accent)",
            boxShadow: "0 0 12px var(--accent)",
            animation: "pulse 1s ease-in-out infinite",
          }}
        />
      </div>

      {/* Filename */}
      {filename && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            marginBottom: 8,
          }}
        >
          {filename}
        </div>
      )}

      {/* Status message */}
      <div
        style={{
          fontSize: 12,
          color: "var(--accent)",
          letterSpacing: "0.08em",
          minHeight: 20,
          marginBottom: 24,
        }}
      >
        {MESSAGES[msgIdx]}
        {".".repeat(dots)}
      </div>

      {/* Progress bar (indeterminate) */}
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          margin: "0 auto",
          height: 2,
          background: "var(--border-subtle)",
          borderRadius: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            height: "100%",
            width: "40%",
            background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
            animation: "indeterminate 1.5s ease-in-out infinite",
            borderRadius: 1,
          }}
        />
      </div>

      <style>{`
        @keyframes indeterminate {
          0% { left: -40%; }
          100% { left: 100%; }
        }
        @keyframes rotate {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}
