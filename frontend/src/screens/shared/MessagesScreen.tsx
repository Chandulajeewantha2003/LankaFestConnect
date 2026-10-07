import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../services/api';
import { chats, ChatMessage, Conversation } from '../../services/chats';
export default function MessagesScreen({ user, initial, onBack }: { user: User; initial?: Conversation; onBack: () => void }) {
 const [selected, setSelected] = useState<Conversation | null>(initial ?? null), [inbox, setInbox] = useState<Conversation[]>([]), [messages, setMessages] = useState<ChatMessage[]>([]);
 const [text, setText] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(true), [sending, setSending] = useState(false), [older, setOlder] = useState(true);
 const scroll = useRef<ScrollView>(null), busy = useRef(false), mounted = useRef(true), retry = useRef<{ text: string; id: string } | null>(null);
 function back() { if (selected && !initial) { setSelected(null); setText(''); } else onBack(); }
 useEffect(() => { const listener = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; }); return () => listener.remove(); });
 useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
 const chatId = selected?.id;
 const currentChat = useRef(chatId); currentChat.current = chatId;
 useEffect(() => {
  let active = true, fetching = false;
  setMessages([]); setError(''); setLoading(true); setOlder(true); setText(''); retry.current = null;
  async function refresh() { if (fetching) return; fetching = true; try {
   if (chatId) { const rows = await chats.history(chatId); if (active) { setMessages(current => Array.from(new Map([...current,...rows].map(m => [m.id,m])).values()).sort((a,b) => a.id.localeCompare(b.id))); if (rows.length < 50) setOlder(false); } }
   else { const rows = await chats.list(); if (active) setInbox(rows); }
   if (active) setError('');
  } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Could not load messages.'); }
  finally { fetching = false; if (active) setLoading(false); } }
  refresh(); const timer = setInterval(refresh, 10000); return () => { active = false; clearInterval(timer); };
 }, [chatId]);
 async function send() { if (!selected || busy.current || !text.trim()) return; busy.current = true; setSending(true); setError('');
  const sendingTo = selected.id;
  const pending = retry.current?.text === text.trim() ? retry.current : { text: text.trim(), id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) }; retry.current = pending;
  try { const message = await chats.send(sendingTo,pending.text,pending.id); if (mounted.current && currentChat.current === sendingTo) { setMessages(current => Array.from(new Map([...current,message].map(m => [m.id,m])).values()).sort((a,b) => a.id.localeCompare(b.id))); setText(''); retry.current = null; requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: true })); } }
  catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : 'Could not send. Retry your message.'); }
  finally { busy.current = false; if (mounted.current) setSending(false); }
 }
 async function loadOlder() { if (!selected || !messages.length || busy.current) return; busy.current = true; const loadingFor = selected.id;
  try { const rows = await chats.history(selected.id,messages[0].id); if (mounted.current && currentChat.current === loadingFor) { setMessages(current => Array.from(new Map([...rows,...current].map(m => [m.id,m])).values()).sort((a,b) => a.id.localeCompare(b.id))); setOlder(rows.length === 50); } }
  catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : 'Could not load earlier messages.'); } finally { busy.current = false; }
 }
 return <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={s.header}><Pressable accessibilityLabel="Back" onPress={back} style={s.back}><Ionicons name="arrow-back" size={24} color="#182230"/></Pressable><Text style={s.title}>{selected?.other.fullName ?? 'Messages'}</Text></View>{error ? <Text accessibilityRole="alert" style={s.error}>{error} Pull down to retry loading.</Text> : null}
 {loading ? <ActivityIndicator color="#0B7A3E"/> : null}
 <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={async () => { setLoading(true); try { if (selected) setMessages(await chats.history(selected.id)); else setInbox(await chats.list()); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Could not load messages.'); } finally { setLoading(false); } }}/>}>{selected ? <>{older && messages.length > 0 ? <Pressable onPress={loadOlder} style={s.back}><Text style={s.link}>Load earlier messages</Text></Pressable> : null}{messages.map(message => <View key={message.id} style={[s.bubble, message.senderId === user.id ? s.mine : s.theirs]}><Text style={s.message}>{message.text}</Text><Text style={s.time}>{new Date(message.createdAt).toLocaleString()}</Text></View>)}{!loading && !messages.length ? <Text style={s.empty}>Start a conversation with {selected.other.fullName}.</Text> : null}</> : <>{inbox.map(item => <Pressable key={item.id} onPress={() => setSelected(item)} style={s.thread}><Ionicons name="person-circle-outline" size={36} color="#0B7A3E"/><View style={{ flex: 1 }}><Text style={s.name}>{item.other.fullName}</Text><Text numberOfLines={2} style={s.preview}>{item.lastMessage || 'No messages yet'}</Text></View><Ionicons name="chevron-forward" size={20} color="#667085"/></Pressable>)}{!loading && !inbox.length ? <Text style={s.empty}>{user.role === 'ORGANIZER' ? 'Messages from event seekers will appear here.' : 'Open an event and tap Message organizer to start a chat.'}</Text> : null}</>}</ScrollView>
 {selected ? <View style={s.composer}><TextInput accessibilityLabel="Message" placeholder="Write a message…" value={text} onChangeText={setText} editable={!sending} multiline maxLength={2000} style={s.input}/><Pressable accessibilityLabel="Send message" onPress={send} disabled={sending || !text.trim()} style={[s.send, (sending || !text.trim()) && { opacity: .5 }]}>{sending ? <ActivityIndicator color="#fff"/> : <Ionicons name="send" size={21} color="#fff"/>}</Pressable></View> : null}</KeyboardAvoidingView>;
}
const s = StyleSheet.create({ root: { flex: 1, backgroundColor: '#fff' }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderColor: '#EAECF0' }, back: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }, title: { fontSize: 20, fontWeight: '700', color: '#182230', flex: 1 }, content: { padding: 16, gap: 12 }, error: { color: '#B42318', padding: 12 }, empty: { color: '#667085', fontSize: 16, lineHeight: 24, paddingVertical: 32 }, thread: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#EAECF0' }, name: { fontSize: 17, fontWeight: '600', color: '#182230' }, preview: { color: '#667085', marginTop: 5, fontSize: 14 }, bubble: { maxWidth: '85%', padding: 12, borderRadius: 12, gap: 6 }, mine: { alignSelf: 'flex-end', backgroundColor: '#E4F1E8' }, theirs: { alignSelf: 'flex-start', backgroundColor: '#F2F4F7' }, message: { fontSize: 16, lineHeight: 23, color: '#182230' }, time: { fontSize: 11, color: '#667085' }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderColor: '#EAECF0' }, input: { flex: 1, minHeight: 48, maxHeight: 140, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, padding: 12, fontSize: 16 }, send: { backgroundColor: '#0B7A3E', width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, link: { color: '#0B7A3E', fontWeight: '600' } });
