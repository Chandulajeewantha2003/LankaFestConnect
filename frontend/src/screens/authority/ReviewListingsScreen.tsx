import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { User } from '../../services/api';
import { AuthorityEvent, authorityService, ListingStatus } from '../../services/authority';
import { parseEventDate } from '../../utils/eventSchedule';
import AuthorityHeader, { AuthorityScreen } from './components/AuthorityHeader';

type IconName = keyof typeof Ionicons.glyphMap;
type SortOrder = 'newest' | 'soonest';

interface Props {
  user: User;
  onNavigate: (screen: AuthorityScreen) => void;
  onAudit: (event: AuthorityEvent) => void;
  logout: () => void;
}

const tabs: { key: ListingStatus; label: string; icon: IconName; color: string }[] = [
  { key: 'PENDING', label: 'Pending', icon: 'calendar-outline', color: '#B45309' },
  { key: 'VERIFIED', label: 'Verified', icon: 'checkmark-circle-outline', color: '#15803D' },
  { key: 'REJECTED', label: 'Rejected', icon: 'close-circle-outline', color: '#B91C1C' },
];

const summary: Record<ListingStatus, { title: (n: number) => string; subtitle: string }> = {
  PENDING: {
    title: (n) => `${n} ${n === 1 ? 'Submission' : 'Submissions'} Awaiting Audit`,
    subtitle: 'SLTDA safety checks & cultural compliance queue',
  },
  VERIFIED: {
    title: (n) => `${n} Verified ${n === 1 ? 'Listing' : 'Listings'}`,
    subtitle: 'Approved events cleared for visitors',
  },
  REJECTED: {
    title: (n) => `${n} Rejected ${n === 1 ? 'Submission' : 'Submissions'}`,
    subtitle: 'Returned to organizers for corrections',
  },
};

const statusBadge: Record<string, { label: string; icon: IconName; color: string; background: string }> = {
  PENDING: { label: 'PENDING REVIEW', icon: 'hourglass', color: '#78350F', background: '#FEF3C7' },
  VERIFIED: { label: 'VERIFIED', icon: 'shield-checkmark', color: '#14532D', background: '#DCFCE7' },
  REJECTED: { label: 'REJECTED', icon: 'close-circle', color: '#7F1D1D', background: '#FEE2E2' },
  FLAGGED: { label: 'FLAGGED', icon: 'flag', color: '#7F1D1D', background: '#FEE2E2' },
};

const avatarColors = [
  { color: '#FFFFFF', background: '#166534' },
  { color: '#166534', background: '#BBF7D0' },
  { color: '#1E3A8A', background: '#E0E7FF' },
  { color: '#B91C1C', background: '#FEE2E2' },
  { color: '#92400E', background: '#FEF3C7' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Aug 10 – Aug 20, 2025"; a single day shows once; different years keep both years.
export function formatDateRange(startDate: string, endDate: string) {
  const start = parseEventDate(startDate);
  const end = parseEventDate(endDate);
  if (!start) return startDate;
  const day = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  if (!end || end.getTime() === start.getTime()) return `${day(start)}, ${start.getFullYear()}`;
  if (end.getFullYear() !== start.getFullYear()) return `${day(start)}, ${start.getFullYear()} – ${day(end)}, ${end.getFullYear()}`;
  return `${day(start)} – ${day(end)}, ${end.getFullYear()}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

function avatarColor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % avatarColors.length;
  return avatarColors[hash];
}

export default function ReviewListingsScreen({ user, onNavigate, onAudit, logout }: Props) {
  const [status, setStatus] = useState<ListingStatus>('PENDING');
  const [events, setEvents] = useState<AuthorityEvent[]>([]);
  const [counts, setCounts] = useState<Record<ListingStatus, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [filterOpen, setFilterOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState('All');
  const [draftSort, setDraftSort] = useState<SortOrder>('newest');
  const latestRequest = useRef(0);

  const fetchEvents = useCallback(async (target: ListingStatus) => {
    const request = ++latestRequest.current;
    try {
      const data = await authorityService.getEvents(target);
      if (request !== latestRequest.current) return;
      setEvents(data.events);
      setCounts(data.counts);
      setError('');
    } catch (err) {
      if (request === latestRequest.current) setError(err instanceof Error ? err.message : 'Could not load event listings. Please retry.');
    } finally {
      if (request === latestRequest.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setEvents([]);
    fetchEvents(status);
  }, [status, fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(status);
  };

  const categories = useMemo(() => ['All', ...Array.from(new Set(events.map((e) => e.category).filter(Boolean))).sort()], [events]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = events.filter(
      (e) =>
        (category === 'All' || e.category === category) &&
        (!term || [e.title, e.city, e.locationName, e.locationAddress, e.category, e.organizer?.fullName ?? ''].join(' ').toLowerCase().includes(term)),
    );
    if (sortOrder === 'soonest') {
      const time = (e: AuthorityEvent) => parseEventDate(e.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return [...rows].sort((a, b) => time(a) - time(b));
    }
    return rows;
  }, [events, query, category, sortOrder]);

  const filtersActive = category !== 'All' || sortOrder !== 'newest';
  const total = counts?.[status] ?? 0;

  const openFilters = () => {
    setDraftCategory(category);
    setDraftSort(sortOrder);
    setFilterOpen(true);
  };

  const changeStatus = (next: ListingStatus) => {
    if (next === status) return;
    setCategory('All');
    setStatus(next);
  };

  const renderCard = (event: AuthorityEvent) => {
    const badge = statusBadge[event.verification.status] ?? statusBadge.PENDING;
    const organizerName = event.organizer?.fullName ?? 'Organizer unavailable';
    const colors = avatarColor(organizerName);
    const cover = (
      <View style={styles.coverOverlay}>
        <View style={[styles.statusBadge, { backgroundColor: badge.background }]}>
          <Ionicons name={badge.icon} size={11} color={badge.color} />
          <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
        <View>
          <Text style={styles.category} numberOfLines={1}>{event.category.toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        </View>
      </View>
    );

    return (
      <View key={event.id} style={styles.card}>
        {event.coverImage ? (
          <ImageBackground source={{ uri: event.coverImage }} style={styles.cover} accessibilityLabel={`${event.title} cover image`}>
            {cover}
          </ImageBackground>
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Image source={require('../../../assets/logo.png')} style={styles.coverLogo} resizeMode="contain" />
            {cover}
          </View>
        )}
        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <View style={[styles.metaItem, { flex: 1 }]}>
              <Ionicons name="location-outline" size={15} color={theme.colors.text} />
              <Text style={styles.metaText} numberOfLines={1}>{event.locationName ? `${event.locationName}, ${event.city}` : event.city}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={15} color={theme.colors.text} />
              <Text style={[styles.metaText, styles.metaDate]}>{formatDateRange(event.startDate, event.endDate)}</Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
          {event.verification.status === 'REJECTED' && event.verification.note ? (
            <Text style={styles.note} numberOfLines={2}>Reason: {event.verification.note}</Text>
          ) : null}
          <View style={styles.cardFooter}>
            <View style={styles.organizer}>
              <View style={[styles.organizerAvatar, { backgroundColor: colors.background }]}>
                <Text style={[styles.organizerInitials, { color: colors.color }]}>{initials(organizerName)}</Text>
              </View>
              <Text style={styles.organizerName} numberOfLines={1}>{organizerName}</Text>
            </View>
            <TouchableOpacity
              style={styles.auditButton}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Audit ${event.title}`}
              onPress={() => onAudit(event)}
            >
              <Text style={styles.auditButtonText}>{status === 'PENDING' ? 'Audit Submission' : 'View Audit'}</Text>
              <Ionicons name="chevron-forward" size={14} color="#14532D" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AuthorityHeader title="Events" user={user} onNavigate={onNavigate} logout={logout} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <TouchableOpacity accessibilityLabel="Back to dashboard" onPress={() => onNavigate('Home')} style={styles.roundButton}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.titleText}>
            <Text style={styles.pageTitle}>Event Listings</Text>
            <Text style={styles.pageSubtitle}>AUTHORITY INSPECTION MODE</Text>
          </View>
          <TouchableOpacity accessibilityLabel="More options" onPress={() => setOptionsOpen(true)} style={styles.roundButton}>
            <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={18} color="#64748B" />
            <TextInput
              accessibilityLabel="Search events by name, district, or tag"
              placeholder="Search events by name, district, or tag..."
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
          <TouchableOpacity accessibilityLabel="Filter and sort" onPress={openFilters} style={[styles.filterButton, filtersActive && styles.filterButtonActive]}>
            <Ionicons name="options-outline" size={20} color={filtersActive ? '#FFFFFF' : theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Status chips */}
        <View style={styles.chips}>
          {tabs.map((tab) => {
            const selected = tab.key === status;
            return (
              <TouchableOpacity
                key={tab.key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => changeStatus(tab.key)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Ionicons name={tab.icon} size={14} color={selected ? '#FFFFFF' : tab.color} />
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {tab.label}
                  {selected && counts ? ` (${counts[tab.key]})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Queue summary */}
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons name="shield-outline" size={18} color="#166534" />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>{counts ? summary[status].title(total) : 'Loading queue…'}</Text>
            <Text style={styles.summarySubtitle}>{summary[status].subtitle}</Text>
          </View>
          <View style={styles.liveDot} />
        </View>

        {filtersActive ? (
          <View style={styles.activeFilters}>
            <Text style={styles.activeFiltersText}>
              {category !== 'All' ? category : 'All categories'} • {sortOrder === 'newest' ? 'Newest submitted' : 'Event date (soonest)'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setCategory('All');
                setSortOrder('newest');
              }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchEvents(status)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator style={styles.loading} color={theme.colors.primary} />
        ) : visible.length ? (
          visible.map(renderCard)
        ) : !error ? (
          <View style={styles.empty}>
            <Ionicons name={events.length ? 'search-outline' : 'file-tray-outline'} size={34} color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>
              {events.length ? 'No matching events' : status === 'PENDING' ? 'No submissions awaiting audit' : status === 'VERIFIED' ? 'No verified listings yet' : 'No rejected submissions'}
            </Text>
            <Text style={styles.emptyText}>
              {events.length ? 'Try another name, district or tag, or clear the filters.' : 'Published festival listings from organizers will appear here.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Filter & sort sheet */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.sheetBackdrop} accessibilityLabel="Close filters" onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter Listings</Text>
              <TouchableOpacity
                onPress={() => {
                  setDraftCategory('All');
                  setDraftSort('newest');
                }}
              >
                <Text style={styles.clearText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetLabel}>CATEGORY</Text>
            <View style={styles.sheetChips}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  accessibilityState={{ selected: draftCategory === item }}
                  onPress={() => setDraftCategory(item)}
                  style={[styles.sheetChip, draftCategory === item && styles.sheetChipSelected]}
                >
                  <Text style={[styles.sheetChipText, draftCategory === item && styles.chipTextSelected]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sheetLabel}>SORT BY</Text>
            {([
              ['newest', 'Newest submitted'],
              ['soonest', 'Event date (soonest)'],
            ] as [SortOrder, string][]).map(([key, label]) => (
              <TouchableOpacity key={key} accessibilityRole="radio" accessibilityState={{ selected: draftSort === key }} onPress={() => setDraftSort(key)} style={styles.radioRow}>
                <Ionicons name={draftSort === key ? 'radio-button-on' : 'radio-button-off'} size={20} color={theme.colors.primary} />
                <Text style={styles.radioText}>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                setCategory(draftCategory);
                setSortOrder(draftSort);
                setFilterOpen(false);
              }}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* More options */}
      <Modal visible={optionsOpen} transparent animationType="fade" onRequestClose={() => setOptionsOpen(false)}>
        <Pressable style={styles.optionsBackdrop} accessibilityLabel="Close options" onPress={() => setOptionsOpen(false)}>
          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setOptionsOpen(false);
                setRefreshing(true);
                fetchEvents(status);
              }}
            >
              <Ionicons name="refresh-outline" size={18} color={theme.colors.text} />
              <Text style={styles.optionText}>Refresh listings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setOptionsOpen(false);
                openFilters();
              }}
            >
              <Ionicons name="options-outline" size={18} color={theme.colors.text} />
              <Text style={styles.optionText}>Filter & sort</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setOptionsOpen(false);
                onNavigate('Home');
              }}
            >
              <Ionicons name="grid-outline" size={18} color={theme.colors.text} />
              <Text style={styles.optionText}>Back to dashboard</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 12,
    paddingBottom: theme.spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8EEF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flex: 1,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  pageSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    paddingVertical: 12,
  },
  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipSelected: {
    backgroundColor: '#166534',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EEF5',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#D1E7DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    marginLeft: 10,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  summarySubtitle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#166534',
    marginLeft: 8,
  },
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activeFiltersText: {
    fontSize: 12,
    color: '#475569',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
  },
  retryText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
    paddingTop: 8,
  },
  loading: {
    marginTop: 40,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cover: {
    height: 150,
    backgroundColor: '#1F3A2C',
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverLogo: {
    width: 64,
    height: 64,
    opacity: 0.35,
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BBF7D0',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 3,
  },
  cardBody: {
    padding: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.text,
    flexShrink: 1,
  },
  metaDate: {
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
    marginTop: 8,
  },
  note: {
    fontSize: 12,
    lineHeight: 17,
    color: '#B91C1C',
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  organizer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  organizerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerInitials: {
    fontSize: 10,
    fontWeight: '800',
  },
  organizerName: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
    flexShrink: 1,
  },
  auditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E0E7EF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  auditButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14532D',
  },
  empty: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  sheetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#667085',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
  },
  sheetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetChip: {
    borderWidth: 1,
    borderColor: '#DCE3EC',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sheetChipSelected: {
    backgroundColor: '#166534',
    borderColor: '#166534',
  },
  sheetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
  },
  radioText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  optionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  optionsMenu: {
    position: 'absolute',
    top: 120,
    right: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  optionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
});
