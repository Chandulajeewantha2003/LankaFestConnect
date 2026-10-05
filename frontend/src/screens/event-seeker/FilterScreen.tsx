import React, { useEffect, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { defaultFilters, isValidDate, SearchFilters } from './data/searchFilters';
const green = '#0B7A3E';
const categories = ['Cultural', 'Food & Beverage', 'Music', 'Religious', 'Art & Exhibition', 'Sports', 'Community'];
const prices = ['Free', 'LKR 1 – 1,000', 'LKR 1,000 – 5,000', 'Above LKR 5,000'];
const locations = ['All Locations', 'Colombo', 'Kandy', 'Galle', 'Mirissa', 'Negombo'];
const languages = [{ value: 'English', label: 'English' }, { value: 'Sinhala', label: 'සිංහල (Sinhala)' }, { value: 'Tamil', label: 'தமிழ் (Tamil)' }];
export default function FilterScreen({ value, onApply, onBack }: { value: SearchFilters; onApply: (value: SearchFilters) => void; onBack: () => void }) {
 const [draft, setDraft] = useState<SearchFilters>(() => ({ ...value, categories: [...value.categories], prices: [...value.prices], languages: [...value.languages] }));
 const [locationOpen, setLocationOpen] = useState(false);
 const insets = useSafeAreaInsets();
 useEffect(() => { const subscription = BackHandler.addEventListener('hardwareBackPress', () => { onBack(); return true; }); return () => subscription.remove(); }, [onBack]);
 function toggle(key: 'categories' | 'prices' | 'languages', value: string) { setDraft(current => ({ ...current, [key]: current[key].includes(value) ? current[key].filter(item => item !== value) : [...current[key], value] })); }
 function check(label: string, value: string, key: 'categories' | 'prices' | 'languages') {
  const checked = draft[key].includes(value);
  return <Pressable key={value} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => toggle(key, value)} style={s.option}><Ionicons name={checked ? 'checkbox' : 'square-outline'} size={22} color={checked ? green : '#748195'}/><Text style={s.optionText}>{label}</Text></Pressable>;
 }
 const invalidDate = draft.date === 'Custom' && !isValidDate(draft.customDate);
 return <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top}>
  <View style={s.header}><Pressable accessibilityLabel="Back to search without applying" onPress={onBack} style={s.headerAction}><Ionicons name="chevron-back" size={24} color="#1D2A3C"/></Pressable><Text style={s.title}>Filters</Text><Pressable onPress={() => { setDraft(defaultFilters()); setLocationOpen(false); }} style={s.headerAction}><Text style={s.reset}>Reset</Text></Pressable></View>
  <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
   <Text style={s.heading}>Date</Text><View style={s.dateRow}>{(['Anytime', 'Today', 'This Week', 'This Month'] as const).map(date => <Pressable key={date} accessibilityRole="button" accessibilityState={{ selected: draft.date === date }} onPress={() => setDraft({ ...draft, date })} style={[s.dateChip, draft.date === date && s.selectedChip]}><Text style={[s.dateText, draft.date === date && s.selectedText]}>{date}</Text></Pressable>)}</View>
   <Pressable accessibilityRole="button" onPress={() => setDraft({ ...draft, date: 'Custom' })} style={s.custom}><Ionicons name="calendar-outline" size={18} color={draft.date === 'Custom' ? green : '#748195'}/><Text style={s.optionText}>Custom Date</Text></Pressable>
   {draft.date === 'Custom' && <><TextInput accessibilityLabel="Custom event date in YYYY-MM-DD format" placeholder="YYYY-MM-DD" placeholderTextColor="#667085" value={draft.customDate} onChangeText={customDate => setDraft({ ...draft, customDate })} maxLength={10} autoCorrect={false} style={s.dateInput}/>{invalidDate && <Text style={s.dateError}>Enter a valid date, for example 2026-11-22.</Text>}</>}
   <Text style={s.heading}>Category</Text><View style={s.grid}>{categories.map(category => check(category, category, 'categories'))}</View>
   <Text style={s.heading}>Price Range</Text><View style={s.grid}>{prices.map(price => check(price, price, 'prices'))}</View>
   <Text style={s.heading}>Location</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded: locationOpen }} onPress={() => setLocationOpen(!locationOpen)} style={s.location}><Ionicons name="location" size={18} color="#435166"/><Text style={[s.optionText, { flex: 1 }]}>{draft.location}</Text><Ionicons name={locationOpen ? 'chevron-up' : 'chevron-down'} size={17} color="#748195"/></Pressable>
   {locationOpen && <View style={s.locationList}>{locations.map(location => <Pressable key={location} onPress={() => { setDraft({ ...draft, location }); setLocationOpen(false); }} style={s.locationOption}><Text style={[s.optionText, draft.location === location && { color: green, fontWeight: '700' }]}>{location}</Text>{draft.location === location && <Ionicons name="checkmark" size={18} color={green}/>}</Pressable>)}</View>}
   <Text style={s.heading}>Language</Text><View style={s.grid}>{languages.map(language => check(language.label, language.value, 'languages'))}</View>
   <Text style={s.note}>Filters apply to demo events. Dates use your device calendar; sample listings are in November–December 2026 and August 2027. Leave a section unselected to include all options.</Text>
  </ScrollView>
  <View style={s.footer}><Pressable accessibilityRole="button" disabled={invalidDate} accessibilityState={{ disabled: invalidDate }} onPress={() => onApply(draft)} style={[s.apply, invalidDate && { opacity: .5 }]}><Text style={s.applyText}>Apply Filters</Text></Pressable></View>
 </KeyboardAvoidingView>;
}
const s = StyleSheet.create({
 root: { flex: 1, backgroundColor: '#fff' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, minHeight: 54, borderBottomWidth: 1, borderBottomColor: '#F0F2F4' }, headerAction: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, title: { fontWeight: '700', fontSize: 19, color: '#1A2639' }, reset: { color: green, fontSize: 13 },
 content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 18, paddingBottom: 30 }, heading: { fontSize: 17, fontWeight: '700', color: '#1E2A3D', marginTop: 24, marginBottom: 13 },
 dateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, dateChip: { backgroundColor: '#F5F7F9', borderWidth: 1, borderColor: '#E7EBF0', borderRadius: 22, paddingHorizontal: 13, paddingVertical: 10 }, selectedChip: { backgroundColor: green, borderColor: green }, dateText: { fontSize: 12, color: '#58657A' }, selectedText: { color: '#fff', fontWeight: '700' },
 custom: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, marginTop: 6 }, dateInput: { borderWidth: 1, borderColor: '#DCE2E9', borderRadius: 8, padding: 12, color: '#243348' }, dateError: { fontSize: 12, color: '#B42318', marginTop: 6 },
 grid: { flexDirection: 'row', flexWrap: 'wrap' }, option: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 40, paddingRight: 8 }, optionText: { fontSize: 12, lineHeight: 18, color: '#47566D', flexShrink: 1 },
 location: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: '#DEE4EB', borderRadius: 9 }, locationList: { borderWidth: 1, borderColor: '#DEE4EB', borderRadius: 9, marginTop: 6 }, locationOption: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
 note: { color: '#687589', fontSize: 11, lineHeight: 18, marginTop: 24 }, footer: { padding: 12, borderTopWidth: 1, borderTopColor: '#F0F2F4' }, apply: { backgroundColor: green, minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, applyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
