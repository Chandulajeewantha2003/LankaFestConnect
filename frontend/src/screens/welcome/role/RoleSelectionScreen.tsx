import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '../../../types';
import { apiRequest, Session } from '../../../services/api';
import { Button, ErrorMessage, green, Page, styles } from '../components/AuthUI';
export const roles: { value: UserRole; title: string; description: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
 { value: 'SEEKER', title: 'Event Seeker', description: 'Discover and attend events', icon: 'compass-outline' },
 { value: 'ORGANIZER', title: 'Event Organizer', description: 'Create and manage events', icon: 'calendar-outline' },
 { value: 'AUTHORITY', title: 'Event Authority / Guide', description: 'Verify events and support visitors', icon: 'shield-checkmark-outline' },
];
export default function RoleSelectionScreen({ onSession, logout }: { onSession: (s: Session) => Promise<void>; logout: () => void }) {
 const [role, setRole] = useState<UserRole>('SEEKER'), [loading, setLoading] = useState(false), [error, setError] = useState('');
 async function submit() {
  setError(''); setLoading(true);
  try { await onSession(await apiRequest<Session>('/auth/role', { method: 'PATCH', body: JSON.stringify({ role }) })); }
  catch (e) { setError((e as Error).message); } finally { setLoading(false); }
 }
 return <Page back={logout}><Text style={[styles.title, { marginTop: 24 }]}>Select Your Role</Text><Text style={styles.subtitle}>Choose how you want to use{'\n'}LankaFest Connect</Text><View style={{ gap: 14, marginTop: 8 }}>{roles.map(item => <Pressable key={item.value} accessibilityRole="radio" accessibilityState={{ selected: role === item.value }} onPress={() => setRole(item.value)} disabled={loading} style={[s.role, role === item.value && s.selected]}><View style={s.icon}><Ionicons name={item.icon} size={25} color={green}/></View><View style={{ flex: 1 }}><Text style={s.name}>{item.title}</Text><Text style={s.description}>{item.description}</Text></View><Ionicons name={role === item.value ? 'checkmark-circle' : 'ellipse-outline'} size={25} color={role === item.value ? green : '#87918B'}/></Pressable>)}</View><View style={{ marginTop: 'auto', paddingTop: 36 }}><ErrorMessage message={error}/><Button title="Continue" onPress={submit} loading={loading}/></View></Page>;
}
const s = StyleSheet.create({ role: { borderWidth: 1, borderColor: '#DEE3E0', borderRadius: 16, padding: 16, minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 14 }, selected: { borderColor: green, backgroundColor: '#F0FBF4', borderWidth: 2 }, icon: { backgroundColor: '#E5F3EA', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }, name: { color: '#19251F', fontWeight: '700', fontSize: 16 }, description: { color: '#56635B', fontSize: 13, marginTop: 6, lineHeight: 19 } });
