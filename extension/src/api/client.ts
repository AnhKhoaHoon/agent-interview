import type { ApiError } from '../types/interview';

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export const API_BASE_URL = configuredApiUrl.replace(/\/$/, '');

export class ApiClientError extends Error {
  constructor(readonly response: ApiError, readonly status: number) {
    super(response.message);
    this.name = 'ApiClientError';
  }
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers }
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      code: 'NETWORK_ERROR',
      message: `Backend request failed with ${response.status}`,
      retryable: response.status >= 500,
      requestId: 'unavailable'
    }))) as ApiError;
    throw new ApiClientError(error, response.status);
  }
  return (await response.json()) as T;
}
