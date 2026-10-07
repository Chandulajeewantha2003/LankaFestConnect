import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
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
import { AuthorityEventDetail, authorityService, Checklist, ChecklistKey, DecisionStatus } from '../../services/authority';
import { formatDateRange } from './ReviewListingsScreen';

type IconName = keyof typeof Ionicons.glyphMap;
type Action = DecisionStatus | 'RESET';

interface Props {
  eventId: string;
  onBack: () => void;
  onProfile: () => void;
  onDecided: () => void;
}

const MIN_REASON = 5;
const MAX_NOTE = 1000;

const checklistItems: { key: ChecklistKey; title: string; detail: string; pending: string }[] = [
  {
    key: 'organizer',
    title: 'Organizer details verified',
    detail: 'Validated against SLTDA certified institution database',
    pending: 'Organizer identity and registration not yet confirmed',
  },
  {
    key: 'documents',
    title: 'Official documents clearance',
    detail: 'District Secretariat permit & Police security clearance approved',
    pending: 'Permits or police clearance still awaiting confirmation',
  },
  {
    key: 'media',
    title: 'Authentic photos & event route map',
    detail: 'Photos, venue and route confirmed as genuine',
    pending: 'Photos, venue or route map still to be confirmed',
  },
  {
    key: 'safety',
    title: 'Safety plan & crowd management',
    detail: 'Medical, fire brigade and crowd-control arrangements approved',
    pending: 'Medical triage, fire brigade or crowd-control sign-off pending',
  },
  {
    key: 'cultural',
    title: 'Compliance with cultural guidelines',
    detail: 'Cultural, religious & animal welfare guidelines respected',
    pending: 'Cultural, religious or animal welfare compliance not yet certified',
  },
];

const emptyChecklist: Checklist = { organizer: false, documents: false, media: false, safety: false, cultural: false };

const statusBadge: Record<string, { label: string; icon: IconName; color: string }> = {
  PENDING: { label: 'PENDING REVIEW', icon: 'alarm-outline', color: '#B91C1C' },
  VERIFIED: { label: 'VERIFIED', icon: 'shield-checkmark', color: '#15803D' },
  REJECTED: { label: 'REJECTED', icon: 'close-circle', color: '#B91C1C' },
  FLAGGED: { label: 'FLAGGED', icon: 'flag', color: '#B45309' },
};

const actionCopy: Record<Action, { title: string; body: string; confirm: string; success: string; color: string }> = {
  VERIFIED: {
    title: 'Approve clearance?',
    body: 'This event will be marked as verified and cleared for visitors.',
    confirm: 'Approve',
    success: 'Clearance approved',
    color: '#166534',
  },
  REJECTED: {
    title: 'Reject this event?',
    body: 'The event will be marked as rejected. Your inspection notes are saved as the reason.',
    confirm: 'Reject',
    success: 'Event rejected',
    color: '#B91C1C',
  },
  FLAGGED: {
    title: 'Flag for investigation?',
    body: 'The event will be moved to flagged items for follow-up. Your inspection notes are saved as the reason.',
    confirm: 'Flag Event',
    success: 'Event flagged',
    color: '#B45309',
  },
  RESET: {
    title: 'Move back to pending?',
    body: 'The current decision will be removed and the event returns to the review queue.',
    confirm: 'Move to Pending',
    success: 'Moved back to pending',
    color: '#1E3A8A',
  },
};

function decidedLabel(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : ` on ${date.toLocaleDateString()}`;
}

export default function VerificationDetailsScreen({ eventId, onBack, onProfile, onDecided }: Props) {
  const [event, setEvent] = useState<AuthorityEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checklist, setChecklist] = useState<Checklist>(emptyChecklist);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState<Action | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const notesY = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authorityService.getEvent(eventId);
      setEvent(data);
      setChecklist(data.verification.checklist ?? emptyChecklist);
      setNote(data.verification.note ?? '');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this event. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const completed = checklistItems.filter((item) => checklist[item.key]).length;
  const allComplete = completed === checklistItems.length;
  const status = event?.verification.status ?? 'PENDING';
  const badge = statusBadge[status] ?? statusBadge.PENDING;
  const reference = `SLTDA-VERIFY-${eventId.slice(-6).toUpperCase()}`;

  const toggle = (key: ChecklistKey) => setChecklist((current) => ({ ...current, [key]: !current[key] }));

  const requestAction = (action: Action) => {
    setOptionsOpen(false);
    setSubmitError('');
    if ((action === 'REJECTED' || action === 'FLAGGED') && note.trim().length < MIN_REASON) {
      setNoteError(`Add a reason in the inspection notes (at least ${MIN_REASON} characters) before you ${action === 'REJECTED' ? 'reject' : 'flag'} this event.`);
      scrollRef.current?.scrollTo({ y: Math.max(notesY.current - 80, 0), animated: true });
      return;
    }
    if (action === 'VERIFIED' && !allComplete) return;
    setNoteError('');
    setPendingAction(action);
  };

  const submit = async () => {
    if (!pendingAction || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      if (pendingAction === 'RESET') await authorityService.resetDecision(eventId);
      else await authorityService.decide(eventId, { status: pendingAction, note: note.trim(), checklist });
      setDone(pendingAction);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save your decision. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeDialog = () => {
    if (submitting) return;
    if (done) {
      setPendingAction(null);
      setDone(null);
      onDecided();
      return;
    }
    setPendingAction(null);
  };

  const header = (
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel="Back to event listings" onPress={onBack} style={styles.headerIcon}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Verify</Text>
      <TouchableOpacity accessibilityLabel="More options" onPress={() => setOptionsOpen(true)} style={styles.headerIcon} disabled={!event}>
        <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
      </TouchableOpacity>
      <TouchableOpacity accessibilityLabel="Open profile" onPress={onProfile} style={styles.headerAvatar}>
        <Ionicons name="person" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  if (loading && !event) {
    return (
      <View style={styles.container}>
        {header}
        <ActivityIndicator style={styles.loading} color={theme.colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={36} color={theme.colors.danger} />
          <Text accessibilityRole="alert" style={styles.errorStateText}>{error || 'This event is unavailable.'}</Text>
          <TouchableOpacity onPress={load} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.linkText}>Back to Event Listings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const tags = [
    { label: event.category, style: styles.tagGreen },
    event.eventType ? { label: event.eventType, style: styles.tagGrey } : null,
    { label: event.isPaid ? `LKR ${event.ticketPrice.toLocaleString()}` : 'Free Entry', style: styles.tagLight },
  ].filter(Boolean) as { label: string; style: object }[];

  const facilities = [
    event.additionalInfo?.foodAndBeverages ? 'Food & beverages' : null,
    event.additionalInfo?.wheelchairAccessible ? 'Wheelchair accessible' : null,
    event.additionalInfo?.familyFriendly ? 'Family friendly' : null,
  ].filter(Boolean) as string[];

  const heroContent = (
    <>
      <View style={styles.heroBadge}>
        <Ionicons name={badge.icon} size={13} color={badge.color} />
        <Text style={[styles.heroBadgeText, { color: badge.color }]}>{badge.label}</Text>
      </View>
      {event.images.length ? (
        <TouchableOpacity accessibilityLabel="View submitted photos" onPress={() => setGalleryOpen(true)} style={styles.photoCount}>
          <Ionicons name="camera-outline" size={13} color="#FFFFFF" />
          <Text style={styles.photoCountText}>
            {event.images.length} Submitted {event.images.length === 1 ? 'Photo' : 'Photos'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </>
  );

  return (
    <View style={styles.container}>
      {header}
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        {event.images[0] ? (
          <ImageBackground source={{ uri: event.images[0] }} style={styles.hero} accessibilityLabel={`${event.title} photo`}>
            {heroContent}
          </ImageBackground>
        ) : (
          <View style={[styles.hero, styles.heroFallback]}>
            <Image source={require('../../../assets/logo.png')} style={styles.heroLogo} resizeMode="contain" />
            <Text style={styles.heroFallbackText}>No photos submitted</Text>
            {heroContent}
          </View>
        )}

        <View style={styles.body}>
          {/* Tags & title */}
          <View style={styles.tags}>
            {tags.map((tag) => (
              <Text key={tag.label} style={[styles.tag, tag.style]}>{tag.label}</Text>
            ))}
          </View>
          <Text style={styles.title}>{event.title}</Text>

          {status !== 'PENDING' ? (
            <View style={[styles.decisionBanner, status === 'VERIFIED' ? styles.decisionVerified : styles.decisionOther]}>
              <Ionicons name={badge.icon} size={18} color={badge.color} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.decisionTitle, { color: badge.color }]}>
                  {status === 'VERIFIED' ? 'Clearance approved' : status === 'REJECTED' ? 'Submission rejected' : 'Flagged for investigation'}
                  {decidedLabel(event.verification.decidedAt)}
                </Text>
                <Text style={styles.decisionText}>You can update the checklist and change this decision below.</Text>
              </View>
            </View>
          ) : null}

          {/* Info card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="location-outline" size={17} color="#1E3A8A" />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{[event.locationName, event.city].filter(Boolean).join(', ')}, Sri Lanka</Text>
                {event.locationAddress ? <Text style={styles.infoSub}>{event.locationAddress}</Text> : null}
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={17} color="#1E3A8A" />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Event Dates</Text>
                <Text style={styles.infoValue}>{formatDateRange(event.startDate, event.endDate)}</Text>
                <Text style={styles.infoSub}>{event.startTime} – {event.endTime}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { marginBottom: 0 }]}>
              <View style={styles.infoIcon}>
                <Ionicons name="business-outline" size={17} color="#1E3A8A" />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Organizing Body</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{event.organizer?.fullName ?? 'Organizer unavailable'}</Text>
              </View>
            </View>
          </View>

          {/* Submission */}
          <Text style={styles.sectionLabel}>SUBMISSION DETAILS</Text>
          <Text style={styles.description}>{event.description}</Text>
          {facilities.length || event.audience.length ? (
            <Text style={styles.facilities}>{[...event.audience, ...facilities].join(' • ')}</Text>
          ) : null}
        </View>

        {/* Evidence checklist */}
        <View style={styles.checklistSection}>
          <View style={styles.checklistHeader}>
            <View style={styles.checklistTitleRow}>
              <Text style={styles.checklistTitle}>EVIDENCE CHECKLIST</Text>
              <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.progressPill}>
              {completed}/{checklistItems.length} Completed
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(completed / checklistItems.length) * 100}%` }]} />
          </View>
          <Text style={styles.checklistHint}>Tap an item to mark it verified or still required.</Text>

          {checklistItems.map((item) => {
            const done = checklist[item.key];
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                accessibilityLabel={item.title}
                onPress={() => toggle(item.key)}
                style={[styles.checkItem, !done && styles.checkItemPending]}
              >
                <View style={[styles.checkIcon, done ? styles.checkIconDone : styles.checkIconPending]}>
                  <Ionicons name={done ? 'checkmark' : 'alert'} size={16} color={done ? '#FFFFFF' : '#475569'} />
                </View>
                <View style={styles.checkBody}>
                  <View style={styles.checkTitleRow}>
                    <Text style={styles.checkTitle}>{item.title}</Text>
                    {!done ? <Text style={styles.actionRequired}>Action Required</Text> : null}
                  </View>
                  <Text style={[styles.checkDetail, !done && styles.checkDetailPending]}>{done ? item.detail : item.pending}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Notes */}
          <View
            onLayout={(e) => {
              notesY.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.notesHeader}>
              <Text style={styles.notesTitle}>Officer Inspection Notes</Text>
              <Text style={styles.notesOptional}>Required to reject or flag</Text>
            </View>
            <View style={[styles.notesBox, noteError ? styles.notesBoxError : null]}>
              <TextInput
                accessibilityLabel="Officer inspection notes"
                multiline
                maxLength={MAX_NOTE}
                value={note}
                onChangeText={(text) => {
                  setNote(text);
                  if (noteError && text.trim().length >= MIN_REASON) setNoteError('');
                }}
                placeholder="Add official notes or regulatory conditions for this event clearance..."
                placeholderTextColor="#94A3B8"
                style={styles.notesInput}
                textAlignVertical="top"
              />
              <View style={styles.notesFooter}>
                <Text style={styles.notesCount}>{note.length}/{MAX_NOTE}</Text>
                <Text style={styles.notesRef}>{reference}</Text>
              </View>
            </View>
            {noteError ? <Text accessibilityRole="alert" style={styles.noteError}>{noteError}</Text> : null}
          </View>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        {!allComplete ? (
          <Text style={styles.bottomHint}>
            Complete all {checklistItems.length} checks to approve clearance ({checklistItems.length - completed} remaining)
          </Text>
        ) : null}
        <View style={styles.bottomButtons}>
          <TouchableOpacity accessibilityRole="button" style={styles.rejectButton} onPress={() => requestAction('REJECTED')}>
            <Ionicons name="close" size={18} color="#B91C1C" />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: !allComplete }}
            disabled={!allComplete}
            style={[styles.approveButton, !allComplete && styles.approveDisabled]}
            onPress={() => requestAction('VERIFIED')}
          >
            <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" />
            <Text style={styles.approveText}>{status === 'VERIFIED' ? 'Update Clearance' : 'Approve Clearance'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Options menu */}
      <Modal visible={optionsOpen} transparent animationType="fade" onRequestClose={() => setOptionsOpen(false)}>
        <Pressable style={styles.optionsBackdrop} accessibilityLabel="Close options" onPress={() => setOptionsOpen(false)}>
          <View style={styles.optionsMenu}>
            <TouchableOpacity style={styles.optionItem} onPress={() => requestAction('FLAGGED')}>
              <Ionicons name="flag-outline" size={18} color="#B45309" />
              <Text style={styles.optionText}>Flag for investigation</Text>
            </TouchableOpacity>
            {status !== 'PENDING' ? (
              <TouchableOpacity style={styles.optionItem} onPress={() => requestAction('RESET')}>
                <Ionicons name="return-up-back-outline" size={18} color={theme.colors.text} />
                <Text style={styles.optionText}>Move back to pending</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setOptionsOpen(false);
                load();
              }}
            >
              <Ionicons name="refresh-outline" size={18} color={theme.colors.text} />
              <Text style={styles.optionText}>Reload submission</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Confirm / result dialog */}
      <Modal visible={!!pendingAction} transparent animationType="fade" onRequestClose={closeDialog}>
        <View style={styles.dialogBackdrop}>
          {pendingAction ? (
            <View style={styles.dialog}>
              {done ? (
                <>
                  <View style={[styles.dialogIcon, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="checkmark" size={28} color="#166534" />
                  </View>
                  <Text style={styles.dialogTitle}>{actionCopy[done].success}</Text>
                  <Text style={styles.dialogBody}>{event.title} has been updated.</Text>
                  <TouchableOpacity style={[styles.dialogPrimary, { backgroundColor: '#166534' }]} onPress={closeDialog}>
                    <Text style={styles.dialogPrimaryText}>Back to Event Listings</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.dialogTitle}>{actionCopy[pendingAction].title}</Text>
                  <Text style={styles.dialogBody}>{actionCopy[pendingAction].body}</Text>
                  {pendingAction !== 'RESET' && note.trim() ? (
                    <Text style={styles.dialogNote} numberOfLines={4}>“{note.trim()}”</Text>
                  ) : null}
                  {submitError ? <Text accessibilityRole="alert" style={styles.dialogError}>{submitError}</Text> : null}
                  <TouchableOpacity
                    style={[styles.dialogPrimary, { backgroundColor: actionCopy[pendingAction].color }, submitting && { opacity: 0.7 }]}
                    disabled={submitting}
                    onPress={submit}
                  >
                    {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.dialogPrimaryText}>{actionCopy[pendingAction].confirm}</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dialogSecondary} disabled={submitting} onPress={closeDialog}>
                    <Text style={styles.dialogSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : null}
        </View>
      </Modal>

      {/* Photo gallery */}
      <Modal visible={galleryOpen} transparent animationType="fade" onRequestClose={() => setGalleryOpen(false)}>
        <View style={styles.galleryBackdrop}>
          <View style={styles.galleryHeader}>
            <Text style={styles.galleryTitle}>
              {event.images.length} Submitted {event.images.length === 1 ? 'Photo' : 'Photos'}
            </Text>
            <TouchableOpacity accessibilityLabel="Close photos" onPress={() => setGalleryOpen(false)} style={styles.galleryClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.galleryContent}>
            {event.images.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.galleryImage} resizeMode="contain" accessibilityLabel={`Submitted photo ${index + 1}`} />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.text,
    marginLeft: 4,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    marginTop: 60,
  },
  errorState: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorStateText: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '700',
    paddingVertical: 8,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingBottom: 24,
  },
  hero: {
    height: 210,
    backgroundColor: '#1F3A2C',
    justifyContent: 'space-between',
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogo: {
    width: 70,
    height: 70,
    opacity: 0.4,
  },
  heroFallbackText: {
    color: '#D1FAE5',
    fontSize: 12,
    marginTop: 6,
  },
  heroBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  photoCount: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    padding: theme.spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    fontSize: 11,
    fontWeight: '600',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  tagGreen: {
    backgroundColor: '#BBF7D0',
    color: '#14532D',
  },
  tagGrey: {
    backgroundColor: '#E2E8F0',
    color: '#334155',
  },
  tagLight: {
    backgroundColor: '#ECFDF5',
    color: '#166534',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 14,
  },
  decisionBanner: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  decisionVerified: {
    backgroundColor: '#DCFCE7',
  },
  decisionOther: {
    backgroundColor: '#FEF2F2',
  },
  decisionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  decisionText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  infoSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: '#334155',
  },
  facilities: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  checklistSection: {
    borderTopWidth: 6,
    borderTopColor: '#E8EEF5',
    padding: theme.spacing.md,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checklistTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 0.6,
  },
  progressPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14532D',
    backgroundColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#166534',
  },
  checklistHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  checkItemPending: {
    backgroundColor: '#FDF2F2',
  },
  checkIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkIconDone: {
    backgroundColor: '#2F7D45',
  },
  checkIconPending: {
    backgroundColor: '#E2E8F0',
  },
  checkBody: {
    flex: 1,
  },
  checkTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  checkTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  actionRequired: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C',
    backgroundColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  checkDetail: {
    fontSize: 12,
    lineHeight: 17,
    color: '#475569',
    marginTop: 3,
  },
  checkDetailPending: {
    color: '#B91C1C',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  notesOptional: {
    fontSize: 11,
    color: '#64748B',
  },
  notesBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 12,
  },
  notesBoxError: {
    borderColor: '#F87171',
  },
  notesInput: {
    minHeight: 70,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.text,
    padding: 0,
  },
  notesFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  notesCount: {
    fontSize: 10,
    color: '#94A3B8',
  },
  notesRef: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  noteError: {
    fontSize: 12,
    lineHeight: 17,
    color: '#B42318',
    marginTop: 6,
  },
  bottomBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 10,
    paddingBottom: 12,
  },
  bottomHint: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FDE2E2',
    borderRadius: 24,
    minHeight: 48,
  },
  rejectText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  approveButton: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#166534',
    borderRadius: 24,
    minHeight: 48,
  },
  approveDisabled: {
    backgroundColor: '#94A3B8',
  },
  approveText: {
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
    top: 60,
    right: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 220,
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
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },
  dialogIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  dialogBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
  },
  dialogNote: {
    fontSize: 12,
    lineHeight: 18,
    color: '#334155',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  dialogError: {
    fontSize: 12,
    lineHeight: 18,
    color: '#B42318',
    textAlign: 'center',
    marginTop: 10,
  },
  dialogPrimary: {
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  dialogPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dialogSecondary: {
    alignSelf: 'stretch',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  dialogSecondaryText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  galleryBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  galleryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  galleryClose: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryContent: {
    padding: 16,
    gap: 16,
  },
  galleryImage: {
    width: '100%',
    height: 260,
  },
});
