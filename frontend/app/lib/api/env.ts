// Browser uses relative `/api/v1/*` (Next rewrites it to backend).
// Server-side fetches need the absolute backend URL.
const API_PREFIX = "/api/v1";
const AUTH_PREFIX = `${API_PREFIX}/auth`;

const isServer = typeof window === "undefined";

const SERVER_BASE = process.env.API_ORIGIN ?? "http://localhost:4000";

export const API_BASE_BROWSER = "";
export { API_PREFIX };

export const apiUrl = (path: string): string => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return isServer ? `${SERVER_BASE}${API_PREFIX}${p}` : `${API_PREFIX}${p}`;
};

// Better Auth requires an absolute baseURL. Browser requests still go through
// the Next rewrite because the origin stays on the frontend dev/prod host.
export const authBaseURL = (): string =>
  isServer ? `${SERVER_BASE}${AUTH_PREFIX}` : `${window.location.origin}${AUTH_PREFIX}`;
