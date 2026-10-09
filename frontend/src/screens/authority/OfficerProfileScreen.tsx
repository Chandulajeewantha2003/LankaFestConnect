import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { theme } from '../../constants/theme';
import { User } from '../../services/api';
import { authorityService, OFFICER_REGIONS, OfficerProfile, OfficerRegion } from '../../services/authority';
import AuthorityHeader, { AuthorityScreen } from './components/AuthorityHeader';
import { formatReportDate } from './components/reportMeta';

type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  user: User;
  onNavigate: (screen: AuthorityScreen) => void;
  logout: () => void;
}

const MAX_PHOTO_LENGTH = 400000;
const PHONE_PATTERN = /^(\+?[0-9][0-9 ]{6,18})?$/;

const decisionMeta: Record<string, { label: string; icon: IconName; color: string; background: string }> = {
  VERIFIED: { label: 'Verified', icon: 'shield-checkmark', color: '#166534', background: '#DCFCE7' },
  REJECTED: { label: 'Rejected', icon: 'close-circle', color: '#B91C1C', background: '#FEE2E2' },
  FLAGGED: { label: 'Flagged', icon: 'flag', color: '#B45309', background: '#FEF3C7' },
};

export default function OfficerProfileScreen({ user, onNavigate, logout }: Props) {
  const [data, setData] = useState<OfficerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [designation, setDesignation] = useState('');
  const [region, setRegion] = useState<OfficerRegion>('Island-wide');
  const [officePhone, setOfficePhone] = useState('');
  const [regionOpen, setRegionOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await authorityService.getProfile());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your profile. Please retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = () => {
    if (!data) return;
    setDesignation(data.profile.designation);
    setRegion(data.profile.region);
    setOfficePhone(data.profile.officePhone);
    setFormError('');
    setEditOpen(true);
  };

  const save = async () => {
    if (saving || !data) return;
    const phone = officePhone.trim();
    if (designation.trim().length > 60) {
      setFormError('Designation must be 60 characters or fewer.');
      return;
    }
    if (!PHONE_PATTERN.test(phone)) {
      setFormError('Enter a valid phone number using digits, spaces and an optional leading +.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const profile = await authorityService.updateProfile({ designation: designation.trim(), region, officePhone: phone });
      setData({ ...data, profile });
      setEditOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save your details. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  const changePhoto = async () => {
    if (photoBusy || !data) return;
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (result.canceled || !result.assets[0]) return;
      const context = ImageManipulator.manipulate(result.assets[0].uri);
      context.resize({ width: 512 });
      const image = await context.renderAsync();
      const output = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
      if (!output.base64) throw new Error('missing image data');
      const photo = 'data:image/jpeg;base64,' + output.base64;
      if (photo.length > MAX_PHOTO_LENGTH) {
        setPhotoError('That photo is too large. Please choose a smaller image.');
        return;
      }
      const profile = await authorityService.setProfilePhoto(photo);
      setData((current) => (current ? { ...current, profile } : current));
    } catch (err) {
      setPhotoError(err instanceof Error && err.message !== 'missing image data' ? err.message : 'Could not change your photo. Please choose another image.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    if (photoBusy) return;
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const profile = await authorityService.removeProfilePhoto();
      setData((current) => (current ? { ...current, profile } : current));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not remove your photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const account = data?.account;
  const profile = data?.profile;
  const name = account?.fullName ?? user.fullName;
  const approved = account?.authorityApproved ?? user.authorityApproved;

  const stats: { label: string; value?: number; icon: IconName; color: string; background: string }[] = [
    { label: 'Events Verified', value: data?.activity.eventsVerified, icon: 'shield-checkmark-outline', color: '#166534', background: '#DCFCE7' },
    { label: 'Events Rejected', value: data?.activity.eventsRejected, icon: 'close-circle-outline', color: '#B91C1C', background: '#FEE2E2' },
    { label: 'Events Flagged', value: data?.activity.eventsFlagged, icon: 'flag-outline', color: '#B45309', background: '#FEF3C7' },
    { label: 'Reports Filed', value: data?.activity.reportsFiled, icon: 'document-text-outline', color: '#1E3A8A', background: '#DBEAFE' },
    { label: 'Reports Resolved', value: data?.activity.reportsResolved, icon: 'checkmark-done-outline', color: '#166534', background: '#DCFCE7' },
    { label: 'Alerts Published', value: data?.activity.alertsPublished, icon: 'megaphone-outline', color: '#1E3A8A', background: '#E0E7FF' },
  ];

  return (
    <View style={styles.container}>
      <AuthorityHeader title="Profile" user={user} onNavigate={onNavigate} logout={logout} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Identity */}
        <View style={styles.identityCard}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={changePhoto} disabled={photoBusy || !data} style={styles.avatar}>
            {profile?.photo ? (
              <Image source={{ uri: profile.photo }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{name.trim().slice(0, 1).toUpperCase()}</Text>
            )}
            <View style={styles.cameraBadge}>
              {photoBusy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="camera" size={15} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
          <View style={styles.photoActions}>
            <TouchableOpacity onPress={changePhoto} disabled={photoBusy || !data}>
              <Text style={styles.linkText}>{photoBusy ? 'Updating…' : profile?.photo ? 'Change Photo' : 'Add Photo'}</Text>
            </TouchableOpacity>
            {profile?.photo ? (
              <TouchableOpacity onPress={removePhoto} disabled={photoBusy}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {photoError ? <Text accessibilityRole="alert" style={styles.photoError}>{photoError}</Text> : null}
          <Text style={styles.name}>{name}</Text>
          <View style={styles.rolePill}>
            <Ionicons name="shield-checkmark" size={13} color="#166534" />
            <Text style={styles.roleText}>Tourism Officer</Text>
          </View>
          <Text style={styles.designation}>
            {profile ? `${profile.designation} • ${profile.region}` : loading ? 'Loading details…' : ''}
          </Text>
          <View style={[styles.statusChip, approved ? styles.statusApproved : styles.statusPending]}>
            <Ionicons name={approved ? 'checkmark-circle' : 'time-outline'} size={14} color={approved ? '#166534' : '#B45309'} />
            <Text style={[styles.statusText, { color: approved ? '#166534' : '#B45309' }]}>
              {approved ? 'Authority access approved' : 'Authority approval pending'}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Officer Details</Text>
          <TouchableOpacity accessibilityRole="button" onPress={openEdit} disabled={!data} style={styles.editButton}>
            <Ionicons name="create-outline" size={15} color={theme.colors.primary} />
            <Text style={styles.linkText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {[
            { label: 'DESIGNATION', value: profile?.designation, icon: 'briefcase-outline' as IconName },
            { label: 'ASSIGNED REGION', value: profile?.region, icon: 'map-outline' as IconName },
            { label: 'OFFICE PHONE', value: profile ? profile.officePhone || 'Not added' : undefined, icon: 'call-outline' as IconName },
            { label: 'EMAIL ADDRESS', value: account?.email ?? user.email, icon: 'mail-outline' as IconName },
            { label: 'MEMBER SINCE', value: account?.memberSince ? formatReportDate(account.memberSince) : account ? 'Unknown' : undefined, icon: 'calendar-outline' as IconName },
          ].map((row, index) => (
            <View key={row.label} style={[styles.detailRow, index > 0 && styles.divider]}>
              <View style={styles.detailIcon}>
                <Ionicons name={row.icon} size={16} color="#1E3A8A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{row.label}</Text>
                <Text selectable style={[styles.detailValue, row.value === 'Not added' && styles.detailMuted]}>{row.value ?? '–'}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          {data ? <Text style={styles.sectionNote}>{data.activity.alertsActive} live {data.activity.alertsActive === 1 ? 'alert' : 'alerts'}</Text> : null}
        </View>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.background }]}>
                <Ionicons name={stat.icon} size={16} color={stat.color} />
              </View>
              {loading && !data ? <ActivityIndicator style={styles.statLoading} color={theme.colors.primary} /> : <Text style={styles.statValue}>{stat.value ?? '–'}</Text>}
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent decisions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Decisions</Text>
          <TouchableOpacity onPress={() => onNavigate('Events')}>
            <Text style={styles.linkText}>Event Listings</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {data?.recentDecisions.length ? (
            data.recentDecisions.map((decision, index) => {
              const meta = decisionMeta[decision.status] ?? decisionMeta.VERIFIED;
              return (
                <View key={`${decision.eventId}-${index}`} style={[styles.decisionRow, index > 0 && styles.divider]}>
                  <View style={[styles.detailIcon, { backgroundColor: meta.background }]}>
                    <Ionicons name={meta.icon} size={16} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.decisionTitle} numberOfLines={1}>{decision.eventTitle}</Text>
                    <Text style={styles.decisionMeta}>{formatReportDate(decision.decidedAt)}</Text>
                  </View>
                  <Text style={[styles.decisionPill, { color: meta.color, backgroundColor: meta.background }]}>{meta.label}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>{data ? 'Events you verify, reject or flag will appear here.' : 'Loading…'}</Text>
          )}
        </View>

        {/* Quick links */}
        <View style={[styles.card, styles.linksCard]}>
          {[
            { label: 'Tourist Support', icon: 'headset-outline' as IconName, target: 'TouristSupport' as AuthorityScreen },
            { label: 'Publish Notice / Alert', icon: 'megaphone-outline' as IconName, target: 'PublishAlert' as AuthorityScreen },
          ].map((link, index) => (
            <TouchableOpacity key={link.label} style={[styles.linkRow, index > 0 && styles.divider]} onPress={() => onNavigate(link.target)}>
              <Ionicons name={link.icon} size={19} color={theme.colors.text} />
              <Text style={styles.linkRowText}>{link.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity accessibilityRole="button" style={styles.logoutButton} onPress={() => setLogoutOpen(true)}>
          <Ionicons name="log-out-outline" size={20} color="#B91C1C" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <Text style={styles.footnote}>Your name and email come from your LankaFest account. Officer details and photo are saved to your officer profile.</Text>
      </ScrollView>

      {/* Edit details */}
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => !saving && setEditOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.sheetBackdrop} accessibilityLabel="Close editor" onPress={() => !saving && setEditOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Edit Officer Details</Text>
                <TouchableOpacity accessibilityLabel="Close" disabled={saving} onPress={() => setEditOpen(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <Text style={styles.fieldLabel}>DESIGNATION</Text>
              <TextInput
                accessibilityLabel="Designation"
                value={designation}
                onChangeText={setDesignation}
                maxLength={60}
                placeholder="e.g. Senior Tourism Officer"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
              <Text style={styles.fieldLabel}>ASSIGNED REGION</Text>
              <TouchableOpacity style={[styles.input, styles.select]} onPress={() => setRegionOpen(!regionOpen)} accessibilityRole="button" accessibilityLabel={`Assigned region ${region}`}>
                <Text style={styles.selectText}>{region}</Text>
                <Ionicons name={regionOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
              </TouchableOpacity>
              {regionOpen ? (
                <ScrollView style={styles.regionList} nestedScrollEnabled>
                  {OFFICER_REGIONS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.regionItem}
                      onPress={() => {
                        setRegion(item);
                        setRegionOpen(false);
                      }}
                    >
                      <Text style={[styles.regionText, item === region && styles.regionSelected]}>{item}</Text>
                      {item === region ? <Ionicons name="checkmark" size={18} color={theme.colors.primary} /> : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
              <Text style={styles.fieldLabel}>OFFICE PHONE (OPTIONAL)</Text>
              <TextInput
                accessibilityLabel="Office phone"
                value={officePhone}
                onChangeText={setOfficePhone}
                maxLength={20}
                keyboardType="phone-pad"
                placeholder="e.g. +94 81 222 3333"
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
              {formError ? <Text accessibilityRole="alert" style={styles.formError}>{formError}</Text> : null}
              <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.7 }]} disabled={saving} onPress={save}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save Details</Text>}
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Log out confirm */}
      <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Log out?</Text>
            <Text style={styles.dialogBody}>You will need to sign in again to use the Tourism Officer tools.</Text>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: '#B91C1C', alignSelf: 'stretch' }]}
              onPress={() => {
                setLogoutOpen(false);
                logout();
              }}
            >
              <Text style={styles.saveText}>Log Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dialogSecondary} onPress={() => setLogoutOpen(false)}>
              <Text style={styles.dialogSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: theme.spacing.md, paddingBottom: 28 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#B42318', fontSize: 13, lineHeight: 19 },
  retryText: { color: theme.colors.primary, fontWeight: '700', fontSize: 13, paddingTop: 8 },
  identityCard: { backgroundColor: theme.colors.surface, borderRadius: 16, alignItems: 'center', paddingVertical: 22, paddingHorizontal: 16 },
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 104, height: 104, borderRadius: 52 },
  avatarInitial: { fontSize: 42, fontWeight: '800', color: theme.colors.primary },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#166534',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: { flexDirection: 'row', gap: 18, marginTop: 10, minHeight: 28, alignItems: 'center' },
  linkText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  removeText: { fontSize: 13, fontWeight: '600', color: '#B91C1C' },
  photoError: { fontSize: 12, color: '#B42318', textAlign: 'center', marginTop: 4 },
  name: { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginTop: 8, textAlign: 'center' },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  roleText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  designation: { fontSize: 13, color: '#475569', marginTop: 8, textAlign: 'center' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginTop: 12 },
  statusApproved: { backgroundColor: '#ECFDF5' },
  statusPending: { backgroundColor: '#FFFBEB' },
  statusText: { fontSize: 12, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  sectionNote: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 14, paddingHorizontal: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: '#EEF2F6' },
  detailIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.6 },
  detailValue: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginTop: 2 },
  detailMuted: { color: '#94A3B8', fontWeight: '400' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  statCard: { width: '31.5%', backgroundColor: theme.colors.surface, borderRadius: 12, padding: 12 },
  statIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginTop: 8 },
  statLoading: { alignSelf: 'flex-start', marginTop: 10, marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 2 },
  decisionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  decisionTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  decisionMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  decisionPill: { fontSize: 10, fontWeight: '800', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  emptyText: { fontSize: 13, color: theme.colors.muted, paddingVertical: 16 },
  linksCard: { marginTop: 16 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  linkRowText: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.text },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minHeight: 50,
    marginTop: 20,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#B91C1C' },
  footnote: { fontSize: 11, lineHeight: 17, color: '#64748B', textAlign: 'center', marginTop: 14 },
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
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.6, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#DCE3EC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: '#F8FAFC',
  },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 14, color: theme.colors.text },
  regionList: { maxHeight: 200, borderWidth: 1, borderColor: '#DCE3EC', borderRadius: 12, marginTop: 6 },
  regionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, minHeight: 42 },
  regionText: { fontSize: 14, color: theme.colors.text },
  regionSelected: { fontWeight: '700', color: theme.colors.primary },
  formError: { fontSize: 12, lineHeight: 17, color: '#B42318', marginTop: 10 },
  saveButton: { backgroundColor: '#166534', borderRadius: 12, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: theme.colors.surface, borderRadius: 18, padding: 22, alignItems: 'center' },
  dialogTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  dialogBody: { fontSize: 13, lineHeight: 20, color: '#475569', textAlign: 'center', marginTop: 8 },
  dialogSecondary: { alignSelf: 'stretch', minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  dialogSecondaryText: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
});
