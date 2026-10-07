import React, { useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SeekerEvent } from './data/events';
import FilterScreen from './FilterScreen';
import { defaultFilters, filterCount, matchesFilters, SearchFilters } from './data/searchFilters';
type ResultType = 'All' | 'Events' | 'Places' | 'Hosts';
interface DirectoryEntry { id: string; type: 'Places' | 'Hosts'; title: string; city: string; subtitle: string; description: string; }

const green = '#0B7A3E';
export default function SearchScreen({ allEvents, saved, onToggleSaved, onSelectEvent, onBack, onFilterVisibilityChange }: {
 allEvents: SeekerEvent[]; saved: string[]; onToggleSaved: (id: string) => void; onSelectEvent: (event: SeekerEvent) => void; onBack: () => void; onFilterVisibilityChange: (visible: boolean) => void;
}) {
 const [query, setQuery] = useState(''), [type, setType] = useState<ResultType>('All');
 const [filters, setFilters] = useState<SearchFilters>(defaultFilters), [showFilters, setShowFilters] = useState(false);
 const activeCount = filterCount(filters);
 const [selectedEntry, setSelectedEntry] = useState<DirectoryEntry | null>(null);
 const insets = useSafeAreaInsets();
 const term = query.trim().toLowerCase();
 const events = (type === 'All' || type === 'Events') ? allEvents.filter(event =>
  [event.title, event.city, event.category, event.venue].join(' ').toLowerCase().includes(term) && matchesFilters(event, filters)) : [];
 const directory: DirectoryEntry[] = Array.from(new Map(allEvents.map(e => [e.venue + e.city, { id: e.id, type: 'Places' as const, title: e.venue, city: e.city, subtitle: e.address, description: e.description }])).values());
 const entries = directory.filter(entry => (type === 'All' || type === entry.type) && (filters.location === 'All Locations' || entry.city === filters.location) && [entry.title, entry.city, entry.subtitle].join(' ').toLowerCase().includes(term));
 function chooseType(next: ResultType) { setType(next); setSelectedEntry(null); if (next === 'Places' || next === 'Hosts') setQuery(''); }
 function closeFilters() { setShowFilters(false); onFilterVisibilityChange(false); }
 if (showFilters) return <FilterScreen value={filters} onBack={closeFilters} onApply={value => { setFilters(value); setType('Events'); closeFilters(); }}/>;
 return <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top}>
  <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel={selectedEntry ? 'Back to search' : 'Back to home'} onPress={() => selectedEntry ? setSelectedEntry(null) : onBack()} style={s.back}><Ionicons name="chevron-back" size={24} color="#172338"/></Pressable><Text style={s.title}>{selectedEntry ? selectedEntry.type === 'Hosts' ? 'Host Details' : 'Place Details' : 'Search'}</Text></View>
  {selectedEntry ? <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={s.content}><View style={s.detailIcon}><Ionicons name={selectedEntry.type === 'Hosts' ? 'people-outline' : 'location-outline'} size={40} color={green}/></View><Text style={s.detailTitle}>{selectedEntry.title}</Text><Text style={s.city}>{selectedEntry.city} · {selectedEntry.subtitle}</Text><Text style={s.body}>{selectedEntry.description}</Text></ScrollView> : <>
   <View style={s.controls}><View style={s.searchRow}><View style={s.search}><Ionicons name="search-outline" size={17} color="#748195"/><TextInput accessibilityLabel="Search events, places and hosts" placeholder="Search events, places, or hosts" placeholderTextColor="#667085" value={query} onChangeText={setQuery} autoCorrect={false} autoCapitalize="none" returnKeyType="search" style={s.input}/>{query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={8}><Ionicons name="close-circle" size={18} color="#8C959E"/></Pressable>}</View><Pressable accessibilityRole="button" accessibilityLabel="Open filters" accessibilityState={{ selected: activeCount > 0 }} onPress={() => { Keyboard.dismiss(); setShowFilters(true); onFilterVisibilityChange(true); }} style={[s.filter, activeCount > 0 && s.filterActive]}><Ionicons name="filter-outline" size={22} color={activeCount > 0 ? green : '#46546A'}/></Pressable></View>
   <View style={s.chips}>{(['All', 'Events', 'Places', 'Hosts'] as ResultType[]).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: type === item }} onPress={() => chooseType(item)} style={[s.chip, type === item && s.chipActive]}><Text style={[s.chipText, type === item && s.chipTextActive]}>{item}</Text></Pressable>)}</View>{activeCount > 0 && <Text style={s.freeLabel}>{activeCount} active {activeCount === 1 ? 'filter' : 'filters'} ? Event filters</Text>}</View>
   <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
    {events.map(event => <View key={event.id} style={s.result}><Pressable accessibilityRole="button" accessibilityLabel={'View ' + event.title} onPress={() => onSelectEvent(event)} style={s.resultMain}><Image source={event.image} style={s.thumbnail}/><View style={s.resultText}><Text style={s.resultTitle}>{event.title}</Text><View style={s.location}><Ionicons name="location" size={12} color="#758094"/><Text style={s.city}>{event.city}</Text></View><Text style={s.date}>{event.date}</Text><Text style={s.price}>{event.price ? 'LKR ' + event.price.toLocaleString() : 'Free'}</Text></View></Pressable><Pressable accessibilityRole="button" accessibilityLabel={(saved.includes(event.id) ? 'Unsave ' : 'Save ') + event.title} accessibilityState={{ selected: saved.includes(event.id) }} onPress={() => onToggleSaved(event.id)} style={s.heart}><Ionicons name={saved.includes(event.id) ? 'heart' : 'heart-outline'} size={20} color={saved.includes(event.id) ? '#E74351' : '#738075'}/></Pressable></View>)}
    {entries.map(entry => <View key={entry.id} style={s.result}><Pressable accessibilityRole="button" onPress={() => setSelectedEntry(entry)} style={s.resultMain}><View style={[s.thumbnail, s.directoryIcon]}><Ionicons name={entry.type === 'Hosts' ? 'people-outline' : 'location-outline'} size={30} color={green}/></View><View style={s.resultText}><Text style={s.resultTitle}>{entry.title}</Text><View style={s.location}><Ionicons name="location" size={12} color="#758094"/><Text style={s.city}>{entry.city}</Text></View><Text style={s.date}>{entry.subtitle}</Text><Text style={s.price}>{entry.type === 'Hosts' ? 'Organizer' : 'Event venue'}</Text></View></Pressable><Ionicons name="chevron-forward" size={18} color="#748195" style={{ marginRight: 12 }}/></View>)}
    {!events.length && !entries.length && <View style={s.empty}><Ionicons name="search-outline" size={36} color={green}/><Text style={s.detailTitle}>No results found</Text><Text style={s.body}>Try another search or reset your filters.</Text><Pressable onPress={() => { setQuery(''); setFilters(defaultFilters()); }}><Text style={s.price}>Clear search and filters</Text></Pressable></View>}
    <Text style={s.disclaimer}>Published events</Text>
   </ScrollView>
  </>}
 </KeyboardAvoidingView>;
}
const s = StyleSheet.create({
 root: { flex: 1, backgroundColor: '#fff' },
 header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 12, width: '100%', maxWidth: 560, alignSelf: 'center' }, back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 21, fontWeight: '700', color: '#172338' },
 controls: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F3F4' }, searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F5F7', borderRadius: 24, paddingHorizontal: 14, minHeight: 44 }, input: { flex: 1, color: '#25334A', fontSize: 14, paddingVertical: 11 }, filter: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E4E8ED', alignItems: 'center', justifyContent: 'center' }, filterActive: { borderColor: green, backgroundColor: '#EDF7F0' },
 chips: { flexDirection: 'row', gap: 9, marginTop: 14 }, chip: { backgroundColor: '#F2F4F6', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 }, chipActive: { backgroundColor: green }, chipText: { color: '#536174', fontSize: 12 }, chipTextActive: { color: '#fff', fontWeight: '700' }, freeLabel: { color: green, fontSize: 12, marginTop: 10 },
 content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 16, paddingTop: 14, paddingBottom: 28 },
 result: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEF0F2', backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, minHeight: 108 },
 resultMain: { flex: 1, flexDirection: 'row', gap: 13, padding: 11, alignItems: 'center' }, thumbnail: { width: 86, height: 86, borderRadius: 10, backgroundColor: '#E5EEE8' }, resultText: { flex: 1 }, resultTitle: { fontSize: 14, lineHeight: 19, fontWeight: '700', color: '#202B3D' }, location: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }, city: { fontSize: 11, color: '#667085' }, date: { fontSize: 11, color: '#667085', marginTop: 5 }, price: { fontSize: 12, fontWeight: '700', color: green, marginTop: 6 }, heart: { width: 40, alignSelf: 'stretch', paddingTop: 16, alignItems: 'center' }, directoryIcon: { alignItems: 'center', justifyContent: 'center' },
 disclaimer: { color: '#687589', fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 10 },
 empty: { alignItems: 'center', paddingVertical: 35 }, detailIcon: { backgroundColor: '#E5F1E9', width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, detailTitle: { fontSize: 23, fontWeight: '700', color: '#203429', marginVertical: 12 }, body: { fontSize: 14, lineHeight: 23, color: '#59697A', marginVertical: 15 },
});
