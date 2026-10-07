import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { UserRole } from '../types';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');
export interface User { id: string; fullName: string; email: string; role: UserRole | null; authorityApproved: boolean; }
export interface Session { token: string; user: User; }
let token: string | null = null;
export async function saveToken(value: string | null) {
 token = value;
 // On web, sessions are memory-only so bearer tokens are never persisted in browser storage.
 if (Platform.OS !== 'web') {
  if (value) await SecureStore.setItemAsync('lankafest.session', value);
  else await SecureStore.deleteItemAsync('lankafest.session');
 }
}
export async function restoreToken() {
 token = Platform.OS === 'web' ? null : await SecureStore.getItemAsync('lankafest.session');
 return token;
}
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 15000);
 try {
  const response = await fetch(API_BASE_URL + path, { ...options, signal: controller.signal,
   headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join('\n') : data.message ?? 'Request failed. Please try again.');
  return data as T;
 } catch (error) {
  if (error instanceof Error && error.name === 'AbortError') throw new Error('Connection timed out. Check your connection and try again.');
  if (error instanceof TypeError) throw new Error('Cannot reach the server. Check the API address and your connection.');
  throw error;
 } finally { clearTimeout(timeout); }
}

// Organizer Event API Service helpers
export const organizerEventService = {
  getEvents: async () => {
    return apiRequest<any[]>('/organizer/events');
  },
  getEventById: async (id: string) => {
    return apiRequest<any>(`/organizer/events/${id}`);
  },
  createEvent: async (data: any) => {
    return apiRequest<any>('/events', {
      method: 'POST',
      body: JSON.stringify(eventPayload(data)),
    });
  },
  updateEvent: async (id: string, data: any) => {
    return apiRequest<any>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(eventPayload(data)),
    });
  },
  deleteEvent: async (id: string) => {
    return apiRequest<any>(`/events/${id}`, {
      method: 'DELETE',
    });
  },
  duplicateEvent: async (id: string) => {
    return apiRequest<any>(`/events/${id}/duplicate`, {
      method: 'POST',
    });
  },
  getEventInsights: async (id: string) => {
    return apiRequest<any>(`/events/${id}/insights`);
  },
};

function eventPayload(data: any) { const { id, _id, createdAt, updatedAt, __v, organizerId, viewsCount, interestedCount, goingCount, organizer, ...payload } = data; return payload; }
