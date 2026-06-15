const DEFAULT_CORE_API_URL = "http://localhost:3000";

export function coreApiUrl() {
  return (process.env.CLINICA_APP_API_URL || process.env.CORE_API_URL || DEFAULT_CORE_API_URL).replace(/\/$/, "");
}

export function coreHeaders(req) {
  const headers = { "Content-Type": "application/json" };
  const auth = req.headers.authorization;
  if (auth) headers.Authorization = auth;
  return headers;
}

export async function coreRequest(req, path, options = {}) {
  const res = await fetch(`${coreApiUrl()}${path}`, {
    method: options.method || "GET",
    headers: coreHeaders(req),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { status: res.status, data };
}
