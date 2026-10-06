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
import { EventItem } from '../../types';
import { OrganizerBottomNav } from './components/OrganizerBottomNav';

interface Props {
  navigation?: any;
  route?: any;
}

export default function OrganizerDashboardScreen({ navigation, route }: Props) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await organizerEventService.getEvents();
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data);
      } else {
        setEvents(defaultEvents);
      }
    } catch (err) {
      console.log('Error loading events, using default fallback list:', err);
      setEvents(defaultEvents);
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
        const parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
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
              <Ionicons name="flower-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.logoTextBold}>LankaFest</Text>
              <Text style={styles.logoTextSub}>Connect</Text>
            </View>
          </View>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' }}
            style={styles.avatarImage}
          />
        </View>

        {/* Banner Greeting */}
        <View style={styles.banner}>
          <Text style={styles.greetingTitle}>Welcome back,{'\n'}Event Host!</Text>
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
          <Text style={styles.sectionTitle}>Recent Events</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('ManageEvent')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          events.map((item) => (
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
                      : 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=400&auto=format&fit=crop',
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
          if (tab === 'Events') navigation?.navigate('ManageEvent');
          if (tab === 'Messages') navigation?.navigate('EventInsights');
        }}
      />
    </View>
  );
}

const defaultEvents: EventItem[] = [
  {
    id: 'evt_1',
    _id: 'evt_1',
    title: 'Kandy Esala Perahera',
    description: 'Traditional cultural procession in Kandy.',
    category: 'Cultural',
    eventType: 'Physical Event',
    audience: ['All Ages'],
    locationName: 'Kandy Esala Perahera Ground',
    locationAddress: 'Kandy, Sri Lanka',
    city: 'Kandy',
    startDate: 'Aug 10, 2025',
    startTime: '6:00 PM',
    endDate: 'Aug 20, 2025',
    endTime: '11:00 PM',
    images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=400&auto=format&fit=crop'],
    isPaid: false,
    additionalInfo: { foodAndBeverages: true, wheelchairAccessible: false, familyFriendly: true },
    status: 'Upcoming',
  },
  {
    id: 'evt_2',
    _id: 'evt_2',
    title: 'Colombo Food Festival',
    description: 'Food stalls and cultural cuisine.',
    category: 'Food & Drink',
    eventType: 'Physical Event',
    audience: ['All Ages'],
    locationName: 'Galle Face Green',
    locationAddress: 'Colombo 03',
    city: 'Colombo',
    startDate: 'Aug 25, 2025',
    startTime: '4:00 PM',
    endDate: 'Aug 25, 2025',
    endTime: '10:00 PM',
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400&auto=format&fit=crop'],
    isPaid: true,
    additionalInfo: { foodAndBeverages: true, wheelchairAccessible: true, familyFriendly: true },
    status: 'Upcoming',
  },
  {
    id: 'evt_3',
    _id: 'evt_3',
    title: 'Galle Literary Festival',
    description: 'Author readings and discussions.',
    category: 'Arts & Festival',
    eventType: 'Physical Event',
    audience: ['Adults'],
    locationName: 'Galle Fort',
    locationAddress: 'Galle Fort, Sri Lanka',
    city: 'Galle',
    startDate: 'Sep 12, 2025',
    startTime: '9:00 AM',
    endDate: 'Sep 14, 2025',
    endTime: '6:00 PM',
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop'],
    isPaid: true,
    additionalInfo: { foodAndBeverages: true, wheelchairAccessible: true, familyFriendly: false },
    status: 'Draft',
  },
];

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
