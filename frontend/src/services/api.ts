import { Platform } from 'react-native';

// Dynamically select host machine URL for Android Emulator vs iOS / Web
const getDefaultApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getDefaultApiBaseUrl();

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as Promise<T>;
  } catch (err) {
    console.warn(`API call failed for ${path}:`, err);
    throw err;
  }
}

// Organizer Event API Service helpers
export const organizerEventService = {
  getEvents: async () => {
    return apiRequest<any[]>('/organizer/events');
  },
  getEventById: async (id: string) => {
    return apiRequest<any>(`/events/${id}`);
  },
  createEvent: async (data: any) => {
    return apiRequest<any>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateEvent: async (id: string, data: any) => {
    return apiRequest<any>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
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
