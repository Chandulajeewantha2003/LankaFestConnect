import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import ProfileScreen from '../shared/ProfileScreen';
import useSeekerData from '../event-seeker/useSeekerData';
import { organizerEventService, User } from '../../services/api';
import { EventItem } from '../../types';
import useStepBack from './useStepBack';
export default function OrganizerAccountScreen({ user, logout, onBack }: { user: User; logout: () => void; onBack?: () => void }) {
 const { photo, setPhoto, ready, error: storageError } = useSeekerData(user.id);
 const [events, setEvents] = useState<EventItem[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
 useStepBack(() => onBack?.());
 async function load() { setLoading(true); try { setEvents(await organizerEventService.getEvents()); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load event totals.'); } finally { setLoading(false); } }
 useEffect(() => { let active = true; organizerEventService.getEvents().then(rows => { if (active) setEvents(rows); }).catch(err => { if (active) setError(err instanceof Error ? err.message : 'Could not load event totals.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [user.id]);
 if (!ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#0B7A3E"/></View>;
 return <View style={{ flex: 1, backgroundColor: '#F7F6F5' }}>{storageError || error ? <View style={{ padding: 12 }}><Text accessibilityRole="alert" style={{ color: '#B42318' }}>{storageError || error}</Text>{error ? <TouchableOpacity onPress={load}><Text style={{ color: '#0B7A3E', paddingVertical: 8 }}>Retry event totals</Text></TouchableOpacity> : null}</View> : null}{loading ? <ActivityIndicator color="#0B7A3E"/> : null}<ProfileScreen user={user} photo={photo} onPhoto={setPhoto} savedCount={0} reminderCount={0} statistics={error || loading ? [] : [{ label: 'Total events', value: events.length }, { label: 'Published', value: events.filter(e => ['Published','Upcoming','Past'].includes(e.status)).length }, { label: 'Drafts', value: events.filter(e => e.status === 'Draft').length }]} note="Your profile photo is saved on this device for your account. Event totals come from your organizer account." logout={logout}/></View>;
}
