import { API_BASE_URL, API_TIMEOUT_MS, DEMO_MODE } from '../constants/api';
import { getToken } from './token';

export type ApiError = {
  message: string;
  status?: number;
  /** Mã lỗi backend trả về, vd: GOOGLE_NOT_CONNECTED, GEMINI_UNREACHABLE. */
  code?: string;
  data?: any;
};

type RequestOptions = Omit<RequestInit, 'body'> & { body?: any; timeoutMs?: number };

export function isApiError(error: unknown): error is ApiError {
  return !!error && typeof error === 'object' && 'message' in error;
}

/** Thông báo lỗi thân thiện cho người dùng. */
export function getErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra. Vui lòng thử lại.') {
  if (isApiError(error)) {
    if (error.status === 0) return 'Không kết nối được máy chủ. Kiểm tra mạng hoặc địa chỉ API.';
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (error.status === 429) return 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.';
    return error.message || fallback;
  }
  return fallback;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data: T; status: number }> {
  const { body, timeoutMs = API_TIMEOUT_MS, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();

  if (DEMO_MODE) {
    // Nạp lười để bundle production không kéo theo dữ liệu mẫu.
    const { demoRequest } = require('./demo');
    return demoRequest(method, endpoint, body) as Promise<{ data: T; status: number }>;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  const token = await getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = { ...fetchOptions, method };

  if (body instanceof FormData) {
    // Không set Content-Type để fetch tự thêm boundary.
    config.body = body;
    delete headers['Content-Type'];
  } else if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
  }

  config.headers = headers;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  config.signal = controller.signal;

  const startedAt = Date.now();
  let response: Response;

  try {
    response = await fetch(url, config);
  } catch (error: any) {
    clearTimeout(timer);
    const aborted = error?.name === 'AbortError';
    if (__DEV__) console.log(`[api] ${method} ${endpoint} ✗ ${aborted ? 'timeout' : error?.message}`);
    const apiError: ApiError = {
      message: aborted
        ? 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.'
        : 'Không kết nối được máy chủ. Kiểm tra mạng hoặc địa chỉ API.',
      status: 0,
    };
    throw apiError;
  }

  clearTimeout(timer);

  const data = await response.json().catch(() => ({}));

  if (__DEV__) {
    console.log(`[api] ${method} ${endpoint} → ${response.status} (${Date.now() - startedAt}ms)`);
  }

  if (!response.ok) {
    const apiError: ApiError = {
      message: data?.message || 'Có lỗi xảy ra',
      status: response.status,
      code: data?.code,
      data,
    };
    throw apiError;
  }

  return { data: data as T, status: response.status };
}

export const api = {
  get: <T>(endpoint: string, opts?: { timeoutMs?: number }) =>
    request<T>(endpoint, { method: 'GET', ...opts }),

  post: <T>(endpoint: string, body?: object, opts?: { timeoutMs?: number }) =>
    request<T>(endpoint, { method: 'POST', body, ...opts }),

  put: <T>(endpoint: string, body?: object) => request<T>(endpoint, { method: 'PUT', body }),

  delete: <T>(endpoint: string, body?: object) =>
    request<T>(endpoint, { method: 'DELETE', body }),

  patch: <T>(endpoint: string, body?: object) => request<T>(endpoint, { method: 'PATCH', body }),
};
