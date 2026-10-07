import React, { useState } from 'react';
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
import useStepBack from './useStepBack';
import { StepProgressBar } from './components/StepProgressBar';

interface Props {
  navigation?: any;
  route?: any;
}

export default function CreateEventReviewScreen({ navigation, route }: Props) {
  const eventData = route?.params?.eventData || {};
  const isEditing = route?.params?.isEditing || !!(eventData.id || eventData._id);
  const targetId = eventData.id || eventData._id;

  const [submitting, setSubmitting] = useState<boolean>(false);

  const [error, setError] = useState('');
  const handlePublish = async () => {
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      if (isEditing && targetId) {
        await organizerEventService.updateEvent(targetId, {
          ...eventData,
          status: 'Published',
        });
      } else {
        await organizerEventService.createEvent({
          ...eventData,
          status: 'Published',
        });
      }
      setSubmitting(false);

      Alert.alert('Success', isEditing ? 'Event updated successfully!' : 'Event published successfully!');

      // Navigate back to Dashboard with refresh token trigger
      navigation?.navigate('OrganizerDashboard', { refreshToken: Date.now() });
    } catch (err) {
      console.log('Error publishing event:', err);
      setSubmitting(false);
      setError(err instanceof Error ? err.message : 'Could not publish your event. Please retry.');
    }
  };

  useStepBack(() => navigation?.navigate('CreateEventMedia', { eventData, isEditing }));

  return (
    <View style={styles.container}>
      {/* Top Header matching teammate shared style */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.navigate('CreateEventMedia', { eventData, isEditing })} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Review & Save' : 'Create Event'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar (Step 4 Review) */}
      <StepProgressBar
        currentStep={4}
        onStepPress={(step) => {
          if (step === 1) navigation?.navigate('CreateEventBasic', { eventData, isEditing });
          if (step === 2) navigation?.navigate('CreateEventLocation', { eventData, isEditing });
          if (step === 3) navigation?.navigate('CreateEventMedia', { eventData, isEditing });
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{error}</Text> : null}
        <Text style={styles.reviewHeading}>{isEditing ? 'Review Changes' : 'Review Event Details'}</Text>
        <Text style={styles.reviewSub}>Please review all information before publishing your event.</Text>

        {/* Featured Image Banner */}
        {eventData.images && eventData.images.length > 0 && (
          <Image source={{ uri: eventData.images[0] }} style={styles.bannerImage} />
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.eventTitle}>{eventData.title}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.categoryBadge}>{eventData.category}</Text>
            <Text style={styles.typeBadge}>{eventData.eventType}</Text>
          </View>

          <Text style={styles.description}>{eventData.description}</Text>

          <View style={styles.divider} />

          {/* Details list */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {eventData.startDate} - {eventData.endDate}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {eventData.startTime} - {eventData.endTime}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {eventData.locationName}, {eventData.locationAddress}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="ticket-outline" size={16} color={theme.colors.primary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {eventData.isPaid ? `Paid Event (LKR ${eventData.ticketPrice})` : 'Free Event'}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.subSectionTitle}>Additional Info</Text>
          <View style={styles.infoTagsRow}>
            {eventData.additionalInfo?.foodAndBeverages && (
              <View style={styles.infoTagItem}>
                <Ionicons name="fast-food-outline" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.infoTagText}>Food Available</Text>
              </View>
            )}
            {eventData.additionalInfo?.wheelchairAccessible && (
              <View style={styles.infoTagItem}>
                <Ionicons name="accessibility-outline" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.infoTagText}>Wheelchair Accessible</Text>
              </View>
            )}
            {eventData.additionalInfo?.familyFriendly && (
              <View style={styles.infoTagItem}>
                <Ionicons name="people-outline" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.infoTagText}>Family Friendly</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.publishButton}
          activeOpacity={0.85}
          onPress={handlePublish}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.publishButtonText}>{isEditing ? 'Save & Update Event' : 'Publish Event'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
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
    padding: theme.spacing.md,
    paddingBottom: 24,
  },
  reviewHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  reviewSub: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: 160,
    borderRadius: theme.radius.md,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  infoTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoTagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  infoTagText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: theme.colors.surface,
  },
  publishButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
