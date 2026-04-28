import { API_BASE_URL } from '../constants/api';

export type ApiError = {
  message: string;
  status?: number;
};

async function request<T>(
  endpoint: string,
  options: Omit<RequestInit, 'body'> & { body?: object } = {}
): Promise<{ data: T; status: number }> {
  const { body, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  };

  if (body && typeof body === 'object') {
    (config as { body?: string }).body = JSON.stringify(body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: ApiError = {
      message: data?.message || 'Có lỗi xảy ra',
      status: response.status,
    };
    throw error;
  }

  return { data: data as T, status: response.status };
}

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  post: <T>(endpoint: string, body?: object, token?: string) =>
    request<T>(endpoint, {
      method: 'POST',
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  put: <T>(endpoint: string, body?: object, token?: string) =>
    request<T>(endpoint, {
      method: 'PUT',
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  delete: <T>(endpoint: string, body?: object, token?: string) =>
    request<T>(endpoint, {
      method: 'DELETE',
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  patch: <T>(endpoint: string, body?: object, token?: string) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
};
