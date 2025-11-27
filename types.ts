export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  attachments?: Attachment[];
  isThinking?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}
