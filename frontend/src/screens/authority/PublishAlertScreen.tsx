import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { AlertAudience, AlertClassification, AlertType, authorityService, PublicAlert } from '../../services/authority';
import { formatReportDate } from './components/reportMeta';

type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  onBack: () => void;
  onProfile: () => void;
}

const MIN_TITLE = 5;
const MAX_TITLE = 100;
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 300;

const classifications: { key: AlertClassification; label: string; caption: string; icon: IconName; color: string; background: string }[] = [
  { key: 'SAFETY', label: 'Safety', caption: 'Priority 1', icon: 'warning', color: '#B91C1C', background: '#FECACA' },
  { key: 'ROUTE', label: 'Route / Road', caption: 'Transit & Pass', icon: 'trail-sign-outline', color: '#166534', background: '#BBF7D0' },
  { key: 'WEATHER', label: 'Weather', caption: 'Monsoon warning', icon: 'thunderstorm-outline', color: '#1E3A8A', background: '#DBEAFE' },
  { key: 'GENERAL', label: 'General', caption: 'Civil Updates', icon: 'megaphone-outline', color: '#334155', background: '#E2E8F0' },
];

const audiences: { key: AlertAudience; label: string; caption: string; icon: IconName }[] = [
  { key: 'ALL_USERS', label: 'All Users', caption: 'Everyone using LankaFest Connect', icon: 'people-outline' },
  { key: 'TOURISTS', label: 'Tourists', caption: 'Event seekers & visitors', icon: 'airplane-outline' },
  { key: 'ORGANIZERS', label: 'Event Organizers', caption: 'Cultural festival coordinators', icon: 'business-outline' },
  { key: 'GUIDES', label: 'Certified Guides', caption: 'Tourism officers & guides', icon: 'id-card-outline' },
];

const classificationFor = (key: AlertClassification) => classifications.find((item) => item.key === key) ?? classifications[0];

export default function PublishAlertScreen({ onBack, onProfile }: Props) {
  const [type, setType] = useState<AlertType>('SAFETY_ALERT');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [urgent, setUrgent] = useState(true);
  const [classification, setClassification] = useState<AlertClassification>('SAFETY');
  const [targets, setTargets] = useState<AlertAudience[]>(['ALL_USERS', 'TOURISTS', 'GUIDES']);
  const [errors, setErrors] = useState<{ title?: string; message?: string; audience?: string; submit?: string }>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<PublicAlert | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<PublicAlert[] | null>(null);
  const [historyError, setHistoryError] = useState('');
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const isSafety = type === 'SAFETY_ALERT';
  const ready = title.trim().length >= MIN_TITLE && message.trim().length >= MIN_MESSAGE && targets.length > 0;
  const preview = classificationFor(classification);

  const switchType = (next: AlertType) => {
    setType(next);
    if (next === 'GENERAL_NOTICE') {
      setUrgent(false);
      if (classification === 'SAFETY') setClassification('GENERAL');
    } else if (classification === 'GENERAL') {
      setClassification('SAFETY');
    }
  };

  const toggleTarget = (key: AlertAudience) => {
    setTargets((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
    setErrors((current) => ({ ...current, audience: undefined }));
  };

  const allSelected = targets.length === audiences.length;

  const requestPublish = () => {
    const next: typeof errors = {};
    if (title.trim().length < MIN_TITLE) next.title = `Enter an alert title of at least ${MIN_TITLE} characters.`;
    if (message.trim().length < MIN_MESSAGE) next.message = `Enter a message of at least ${MIN_MESSAGE} characters.`;
    if (!targets.length) next.audience = 'Choose at least one target audience.';
    setErrors(next);
    if (next.title || next.message || next.audience) return;
    setConfirmOpen(true);
  };

  const publish = async () => {
    if (publishing) return;
    setPublishing(true);
    setErrors({});
    try {
      const alert = await authorityService.publishAlert({ type, title: title.trim(), message: message.trim(), classification, urgent, audiences: targets });
      setPublished(alert);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Could not publish this alert. Please retry.' });
    } finally {
      setPublishing(false);
    }
  };

  const finishPublish = () => {
    setConfirmOpen(false);
    setPublished(null);
    setTitle('');
    setMessage('');
  };

  const openHistory = async () => {
    setOptionsOpen(false);
    setHistoryOpen(true);
    setHistoryError('');
    try {
      setHistory(await authorityService.getAlerts());
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Could not load published alerts.');
    }
  };

  const withdraw = async (alert: PublicAlert) => {
    if (withdrawing) return;
    setWithdrawing(alert.id);
    setHistoryError('');
    try {
      const updated = await authorityService.withdrawAlert(alert.id);
      setHistory((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? null);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Could not withdraw this alert.');
    } finally {
      setWithdrawing(null);
    }
  };

  const resetForm = () => {
    setOptionsOpen(false);
    setTitle('');
    setMessage('');
    setErrors({});
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Back to dashboard" onPress={onBack} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publish</Text>
        <TouchableOpacity accessibilityLabel="More options" onPress={() => setOptionsOpen(true)} style={styles.headerIcon}>
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Open profile" onPress={onProfile} style={styles.headerAvatar}>
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Type switch */}
          <View style={styles.typeSwitch}>
            <TouchableOpacity
              accessibilityRole="tab"
              accessibilityState={{ selected: isSafety }}
              onPress={() => switchType('SAFETY_ALERT')}
              style={[styles.typeOption, isSafety && styles.typeOptionSelected]}
            >
              <Ionicons name="warning" size={15} color={isSafety ? '#FFFFFF' : theme.colors.text} />
              <Text style={[styles.typeText, isSafety && styles.typeTextSelected]}>SAFETY ALERT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="tab"
              accessibilityState={{ selected: !isSafety }}
              onPress={() => switchType('GENERAL_NOTICE')}
              style={[styles.typeOption, !isSafety && styles.typeOptionSelected]}
            >
              <Ionicons name="information-circle-outline" size={16} color={!isSafety ? '#FFFFFF' : theme.colors.text} />
              <Text style={[styles.typeText, !isSafety && styles.typeTextSelected]}>General Notice</Text>
            </TouchableOpacity>
          </View>

          {/* Channel info */}
          <View style={styles.channel}>
            <View style={styles.channelIcon}>
              <Ionicons name={isSafety ? 'shield-checkmark-outline' : 'newspaper-outline'} size={18} color="#166534" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.channelTitle}>{isSafety ? 'Safety Broadcast Channel' : 'Public Notice Board'}</Text>
              <Text style={styles.channelText}>
                {isSafety
                  ? 'Alerts are published to the LankaFest in-app alert feed for the audiences you select below.'
                  : 'Notices appear in the LankaFest in-app feed as general updates for the selected audiences.'}
              </Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>{isSafety ? 'ALERT TITLE' : 'NOTICE TITLE'}</Text>
            <TouchableOpacity
              accessibilityRole="switch"
              accessibilityState={{ checked: urgent }}
              accessibilityLabel="Mark as urgent"
              onPress={() => setUrgent(!urgent)}
              style={[styles.urgentToggle, urgent && styles.urgentToggleOn]}
            >
              <Ionicons name="flash" size={12} color={urgent ? '#FFFFFF' : '#166534'} />
              <Text style={[styles.urgentText, urgent && styles.urgentTextOn]}>Urgent</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            accessibilityLabel="Alert title"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title && text.trim().length >= MIN_TITLE) setErrors((current) => ({ ...current, title: undefined }));
            }}
            maxLength={MAX_TITLE}
            placeholder="e.g. Heavy Rain Warning: Kandy Route Advisory"
            placeholderTextColor="#94A3B8"
            style={[styles.input, errors.title ? styles.inputError : null]}
          />
          {errors.title ? <Text accessibilityRole="alert" style={styles.fieldError}>{errors.title}</Text> : null}

          {/* Message */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>MESSAGE</Text>
            <Text style={styles.counter}>{message.length}/{MAX_MESSAGE}</Text>
          </View>
          <TextInput
            accessibilityLabel="Alert message"
            multiline
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              if (errors.message && text.trim().length >= MIN_MESSAGE) setErrors((current) => ({ ...current, message: undefined }));
            }}
            maxLength={MAX_MESSAGE}
            placeholder="Write important safety notice, crowd advisory, or travel warning here..."
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.messageInput, errors.message ? styles.inputError : null]}
            textAlignVertical="top"
          />
          {errors.message ? <Text accessibilityRole="alert" style={styles.fieldError}>{errors.message}</Text> : null}

          {/* Classification */}
          <Text style={[styles.label, styles.sectionLabel]}>{isSafety ? 'ALERT CLASSIFICATION' : 'NOTICE CLASSIFICATION'}</Text>
          <View style={styles.classGrid}>
            {classifications.map((item) => {
              const selected = classification === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setClassification(item.key)}
                  style={[styles.classCard, selected && styles.classCardSelected]}
                >
                  <View style={[styles.classIcon, { backgroundColor: item.background }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classLabel}>{item.label}</Text>
                    <Text style={styles.classCaption}>{item.caption}</Text>
                  </View>
                  {selected ? <View style={styles.classDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Audience */}
          <View style={[styles.labelRow, styles.sectionLabel]}>
            <Text style={styles.label}>TARGET AUDIENCE BROADCAST</Text>
            <TouchableOpacity onPress={() => setTargets(allSelected ? [] : audiences.map((item) => item.key))}>
              <Text style={styles.selectAll}>{allSelected ? 'Clear All' : 'Select All'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.audienceCard}>
            {audiences.map((item, index) => {
              const checked = targets.includes(item.key);
              return (
                <TouchableOpacity
                  key={item.key}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={item.label}
                  onPress={() => toggleTarget(item.key)}
                  style={[styles.audienceRow, index > 0 && styles.audienceDivider]}
                >
                  <View style={styles.audienceIcon}>
                    <Ionicons name={item.icon} size={16} color="#166534" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.audienceLabel}>{item.label}</Text>
                    <Text style={styles.audienceCaption}>{item.caption}</Text>
                  </View>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.audience ? <Text accessibilityRole="alert" style={styles.fieldError}>{errors.audience}</Text> : null}

          {/* Preview */}
          <View style={styles.previewCard}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>PUBLIC FEED PREVIEW</Text>
              <View style={styles.readyRow}>
                <View style={[styles.readyDot, { backgroundColor: ready ? '#16A34A' : '#94A3B8' }]} />
                <Text style={[styles.readyText, { color: ready ? '#166534' : '#64748B' }]}>{ready ? 'Ready to send' : 'Incomplete'}</Text>
              </View>
            </View>
            <View style={styles.preview}>
              <View style={[styles.previewIcon, { backgroundColor: urgent ? '#991B1B' : preview.color }]}>
                <Ionicons name={urgent ? 'alert' : preview.icon} size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewTitle} numberOfLines={2}>{title.trim() || 'Your alert title'}</Text>
                <Text style={styles.previewMessage} numberOfLines={3}>{message.trim() || 'Your message will appear here.'}</Text>
                <Text style={styles.previewMeta}>
                  {isSafety ? 'Safety Alert' : 'General Notice'} • {preview.label}
                  {urgent ? ' • Urgent' : ''}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity accessibilityRole="button" style={styles.publishButton} onPress={requestPublish}>
          <Ionicons name="notifications" size={18} color="#FFFFFF" />
          <Text style={styles.publishText}>{isSafety ? 'PUBLISH ALERT' : 'PUBLISH NOTICE'}</Text>
        </TouchableOpacity>
      </View>

      {/* Options */}
      <Modal visible={optionsOpen} transparent animationType="fade" onRequestClose={() => setOptionsOpen(false)}>
        <Pressable style={styles.optionsBackdrop} accessibilityLabel="Close options" onPress={() => setOptionsOpen(false)}>
          <View style={styles.optionsMenu}>
            <TouchableOpacity style={styles.optionItem} onPress={openHistory}>
              <Ionicons name="list-outline" size={18} color={theme.colors.text} />
              <Text style={styles.optionText}>Published alerts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={resetForm}>
              <Ionicons name="trash-outline" size={18} color={theme.colors.text} />
              <Text style={styles.optionText}>Clear draft</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Confirm / success */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => (published ? finishPublish() : !publishing && setConfirmOpen(false))}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            {published ? (
              <>
                <View style={[styles.dialogIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="checkmark" size={28} color="#166534" />
                </View>
                <Text style={styles.dialogTitle}>{published.type === 'SAFETY_ALERT' ? 'Alert published' : 'Notice published'}</Text>
                <Text style={styles.dialogBody}>“{published.title}” is now live in the in-app alert feed.</Text>
                <TouchableOpacity style={[styles.dialogPrimary, { backgroundColor: '#166534' }]} onPress={finishPublish}>
                  <Text style={styles.dialogPrimaryText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.dialogTitle}>{isSafety ? 'Publish this alert?' : 'Publish this notice?'}</Text>
                <Text style={styles.dialogBody}>
                  It will be shown to: {targets.map((key) => audiences.find((a) => a.key === key)?.label).join(', ')}.
                </Text>
                {errors.submit ? <Text accessibilityRole="alert" style={styles.dialogError}>{errors.submit}</Text> : null}
                <TouchableOpacity style={[styles.dialogPrimary, { backgroundColor: '#166534' }, publishing && { opacity: 0.7 }]} disabled={publishing} onPress={publish}>
                  {publishing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.dialogPrimaryText}>Publish</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.dialogSecondary} disabled={publishing} onPress={() => setConfirmOpen(false)}>
                  <Text style={styles.dialogSecondaryText}>Keep Editing</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Published alerts */}
      <Modal visible={historyOpen} transparent animationType="slide" onRequestClose={() => setHistoryOpen(false)}>
        <Pressable style={styles.sheetBackdrop} accessibilityLabel="Close published alerts" onPress={() => setHistoryOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Published Alerts</Text>
              <TouchableOpacity accessibilityLabel="Close" onPress={() => setHistoryOpen(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            {historyError ? <Text accessibilityRole="alert" style={styles.fieldError}>{historyError}</Text> : null}
            {!history && !historyError ? <ActivityIndicator style={{ marginVertical: 24 }} color={theme.colors.primary} /> : null}
            <ScrollView style={{ maxHeight: 420 }}>
              {history?.length === 0 ? <Text style={styles.sheetEmpty}>No alerts have been published yet.</Text> : null}
              {history?.map((alert) => {
                const meta = classificationFor(alert.classification);
                const active = alert.status === 'ACTIVE';
                return (
                  <View key={alert.id} style={styles.historyItem}>
                    <View style={[styles.previewIcon, { backgroundColor: active ? (alert.urgent ? '#991B1B' : meta.color) : '#94A3B8' }]}>
                      <Ionicons name={alert.urgent ? 'alert' : meta.icon} size={15} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle} numberOfLines={2}>{alert.title}</Text>
                      <Text style={styles.historyMeta}>
                        {formatReportDate(alert.createdAt)} • {meta.label} • {active ? 'Live' : 'Withdrawn'}
                      </Text>
                    </View>
                    {active ? (
                      <TouchableOpacity style={styles.withdrawButton} disabled={!!withdrawing} onPress={() => withdraw(alert)}>
                        {withdrawing === alert.id ? <ActivityIndicator size="small" color="#B91C1C" /> : <Text style={styles.withdrawText}>Withdraw</Text>}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          </Pressable>
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
  typeSwitch: { flexDirection: 'row', backgroundColor: '#E2EAF4', borderRadius: 12, padding: 4 },
  typeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, borderRadius: 9 },
  typeOptionSelected: { backgroundColor: '#2F6E3B' },
  typeText: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  typeTextSelected: { color: '#FFFFFF' },
  channel: { flexDirection: 'row', gap: 12, backgroundColor: '#E8EEF8', borderRadius: 12, padding: 14, marginTop: 14 },
  channelIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#BBF7D0', alignItems: 'center', justifyContent: 'center' },
  channelTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  channelText: { fontSize: 12, lineHeight: 17, color: '#334155', marginTop: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '700', color: '#334155', letterSpacing: 0.6 },
  sectionLabel: { marginTop: 22 },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  urgentToggleOn: { backgroundColor: '#B91C1C', borderColor: '#B91C1C' },
  urgentText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  urgentTextOn: { color: '#FFFFFF' },
  counter: { fontSize: 11, color: '#64748B' },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.text,
  },
  messageInput: { minHeight: 100, lineHeight: 20 },
  inputError: { borderColor: '#F87171' },
  fieldError: { fontSize: 12, lineHeight: 17, color: '#B42318', marginTop: 6 },
  classGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  classCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  classCardSelected: { backgroundColor: '#E2E8F0', borderColor: '#CBD5E1' },
  classIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  classLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  classCaption: { fontSize: 11, color: '#475569', marginTop: 1 },
  classDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#166534' },
  selectAll: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  audienceCard: { backgroundColor: theme.colors.surface, borderRadius: 12, paddingHorizontal: 14 },
  audienceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60 },
  audienceDivider: { borderTopWidth: 1, borderTopColor: '#EEF2F6' },
  audienceIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E8EEF8', alignItems: 'center', justifyContent: 'center' },
  audienceLabel: { fontSize: 14, color: theme.colors.text },
  audienceCaption: { fontSize: 11, color: '#475569', marginTop: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#2F6E3B' },
  previewCard: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, paddingTop: 0, marginTop: 22 },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  readyDot: { width: 7, height: 7, borderRadius: 4 },
  readyText: { fontSize: 11, fontWeight: '700' },
  preview: { flexDirection: 'row', gap: 10, backgroundColor: '#E8EEF8', borderRadius: 10, padding: 12 },
  previewIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  previewMessage: { fontSize: 12, lineHeight: 17, color: '#334155', marginTop: 2 },
  previewMeta: { fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 6 },
  bottomBar: { backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingHorizontal: theme.spacing.md, paddingVertical: 12 },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2F6E3B',
    borderRadius: 26,
    minHeight: 52,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  publishText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
  optionsBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.15)' },
  optionsMenu: {
    position: 'absolute',
    top: 60,
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
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 44 },
  optionText: { fontSize: 14, color: theme.colors.text },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 380, backgroundColor: theme.colors.surface, borderRadius: 18, padding: 22, alignItems: 'center' },
  dialogIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dialogTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  dialogBody: { fontSize: 13, lineHeight: 20, color: '#475569', textAlign: 'center', marginTop: 8 },
  dialogError: { fontSize: 12, lineHeight: 18, color: '#B42318', textAlign: 'center', marginTop: 10 },
  dialogPrimary: { alignSelf: 'stretch', minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  dialogPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  dialogSecondary: { alignSelf: 'stretch', minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  dialogSecondaryText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.4)' },
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
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  sheetEmpty: { fontSize: 13, color: theme.colors.muted, paddingVertical: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF2F6' },
  historyTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  historyMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  withdrawButton: { borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 8, paddingHorizontal: 10, minHeight: 34, minWidth: 82, alignItems: 'center', justifyContent: 'center' },
  withdrawText: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
});
