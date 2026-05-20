import { ApiError } from "./error";
import { apiUrl } from "./env";

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
};

export async function apiClient<T>(path: string, opts: Options = {}): Promise<T> {
  const url = withQuery(apiUrl(path), opts.query);

  const headers = new Headers(opts.headers);
  const isForm = opts.body instanceof FormData;
  if (opts.body !== undefined && !isForm) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const res = await fetch(url, {
    ...opts,
    credentials: "include",
    headers,
    body: isForm
      ? (opts.body as FormData)
      : opts.body !== undefined
        ? JSON.stringify(opts.body)
        : undefined,
  });

  const text = await res.text();
  const json = text ? safeParse(text) : null;

  if (!res.ok) {
    const code =
      typeof json === "object" && json && "code" in json
        ? String((json as { code: unknown }).code)
        : "unknown";
    const message =
      typeof json === "object" && json && "message" in json
        ? String((json as { message: unknown }).message)
        : res.statusText;
    throw new ApiError(res.status, code, message, json);
  }
  return json as T;
}

function withQuery(url: string, query?: Options["query"]): string {
  if (!query) return url;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) sp.append(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${url}?${qs}` : url;
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
