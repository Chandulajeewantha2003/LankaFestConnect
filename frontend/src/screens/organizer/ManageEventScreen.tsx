import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

interface Props {
  navigation?: any;
  route?: any;
}

export default function ManageEventScreen({ navigation, route }: Props) {
  const eventId = route?.params?.eventId;

  const [error, setError] = useState('');
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchEventDetails = async () => {
    try {
      const data = await organizerEventService.getEventById(eventId);
      if (data) {
        setEvent(data);
      } else {
        setEvent(null); setError('Could not load this event. Please retry.');
      }
    } catch (err) {
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const handleDuplicate = async () => {
    try {
      await organizerEventService.duplicateEvent(eventId);
      Alert.alert('Success', 'Event duplicated successfully!');
      navigation?.navigate('OrganizerDashboard', { refreshToken: Date.now() });
    } catch (err) {
      Alert.alert('Could not duplicate', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleCancelEvent = () => {
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel/delete this event? This action cannot be undone.',
      [
        { text: 'No, Keep Event', style: 'cancel' },
        {
          text: 'Yes, Cancel Event',
          style: 'destructive',
          onPress: async () => {
            try {
              await organizerEventService.deleteEvent(eventId);
            } catch (err) {
              Alert.alert('Could not delete', err instanceof Error ? err.message : 'Please try again.'); return;
            }
            Alert.alert('Event Cancelled', 'The event has been successfully cancelled.');
            navigation?.navigate('OrganizerDashboard', { refreshToken: Date.now() });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!event) return <View style={styles.centerContainer}><Text accessibilityRole="alert">{error}</Text><TouchableOpacity onPress={fetchEventDetails}><Text>Retry</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation?.goBack()}><Text>Back to events</Text></TouchableOpacity></View>;
  const displayEvent = event;

  return (
    <View style={styles.container}>
      {/* Header Bar matching teammate shared style */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('EventInsights', { eventId })}>
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Image with Overlay Pills */}
        <View style={styles.bannerContainer}>
          <Image
            source={{
              uri:
                displayEvent.images && displayEvent.images.length > 0
                  ? displayEvent.images[0]
                  : undefined,
            }}
            style={styles.bannerImage}
          />
          {/* Published Badge */}
          <View style={styles.publishedBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.publishedText}>{displayEvent.status || 'Published'}</Text>
          </View>

          {/* Edit Header Button */}
          <TouchableOpacity
            style={styles.editHeaderButton}
            onPress={() => navigation?.navigate('CreateEventBasic', { eventData: displayEvent, isEditing: true })}
          >
            <Ionicons name="create-outline" size={15} color={theme.colors.text} style={{ marginRight: 4 }} />
            <Text style={styles.editHeaderText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Main Event Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.eventTitle}>{displayEvent.title}</Text>

          <View style={styles.categoryBadgeContainer}>
            <Text style={styles.categoryBadgeText}>{displayEvent.category || 'Cultural'}</Text>
          </View>

          {/* Key Details Rows */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {displayEvent.startDate} - {displayEvent.endDate}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color={theme.colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {displayEvent.startTime} - {displayEvent.endTime}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={theme.colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {displayEvent.locationName}, {displayEvent.city}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={18} color={theme.colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              <Text style={styles.boldText}>{displayEvent.interestedCount ?? 0}</Text> interested{'   '}
              <Text style={styles.boldText}>{displayEvent.goingCount ?? 0}</Text> going
            </Text>
          </View>

          {/* View on App Button */}
          <TouchableOpacity
            style={styles.viewAppButton}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('EventInsights', { eventId })}
          >
            <Text style={styles.viewAppText}>View on App</Text>
            <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* Action List Items matching prototype */}
          <View style={styles.actionList}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation?.navigate('CreateEventBasic', { eventData: displayEvent, isEditing: true })}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} style={styles.actionItemIcon} />
              <Text style={styles.actionItemText}>Edit Event Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation?.navigate('CreateEventMedia', { eventData: displayEvent, isEditing: true })}
            >
              <Ionicons name="ticket-outline" size={20} color={theme.colors.primary} style={styles.actionItemIcon} />
              <Text style={styles.actionItemText}>Manage Tickets / Pricing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation?.navigate('EventInsights', { eventId })}
            >
              <Ionicons name="people-outline" size={20} color={theme.colors.primary} style={styles.actionItemIcon} />
              <Text style={styles.actionItemText}>View Attendee List</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleDuplicate}>
              <Ionicons name="copy-outline" size={20} color={theme.colors.primary} style={styles.actionItemIcon} />
              <Text style={styles.actionItemText}>Duplicate Event</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionItem, styles.cancelActionItem]} onPress={handleCancelEvent}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.danger} style={styles.actionItemIcon} />
              <Text style={styles.cancelActionText}>Cancel Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  bannerContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  publishedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
    marginRight: 6,
  },
  publishedText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  editHeaderButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  editHeaderText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  infoContainer: {
    padding: theme.spacing.md,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  categoryBadgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryBadgeText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 10,
    width: 22,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  boldText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  viewAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
  },
  viewAppText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  actionList: {
    backgroundColor: 'transparent',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 10,
    backgroundColor: theme.colors.surface,
  },
  actionItemIcon: {
    marginRight: 12,
  },
  actionItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cancelActionItem: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    marginTop: 6,
  },
  cancelActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.danger,
  },
});
