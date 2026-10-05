import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest, Session } from '../../../services/api';
import { Brand, Button, ErrorMessage, Field, green, Page, styles } from '../components/AuthUI';
export default function RegistrationScreen({ back, login, onSession }: { back: () => void; login: () => void; onSession: (s: Session) => Promise<void> }) {
 const [fullName, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
 const [acceptTerms, setTerms] = useState(false), [error, setError] = useState(''), [loading, setLoading] = useState(false), [termsOpen, setTermsOpen] = useState(false);
 async function submit() {
  setError('');
  if (fullName.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter your full name and a valid email address.'); return; }
  if (password.length < 8 || password.length > 128) { setError('Use a password between 8 and 128 characters.'); return; }
  if (password !== confirm) { setError('Passwords do not match.'); return; }
  if (!acceptTerms) { setError('Please accept the terms to create your account.'); return; }
  setLoading(true);
  try { await onSession(await apiRequest<Session>('/auth/register', { method: 'POST', body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), password, acceptTerms }) })); }
  catch (e) { setError((e as Error).message); } finally { setLoading(false); }
 }
 return <Page back={back}><Brand/><Text style={styles.title}>Create Your Account</Text><Text style={styles.subtitle}>Join LankaFest Connect today</Text><Field label="Full Name" value={fullName} onChange={setName} icon="person-outline"/><Field label="Email" value={email} onChange={setEmail} email icon="mail-outline"/><Field label="Password" value={password} onChange={setPassword} password newPassword icon="lock-closed-outline"/><Field label="Confirm Password" value={confirm} onChange={setConfirm} password newPassword icon="lock-closed-outline"/><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 8 }}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acceptTerms }} accessibilityLabel="Accept terms" onPress={() => setTerms(!acceptTerms)} style={{ padding: 8 }}><Ionicons name={acceptTerms ? 'checkbox' : 'square-outline'} size={22} color={green}/></Pressable><Text style={styles.muted}>I agree to the</Text><Pressable onPress={() => setTermsOpen(!termsOpen)}><Text style={styles.link}>Terms & Conditions</Text></Pressable></View>{termsOpen && <Text style={[styles.muted, { lineHeight: 21, marginBottom: 12 }]}>Use accurate account details, respect other users, and only publish events you are authorized to manage. Authority access requires approval. These are interim app terms; final legal terms must be supplied before launch.</Text>}<ErrorMessage message={error}/><Button title="Sign Up" onPress={submit} loading={loading}/><View style={styles.footer}><Text style={styles.muted}>Already have an account?</Text><Pressable onPress={login}><Text style={styles.link}>Login</Text></Pressable></View></Page>;
}
