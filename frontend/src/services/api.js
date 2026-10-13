// The ONLY place that calls fetch(). Everything else goes through agentApi.js.
const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export async function api(path, options = {}, base = BASE) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      cache: 'no-store',
    });
  } catch (error) {
    // Browser fetch rejects for unreachable servers and blocked CORS requests.
    const reason = error instanceof Error && error.message ? ` (${error.message})` : '';
    throw new Error(`Network request failed for ${base}${path}${reason}. Check that the backend is running and CORS allows this frontend origin.`);
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Server returned an invalid response for ${base}${path} (HTTP ${response.status}).`);
  }
  if (!response.ok || payload.success === false) {
    const message = payload.error?.message || `Request failed (HTTP ${response.status}).`;
    throw new Error(`${message} [${response.status} ${response.statusText}]`);
  }
  return payload.success === true ? payload.data : payload;
}

// Route handlers hosted by Next.js use the same response contract but a
// different base URL from the Express API.
export function localApi(path, options = {}) {
  return api(path, options, '');
}
