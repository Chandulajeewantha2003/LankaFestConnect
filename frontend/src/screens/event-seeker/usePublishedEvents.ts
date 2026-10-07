import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { apiRequest } from '../../services/api';
import { EventItem } from '../../types';
import { SeekerEvent, toSeekerEvent } from './data/events';
export default function usePublishedEvents() {
 const [events, setEvents] = useState<SeekerEvent[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
 const active = useRef(true), busy = useRef(false);
 const refresh = useCallback(async () => { if (busy.current) return; busy.current = true; try { const data = await apiRequest<EventItem[]>('/events'); if (active.current) { setEvents(data.map(toSeekerEvent)); setError(''); } } catch (err) { if (active.current) setError(err instanceof Error ? err.message : 'Could not load events.'); } finally { busy.current = false; if (active.current) setLoading(false); } }, []);
 useEffect(() => { active.current = true; refresh(); const timer = setInterval(refresh, 30000); const listener = AppState.addEventListener('change', state => { if (state === 'active') refresh(); }); return () => { active.current = false; clearInterval(timer); listener.remove(); }; }, [refresh]);
 return { events, loading, error, refresh };
}
