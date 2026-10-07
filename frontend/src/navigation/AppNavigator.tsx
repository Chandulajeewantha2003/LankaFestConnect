import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { apiRequest, restoreToken, saveToken, Session, User } from '../services/api';
import WelcomeScreen from '../screens/welcome/WelcomeScreen';
import LoginScreen from '../screens/welcome/login/LoginScreen';
import RegistrationScreen from '../screens/welcome/registration/RegistrationScreen';
import RoleSelectionScreen from '../screens/welcome/role/RoleSelectionScreen';
import HomeScreen from '../screens/event-seeker/HomeScreen';
import OrganizerNavigator from './OrganizerNavigator';
import AuthorityNavigator from './AuthorityNavigator';
export default function AppNavigator() {
 const [route, setRoute] = useState<'welcome' | 'login' | 'registration'>('welcome');
 const [user, setUser] = useState<User | null>(null), [loading, setLoading] = useState(true);
 useEffect(() => { (async () => {
  try { if (await restoreToken()) setUser(await apiRequest<User>('/auth/me')); }
  catch { await saveToken(null); } finally { setLoading(false); }
 })(); }, []);
 async function onSession(session: Session) { await saveToken(session.token); setUser(session.user); }
 async function logout() { await saveToken(null); setUser(null); setRoute('login'); }
 let screen;
 if (loading) screen = <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#0B7A3E"/><Text>Loading your account…</Text></View>;
 else if (user && !user.role) screen = <RoleSelectionScreen onSession={onSession} logout={logout}/>;
 else if (user) {
  const Dashboard = { SEEKER: HomeScreen, ORGANIZER: OrganizerNavigator, AUTHORITY: AuthorityNavigator }[user.role!];
  screen = <Dashboard user={user} logout={logout}/>;
 } else if (route === 'welcome') screen = <WelcomeScreen onStart={() => setRoute('login')}/>;
 else if (route === 'login') screen = <LoginScreen back={() => setRoute('welcome')} signUp={() => setRoute('registration')} onSession={onSession}/>;
 else screen = <RegistrationScreen back={() => setRoute('login')} login={() => setRoute('login')} onSession={onSession}/>;
 const isWelcome = !loading && !user && route === 'welcome';
 return <SafeAreaView edges={isWelcome ? [] : ['top', 'right', 'bottom', 'left']} style={{ flex: 1, backgroundColor: isWelcome ? '#163D2A' : '#fff' }}><StatusBar style={isWelcome ? 'light' : 'dark'}/>{screen}</SafeAreaView>;
}
