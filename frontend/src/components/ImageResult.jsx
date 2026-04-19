import React from "react";
import { CheckCircle, AlertTriangle, User } from "lucide-react";
import ConfidenceBar from "./ConfidenceBar.jsx";

function FaceCard({ person, index }) {
  const fake = person.is_fake;
  return (
    <div
      className="animate-slide-up"
      style={{
        background: fake ? "var(--danger-dim)" : "var(--safe-dim)",
        border: `1px solid ${fake ? "rgba(244,63,94,0.4)" : "rgba(16,185,129,0.4)"}`,
        borderRadius: 4,
        padding: "14px 16px",
        animationDelay: `${index * 80}ms`,
        animationFillMode: "both",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              border: `1px solid ${fake ? "var(--danger)" : "var(--safe)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={14} color={fake ? "var(--danger)" : "var(--safe)"} />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: fake ? "var(--danger)" : "var(--safe)",
                letterSpacing: "0.06em",
              }}
            >
              FACE #{person.person_id + 1}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
              detect {Math.round((person.detection_confidence || 1) * 100)}%
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            letterSpacing: "0.1em",
            background: fake ? "var(--danger)" : "var(--safe)",
            color: "#070c14",
          }}
        >
          {fake ? "DEEPFAKE" : "AUTHENTIC"}
        </span>
      </div>

      <ConfidenceBar value={person.confidence} isFake={fake} size="sm" showPercent={false} />
      <div
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          marginTop: 4,
          textAlign: "right",
        }}
      >
        {Math.round(person.confidence * 100)}% fake probability
      </div>

      {person.bounding_box && (
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 6 }}>
          BBOX [{person.bounding_box.map(Math.round).join(", ")}]
        </div>
      )}
    </div>
  );
}

export default function ImageResult({ result }) {
  const isMultiface = result.input_type === "image" && result.persons !== undefined;

  if (isMultiface) {
    const persons = result.persons || [];
    const fakeCount = persons.filter((p) => p.is_fake).length;
    const hasAnyFake = fakeCount > 0;

    return (
      <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Summary header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            background: hasAnyFake ? "var(--danger-dim)" : "var(--safe-dim)",
            border: `1px solid ${hasAnyFake ? "rgba(244,63,94,0.4)" : "rgba(16,185,129,0.4)"}`,
            borderRadius: 4,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: '"Bebas Neue", monospace',
                fontSize: 28,
                letterSpacing: "0.06em",
                color: hasAnyFake ? "var(--danger)" : "var(--safe)",
              }}
            >
              {hasAnyFake ? "DEEPFAKE DETECTED" : "ALL FACES AUTHENTIC"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
              {persons.length} face{persons.length !== 1 ? "s" : ""} detected · {fakeCount} deepfake
              {fakeCount !== 1 ? "s" : ""}
            </div>
          </div>
          {hasAnyFake ? (
            <AlertTriangle size={36} color="var(--danger)" />
          ) : (
            <CheckCircle size={36} color="var(--safe)" />
          )}
        </div>

        {/* Face cards */}
        {persons.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {persons.map((person, i) => (
              <FaceCard key={person.person_id} person={person} index={i} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 12,
              border: "1px dashed var(--border-subtle)",
            }}
          >
            No faces detected in image
          </div>
        )}
      </div>
    );
  }

  // Single face result
  const fake = result.is_fake;
  const conf = result.confidence;

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Main verdict */}
      <div
        className={fake ? "glow-danger" : "glow-safe"}
        style={{
          padding: "24px 28px",
          background: fake ? "var(--danger-dim)" : "var(--safe-dim)",
          border: `1px solid ${fake ? "rgba(244,63,94,0.5)" : "rgba(16,185,129,0.5)"}`,
          borderRadius: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
            ANALYSIS VERDICT
          </div>
          <div
            className="readout"
            style={{
              fontSize: 36,
              letterSpacing: "0.06em",
              color: fake ? "var(--danger)" : "var(--safe)",
            }}
          >
            {fake ? "DEEPFAKE" : "AUTHENTIC"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
            {fake ? "AI-generated manipulation detected" : "No manipulation detected"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 4 }}>
            FAKE PROBABILITY
          </div>
          <div
            className="readout"
            style={{
              fontSize: 48,
              color: fake ? "var(--danger)" : "var(--safe)",
              lineHeight: 1,
            }}
          >
            {Math.round(conf * 100)}
            <span style={{ fontSize: 20 }}>%</span>
          </div>
        </div>
      </div>

      {/* Confidence bar */}
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
            letterSpacing: "0.1em",
            marginBottom: 10,
          }}
        >
          FAKE PROBABILITY SPECTRUM
        </div>
        <ConfidenceBar value={conf} isFake={fake} size="lg" showPercent={true} />
      </div>
    </div>
  );
}
