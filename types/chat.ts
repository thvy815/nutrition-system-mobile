export type ChatRole = 'user' | 'model';

export type ChatSessionMessage = {
  role: ChatRole;
  content: string;
  imageUrl?: string | null;
  dataSource?: ChatDataSource;
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

export type ChatCitation = {
  id: string; // "S1"
  title: string;
  org?: string;
  year?: string | number;
  url?: string;
  section?: string;
  doc_id?: string;
};

export type ChatGrounding = {
  checked: boolean;
  action: 'unchecked' | 'passed' | 'regenerated' | 'stripped' | 'refused';
  passed?: boolean;
  supportRatio?: number;
  warnings?: number;
} | null;

export type ChatDataSource = 'system_db' | 'ai_generated' | 'hybrid' | 'rule';

export type SendChatResponse = {
  success: boolean;
  data: {
    sessionId: string;
    message: {
      role: 'model';
      content: string;
      disclaimer?: string | null;
      hasDisclaimer?: boolean;
      dataSource?: ChatDataSource;
      citations?: ChatCitation[];
      grounding?: ChatGrounding;
    };
    toolsUsed?: { name: string; args?: unknown; success?: boolean }[];
  };
};

export type UIChatMessage = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  citations?: ChatCitation[];
  disclaimer?: string | null;
  grounding?: ChatGrounding;
  dataSource?: ChatDataSource;
  /** Tin nhắn lỗi: hiển thị nút gửi lại. */
  failed?: boolean;
  retryText?: string;
};