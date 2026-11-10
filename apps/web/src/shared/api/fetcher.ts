import { API_V1 } from '@/shared/config';
import { ApiError } from './types';

export type FetchInit = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

export async function apiGetJson<T>(path: string, init?: FetchInit): Promise<T> {
  const url = `${API_V1}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    // read the body once: a JSON parse that fails has already used it up, and a
    // second read threw "Body is unusable", turning e.g. a 429 into a page crash
    const text = await res.text().catch(() => '');
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // not JSON: keep the text
    }
    const detail =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: unknown }).message)
        : typeof body === 'string'
          ? body
          : undefined;
    throw new ApiError(detail || `API ${res.status} for ${path}`, res.status, body);
  }
  return res.json() as Promise<T>;
}
