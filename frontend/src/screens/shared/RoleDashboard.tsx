import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../services/api';
import { UserRole } from '../../types';
import { Button, Page, styles, green } from '../welcome/components/AuthUI';
const content: Record<UserRole, { title: string; intro: string; sections: [string, string][] }> = {
 SEEKER: { title: 'Discover Sri Lanka', intro: 'Your next cultural experience starts here.', sections: [['Upcoming events', 'There are no published events yet. Check back for festivals, celebrations, and experiences.'], ['Saved events', 'Events you save will appear here.']] },
 ORGANIZER: { title: 'Organizer Dashboard', intro: 'Bring people together through memorable events.', sections: [['Your events', 'You have not created any events yet. Event publishing is coming in the next milestone.'], ['Event insights', 'Attendance and engagement will appear once your events are live.']] },
 AUTHORITY: { title: 'Authority / Guide Dashboard', intro: 'Support trusted events and help visitors experience Sri Lanka.', sections: [['Account verification', 'Your authority / guide account is awaiting approval. Verification and moderation access remain locked until an administrator approves your account.'], ['Event review queue', 'Approved authorities / guides will review submitted listings here.'], ['Visitor requests', 'No visitor requests yet.'], ['Your experiences', 'Your guided experiences will appear here when guide publishing becomes available.']] },
};
export default function RoleDashboard({ user, logout }: { user: User; logout: () => void }) {
 const data = content[user.role!];
 return <Page><View style={s.top}><Image source={require('../../../assets/logo.png')} accessibilityLabel="LankaFest Connect logo" resizeMode="contain" style={{ width: 36, height: 36 }}/><Text style={s.brand}>LankaFest Connect</Text></View><Text style={s.greeting}>Welcome, {user.fullName}</Text><Text style={[styles.title, { textAlign: 'left' }]}>{data.title}</Text><Text style={[styles.subtitle, { textAlign: 'left' }]}>{data.intro}</Text>{data.sections.map(([title, description], i) => <View key={title} style={s.section}><Ionicons name={i === 0 ? 'calendar-outline' : 'bookmark-outline'} size={25} color={green}/><Text style={s.heading}>{title}</Text><Text style={s.body}>{user.role === 'AUTHORITY' && user.authorityApproved && i === 0 ? 'Your authority account is approved.' : description}</Text></View>)}<View style={{ marginTop: 'auto', paddingTop: 30 }}><Text style={styles.muted}>{user.email}</Text><Button title="Log Out" onPress={logout}/></View></Page>;
}
const s = StyleSheet.create({ top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 42 }, brand: { fontWeight: '700', fontSize: 18, color: '#152018' }, greeting: { color: '#526581', fontSize: 16, marginBottom: 12 }, section: { paddingVertical: 24, borderTopWidth: 1, borderTopColor: '#E1E8E3' }, heading: { fontSize: 19, fontWeight: '700', color: '#152018', marginTop: 12, marginBottom: 8 }, body: { fontSize: 15, lineHeight: 24, color: '#526581' } });
