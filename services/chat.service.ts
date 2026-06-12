import { api } from './api';
import type {
  ChatSession,
  ChatSessionsResponse,
  SendChatResponse,
} from '../types/chat';

export async function getChatSessions(): Promise<ChatSession[]> {
  const { data } = await api.get<ChatSessionsResponse>('/chat/sessions');

  if (!data.success) {
    throw new Error('Failed to get chat sessions');
  }

  return data.data.sessions ?? [];
}

export async function getChatSessionDetail(
  sessionId: string
): Promise<ChatSession> {
  const { data } = await api.get<{
    success: boolean;
    data: ChatSession;
  }>(`/chat/sessions/${sessionId}`);

  if (!data.success) {
    throw new Error('Failed to get chat session detail');
  }

  return data.data;
}

export async function sendChatMessage(payload: {
  message: string;
  sessionId?: string | null;
}): Promise<SendChatResponse['data']> {
  const { data } = await api.post<SendChatResponse>('/chat/message/v2', payload);

  if (!data.success) {
    throw new Error('Failed to send chat message');
  }

  return data.data;
}

export async function deleteChatSession(sessionId: string) {
  const { data } = await api.delete(`/chat/sessions/${sessionId}`);
  return data;
}