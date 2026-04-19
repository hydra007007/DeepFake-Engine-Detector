import React, { useState } from "react";

function fmtSec(s) {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return `${m}:${sec.padStart(4, "0")}`;
}

export default function Timeline({ duration, segments, frameTimes, frameScores }) {
  const [hovered, setHovered] = useState(null);

  if (!duration || duration <= 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
          fontSize: 10,
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
        }}
      >
        <span>TEMPORAL ANALYSIS MAP</span>
        <span>{fmtSec(duration)} TOTAL</span>
      </div>

      {/* Main track */}
      <div
        style={{
          height: 36,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Frame score background heatmap */}
        {frameTimes && frameScores && frameTimes.length > 1 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "stretch" }}>
            {frameScores.map((score, i) => {
              const tStart = frameTimes[i];
              const tEnd = frameTimes[i + 1] ?? duration;
              const left = (tStart / duration) * 100;
              const width = ((tEnd - tStart) / duration) * 100;
              const alpha = Math.max(0, score - 0.3) / 0.7;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${left}%`,
                    width: `${Math.max(width, 0.2)}%`,
                    background: `rgba(244,63,94,${alpha * 0.3})`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Manipulated segments */}
        {segments.map((seg, i) => {
          const left = (seg.start_seconds / duration) * 100;
          const width = ((seg.end_seconds - seg.start_seconds) / duration) * 100;
          return (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "absolute",
                top: 2,
                bottom: 2,
                left: `${left}%`,
                width: `${Math.max(width, 0.5)}%`,
                background: hovered === i ? "rgba(244,63,94,0.7)" : "rgba(244,63,94,0.5)",
                border: "1px solid var(--danger)",
                borderRadius: 2,
                cursor: "default",
                transition: "background 0.15s ease",
                boxShadow: hovered === i ? "0 0 8px rgba(244,63,94,0.4)" : "none",
              }}
            />
          );
        })}

        {/* Center line */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 1,
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Timestamps */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontSize: 9,
          color: "var(--text-muted)",
        }}
      >
        <span>0:00.0</span>
        <span>{fmtSec(duration / 2)}</span>
        <span>{fmtSec(duration)}</span>
      </div>

      {/* Segment tooltip */}
      {hovered !== null && segments[hovered] && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "var(--danger-dim)",
            border: "1px solid var(--danger)",
            borderRadius: 3,
            fontSize: 11,
            color: "var(--danger)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            SEGMENT {hovered + 1}: {segments[hovered].start_time} → {segments[hovered].end_time}
          </span>
          <span>{Math.round(segments[hovered].confidence * 100)}% CONFIDENCE</span>
        </div>
      )}

      {/* Segment list */}
      {segments.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            MANIPULATED SEGMENTS ({segments.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {segments.map((seg, i) => (
              <div
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "7px 12px",
                  background: hovered === i ? "var(--danger-dim)" : "rgba(244,63,94,0.06)",
                  border: `1px solid ${hovered === i ? "var(--danger)" : "rgba(244,63,94,0.2)"}`,
                  borderRadius: 3,
                  cursor: "default",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 11, color: "var(--danger)" }}>
                  ▶ {seg.start_time} — {seg.end_time}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-secondary)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {Math.round(seg.confidence * 100)}% FAKE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
