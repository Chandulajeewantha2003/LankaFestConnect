import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
type Data = { saved: string[]; reminders: string[]; read: string[]; photo: string | null };
const empty: Data = { saved: [], reminders: [], read: [], photo: null };
export default function useSeekerData(userId: string) {
 const [data, setData] = useState<Data>(empty), [loadedKey, setLoadedKey] = useState<string | null>(null), [error, setError] = useState('');
 const queue = useRef(Promise.resolve());
 const key = 'lankafest.seeker.' + userId;
 const ready = loadedKey === key;
 const storageAvailable = useRef(true);
 useEffect(() => { let active = true; setLoadedKey(null); setError(''); storageAvailable.current = true;
  AsyncStorage.getItem(key).then(value => { if (!active) return; const parsed = value ? JSON.parse(value) : empty;
   setData({ saved: Array.isArray(parsed.saved) ? parsed.saved.filter((id: unknown) => typeof id === 'string') : [], reminders: Array.isArray(parsed.reminders) ? parsed.reminders.filter((id: unknown) => typeof id === 'string') : [], read: Array.isArray(parsed.read) ? parsed.read.filter((id: unknown) => typeof id === 'string') : [], photo: typeof parsed.photo === 'string' ? parsed.photo : null });
  }).catch(() => { if (active) { storageAvailable.current = false; setData(empty); setError('Could not load your saved data. Changes will stay in this session.'); } }).finally(() => { if (active) setLoadedKey(key); });
  return () => { active = false; };
 }, [key]);
 useEffect(() => { if (!ready || !storageAvailable.current) return; queue.current = queue.current.then(() => AsyncStorage.setItem(key, JSON.stringify(data))).catch(() => setError('Could not save changes on this device. Please try again.')); }, [data, ready, key]);
 return { ...data, ready, error,
  toggleSaved: (id: string) => setData(d => ({ ...d, saved: d.saved.includes(id) ? d.saved.filter(v => v !== id) : [...d.saved, id] })),
  toggleReminder: (id: string) => setData(d => ({ ...d, reminders: d.reminders.includes(id) ? d.reminders.filter(v => v !== id) : [...d.reminders, id], read: d.read.filter(v => v !== id) })),
  markRead: () => setData(d => ({ ...d, read: [...d.reminders] })),
  setPhoto: (photo: string | null) => setData(d => ({ ...d, photo })),
 };
}
