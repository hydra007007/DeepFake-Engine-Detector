import React, { useEffect, useState } from "react";

export default function ConfidenceBar({ value, isFake, size = "md", showPercent = true }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(value * 100), 100);
    return () => clearTimeout(t);
  }, [value]);

  const color = isFake ? "var(--danger)" : "var(--safe)";
  const dimColor = isFake ? "rgba(244,63,94,0.6)" : "rgba(16,185,129,0.6)";
  const pct = Math.round(value * 100);

  const heights = { sm: 3, md: 5, lg: 8 };
  const h = heights[size] || 5;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          height: h,
          background: "var(--border-subtle)",
          borderRadius: h / 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: `linear-gradient(90deg, ${dimColor}, ${color})`,
            borderRadius: h / 2,
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
      {showPercent && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
            fontSize: 10,
            color: "var(--text-muted)",
          }}
        >
          <span>0%</span>
          <span style={{ color, fontWeight: 600 }}>{pct}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}
