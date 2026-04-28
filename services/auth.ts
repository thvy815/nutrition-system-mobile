import { api } from './api';
import type { LoginRequest, LoginSuccessResponse, LoginUser } from '../types/auth';

// Lưu token tạm trong bộ nhớ (không dùng native storage để tránh lỗi trên Expo Go)
let inMemoryToken: string | null = null;

export async function login(credentials: LoginRequest): Promise<LoginSuccessResponse> {
  const { data } = await api.post<LoginSuccessResponse>('/auth/login', credentials);
  if (data.token) {
    setToken(data.token); 
  }
  return data;
}

export async function fetchCurrentUser(): Promise<LoginUser> {
  const { data } = await api.get<LoginUser>('/auth/me');
  return data;
}

export async function logout(): Promise<void> {
  setToken(null);
}

export const setToken = (token: string | null) => {
  inMemoryToken = token;
};

export async function getToken(): Promise<string | null> {
  return inMemoryToken;
}
