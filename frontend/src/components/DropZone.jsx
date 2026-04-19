import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Film, Image, X, FileVideo } from "lucide-react";

const ACCEPTED = {
  "image/*": [".jpg", ".jpeg", ".png", ".bmp", ".webp"],
  "video/*": [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"],
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DropZone({ file, onFile, disabled }) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length > 0) onFile(accepted[0]);
      setIsDragging(false);
    },
    [onFile]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const isVideo = file && file.type.startsWith("video/");
  const isImage = file && file.type.startsWith("image/");

  return (
    <div style={{ width: "100%" }}>
      <div
        {...getRootProps()}
        className={`dropzone-idle corner-tl corner-br`}
        style={{
          borderRadius: 4,
          padding: file ? "20px 24px" : "48px 24px",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.3s ease",
          background: isDragging
            ? "rgba(34,211,238,0.06)"
            : file
            ? "var(--bg-card)"
            : "transparent",
          borderColor: isDragging
            ? "var(--accent)"
            : file
            ? "var(--border-subtle)"
            : undefined,
          boxShadow: isDragging ? "0 0 24px rgba(34,211,238,0.12)" : undefined,
          position: "relative",
        }}
      >
        <input {...getInputProps()} />

        {file ? (
          /* File preview */
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: isVideo ? "rgba(245,158,11,0.15)" : "rgba(34,211,238,0.12)",
                border: `1px solid ${isVideo ? "var(--warn)" : "var(--accent)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isVideo ? (
                <Film size={20} color="var(--warn)" />
              ) : (
                <Image size={20} color="var(--accent)" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                {isVideo ? "VIDEO" : "IMAGE"} · {formatBytes(file.size)} · {file.type}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          /* Empty state */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transition: "all 0.3s ease",
                background: isDragging ? "var(--accent-dim)" : "transparent",
              }}
            >
              <Upload
                size={28}
                color={isDragging ? "var(--accent)" : "var(--text-muted)"}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: isDragging ? "var(--accent)" : "var(--text-primary)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {isDragging ? "RELEASE TO ANALYZE" : "DRAG & DROP FILE"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                or click to browse
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {["MP4", "AVI", "MOV", "MKV", "JPG", "PNG", "WEBP"].map((ext) => (
                <span
                  key={ext}
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
