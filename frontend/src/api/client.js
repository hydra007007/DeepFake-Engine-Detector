const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://deepfake-engine-detector.onrender.com").replace(/\/$/, "");
const BASE = `${API_BASE}/api`;

export async function detectDeepfake(file, modelId, useMultiface, provider = "local") {
  const form = new FormData();
  form.append("file", file);
  form.append("provider", provider);
  form.append("model", modelId);
  form.append("multiface", useMultiface ? "true" : "false");

  const res = await fetch(`${BASE}/detect`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Detection failed");
  return data;
}

export async function fetchModels() {
  const res = await fetch(`${BASE}/models`);
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}
