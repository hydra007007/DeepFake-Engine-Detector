import React from "react";
import { Cpu, Wifi, WifiOff, AlertCircle } from "lucide-react";

export default function Header({ status }) {
  const online = status?.status === "ok";
  const device = status?.device_type || "cpu";

  return (
    <header
      style={{
        background: "rgba(7,12,20,0.95)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              border: "2px solid var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                background: "var(--accent)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: '"Bebas Neue", monospace',
              fontSize: 22,
              letterSpacing: "0.12em",
              color: "var(--text-primary)",
            }}
          >
            DEEPFAKE DETECTION ENGINE
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--accent)",
              border: "1px solid var(--accent)",
              padding: "1px 6px",
              letterSpacing: "0.1em",
            }}
          >
            v2
          </span>
        </div>

        {/* Status indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Connection */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            {online ? (
              <>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--safe)",
                    boxShadow: "0 0 6px var(--safe)",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                />
                <span style={{ color: "var(--safe)" }}>ONLINE</span>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--danger)",
                  }}
                />
                <span style={{ color: "var(--danger)" }}>OFFLINE</span>
              </>
            )}
          </div>

          {/* Device */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: "var(--text-secondary)",
            }}
          >
            <Cpu size={12} />
            <span style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {device === "cuda" ? "GPU / CUDA" : device === "mps" ? "GPU / MPS" : "CPU"}
            </span>
          </div>

          {/* Version */}
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
            DUAL-BRANCH EFFICIENTNET + FFT
          </div>
        </div>
      </div>
    </header>
  );
}
