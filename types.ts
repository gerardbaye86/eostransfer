
export interface User {
  id: string;
  name: string;
}

export interface ChatMessage {
    id: number;
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
    isLoading?: boolean;
}