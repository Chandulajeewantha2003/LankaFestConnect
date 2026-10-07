import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { AuthorityEvent, authorityService } from '../../services/authority';
import { formatDateRange } from './ReviewListingsScreen';
import { emergencyContacts, faqs, mapsUrl, places, quickFacts, TOURISM_WEBSITE, travelTips } from './data/touristSupport';

type IconName = keyof typeof Ionicons.glyphMap;
type Section = 'events' | 'places' | 'tips' | 'emergency';
type Tab = 'guide' | 'info';

interface Props {
  onBack: () => void;
  onProfile: () => void;
  onOpenEvent: (event: AuthorityEvent) => void;
}

const categories: { key: Section; title: string; subtitle: string; icon: IconName; color: string; background: string }[] = [
  { key: 'events', title: 'Event Recommendations', subtitle: 'Verified cultural events cleared by officers', icon: 'sparkles-outline', color: '#166534', background: '#DCEFE3' },
  { key: 'places', title: 'Key Places', subtitle: 'Heritage sites, sacred sites & transit hubs', icon: 'navigate', color: '#166534', background: '#DCE6F5' },
  { key: 'tips', title: 'Travel Tips & Etiquette', subtitle: 'Temple customs, fair taxi fares, wildlife safety', icon: 'bulb-outline', color: '#166534', background: '#DCE6F5' },
  { key: 'emergency', title: 'Emergency Contacts', subtitle: 'Police 119, 1990 Suwa Seriya ambulance, 1912', icon: 'medkit-outline', color: '#B91C1C', background: '#FAD9D5' },
];

const sectionTitles: Record<Section, string> = {
  events: 'Event Recommendations',
  places: 'Key Places',
  tips: 'Travel Tips & Etiquette',
  emergency: 'Emergency Contacts',
};

export default function TouristSupportScreen({ onBack, onProfile, onOpenEvent }: Props) {
  const [tab, setTab] = useState<Tab>('guide');
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<Section | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [linkError, setLinkError] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [events, setEvents] = useState<AuthorityEvent[] | null>(null);
  const [eventsError, setEventsError] = useState('');

  // Android Back closes an open section before leaving the screen.
  useEffect(() => {
    if (!section) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      setSection(null);
      return true;
    });
    return () => listener.remove();
  }, [section]);

  useEffect(() => {
    if (section !== 'events' || events) return;
    let active = true;
    setEventsError('');
    authorityService
      .getEvents('VERIFIED')
      .then((data) => {
        if (active) setEvents(data.events);
      })
      .catch((err) => {
        if (active) setEventsError(err instanceof Error ? err.message : 'Could not load verified events.');
      });
    return () => {
      active = false;
    };
  }, [section, events]);

  const open = async (url: string) => {
    setLinkError('');
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError(url.startsWith('tel:') ? `Calling is not available on this device. Dial ${url.slice(4)} manually.` : 'Could not open that link on this device.');
    }
  };

  const call = (number: string) => open(`tel:${number}`);

  const term = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!term) return null;
    const has = (...values: string[]) => values.join(' ').toLowerCase().includes(term);
    return {
      contacts: emergencyContacts.filter((c) => has(c.name, c.detail, c.number)),
      places: places.filter((p) => has(p.name, p.type, p.description)),
      tips: travelTips.filter((t) => has(t.title, t.body)),
      faqs: faqs.filter((f) => has(f.question, f.answer)),
    };
  }, [term]);
  const resultCount = results ? results.contacts.length + results.places.length + results.tips.length + results.faqs.length : 0;

  const header = (
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel={section ? 'Back to support' : 'Back to dashboard'} onPress={section ? () => setSection(null) : onBack} style={styles.headerIcon}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>{section ? sectionTitles[section] : 'Support'}</Text>
      <TouchableOpacity accessibilityLabel="More options" onPress={() => setOptionsOpen(true)} style={styles.headerIcon}>
        <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
      </TouchableOpacity>
      <TouchableOpacity accessibilityLabel="Open profile" onPress={onProfile} style={styles.headerAvatar}>
        <Ionicons name="person" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const contactRow = (contact: (typeof emergencyContacts)[number]) => (
    <TouchableOpacity key={contact.id} style={styles.listCard} onPress={() => call(contact.number)} accessibilityRole="button" accessibilityLabel={`Call ${contact.name}`}>
      <View style={[styles.listIcon, { backgroundColor: '#FAD9D5' }]}>
        <Ionicons name={contact.icon} size={20} color="#B91C1C" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle}>{contact.name}</Text>
        <Text style={styles.listText}>{contact.detail}</Text>
      </View>
      <View style={styles.callPill}>
        <Ionicons name="call" size={13} color="#FFFFFF" />
        <Text style={styles.callText}>{contact.number.startsWith('+94') ? 'Call' : contact.number}</Text>
      </View>
    </TouchableOpacity>
  );

  const placeRow = (place: (typeof places)[number]) => (
    <View key={place.id} style={styles.listCard}>
      <View style={[styles.listIcon, { backgroundColor: '#DCE6F5' }]}>
        <Ionicons name="location-outline" size={20} color="#1E3A8A" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle}>{place.name}</Text>
        <Text style={styles.listMeta}>{place.type}</Text>
        <Text style={styles.listText}>{place.description}</Text>
        <TouchableOpacity onPress={() => open(mapsUrl(place.query))} style={styles.inlineLink}>
          <Ionicons name="map-outline" size={14} color={theme.colors.primary} />
          <Text style={styles.inlineLinkText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const tipRow = (tip: (typeof travelTips)[number]) => (
    <View key={tip.id} style={styles.listCard}>
      <View style={[styles.listIcon, { backgroundColor: '#DCEFE3' }]}>
        <Ionicons name={tip.icon} size={20} color="#166534" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle}>{tip.title}</Text>
        <Text style={styles.listText}>{tip.body}</Text>
      </View>
    </View>
  );

  const faqRow = (faq: (typeof faqs)[number]) => {
    const expanded = openFaq === faq.id;
    return (
      <TouchableOpacity
        key={faq.id}
        style={styles.faq}
        onPress={() => setOpenFaq(expanded ? null : faq.id)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.faqRow}>
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.text} />
        </View>
        {expanded ? <Text style={styles.faqAnswer}>{faq.answer}</Text> : null}
      </TouchableOpacity>
    );
  };

  const renderSection = (value: Section) => {
    if (value === 'emergency') {
      return (
        <>
          <Text style={styles.sectionIntro}>Tap a contact to call. In a life-threatening emergency call 119 or 1990 first.</Text>
          {emergencyContacts.map(contactRow)}
        </>
      );
    }
    if (value === 'places') {
      return (
        <>
          <Text style={styles.sectionIntro}>Well-known heritage, sacred and transit locations to point visitors to.</Text>
          {places.map(placeRow)}
        </>
      );
    }
    if (value === 'tips') {
      return (
        <>
          <Text style={styles.sectionIntro}>Share these customs and safety tips with visitors before festivals and temple visits.</Text>
          {travelTips.map(tipRow)}
        </>
      );
    }
    return (
      <>
        <Text style={styles.sectionIntro}>Events you and other officers have verified. Recommend these to visitors.</Text>
        {eventsError ? (
          <View style={styles.errorBox}>
            <Text accessibilityRole="alert" style={styles.errorText}>{eventsError}</Text>
            <TouchableOpacity onPress={() => setEvents(null)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {!events && !eventsError ? <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} /> : null}
        {events?.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={30} color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>No verified events yet</Text>
            <Text style={styles.emptyText}>Approve events in Event Listings and they will appear here as recommendations.</Text>
          </View>
        ) : null}
        {events?.map((event) => (
          <TouchableOpacity key={event.id} style={styles.listCard} onPress={() => onOpenEvent(event)} accessibilityRole="button">
            <View style={[styles.listIcon, { backgroundColor: '#DCEFE3' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#166534" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle}>{event.title}</Text>
              <Text style={styles.listMeta}>
                {event.category} • {event.city}
              </Text>
              <Text style={styles.listText}>{formatDateRange(event.startDate, event.endDate)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
          </TouchableOpacity>
        ))}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {header}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {linkError ? (
          <View style={styles.errorBox}>
            <Text accessibilityRole="alert" style={styles.errorText}>{linkError}</Text>
          </View>
        ) : null}

        {section ? (
          renderSection(section)
        ) : (
          <>
            {/* Search */}
            <View style={styles.search}>
              <Ionicons name="search" size={20} color="#334155" />
              <TextInput
                accessibilityLabel="Search guides, safety contacts and FAQs"
                placeholder="Search guides, safety contacts, FAQs..."
                placeholderTextColor="#64748B"
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                style={styles.searchInput}
              />
              {query ? (
                <TouchableOpacity accessibilityLabel="Clear search" onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#64748B" />
                </TouchableOpacity>
              ) : null}
            </View>

            {results ? (
              <>
                <Text style={styles.resultsLabel}>
                  {resultCount} {resultCount === 1 ? 'result' : 'results'} for “{query.trim()}”
                </Text>
                {results.contacts.map(contactRow)}
                {results.places.map(placeRow)}
                {results.tips.map(tipRow)}
                {results.faqs.map(faqRow)}
                {!resultCount ? (
                  <View style={styles.empty}>
                    <Ionicons name="search-outline" size={30} color={theme.colors.primary} />
                    <Text style={styles.emptyTitle}>Nothing found</Text>
                    <Text style={styles.emptyText}>Try “taxi”, “temple”, “ambulance” or a place name.</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                {/* Tabs */}
                <View style={styles.tabs}>
                  <TouchableOpacity
                    accessibilityRole="tab"
                    accessibilityState={{ selected: tab === 'guide' }}
                    onPress={() => setTab('guide')}
                    style={[styles.tab, tab === 'guide' && styles.tabSelected]}
                  >
                    <Ionicons name="compass" size={16} color={tab === 'guide' ? '#FFFFFF' : theme.colors.text} />
                    <Text style={[styles.tabText, tab === 'guide' && styles.tabTextSelected]}>Tourist Guide</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="tab"
                    accessibilityState={{ selected: tab === 'info' }}
                    onPress={() => setTab('info')}
                    style={[styles.tab, tab === 'info' && styles.tabSelected]}
                  >
                    <Ionicons name="information-circle-outline" size={17} color={tab === 'info' ? '#FFFFFF' : theme.colors.text} />
                    <Text style={[styles.tabText, tab === 'info' && styles.tabTextSelected]}>Information</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.deskBanner} onPress={() => call('1912')} accessibilityRole="button" accessibilityLabel="Call Sri Lanka Tourism hotline 1912">
                  <Ionicons name="shield-checkmark" size={18} color="#166534" />
                  <Text style={styles.deskText}>Sri Lanka Tourism Hotline 1912</Text>
                  <Text style={styles.deskPill}>TAP TO CALL</Text>
                </TouchableOpacity>

                {tab === 'guide' ? (
                  <>
                    <Text style={styles.sectionTitle}>Essential Support Categories</Text>
                    {categories.map((item) => (
                      <TouchableOpacity key={item.key} style={styles.categoryCard} activeOpacity={0.85} onPress={() => setSection(item.key)} accessibilityRole="button">
                        <View style={[styles.categoryIcon, { backgroundColor: item.background }]}>
                          <Ionicons name={item.icon} size={22} color={item.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.categoryTitle}>{item.title}</Text>
                          <Text style={styles.categorySubtitle} numberOfLines={1}>{item.subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <>
                    <Text style={styles.sectionTitle}>Visitor Quick Facts</Text>
                    <View style={styles.factsCard}>
                      {quickFacts.map((fact, index) => (
                        <View key={fact.label} style={[styles.factRow, index > 0 && styles.factDivider]}>
                          <Ionicons name={fact.icon} size={18} color={theme.colors.primary} />
                          <Text style={styles.factLabel}>{fact.label}</Text>
                          <Text style={styles.factValue}>{fact.value}</Text>
                        </View>
                      ))}
                    </View>
                    <TouchableOpacity style={styles.websiteButton} onPress={() => open(TOURISM_WEBSITE)}>
                      <Ionicons name="globe-outline" size={18} color={theme.colors.primary} />
                      <Text style={styles.websiteText}>Official tourism website • srilanka.travel</Text>
                      <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </>
                )}

                {/* Assistance */}
                <View style={styles.assistCard}>
                  <View style={styles.assistHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assistTitle}>Need Further Assistance?</Text>
                      <Text style={styles.assistText}>Contact Sri Lanka Tourism or emergency services</Text>
                    </View>
                    <View style={styles.assistIcon}>
                      <Ionicons name="headset-outline" size={18} color="#166534" />
                    </View>
                  </View>
                  <View style={styles.assistRow}>
                    <TouchableOpacity style={styles.assistTile} onPress={() => call('1912')} accessibilityLabel="Call tourism hotline 1912">
                      <View style={styles.assistTileIcon}>
                        <Ionicons name="call" size={18} color="#FFFFFF" />
                      </View>
                      <Text style={styles.assistTileTitle}>1912 Hotline</Text>
                      <Text style={styles.assistTileText}>Tourism</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.assistTile} onPress={() => open(TOURISM_WEBSITE)} accessibilityLabel="Open srilanka.travel">
                      <View style={[styles.assistTileIcon, styles.assistTileIconLight]}>
                        <Ionicons name="globe-outline" size={18} color="#166534" />
                      </View>
                      <Text style={styles.assistTileTitle}>Website</Text>
                      <Text style={styles.assistTileText}>srilanka.travel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.assistTile} onPress={() => call('119')} accessibilityLabel="Call police emergency 119">
                      <View style={[styles.assistTileIcon, { backgroundColor: '#B91C1C' }]}>
                        <Ionicons name="shield" size={17} color="#FFFFFF" />
                      </View>
                      <Text style={styles.assistTileTitle}>Police 119</Text>
                      <Text style={[styles.assistTileText, { color: '#B91C1C', fontWeight: '700' }]}>Emergency</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Pledge banner */}
                <ImageBackground source={require('../../../assets/welcome.jpg')} style={styles.banner} imageStyle={styles.bannerImage} accessibilityLabel="Sri Lanka landscape">
                  <View style={styles.bannerOverlay}>
                    <View style={styles.bannerTag}>
                      <Ionicons name="leaf-outline" size={12} color="#86EFAC" />
                      <Text style={styles.bannerTagText}>RESPONSIBLE TRAVEL PLEDGE</Text>
                    </View>
                    <Text style={styles.bannerTitle}>Explore • Respect • Enjoy</Text>
                    <Text style={styles.bannerText}>A safer, warmer, and more welcoming Sri Lanka.</Text>
                  </View>
                </ImageBackground>

                {/* FAQ */}
                <View style={styles.faqCard}>
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqTitle}>Common Inquiries</Text>
                    <Text style={styles.faqCount}>{faqs.length} answers</Text>
                  </View>
                  {faqs.map(faqRow)}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Options */}
      <Modal visible={optionsOpen} transparent animationType="fade" onRequestClose={() => setOptionsOpen(false)}>
        <Pressable style={styles.optionsBackdrop} accessibilityLabel="Close options" onPress={() => setOptionsOpen(false)}>
          <View style={styles.optionsMenu}>
            {[
              { label: 'Emergency contacts', icon: 'medkit-outline' as IconName, action: () => setSection('emergency') },
              { label: 'Call tourism hotline 1912', icon: 'call-outline' as IconName, action: () => call('1912') },
              { label: 'Open srilanka.travel', icon: 'globe-outline' as IconName, action: () => open(TOURISM_WEBSITE) },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.optionItem}
                onPress={() => {
                  setOptionsOpen(false);
                  item.action();
                }}
              >
                <Ionicons name={item.icon} size={18} color={theme.colors.text} />
                <Text style={styles.optionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  headerIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 19, fontWeight: '700', color: theme.colors.text, marginLeft: 4 },
  headerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#166534', alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: theme.spacing.md, paddingBottom: 28 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#B42318', fontSize: 13, lineHeight: 19 },
  retryText: { color: theme.colors.primary, fontWeight: '700', fontSize: 13, paddingTop: 8 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.colors.text, paddingVertical: 12 },
  resultsLabel: { fontSize: 12, color: '#475569', marginTop: 14, marginBottom: 10 },
  tabs: { flexDirection: 'row', gap: 10, marginTop: 14 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.surface,
  },
  tabSelected: { backgroundColor: '#2F6E3B' },
  tabText: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  tabTextSelected: { color: '#FFFFFF' },
  deskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#A7F3B5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
  },
  deskText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#14532D' },
  deskPill: {
    fontSize: 10,
    fontWeight: '800',
    color: '#14532D',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text, marginTop: 18, marginBottom: 10 },
  sectionIntro: { fontSize: 13, lineHeight: 19, color: '#475569', marginBottom: 12 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  categoryIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  categoryTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  categorySubtitle: { fontSize: 12, color: '#334155', marginTop: 2 },
  factsCard: { backgroundColor: theme.colors.surface, borderRadius: 12, paddingHorizontal: 14 },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingVertical: 8 },
  factDivider: { borderTopWidth: 1, borderTopColor: '#EEF2F6' },
  factLabel: { width: 84, fontSize: 12, fontWeight: '700', color: '#475569' },
  factValue: { flex: 1, fontSize: 13, color: theme.colors.text },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  websiteText: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  assistCard: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, marginTop: 8 },
  assistHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  assistTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  assistText: { fontSize: 12, color: '#334155', marginTop: 3 },
  assistIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  assistRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  assistTile: { flex: 1, alignItems: 'center', backgroundColor: '#E8EEF8', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 4 },
  assistTileIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2F6E3B', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  assistTileIconLight: { backgroundColor: '#D1D9E6' },
  assistTileTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  assistTileText: { fontSize: 11, color: '#334155', marginTop: 2, textAlign: 'center' },
  banner: { height: 180, marginTop: 16 },
  bannerImage: { borderRadius: 12 },
  bannerOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16, borderRadius: 12, backgroundColor: 'rgba(0, 20, 10, 0.45)' },
  bannerTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bannerTagText: { fontSize: 10, fontWeight: '700', color: '#86EFAC', letterSpacing: 0.8 },
  bannerTitle: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', marginTop: 6 },
  bannerText: { fontSize: 12, color: '#F1F5F9', marginTop: 4 },
  faqCard: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, marginTop: 16 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  faqTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  faqCount: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },
  faq: { backgroundColor: '#F1F5F9', borderRadius: 10, padding: 12, marginBottom: 8 },
  faqRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.text },
  faqAnswer: { fontSize: 13, lineHeight: 19, color: '#334155', marginTop: 8 },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  listIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  listTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  listMeta: { fontSize: 11, fontWeight: '600', color: theme.colors.primary, marginTop: 2 },
  listText: { fontSize: 12, lineHeight: 18, color: '#334155', marginTop: 3 },
  inlineLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, minHeight: 28 },
  inlineLinkText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  callPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#B91C1C',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  callText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  empty: { alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 12, padding: 24, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  emptyText: { fontSize: 13, lineHeight: 19, color: theme.colors.muted, textAlign: 'center' },
  optionsBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.15)' },
  optionsMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 230,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 44 },
  optionText: { fontSize: 14, color: theme.colors.text },
});
