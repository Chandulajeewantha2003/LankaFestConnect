import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Button } from './components/AuthUI';
export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
 const insets = useSafeAreaInsets();
 return <ImageBackground source={require('../../../assets/welcome.jpg')} style={s.background}><View style={[s.overlay, { paddingTop: 24 + insets.top, paddingBottom: 24 + insets.bottom, paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right }]}><View style={s.content}><Brand welcome/><Text style={s.title}>LankaFest<Text style={{ color: '#4ADB85' }}>{'\n'}Connect</Text></Text><Text style={s.tagline}>Discover Events{'\n'}Experience Culture{'\n'}Celebrate Sri Lanka</Text></View><View style={s.bottom}><Button title="Get Started" onPress={onStart}/><Text style={s.caption}>Events bring people together</Text></View></View></ImageBackground>;
}
const s = StyleSheet.create({ background: { flex: 1, backgroundColor: '#163D2A' }, overlay: { flex: 1, backgroundColor: 'rgba(0,20,10,0.55)', padding: 24, alignItems: 'center' }, content: { flex: 1, justifyContent: 'center', width: '100%', maxWidth: 392 }, title: { fontSize: 36, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 44 }, tagline: { color: '#fff', textAlign: 'center', fontSize: 17, lineHeight: 30, marginTop: 28 }, bottom: { width: '100%', maxWidth: 392, paddingBottom: 32 }, caption: { color: '#E2EEE7', textAlign: 'center', marginTop: 16, fontSize: 13 } });
