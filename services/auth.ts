import { api } from './api';
import type { LoginRequest, LoginSuccessResponse, LoginUser } from '../types/auth';

// Lưu token tạm trong bộ nhớ (không dùng native storage để tránh lỗi trên Expo Go)
let inMemoryToken: string | null = null;

export async function login(credentials: LoginRequest): Promise<LoginSuccessResponse> {
  const { data } = await api.post<LoginSuccessResponse>('/auth/login', credentials);
  if (data.token) {
    inMemoryToken = data.token;
  }
  return data;
}

export async function fetchCurrentUser(token: string): Promise<LoginUser> {
  const { data } = await api.get<LoginUser>('/auth/me', token);
  return data;
}

export async function logout(): Promise<void> {
  inMemoryToken = null;
}

export async function getToken(): Promise<string | null> {
  return inMemoryToken;
}
