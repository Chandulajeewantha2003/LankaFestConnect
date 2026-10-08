import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { theme } from '../../constants/theme';
import { authorityService, NewReport, ReportCategory, ReportPriority } from '../../services/authority';
import { categoryMeta, priorityMeta } from './components/reportMeta';

interface Props {
  onBack: () => void;
  onSubmitted: () => void;
}

type OfficerSource = NewReport['source'];

const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 2000;
const MAX_EVIDENCE = 3;
const MAX_EVIDENCE_LENGTH = 1500000;
const categories = Object.keys(categoryMeta) as ReportCategory[];
const priorities = Object.keys(priorityMeta) as ReportPriority[];
const sources: { key: OfficerSource; label: string }[] = [
  { key: 'FIELD_OFFICER', label: 'Field Officer' },
  { key: 'LOCAL_POLICE', label: 'Local Police' },
  { key: 'PUBLIC_TIP', label: 'Public Tip-off' },
];

export default function ReportFormScreen({ onBack, onSubmitted }: Props) {
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [priority, setPriority] = useState<ReportPriority>('NORMAL');
  const [source, setSource] = useState<OfficerSource>('FIELD_OFFICER');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventOptions, setEventOptions] = useState<{ id: string; title: string; city: string }[] | null>(null);
  const [eventsError, setEventsError] = useState('');
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [errors, setErrors] = useState<{ category?: string; description?: string; evidence?: string; submit?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    authorityService
      .getEventOptions()
      .then((rows) => {
        if (active) setEventOptions(rows);
      })
      .catch((err) => {
        if (active) setEventsError(err instanceof Error ? err.message : 'Could not load events.');
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedEvent = eventOptions?.find((event) => event.id === eventId) ?? null;

  const addEvidence = async () => {
    if (picking || evidence.length >= MAX_EVIDENCE) return;
    setPicking(true);
    setErrors((current) => ({ ...current, evidence: undefined }));
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        // Resize on the device so uploads stay small.
        const context = ImageManipulator.manipulate(result.assets[0].uri);
        context.resize({ width: 1280 });
        const image = await context.renderAsync();
        const output = await image.saveAsync({ compress: 0.6, format: SaveFormat.JPEG, base64: true });
        if (!output.base64) throw new Error('missing image data');
        const uri = 'data:image/jpeg;base64,' + output.base64;
        if (uri.length > MAX_EVIDENCE_LENGTH) {
          setErrors((current) => ({ ...current, evidence: 'That photo is too large. Please choose a smaller image.' }));
          return;
        }
        setEvidence((current) => [...current, uri].slice(0, MAX_EVIDENCE));
      }
    } catch {
      setErrors((current) => ({ ...current, evidence: 'Could not attach that photo. Please choose another image.' }));
    } finally {
      setPicking(false);
    }
  };

  const submit = async () => {
    if (submitting) return;
    const nextErrors: typeof errors = {};
    if (!category) nextErrors.category = 'Choose the type of issue.';
    if (description.trim().length < MIN_DESCRIPTION) nextErrors.description = `Describe the issue in at least ${MIN_DESCRIPTION} characters.`;
    setErrors(nextErrors);
    if (nextErrors.category || nextErrors.description || !category) return;
    setSubmitting(true);
    try {
      await authorityService.createReport({
        category,
        priority,
        source,
        description: description.trim(),
        ...(eventId ? { eventId } : {}),
        ...(evidence.length ? { evidence } : {}),
      });
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Could not file this report. Please retry.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Back to reports" onPress={onBack} style={styles.headerIcon} disabled={submitting}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerBrand}>OFFICER FIELD REPORT</Text>
          <Text style={styles.headerTitle}>Log New Report</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>ISSUE TYPE</Text>
          <View style={styles.categoryGrid}>
            {categories.map((value) => {
              const meta = categoryMeta[value];
              const selected = category === value;
              return (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setCategory(value);
                    setErrors((current) => ({ ...current, category: undefined }));
                  }}
                  style={[styles.categoryCard, selected && styles.categorySelected]}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: meta.background }]}>
                    <Ionicons name={meta.icon} size={18} color={meta.color} />
                  </View>
                  <Text style={styles.categoryText}>{meta.label}</Text>
                  {selected ? <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.category ? <Text accessibilityRole="alert" style={styles.fieldError}>{errors.category}</Text> : null}

          <Text style={styles.label}>PRIORITY</Text>
          <View style={styles.segment}>
            {priorities.map((value) => {
              const selected = priority === value;
              return (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setPriority(value)}
                  style={[styles.segmentItem, selected && { backgroundColor: priorityMeta[value].background, borderColor: priorityMeta[value].color }]}
                >
                  <Text style={[styles.segmentText, selected && { color: priorityMeta[value].color, fontWeight: '800' }]}>{priorityMeta[value].label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>REPORTED BY</Text>
          <View style={styles.segment}>
            {sources.map((item) => {
              const selected = source === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setSource(item.key)}
                  style={[styles.segmentItem, selected && styles.segmentSelected]}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>RELATED EVENT (OPTIONAL)</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setEventPickerOpen(true)} accessibilityRole="button">
            <Ionicons name="calendar-outline" size={18} color="#475569" />
            <Text style={[styles.pickerText, !selectedEvent && { color: '#94A3B8' }]} numberOfLines={1}>
              {selectedEvent ? `${selectedEvent.title} • ${selectedEvent.city}` : 'Not linked to a listed event'}
            </Text>
            {selectedEvent ? (
              <TouchableOpacity accessibilityLabel="Remove linked event" onPress={() => setEventId(null)}>
                <Ionicons name="close-circle" size={18} color="#64748B" />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-down" size={18} color="#64748B" />
            )}
          </TouchableOpacity>

          <Text style={styles.label}>DESCRIPTION</Text>
          <View style={[styles.textBox, errors.description ? styles.textBoxError : null]}>
            <TextInput
              multiline
              maxLength={MAX_DESCRIPTION}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description && text.trim().length >= MIN_DESCRIPTION) setErrors((current) => ({ ...current, description: undefined }));
              }}
              placeholder="What did you observe? Include location details, times and people involved..."
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
              textAlignVertical="top"
              accessibilityLabel="Report description"
            />
            <Text style={styles.counter}>{description.length}/{MAX_DESCRIPTION}</Text>
          </View>
          {errors.description ? <Text accessibilityRole="alert" style={styles.fieldError}>{errors.description}</Text> : null}

          <Text style={styles.label}>ON-SITE EVIDENCE ({evidence.length}/{MAX_EVIDENCE})</Text>
          <View style={styles.evidenceRow}>
            {evidence.map((uri, index) => (
              <View key={index} style={styles.evidenceThumb}>
                <Image source={{ uri }} style={styles.evidenceImage} accessibilityLabel={`Evidence photo ${index + 1}`} />
                <TouchableOpacity
                  accessibilityLabel={`Remove evidence photo ${index + 1}`}
                  onPress={() => setEvidence((current) => current.filter((_, i) => i !== index))}
                  style={styles.removeEvidence}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
            {evidence.length < MAX_EVIDENCE ? (
              <TouchableOpacity style={[styles.evidenceThumb, styles.addEvidence]} onPress={addEvidence} disabled={picking} accessibilityLabel="Attach evidence photo">
                {picking ? <ActivityIndicator color={theme.colors.primary} /> : <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />}
                <Text style={styles.addEvidenceText}>{picking ? 'Attaching…' : 'Add Photo'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {errors.evidence ? <Text accessibilityRole="alert" style={styles.fieldError}>{errors.evidence}</Text> : null}

          {errors.submit ? (
            <View style={styles.submitError}>
              <Text accessibilityRole="alert" style={styles.submitErrorText}>{errors.submit}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.7 }]} onPress={submit} disabled={submitting} accessibilityRole="button">
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>File Field Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Event picker */}
      <Modal visible={eventPickerOpen} transparent animationType="slide" onRequestClose={() => setEventPickerOpen(false)}>
        <Pressable style={styles.sheetBackdrop} accessibilityLabel="Close event list" onPress={() => setEventPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Link an Event</Text>
            {eventsError ? <Text style={styles.fieldError}>{eventsError}</Text> : null}
            {!eventOptions && !eventsError ? <ActivityIndicator style={{ marginVertical: 24 }} color={theme.colors.primary} /> : null}
            <ScrollView style={{ maxHeight: 360 }}>
              {eventOptions?.length === 0 ? <Text style={styles.sheetEmpty}>There are no published events right now.</Text> : null}
              {eventOptions?.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventOption}
                  onPress={() => {
                    setEventId(event.id);
                    setEventPickerOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventOptionTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventOptionCity}>{event.city}</Text>
                  </View>
                  {eventId === event.id ? <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.sheetSecondary}
              onPress={() => {
                setEventId(null);
                setEventPickerOpen(false);
              }}
            >
              <Text style={styles.sheetSecondaryText}>Don't link an event</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Success */}
      <Modal visible={submitted} transparent animationType="fade" onRequestClose={onSubmitted}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <View style={styles.dialogIcon}>
              <Ionicons name="checkmark" size={28} color="#166534" />
            </View>
            <Text style={styles.dialogTitle}>Field report filed</Text>
            <Text style={styles.dialogBody}>The report has been added to the Open queue.</Text>
            <TouchableOpacity style={styles.dialogButton} onPress={onSubmitted}>
              <Text style={styles.dialogButtonText}>Back to Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  headerIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBrand: { fontSize: 10, fontWeight: '700', color: theme.colors.primary, letterSpacing: 0.8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginTop: 1 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: theme.spacing.md, paddingBottom: 32 },
  label: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.8, marginTop: 18, marginBottom: 8 },
  categoryGrid: { gap: 8 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: 10,
  },
  categorySelected: { borderColor: theme.colors.primary, backgroundColor: '#F0FBF4' },
  categoryIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  categoryText: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.text },
  fieldError: { fontSize: 12, lineHeight: 17, color: '#B42318', marginTop: 6 },
  segment: { flexDirection: 'row', gap: 8 },
  segmentItem: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE3EC',
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  segmentSelected: { backgroundColor: '#166534', borderColor: '#166534' },
  segmentText: { fontSize: 12, fontWeight: '600', color: theme.colors.text, textAlign: 'center' },
  segmentTextSelected: { color: '#FFFFFF' },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  pickerText: { flex: 1, fontSize: 13, color: theme.colors.text },
  textBox: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', padding: 12 },
  textBoxError: { borderColor: '#F87171' },
  textInput: { minHeight: 110, fontSize: 13, lineHeight: 19, color: theme.colors.text, padding: 0 },
  counter: { fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 6 },
  evidenceRow: { flexDirection: 'row', gap: 8 },
  evidenceThumb: { width: 96, height: 96, borderRadius: 10, overflow: 'hidden', backgroundColor: '#E2E8F0' },
  evidenceImage: { width: '100%', height: '100%' },
  removeEvidence: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEvidence: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
  },
  addEvidenceText: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },
  submitError: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginTop: 18 },
  submitErrorText: { color: '#B42318', fontSize: 13, lineHeight: 19 },
  bottomBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2F6E3B',
    borderRadius: 26,
    minHeight: 50,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
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
  sheetTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 12 },
  sheetEmpty: { fontSize: 13, color: theme.colors.muted, paddingVertical: 16 },
  eventOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  eventOptionTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  eventOptionCity: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  sheetSecondary: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  sheetSecondaryText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 380, backgroundColor: theme.colors.surface, borderRadius: 18, padding: 22, alignItems: 'center' },
  dialogIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dialogTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  dialogBody: { fontSize: 13, lineHeight: 20, color: '#475569', textAlign: 'center', marginTop: 8 },
  dialogButton: {
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  dialogButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
