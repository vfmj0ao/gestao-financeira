const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

type ApiErrorBody = {
  message?: string | string[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && retry && path !== '/auth/refresh' && path !== '/auth/login') {
    const restored = await refreshSession();
    if (restored) {
      return apiFetch<T>(path, init, false);
    }
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function refreshSession() {
  try {
    const data = await apiFetch<{ accessToken: string }>(
      '/auth/refresh',
      { method: 'POST' },
      false,
    );
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

async function readErrorMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  if (typeof body?.message === 'string') {
    return body.message;
  }
  if (Array.isArray(body?.message) && typeof body.message[0] === 'string') {
    return body.message[0];
  }
  return 'Não foi possível concluir a ação';
}
