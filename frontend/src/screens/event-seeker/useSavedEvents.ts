import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { apiRequest } from '../../services/api';
export default function useSavedEvents(userId: string) {
 const [saved, setSaved] = useState<string[]>([]), [error, setError] = useState('');
 const pending = useRef(new Set<string>()), current = useRef(saved); current.current = saved;
 useEffect(() => { let active = true; apiRequest<string[]>('/seeker/saved-events').then(ids => { if (active) { setSaved(ids); setError(''); } }).catch(err => { if (active) setError(err.message); }); return () => { active = false; }; }, [userId]);
 async function toggleSaved(id: string) { if (pending.current.has(id)) return; pending.current.add(id); const next = !current.current.includes(id);
  try { await apiRequest('/events/' + id + '/saved', { method: 'PATCH', body: JSON.stringify({ saved: next }) }); setSaved(ids => next ? Array.from(new Set([...ids,id])) : ids.filter(value => value !== id)); setError(''); }
  catch (err) { const message = err instanceof Error ? err.message : 'Could not save this event. Please retry.'; setError(message); Alert.alert('Could not update saved event', message); }
  finally { pending.current.delete(id); }
 }
 return { saved, toggleSaved, error };
}
