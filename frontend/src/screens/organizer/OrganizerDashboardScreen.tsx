import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { organizerEventService } from '../../services/api';
import { parseEventDateTime } from '../../utils/eventSchedule';
import { EventItem } from '../../types';
import { OrganizerBottomNav } from './components/OrganizerBottomNav';

interface Props {
  navigation?: any;
  route?: any;
}

export default function OrganizerDashboardScreen({ navigation, route }: Props) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await organizerEventService.getEvents();
      setEvents(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load events. Please retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, route?.params?.refreshToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // Dynamic statistics calculated from current events list
  const totalEvents = events.length;

  const calculateUpcomingAndPast = () => {
    const now = new Date();
    let upcoming = 0;
    let past = 0;

    events.forEach((item) => {
      let isPast = item.status === 'Past';
      if (item.endDate || item.startDate) {
        const dateString = item.endDate || item.startDate;
        const parsedDate = parseEventDateTime(dateString, item.endDate ? item.endTime : item.startTime);
        if (parsedDate) {
          isPast = parsedDate < now;
        }
      }
      if (isPast) {
        past += 1;
      } else {
        upcoming += 1;
      }
    });

    return { upcoming, past };
  };

  const { upcoming: upcomingCount, past: pastCount } = calculateUpcomingAndPast();

  const handleEdit = (item: EventItem) => {
    navigation?.navigate('CreateEventBasic', {
      eventData: item,
      isEditing: true,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        {/* Header matching teammate shared style & prototype */}
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <View style={styles.lotusBadge}>
              <Image source={require('../../../assets/logo.png')} style={{ width: 30, height: 30 }} resizeMode="contain" accessibilityLabel="LankaFest logo" />
            </View>
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.logoTextBold}>LankaFest</Text>
              <Text style={styles.logoTextSub}>Connect</Text>
            </View>
          </View>
          <View style={[styles.avatarImage, { alignItems: 'center', justifyContent: 'center' }]}><Text>{route?.params?.user?.fullName?.slice(0, 1).toUpperCase()}</Text></View>
        </View>

        {/* Banner Greeting */}
        <View style={styles.banner}>
          <Text style={styles.greetingTitle}>Welcome back,{'\n'}{route?.params?.user?.fullName || 'Event Host'}!</Text>
          <Text style={styles.greetingSubtitle}>Create amazing events{'\n'}and bring people together.</Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.85}
          onPress={() => navigation?.navigate('CreateEventBasic')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.createButtonText}>Create New Event</Text>
        </TouchableOpacity>

        {/* Stats Row - Dynamic values calculated from database */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.statNumber, { color: '#15803D' }]}>{totalEvents}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E0F2FE' }]}>
            <Text style={[styles.statNumber, { color: '#0284C7' }]}>{upcomingCount}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.statNumber, { color: theme.colors.danger }]}>{pastCount}</Text>
            <Text style={styles.statLabel}>Past</Text>
          </View>
        </View>

        {/* Recent Events Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{route?.params?.showAll ? 'My Events' : 'Recent Events'}</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('MyEvents')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {error ? <View><Text accessibilityRole="alert">{error}</Text><TouchableOpacity onPress={onRefresh}><Text style={styles.seeAllText}>Retry</Text></TouchableOpacity></View> : null}
        {!loading && !error && !events.length ? <Text>Create your first event to see it here.</Text> : null}
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          (route?.params?.showAll ? events : events.slice(0, 5)).map((item) => (
            <TouchableOpacity
              key={item.id || item._id}
              style={styles.eventCard}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('ManageEvent', { eventId: item.id || item._id })}
            >
              <Image
                source={{
                  uri:
                    item.images && item.images.length > 0
                      ? item.images[0]
                      : undefined,
                }}
                style={styles.eventImage}
              />
              <View style={styles.eventDetails}>
                <View style={styles.eventTitleRow}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={styles.inlineEditButton}
                  >
                    <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.eventSubText}>
                  {item.startDate} {item.endDate ? `- ${item.endDate}` : ''}
                </Text>
                <Text style={styles.eventSubText}>{item.city || item.locationName}</Text>

                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'Draft' ? styles.draftBadge : styles.upcomingBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.status === 'Draft' ? styles.draftBadgeText : styles.upcomingBadgeText,
                    ]}
                  >
                    {item.status || 'Upcoming'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Shared Bottom Navigation */}
      <OrganizerBottomNav
        activeTab="Home"
        onTabPress={(tab) => {
          if (tab === 'Profile') navigation?.navigate('Profile');
          if (tab === 'Events') navigation?.navigate('EventInsights');
          if (tab === 'Messages') navigation?.navigate('Messages');
        }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lotusBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextBold: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
    lineHeight: 18,
  },
  logoTextSub: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 16,
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  banner: {
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
    lineHeight: 30,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 18,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  eventImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  eventDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
    flex: 1,
  },
  inlineEditButton: {
    padding: 4,
  },
  eventSubText: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  upcomingBadge: {
    backgroundColor: '#DCFCE7',
  },
  upcomingBadgeText: {
    color: '#15803D',
  },
  draftBadge: {
    backgroundColor: '#F3F4F6',
  },
  draftBadgeText: {
    color: theme.colors.muted,
  },
});
