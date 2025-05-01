export interface Message {
  content: string;
  isUser: boolean;
  id: string;
  timestamp: number;
}

export interface ChatConfig {
  model: string;
  mode: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  config: ChatConfig;
  created: number;
  updated: number;
}
