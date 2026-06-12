export type ChatRole = 'user' | 'model';

export type ChatSessionMessage = {
  role: ChatRole;
  content: string;
  imageUrl?: string | null;
  dataSource?: 'system_db' | 'ai_generated' | 'hybrid';
  hasDisclaimer?: boolean;
};

export type ChatSession = {
  _id: string;
  title: string;
  messages: ChatSessionMessage[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatSessionsResponse = {
  success: boolean;
  data: {
    sessions: ChatSession[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SendChatResponse = {
  success: boolean;
  data: {
    sessionId: string;
    message: {
      role: 'model';
      content: string;
      disclaimer?: string;
      hasDisclaimer?: boolean;
      dataSource?: 'system_db' | 'ai_generated' | 'hybrid';
    };
    toolsUsed?: string[];
  };
};

export type UIChatMessage = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};