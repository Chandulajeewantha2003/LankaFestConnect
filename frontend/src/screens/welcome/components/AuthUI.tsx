import React from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export const green = '#0B7A3E';
export function Brand({ welcome = false }: { welcome?: boolean }) { return <View style={styles.brand}><Image source={require('../../../../assets/logo.png')} accessibilityLabel="LankaFest Connect logo" resizeMode="contain" style={{ width: welcome ? 72 : 48, height: welcome ? 72 : 48 }}/>{!welcome && <><Text style={styles.brandName}>LankaFest</Text><Text style={styles.connect}>CONNECT</Text></>}</View>; }
export function Page({ children, back }: { children: React.ReactNode; back?: () => void }) {
 const insets = useSafeAreaInsets();
 return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top}><ScrollView style={{ flex: 1 }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>{back && <Pressable accessibilityLabel="Go back" onPress={back} style={styles.back}><Ionicons name="chevron-back" size={25} color="#192536"/></Pressable>}{children}</ScrollView></KeyboardAvoidingView>;
}
export function Button({ title, onPress, loading, disabled }: { title: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
 return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || loading }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, { opacity: disabled || loading ? .55 : pressed ? .8 : 1 }]}>{loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.buttonText}>{title}</Text>}</Pressable>;
}
export function Field({ label, value, onChange, password, icon, email, newPassword }: { label: string; value: string; onChange: (s: string) => void; password?: boolean; icon: React.ComponentProps<typeof Ionicons>['name']; email?: boolean; newPassword?: boolean }) {
 const [visible, setVisible] = React.useState(false);
 return <View style={styles.field}><Ionicons name={icon} size={20} color="#64748B"/><TextInput accessibilityLabel={label} placeholder={label} placeholderTextColor="#64748B" value={value} onChangeText={onChange} secureTextEntry={password && !visible} autoCapitalize={email || password ? 'none' : 'words'} keyboardType={email ? 'email-address' : 'default'} autoComplete="off" textContentType="none" importantForAutofill="no" autoCorrect={!email && !password} selectionColor={green} cursorColor={green} underlineColorAndroid="transparent" style={styles.input}/>{password && <Pressable accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={() => setVisible(!visible)}><Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={21} color="#64748B"/></Pressable>}</View>;
}
export function ErrorMessage({ message }: { message: string }) { return message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null; }
export const styles = StyleSheet.create({
 page: { flexGrow: 1, width: '100%', maxWidth: 440, alignSelf: 'center', padding: 24, paddingTop: 55, paddingBottom: 30 },
 back: { alignSelf: 'flex-start', padding: 8, marginLeft: -8, marginBottom: 18 },
 brand: { alignItems: 'center', marginTop: 24, marginBottom: 32 }, brandName: { fontSize: 21, fontWeight: '700', color: '#162033', marginTop: 12 },
 connect: { color: green, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 3 },
 title: { fontSize: 27, fontWeight: '700', color: '#162033', textAlign: 'center', marginBottom: 8 },
 subtitle: { fontSize: 14, color: '#526581', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
 field: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#DCE3EC', borderRadius: 12, paddingHorizontal: 16, minHeight: 54, backgroundColor: '#F8FAFC', marginBottom: 14 },
 input: { flex: 1, color: '#162033', fontSize: 15, paddingVertical: 14 },
 button: { minHeight: 54, backgroundColor: green, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
 buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
 footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginTop: 'auto', paddingTop: 48 },
 muted: { color: '#526581', fontSize: 13 }, link: { color: green, fontWeight: '700', fontSize: 13 },
 error: { color: '#B42318', lineHeight: 21, marginBottom: 8 },
});
