import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../services/api';
import { Category, DemoEvent, demoEvents } from './data/demoEvents';
import EventDetailsScreen from './EventDetailsScreen';
import SavedEventsScreen from './SavedEventsScreen';
import NotificationsScreen from './NotificationsScreen';
import ProfileScreen from '../shared/ProfileScreen';
import useSeekerData from './useSeekerData';
import SearchScreen from './SearchScreen';
const green = '#0B7A3E';
type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Tab = 'Home' | 'Explore' | 'Saved' | 'Alerts' | 'Profile';
const categories: { name: Category; icon: IconName; color: string; background: string }[] = [
 { name: 'All', icon: 'apps', color: green, background: '#E6F2EB' },
 { name: 'Cultural', icon: 'color-palette-outline', color: '#9234C4', background: '#F3E9FA' },
 { name: 'Music', icon: 'musical-notes', color: '#DB421D', background: '#FDECE6' },
 { name: 'Food', icon: 'restaurant', color: '#AC6600', background: '#FFF4DA' },
 { name: 'Religious', icon: 'business-outline', color: '#00877E', background: '#DCF5F2' },
];
const tabs: { name: Tab; icon: IconName }[] = [
 { name: 'Home', icon: 'home' }, { name: 'Explore', icon: 'compass-outline' }, { name: 'Saved', icon: 'heart-outline' }, { name: 'Alerts', icon: 'notifications-outline' }, { name: 'Profile', icon: 'person-outline' },
];
export default function HomeScreen({ user, logout }: { user: User; logout: () => void }) {
 const [tab, setTab] = useState<Tab>('Home'), [category, setCategory] = useState<Category>('All'), [query, setQuery] = useState('');
 const { saved, reminders, read, photo, ready, error, toggleSaved, toggleReminder, markRead, setPhoto } = useSeekerData(user.id);
 const [freeOnly, setFreeOnly] = useState(false), [showAll, setShowAll] = useState(false);
 const [selected, setSelected] = useState<DemoEvent | null>(null);
 const unreadCount = reminders.filter(id => !read.includes(id)).length;
 const unread = unreadCount > 0;
 const [filtersVisible, setFiltersVisible] = useState(false);
 function changeTab(next: Tab) { setTab(next); setSelected(null); if (next === 'Alerts') markRead(); }
 const filtered = demoEvents.filter(event => (tab !== 'Saved' || saved.includes(event.id)) &&
  (category === 'All' || event.category === category) && (!freeOnly || event.price === 0) &&
  [event.title, event.city, event.venue, event.category].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
 const displayed = tab === 'Home' && !showAll && category === 'All' && !query && !freeOnly ? filtered.slice(0, 2) : filtered;
 const listingTab = ['Home', 'Explore', 'Saved'].includes(tab);
 const categoryControls = <View style={s.categories}>{categories.map(item => <Pressable key={item.name} accessibilityRole="button" accessibilityLabel={item.name + ' events'} accessibilityState={{ selected: category === item.name }} onPress={() => setCategory(item.name)} style={s.category}><View style={[s.categoryIcon, { backgroundColor: category === item.name ? green : item.background }]}><Ionicons name={item.icon} size={23} color={category === item.name ? '#fff' : item.color}/></View><Text style={[s.categoryLabel, category === item.name && { color: green, fontWeight: '700' }]}>{item.name}</Text></Pressable>)}</View>;
 function card(event: DemoEvent) {
  const isSaved = saved.includes(event.id);
  return <View key={event.id} style={s.card}>
   <View style={s.cover}><Pressable accessibilityRole="button" accessibilityLabel={'View ' + event.title} onPress={() => setSelected(event)} style={{ flex: 1 }}><Image source={event.image} style={s.image} resizeMode="cover"/></Pressable>
    <View pointerEvents="none" style={[s.badge, event.category !== 'Cultural' && { backgroundColor: '#332819' }]}><Ionicons name={event.category === 'Cultural' ? 'shield-checkmark' : 'sparkles'} size={12} color="#fff"/><Text style={s.badgeText}>{event.badge}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={(isSaved ? 'Unsave ' : 'Save ') + event.title} accessibilityState={{ selected: isSaved }} onPress={() => toggleSaved(event.id)} style={s.heart}><Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={24} color={isSaved ? '#E4516B' : '#56605A'}/></Pressable>
    <View pointerEvents="none" style={[s.price, event.price === 0 && { backgroundColor: '#fff' }]}><Text style={[s.priceText, event.price === 0 && { color: green }]}>{event.price ? 'LKR ' + event.price.toLocaleString() : 'Free'}</Text></View>
   </View>
   <Pressable accessibilityRole="button" onPress={() => setSelected(event)} style={s.cardBody}><Text style={s.eventTitle}>{event.title}</Text><View style={s.meta}><Ionicons name="location" size={13} color={green}/><Text style={s.metaText}>{event.city}</Text><Text style={s.separator}>·</Text><Ionicons name="calendar-outline" size={13} color="#68726C"/><Text style={s.metaText}>{event.date}</Text></View>
    <View style={s.cardBottom}><View style={s.venue}><View style={[s.dot, { backgroundColor: event.category === 'Food' ? '#EF9900' : '#11B687' }]}/><Text numberOfLines={1} style={s.metaText}>{event.venue}</Text></View><View style={s.rating}><Ionicons name="star" size={13} color="#D67A00"/><Text style={s.ratingText}>{event.rating}</Text><Text style={s.review}>({event.reviews})</Text></View></View>
   </Pressable>
  </View>;
 }
 if (!ready) return <View style={s.empty}><Text style={s.body}>Loading your events…</Text></View>;
 return <View style={s.root}>
 {error ? <Text accessibilityRole="alert" style={s.demoNote}>{error}</Text> : null}
 {selected && <EventDetailsScreen event={selected} saved={saved.includes(selected.id)} reminder={reminders.includes(selected.id)} onSave={() => toggleSaved(selected.id)} onReminder={() => toggleReminder(selected.id)} onBack={() => setSelected(null)}/>}
 {!selected && tab === 'Saved' && <SavedEventsScreen saved={saved} reminders={reminders} onSelect={setSelected} onRemove={toggleSaved} onExplore={() => changeTab('Explore')}/>}
 {!selected && tab === 'Alerts' && <NotificationsScreen reminders={reminders} onSelect={setSelected} onRemove={toggleReminder}/>}
 {!selected && tab === 'Profile' && <ProfileScreen user={user} photo={photo} onPhoto={setPhoto} savedCount={saved.length} reminderCount={reminders.length} logout={logout}/>}
  {tab === 'Explore' && <View style={{ flex: 1, display: selected ? 'none' : 'flex' }}><SearchScreen saved={saved} onToggleSaved={toggleSaved} onSelectEvent={setSelected} onBack={() => changeTab('Home')} onFilterVisibilityChange={setFiltersVisible}/></View>}
  {tab === 'Home' && !selected && <>
  <View style={s.header}><View style={s.identity}><View style={s.logoTile}><Image source={require('../../../assets/logo.png')} style={s.logo} resizeMode="contain"/></View><View><Text style={s.brand}><Text style={{ color: green }}>LankaFest</Text> Connect</Text><Text style={s.brandCaption}>SRI LANKA DISCOVERY</Text></View></View><Pressable accessibilityRole="button" accessibilityLabel="Open alerts" onPress={() => changeTab('Alerts')} style={s.notification}><Ionicons name="notifications-outline" size={23} color="#28342C"/>{unread && <View style={s.unread}><Text style={s.unreadText}>{unreadCount}</Text></View>}</Pressable></View>
  <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
   {    <>{tab === 'Home' && <View style={s.greeting}><View style={s.avatar}><>{photo ? <Image source={{ uri: photo }} style={{ width: 46, height: 46, borderRadius: 23 }}/> : <Text style={s.initials}>{user.fullName.slice(0, 1).toUpperCase()}</Text>}</><View style={s.online}><Ionicons name="checkmark" size={10} color="#fff"/></View></View><View style={{ flex: 1 }}><Text style={s.greetingTitle}>Hello, Explorer! <Ionicons name="sparkles-outline" size={14} color="#758078"/></Text><Text style={s.greetingText}>Discover amazing events near you in Sri Lanka</Text></View></View>}
     <View style={s.search}><Ionicons name="search-outline" size={19} color="#758078"/><TextInput accessibilityLabel="Search events, places, or categories" placeholder="Search events, places, or categories..." placeholderTextColor="#6B756E" value={query} onChangeText={setQuery} style={s.searchInput} autoCorrect={false}/>{query.length > 0 && <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}><Ionicons name="close-circle" size={19} color="#68726C"/></Pressable>}<Pressable accessibilityRole="button" accessibilityState={{ selected: freeOnly }} accessibilityLabel={freeOnly ? 'Show all prices' : 'Show free events only'} onPress={() => setFreeOnly(!freeOnly)} style={s.filter}><Ionicons name="options-outline" size={20} color={freeOnly ? green : '#758078'}/></Pressable></View>
     {freeOnly && <Pressable onPress={() => setFreeOnly(false)} style={s.filterChip}><Text style={s.filterChipText}>Free events only</Text><Ionicons name="close" color={green} size={16}/></Pressable>}
     <View style={s.sectionHeader}><Text style={s.sectionTitle}>Categories</Text><Text style={s.categoryCount}>5 Types</Text></View>{categoryControls}
     <View style={s.sectionHeader}><View style={s.headingGroup}><Text style={s.sectionTitle}>Upcoming Events</Text><Text style={s.country}>Sri Lanka</Text></View>{tab === 'Home' && <Pressable onPress={() => { setShowAll(!showAll); setCategory('All'); setQuery(''); setFreeOnly(false); }}><Text style={s.seeAll}>{showAll ? 'Show Less' : 'See All'} <Ionicons name="chevron-forward" size={12}/></Text></Pressable>}</View>
     {displayed.length ? displayed.map(card) : <View style={s.empty}><Ionicons name="search-outline" size={34} color={green}/><Text style={s.eventTitle}>No matching events</Text><Text style={s.body}>Try another category or search.</Text><Pressable onPress={() => { setCategory('All'); setQuery(''); setFreeOnly(false); }}><Text style={s.backText}>Reset filters</Text></Pressable></View>}
    </>}
   <Text style={s.demoNote}>Demo content · Sample dates, prices, verification, and ratings.{listingTab ? ' Saved events stay on this device.' : ''}</Text>
  </ScrollView>
  </>}
  {!filtersVisible && !selected && <View style={s.tabBar}>{tabs.map(item => <Pressable key={item.name} accessibilityRole="tab" accessibilityState={{ selected: tab === item.name }} onPress={() => changeTab(item.name)} style={s.tab}><View><Ionicons name={item.icon} size={23} color={tab === item.name ? green : '#7A817C'}/>{item.name === 'Alerts' && unread && <View style={s.alertDot}/>}</View><Text style={[s.tabLabel, tab === item.name && { color: green, fontWeight: '700' }]}>{item.name}</Text></Pressable>)}</View>}
 </View>;
}
const s = StyleSheet.create({
 root: { flex: 1, backgroundColor: '#F7F6F5' },
 header: { width: '100%', maxWidth: 560, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
 identity: { flexDirection: 'row', alignItems: 'center', gap: 9 }, logoTile: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#E4F1E8', alignItems: 'center', justifyContent: 'center' }, logo: { width: 30, height: 30 }, brand: { fontWeight: '800', fontSize: 19, color: '#202622' }, brandCaption: { fontSize: 9, color: '#68726C', letterSpacing: .7, marginTop: 3 },
 notification: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E7E7E4', alignItems: 'center', justifyContent: 'center' }, unread: { position: 'absolute', right: 2, top: 1, backgroundColor: '#DE4343', width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, unreadText: { fontSize: 10, fontWeight: '700', color: '#fff' },
 scroll: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24 },
 greeting: { backgroundColor: '#EDF1EF', borderWidth: 1, borderColor: '#DBE3DE', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 16 },
 avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D7EADB', borderWidth: 2, borderColor: '#ABCAB5', alignItems: 'center', justifyContent: 'center' }, initials: { color: green, fontWeight: '800', fontSize: 24 }, online: { position: 'absolute', bottom: 0, right: -1, backgroundColor: green, width: 15, height: 15, borderRadius: 8, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
 greetingTitle: { fontSize: 18, fontWeight: '700', color: '#222B25', marginBottom: 4 }, greetingText: { fontSize: 13, color: '#5F6B63', lineHeight: 18 },
 search: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3E5E2', borderRadius: 12, paddingHorizontal: 12, minHeight: 48 },
 searchInput: { flex: 1, fontSize: 13, color: '#26352B', paddingVertical: 12 }, filter: { padding: 6 },
 filterChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E4F1E8', borderRadius: 8, padding: 8, marginTop: 10 }, filterChipText: { color: green, fontSize: 12, fontWeight: '600' },
 sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 23, marginBottom: 13 }, sectionTitle: { fontSize: 16, fontWeight: '800', color: '#222923' }, categoryCount: { fontSize: 12, fontWeight: '600', color: green },
 categories: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, category: { flex: 1, alignItems: 'center', gap: 7 }, categoryIcon: { width: '100%', maxWidth: 62, aspectRatio: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, categoryLabel: { fontSize: 10, color: '#4E5951' },
 headingGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }, country: { color: green, backgroundColor: '#E4EFE6', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: '700' }, seeAll: { color: green, fontSize: 12, fontWeight: '700' },
 card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3E5E1', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
 cover: { height: 190, backgroundColor: '#263C2E' }, image: { width: '100%', height: '100%' }, badge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: green, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 7 }, badgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: .4 },
 heart: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, price: { position: 'absolute', bottom: 12, right: 12, backgroundColor: green, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 13 }, priceText: { fontSize: 12, fontWeight: '800', color: '#fff' },
 cardBody: { padding: 14 }, eventTitle: { color: '#202923', fontSize: 16, fontWeight: '700' }, meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 9 }, metaText: { fontSize: 11, color: '#59665D' }, separator: { color: '#78837B', marginHorizontal: 4 }, cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: '#EFF0ED', marginTop: 13, paddingTop: 12 }, venue: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }, dot: { width: 7, height: 7, borderRadius: 4 }, rating: { flexDirection: 'row', alignItems: 'center', gap: 3 }, ratingText: { fontSize: 11, fontWeight: '700', color: '#4F5C53' }, review: { fontSize: 10, color: '#68726C' },
 tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7E2', paddingVertical: 11 }, tab: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 4 }, tabLabel: { fontSize: 10, color: '#68726C' }, alertDot: { position: 'absolute', right: 1, top: 0, width: 7, height: 7, borderRadius: 4, backgroundColor: '#DE4343' },
 demoNote: { color: '#647067', fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 12 }, pageTitle: { fontSize: 25, fontWeight: '800', color: '#203429', marginVertical: 15 },
 empty: { alignItems: 'center', padding: 28, gap: 10 }, body: { fontSize: 14, lineHeight: 23, color: '#5E6B62', marginVertical: 8 }, back: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 12, marginBottom: 8 }, backText: { color: green, fontWeight: '700', fontSize: 14 },
 detailImage: { width: '100%', height: 220, borderRadius: 16 }, detailTitle: { fontSize: 25, fontWeight: '800', color: '#203429', marginTop: 20, marginBottom: 8 }, detailMeta: { fontSize: 13, color: green, marginBottom: 12 },
 profile: { alignItems: 'center', paddingVertical: 28 }, profileRole: { color: green, backgroundColor: '#E4F1E8', padding: 8, borderRadius: 8, marginTop: 8 }, alert: { flexDirection: 'row', gap: 14, paddingVertical: 22, borderTopWidth: 1, borderTopColor: '#DFE6DF' },
});
