/**
 * Normalize API origin. `NEXT_PUBLIC_API_URL` must be the host only, e.g.
 * `https://api.kobiza.com` — not `https://api.kobiza.com/api`. Otherwise
 * `apiFetch` would request `/api/api/...` and Nest returns 404.
 */
export function normalizeApiOrigin(raw: string): string {
  let base = raw.trim().replace(/\/+$/, '');
  if (/\/api$/i.test(base)) {
    base = base.slice(0, -4).replace(/\/+$/, '');
  }
  return base;
}

export const API_URL = normalizeApiOrigin(
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
);

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('Kobiza_token') : null;

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Request failed');
  return data as T;
}
