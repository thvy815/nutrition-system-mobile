/**
 * Base URL cho API backend.
 * Đặt EXPO_PUBLIC_API_BASE_URL trong .env để đổi mà không sửa code, vd:
 *   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000/api
 * - Thiết bị thật: dùng IP LAN của máy chạy backend.
 * - Android emulator: 10.0.2.2 thay cho localhost.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://172.20.10.2:3000/api';

/** search-service (FastAPI) dùng để map nguyên liệu -> dinh dưỡng. */
export const SEARCH_SERVICE_URL =
  process.env.EXPO_PUBLIC_SEARCH_SERVICE_URL || 'http://192.168.31.206:8000';

/** Timeout mặc định cho request (ms). Chatbot / AI dùng timeout dài hơn. */
export const API_TIMEOUT_MS = 30000;
export const AI_TIMEOUT_MS = 90000;

/**
 * Chế độ demo: trả dữ liệu mẫu đúng định dạng API, không gọi backend.
 * Chỉ bật khi EXPO_PUBLIC_DEMO=1 (dùng để chụp UI / demo offline).
 */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO === '1';

/** Deep link scheme của app (khai báo trong app.json -> expo.scheme). */
export const APP_SCHEME = 'nutritionsystem';
