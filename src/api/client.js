const API_URL = "http://localhost:8000";

export { API_URL };

function extractMessage(body) {
  if (!body || typeof body !== "object") return "Something went wrong.";
  if (body.detail) return body.detail;
  for (const key of Object.keys(body)) {
    const val = body[key];
    const msg = Array.isArray(val) ? val[0] : val;
    if (msg) return `${key}: ${msg}`;
  }
  return "Something went wrong.";
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(extractMessage(body));
    err.status = res.status;
    err.errors = body;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function requestBlob(endpoint, filename) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error("Request failed.");
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") ?? "";
  const name = cd.match(/filename="(.+)"/)?.[ 1] ?? filename;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default request;
