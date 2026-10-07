import { apiRequest } from './api';
export interface Conversation { id: string; other: { id: string; fullName: string }; lastMessage: string; }
export interface ChatMessage { id: string; senderId: string; text: string; createdAt: string; }
export const chats = {
 open: (eventId: string) => apiRequest<Conversation>('/chats', { method: 'POST', body: JSON.stringify({ eventId }) }),
 list: () => apiRequest<Conversation[]>('/chats'),
 history: (id: string, before?: string) => apiRequest<ChatMessage[]>('/chats/' + id + '/messages' + (before ? '?before=' + encodeURIComponent(before) : '')),
 send: (id: string, text: string, clientId: string) => apiRequest<ChatMessage>('/chats/' + id + '/messages', { method: 'POST', body: JSON.stringify({ text, clientId }) }),
};
