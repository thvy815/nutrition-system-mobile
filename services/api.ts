import { API_BASE_URL } from '../constants/api';
import { getToken } from './auth';

export type ApiError = {
  message: string;
  status?: number;
};

async function request<T>(
  endpoint: string,
  options: Omit<RequestInit, 'body'> & { body?: any } = {} // Đổi body thành any để nhận FormData
): Promise<{ data: T; status: number }> {
  const { body, ...fetchOptions } = options;
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  // Tự động lấy token từ auth service và thêm vào headers
  const token = await getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...fetchOptions,
  };

  // KIỂM TRA BODY
  if (body instanceof FormData) {
    // Nếu là FormData: 
    // 1. KHÔNG SET Content-Type (để Fetch tự điền cùng boundary)
    // 2. KHÔNG stringify body
    config.body = body;
    // Đảm bảo không có Content-Type: application/json bị ghi đè vào
    delete headers['Content-Type'];
  } else if (body && typeof body === 'object') {
    // Nếu là Object bình thường: Set JSON
    headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
  }

  config.headers = headers;
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
  get: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: 'GET',
    }),

  post: <T>(endpoint: string, body?: object) =>
    request<T>(endpoint, {
      method: 'POST',
      body,
    }),

  put: <T>(endpoint: string, body?: object) =>
    request<T>(endpoint, {
      method: 'PUT',
      body,
    }),

  delete: <T>(endpoint: string, body?: object) =>
    request<T>(endpoint, {
      method: 'DELETE',
      body,
    }),

  patch: <T>(endpoint: string, body?: object) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body,
    }),
};
