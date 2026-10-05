import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { apiRequest, Session } from '../../../services/api';
import { Brand, Button, ErrorMessage, Field, Page, styles } from '../components/AuthUI';
export default function LoginScreen({ back, signUp, onSession }: { back: () => void; signUp: () => void; onSession: (s: Session) => Promise<void> }) {
 const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(false);
 async function submit() {
  setError(''); if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
  setLoading(true);
  try { await onSession(await apiRequest<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) })); }
  catch (e) { setError((e as Error).message); } finally { setLoading(false); }
 }
 return <Page back={back}><Brand/><Text style={styles.title}>Welcome Back!</Text><Text style={styles.subtitle}>Sign in to continue to LankaFest Connect</Text><Field label="Email" value={email} onChange={setEmail} email icon="mail-outline"/><Field label="Password" value={password} onChange={setPassword} password icon="lock-closed-outline"/><ErrorMessage message={error}/><Button title="Login" onPress={submit} loading={loading}/><View style={styles.footer}><Text style={styles.muted}>Don't have an account?</Text><Pressable onPress={signUp}><Text style={styles.link}>Sign Up</Text></Pressable></View></Page>;
}
