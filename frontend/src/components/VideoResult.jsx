import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Users, User, ChevronDown, ChevronUp } from "lucide-react";
import ConfidenceBar from "./ConfidenceBar.jsx";
import Timeline from "./Timeline.jsx";

function PersonPanel({ person, index }) {
  const [open, setOpen] = useState(index === 0);
  const fake = person.is_fake;

  return (
    <div
      className="animate-slide-up"
      style={{
        border: `1px solid ${fake ? "rgba(244,63,94,0.3)" : "rgba(16,185,129,0.3)"}`,
        borderRadius: 4,
        overflow: "hidden",
        animationDelay: `${index * 80}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Accordion header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: fake ? "rgba(244,63,94,0.08)" : "rgba(16,185,129,0.08)",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontFamily: '"IBM Plex Mono", monospace',
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <User size={14} color={fake ? "var(--danger)" : "var(--safe)"} />
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em" }}>
            PERSON {person.person_id + 1}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: "2px 7px",
              background: fake ? "var(--danger)" : "var(--safe)",
              color: "#070c14",
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            {fake ? "DEEPFAKE" : "REAL"}
          </span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {Math.round(person.confidence * 100)}% · {person.num_detections} frames
          </span>
        </div>
        {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </button>

      {/* Accordion body */}
      {open && (
        <div style={{ padding: "14px 16px", background: "var(--bg-card)" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 6 }}>
              FAKE PROBABILITY
            </div>
            <ConfidenceBar value={person.confidence} isFake={fake} size="md" showPercent={true} />
          </div>

          {person.confidence_range && (
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 12,
                fontSize: 11,
                color: "var(--text-secondary)",
              }}
            >
              <span>MIN: {Math.round(person.confidence_range.min * 100)}%</span>
              <span>MAX: {Math.round(person.confidence_range.max * 100)}%</span>
            </div>
          )}

          {person.fake_segments && person.fake_segments.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 6 }}>
                FAKE SEGMENTS ({person.fake_segments.length})
              </div>
              {person.fake_segments.map((seg, i) => (
                <div
                  key={i}
                  style={{
                    padding: "6px 10px",
                    marginBottom: 4,
                    background: "rgba(244,63,94,0.07)",
                    border: "1px solid rgba(244,63,94,0.2)",
                    borderRadius: 3,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: "var(--danger)" }}>
                    ▶ {seg.start_time || seg.start} — {seg.end_time || seg.end}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {Math.round((seg.confidence || 0) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VideoResult({ result }) {
  const isMultiface = result.persons !== undefined;
  const isFake = isMultiface
    ? (result.summary?.fake_persons || 0) > 0
    : result.video_is_fake;
  const conf = isMultiface
    ? (result.persons || []).reduce((a, p) => a + p.confidence, 0) /
      Math.max(1, (result.persons || []).length)
    : result.overall_confidence;

  const segments = result.manipulated_segments || [];
  const duration = result.duration_seconds;
  const frameTimes = result.frame_times;
  const frameScores = result.frame_scores;

  return (
    <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Verdict banner */}
      <div
        className={isFake ? "glow-danger" : "glow-safe"}
        style={{
          padding: "20px 24px",
          background: isFake ? "var(--danger-dim)" : "var(--safe-dim)",
          border: `1px solid ${isFake ? "rgba(244,63,94,0.5)" : "rgba(16,185,129,0.5)"}`,
          borderRadius: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              marginBottom: 4,
            }}
          >
            VIDEO ANALYSIS VERDICT
          </div>
          <div
            className="readout"
            style={{
              fontSize: 32,
              letterSpacing: "0.06em",
              color: isFake ? "var(--danger)" : "var(--safe)",
            }}
          >
            {isFake ? "DEEPFAKE DETECTED" : "VIDEO APPEARS AUTHENTIC"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {duration != null && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em" }}>DURATION</div>
              <div className="readout" style={{ fontSize: 22, color: "var(--text-primary)" }}>
                {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}
              </div>
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em" }}>CONFIDENCE</div>
            <div
              className="readout"
              style={{ fontSize: 22, color: isFake ? "var(--danger)" : "var(--safe)" }}
            >
              {Math.round(conf * 100)}%
            </div>
          </div>
          {segments.length > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em" }}>SEGMENTS</div>
              <div className="readout" style={{ fontSize: 22, color: "var(--danger)" }}>
                {segments.length}
              </div>
            </div>
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
          FAKE PROBABILITY
        </div>
        <ConfidenceBar value={conf} isFake={isFake} size="md" showPercent={true} />
      </div>

      {/* Timeline (single-face) */}
      {!isMultiface && duration != null && (
        <div
          style={{
            padding: "14px 18px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 4,
          }}
        >
          <Timeline
            duration={duration}
            segments={segments}
            frameTimes={frameTimes}
            frameScores={frameScores}
          />
        </div>
      )}

      {/* Multi-face summary */}
      {isMultiface && result.summary && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 4,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 12,
          }}
        >
          {[
            { label: "PERSONS", value: result.summary.total_persons_detected },
            { label: "DEEPFAKES", value: result.summary.fake_persons, danger: true },
            { label: "AUTHENTIC", value: result.summary.real_persons, safe: true },
            { label: "MULTI-FACE FRAMES", value: result.summary.frames_with_multiple_faces },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 4 }}>
                {stat.label}
              </div>
              <div
                className="readout"
                style={{
                  fontSize: 28,
                  color: stat.danger ? "var(--danger)" : stat.safe ? "var(--safe)" : "var(--text-primary)",
                }}
              >
                {stat.value ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-person panels */}
      {isMultiface && result.persons && result.persons.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            PER-PERSON ANALYSIS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.persons.map((person, i) => (
              <PersonPanel key={person.person_id} person={person} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
