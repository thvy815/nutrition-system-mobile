import { api } from './api';
import type {
  ActivitySummary,
  GoogleConnectionStatus,
  GoogleSyncResult,
  MockSyncPayload,
  WhoComparison,
} from '../types/health';

type Wrapped<T> = { success: boolean; data: T; message?: string; code?: string };

/** Lỗi 409 khi chưa kết nối / token bị thu hồi. */
export const GOOGLE_NOT_CONNECTED_CODES = ['GOOGLE_NOT_CONNECTED', 'GOOGLE_TOKEN_REVOKED'];

export const googleHealthService = {
  async getStatus(): Promise<GoogleConnectionStatus> {
    const { data } = await api.get<Wrapped<GoogleConnectionStatus>>('/google-health/status');
    return data.data;
  },

  /** Lấy URL đăng nhập Google. returnTo = deep link của app để quay lại sau khi đồng ý. */
  async getConnectUrl(returnTo?: string): Promise<string> {
    const qs = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    const { data } = await api.get<Wrapped<{ url: string }>>(`/google-health/connect${qs}`);
    return data.data.url;
  },

  async disconnect(): Promise<boolean> {
    const { data } = await api.delete<Wrapped<{ disconnected: boolean }>>('/google-health/disconnect');
    return !!data.data?.disconnected;
  },

  async sync(): Promise<GoogleSyncResult> {
    const { data } = await api.post<Wrapped<GoogleSyncResult>>('/google-health/sync');
    return data.data;
  },

  /** Chỉ dùng khi dev: tạo dữ liệu mẫu cho ngày hôm nay. */
  async mockSync(payload: MockSyncPayload = {}) {
    const { data } = await api.post<Wrapped<unknown>>('/google-health/mock-sync', payload);
    return data.data;
  },

  async getSummary(days = 7): Promise<ActivitySummary> {
    const { data } = await api.get<Wrapped<ActivitySummary>>(
      `/google-health/activity/summary?days=${days}`
    );
    return data.data;
  },

  async getWhoComparison(sync = false): Promise<WhoComparison> {
    const { data } = await api.get<Wrapped<WhoComparison>>(
      `/google-health/who-comparison${sync ? '?sync=1' : ''}`
    );
    return data.data;
  },
};
