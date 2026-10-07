import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import {
  authorityService,
  EvidenceFeed,
  ReportCategory,
  ReportDetail,
  ReportList,
  ReportPriority,
  ReportStatus,
  ReportSummary,
} from '../../services/authority';
import AuthorityHeader, { AuthorityScreen } from './components/AuthorityHeader';
import { categoryMeta, formatReportDate, priorityMeta, sourceMeta, statusMeta } from './components/reportMeta';

type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  user: User;
  onNavigate: (screen: AuthorityScreen) => void;
  onNewReport: () => void;
  logout: () => void;
}

const statuses: ReportStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'];
const categories = Object.keys(categoryMeta) as ReportCategory[];
const priorities = Object.keys(priorityMeta) as ReportPriority[];
const MIN_RESOLUTION = 5;

// Actions an officer can take from each status (mirrors the backend transitions).
const statusActions: Record<ReportStatus, { to: ReportStatus; label: string; icon: IconName; color: string; primary?: boolean }[]> = {
  OPEN: [
    { to: 'IN_PROGRESS', label: 'Start Investigation', icon: 'play-circle-outline', color: '#1E3A8A', primary: true },
    { to: 'RESOLVED', label: 'Mark Resolved', icon: 'checkmark-circle-outline', color: '#166534' },
    { to: 'ARCHIVED', label: 'Archive', icon: 'archive-outline', color: '#475569' },
  ],
  IN_PROGRESS: [
    { to: 'RESOLVED', label: 'Mark Resolved', icon: 'checkmark-circle-outline', color: '#166534', primary: true },
    { to: 'OPEN', label: 'Move Back to Open', icon: 'return-up-back-outline', color: '#B91C1C' },
    { to: 'ARCHIVED', label: 'Archive', icon: 'archive-outline', color: '#475569' },
  ],
  RESOLVED: [
    { to: 'OPEN', label: 'Reopen', icon: 'refresh-outline', color: '#B91C1C', primary: true },
    { to: 'ARCHIVED', label: 'Archive', icon: 'archive-outline', color: '#475569' },
  ],
  ARCHIVED: [{ to: 'OPEN', label: 'Reopen', icon: 'refresh-outline', color: '#B91C1C', primary: true }],
};

export default function ReportsScreen({ user, onNavigate, onNewReport, logout }: Props) {
  const [status, setStatus] = useState<ReportStatus>('OPEN');
  const [data, setData] = useState<ReportList | null>(null);
  const [evidence, setEvidence] = useState<EvidenceFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<ReportPriority | 'ALL'>('ALL');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [allEvidence, setAllEvidence] = useState<EvidenceFeed | null>(null);
  const [galleryError, setGalleryError] = useState('');
  const latestRequest = useRef(0);

  // Detail sheet state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [detailError, setDetailError] = useState('');
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState<ReportStatus | null>(null);
  const [actionError, setActionError] = useState('');

  const fetchReports = useCallback(async (target: ReportStatus) => {
    const request = ++latestRequest.current;
    try {
      const [list, feed] = await Promise.all([authorityService.getReports(target), authorityService.getEvidence(3)]);
      if (request !== latestRequest.current) return;
      setData(list);
      setEvidence(feed);
      setError('');
    } catch (err) {
      if (request === latestRequest.current) setError(err instanceof Error ? err.message : 'Could not load reports. Please retry.');
    } finally {
      if (request === latestRequest.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchReports(status);
  }, [status, fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports(status);
  };

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (data?.status === status ? data.reports : []).filter(
      (report) =>
        (categoryFilter === 'ALL' || report.category === categoryFilter) &&
        (priorityFilter === 'ALL' || report.priority === priorityFilter) &&
        (!term ||
          [categoryMeta[report.category].label, report.description, report.ref, report.reporterLabel, report.eventTitle].join(' ').toLowerCase().includes(term)),
    );
  }, [data, status, query, categoryFilter, priorityFilter]);

  const filtersActive = categoryFilter !== 'ALL' || priorityFilter !== 'ALL';

  const openDetail = async (report: ReportSummary) => {
    setSelectedId(report.id);
    setDetail(null);
    setDetailError('');
    setActionError('');
    setResolution(report.resolutionNote ?? '');
    try {
      setDetail(await authorityService.getReport(report.id));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Could not load this report.');
    }
  };

  const closeDetail = () => {
    if (updating) return;
    setSelectedId(null);
    setDetail(null);
  };

  const changeStatus = async (to: ReportStatus) => {
    if (!detail || updating) return;
    setActionError('');
    if (to === 'RESOLVED' && resolution.trim().length < MIN_RESOLUTION) {
      setActionError(`Add a resolution note (at least ${MIN_RESOLUTION} characters) to resolve this report.`);
      return;
    }
    setUpdating(to);
    try {
      const updated = await authorityService.updateReportStatus(detail.id, to, resolution.trim() || undefined);
      setDetail({ ...detail, ...updated });
      fetchReports(status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update this report. Please retry.');
    } finally {
      setUpdating(null);
    }
  };

  const openGallery = async () => {
    setGalleryOpen(true);
    setGalleryError('');
    setAllEvidence(null);
    try {
      setAllEvidence(await authorityService.getEvidence(50));
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : 'Could not load evidence photos.');
    }
  };

  const critical = data?.critical;
  const pendingActions = data?.pendingActions ?? 0;

  const renderReport = (report: ReportSummary) => {
    const category = categoryMeta[report.category];
    const badge = statusMeta[report.status];
    const resolved = report.status === 'RESOLVED';
    return (
      <TouchableOpacity
        key={report.id}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${category.label} report ${report.ref}`}
        onPress={() => openDetail(report)}
        style={styles.reportCard}
      >
        <View style={styles.reportTop}>
          <View style={[styles.reportIcon, { backgroundColor: resolved ? '#E0E7FF' : category.background }]}>
            <Ionicons name={resolved ? 'checkmark-circle-outline' : category.icon} size={22} color={resolved ? '#166534' : category.color} />
          </View>
          <View style={styles.reportBody}>
            <View style={styles.reportTitleRow}>
              <Text style={styles.reportTitle} numberOfLines={1}>{category.label}</Text>
              <Text style={[styles.statusPill, { color: badge.color, backgroundColor: badge.background }]}>{badge.label}</Text>
            </View>
            <Text style={styles.reportDescription} numberOfLines={2}>{report.description}</Text>
            {report.priority !== 'NORMAL' || report.eventTitle ? (
              <View style={styles.reportTags}>
                {report.priority !== 'NORMAL' ? (
                  <Text style={[styles.smallTag, { color: priorityMeta[report.priority].color, backgroundColor: priorityMeta[report.priority].background }]}>
                    {priorityMeta[report.priority].label}
                  </Text>
                ) : null}
                {report.eventTitle ? (
                  <Text style={[styles.smallTag, styles.eventTag]} numberOfLines={1}>{report.eventTitle}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.reportFooter}>
          <Ionicons name={resolved ? 'checkmark-circle-outline' : sourceMeta[report.source].icon} size={14} color="#334155" />
          <Text style={styles.reportFooterText} numberOfLines={1}>
            Reported on {formatReportDate(report.createdAt)} by {report.reporterLabel}
          </Text>
          {report.evidenceCount ? (
            <View style={styles.evidenceCount}>
              <Ionicons name="image-outline" size={12} color="#475569" />
              <Text style={styles.evidenceCountText}>{report.evidenceCount}</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={16} color="#334155" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AuthorityHeader title="Reports" user={user} onNavigate={onNavigate} logout={logout} />

      <View style={styles.subHeader}>
        <TouchableOpacity accessibilityLabel="Back to dashboard" onPress={() => onNavigate('Home')} style={styles.roundButton}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.subTitles}>
          <Text style={styles.pageTitle}>Reports & Complaints</Text>
          <Text style={styles.pageSubtitle}>
            {data ? `${pendingActions} pending review ${pendingActions === 1 ? 'action' : 'actions'}` : 'Loading…'}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel={searchOpen ? 'Close search' : 'Search reports'}
          onPress={() => {
            if (searchOpen) setQuery('');
            setSearchOpen(!searchOpen);
          }}
          style={[styles.roundButton, searchOpen && styles.roundButtonActive]}
        >
          <Ionicons name={searchOpen ? 'close' : 'search'} size={19} color={searchOpen ? '#FFFFFF' : theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Filter reports" onPress={() => setFilterOpen(true)} style={[styles.roundButton, { marginLeft: 8 }]}>
          <Ionicons name="options-outline" size={20} color={theme.colors.text} />
          {filtersActive ? <View style={styles.filterDot} /> : null}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
      >
        {searchOpen ? (
          <View style={styles.search}>
            <Ionicons name="search-outline" size={18} color="#64748B" />
            <TextInput
              autoFocus
              accessibilityLabel="Search reports"
              placeholder="Search by issue, description, ticket or event..."
              placeholderTextColor="#64748B"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              style={styles.searchInput}
            />
          </View>
        ) : null}

        {/* High priority notice */}
        <View style={[styles.notice, critical?.unresolved ? styles.noticeAlert : styles.noticeCalm]}>
          <View style={[styles.noticeIcon, { backgroundColor: critical?.unresolved ? '#FECACA' : '#BBF7D0' }]}>
            <Ionicons name={critical?.unresolved ? 'alert-circle-outline' : 'shield-checkmark-outline'} size={24} color={critical?.unresolved ? '#B91C1C' : '#166534'} />
          </View>
          <View style={styles.noticeBody}>
            <Text style={styles.noticeTitle}>{critical?.unresolved ? 'High Priority Notice' : 'No Critical Tickets'}</Text>
            <Text style={styles.noticeText}>
              {!critical
                ? 'Checking critical tickets…'
                : critical.unresolved
                  ? `${critical.unresolved} unresolved critical ${critical.unresolved === 1 ? 'ticket' : 'tickets'}${critical.today ? `, ${critical.today} flagged today` : ''}`
                  : 'All critical tickets have been handled'}
            </Text>
          </View>
          <View style={styles.noticeShield}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#166534" />
          </View>
        </View>

        {/* Status tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {statuses.map((value) => {
            const selected = value === status;
            const count = data?.counts[value];
            return (
              <TouchableOpacity
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setStatus(value)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{statusMeta[value].tab}</Text>
                {count ? (
                  <Text style={[styles.tabCount, selected && styles.tabCountSelected]}>{count}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filtersActive ? (
          <View style={styles.activeFilters}>
            <Text style={styles.activeFiltersText}>
              {categoryFilter === 'ALL' ? 'All issues' : categoryMeta[categoryFilter].label} • {priorityFilter === 'ALL' ? 'Any priority' : `${priorityMeta[priorityFilter].label} priority`}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setCategoryFilter('ALL');
                setPriorityFilter('ALL');
              }}
            >
              <Text style={styles.linkText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchReports(status)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading && data?.status !== status ? (
          <ActivityIndicator style={styles.loading} color={theme.colors.primary} />
        ) : visible.length ? (
          visible.map(renderReport)
        ) : !error ? (
          <View style={styles.empty}>
            <Ionicons name={data?.reports.length ? 'search-outline' : 'checkmark-done-outline'} size={32} color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>
              {data?.reports.length ? 'No matching reports' : `No ${statusMeta[status].tab.toLowerCase()} reports`}
            </Text>
            <Text style={styles.emptyText}>
              {data?.reports.length
                ? 'Try another search or clear the filters.'
                : status === 'OPEN'
                  ? 'New complaints and officer field reports will appear here.'
                  : 'Reports you move to this stage will appear here.'}
            </Text>
          </View>
        ) : null}

        {/* Evidence */}
        <View style={styles.evidenceCard}>
          <View style={styles.evidenceHeader}>
            <Text style={styles.evidenceTitle}>Attached On-Site Evidence</Text>
            {evidence?.total ? (
              <TouchableOpacity onPress={openGallery}>
                <Text style={styles.linkText}>View All ({evidence.total})</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {evidence?.items.length ? (
            <View style={styles.evidenceRow}>
              {evidence.items.slice(0, evidence.total > 3 ? 2 : 3).map((item) => (
                <TouchableOpacity key={`${item.reportId}-${item.index}`} style={styles.evidenceThumb} onPress={openGallery} accessibilityLabel={`Evidence for report ${item.ref}`}>
                  <Image source={{ uri: item.image }} style={styles.evidenceImage} />
                  <Text style={styles.evidenceRef}>{item.ref}</Text>
                </TouchableOpacity>
              ))}
              {evidence.total > 3 ? (
                <TouchableOpacity style={[styles.evidenceThumb, styles.evidenceMore]} onPress={openGallery} accessibilityLabel="View all evidence">
                  <Ionicons name="images-outline" size={22} color="#334155" />
                  <Text style={styles.evidenceMoreText}>+{evidence.total - 2} more</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <Text style={styles.evidenceEmpty}>{evidence ? 'Photos attached to reports will appear here.' : 'Loading evidence…'}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.logButton} activeOpacity={0.85} onPress={onNewReport} accessibilityRole="button">
          <Ionicons name="document-attach-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logButtonText}>Log New Officer Field Report</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Filters */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.sheetBackdrop} accessibilityLabel="Close filters" onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter Reports</Text>
              <TouchableOpacity
                onPress={() => {
                  setCategoryFilter('ALL');
                  setPriorityFilter('ALL');
                }}
              >
                <Text style={styles.linkText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetLabel}>ISSUE TYPE</Text>
            <View style={styles.sheetChips}>
              {(['ALL', ...categories] as const).map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setCategoryFilter(value)}
                  style={[styles.sheetChip, categoryFilter === value && styles.sheetChipSelected]}
                >
                  <Text style={[styles.sheetChipText, categoryFilter === value && styles.sheetChipTextSelected]}>
                    {value === 'ALL' ? 'All' : categoryMeta[value].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sheetLabel}>PRIORITY</Text>
            <View style={styles.sheetChips}>
              {(['ALL', ...priorities] as const).map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setPriorityFilter(value)}
                  style={[styles.sheetChip, priorityFilter === value && styles.sheetChipSelected]}
                >
                  <Text style={[styles.sheetChipText, priorityFilter === value && styles.sheetChipTextSelected]}>
                    {value === 'ALL' ? 'Any' : priorityMeta[value].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.applyButton} onPress={() => setFilterOpen(false)}>
              <Text style={styles.applyButtonText}>Show Reports</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Report detail */}
      <Modal visible={!!selectedId} transparent animationType="slide" onRequestClose={closeDetail}>
        <Pressable style={styles.sheetBackdrop} accessibilityLabel="Close report" onPress={closeDetail}>
          <Pressable style={[styles.sheet, styles.detailSheet]} onPress={() => undefined}>
            {!detail ? (
              <View style={styles.detailLoading}>
                {detailError ? (
                  <>
                    <Text accessibilityRole="alert" style={styles.errorText}>{detailError}</Text>
                    <TouchableOpacity onPress={closeDetail}>
                      <Text style={styles.retryText}>Close</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <ActivityIndicator color={theme.colors.primary} />
                )}
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.detailRef}>Ticket {detail.ref}</Text>
                  <TouchableOpacity accessibilityLabel="Close report" onPress={closeDetail}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.detailTitleRow}>
                  <View style={[styles.reportIcon, { backgroundColor: categoryMeta[detail.category].background }]}>
                    <Ionicons name={categoryMeta[detail.category].icon} size={22} color={categoryMeta[detail.category].color} />
                  </View>
                  <Text style={styles.detailTitle}>{categoryMeta[detail.category].label}</Text>
                </View>
                <View style={styles.reportTags}>
                  <Text style={[styles.smallTag, { color: statusMeta[detail.status].color, backgroundColor: statusMeta[detail.status].background }]}>
                    {statusMeta[detail.status].label}
                  </Text>
                  <Text style={[styles.smallTag, { color: priorityMeta[detail.priority].color, backgroundColor: priorityMeta[detail.priority].background }]}>
                    {priorityMeta[detail.priority].label} priority
                  </Text>
                </View>
                <Text style={styles.detailDescription}>{detail.description}</Text>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailInfoText}>Reported on {formatReportDate(detail.createdAt)} by {detail.reporterLabel}</Text>
                  {detail.eventTitle ? <Text style={styles.detailInfoText}>Related event: {detail.eventTitle}</Text> : null}
                  {detail.resolutionNote ? <Text style={styles.detailInfoText}>Resolution: {detail.resolutionNote}</Text> : null}
                </View>
                {detail.evidence.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.detailEvidence}>
                    {detail.evidence.map((uri, index) => (
                      <Image key={index} source={{ uri }} style={styles.detailEvidenceImage} accessibilityLabel={`Evidence photo ${index + 1}`} />
                    ))}
                  </ScrollView>
                ) : null}

                {statusActions[detail.status].some((a) => a.to === 'RESOLVED') ? (
                  <>
                    <Text style={styles.sheetLabel}>RESOLUTION NOTE</Text>
                    <TextInput
                      multiline
                      maxLength={1000}
                      value={resolution}
                      onChangeText={setResolution}
                      placeholder="Describe the action taken (required to resolve)..."
                      placeholderTextColor="#94A3B8"
                      style={styles.resolutionInput}
                      textAlignVertical="top"
                      accessibilityLabel="Resolution note"
                    />
                  </>
                ) : null}
                {actionError ? <Text accessibilityRole="alert" style={[styles.errorText, { marginTop: 8 }]}>{actionError}</Text> : null}
                <View style={styles.detailActions}>
                  {statusActions[detail.status].map((action) => (
                    <TouchableOpacity
                      key={action.to}
                      disabled={!!updating}
                      onPress={() => changeStatus(action.to)}
                      style={[
                        styles.detailAction,
                        action.primary ? { backgroundColor: action.color } : { borderColor: action.color, borderWidth: 1 },
                        updating && updating !== action.to ? { opacity: 0.5 } : null,
                      ]}
                    >
                      {updating === action.to ? (
                        <ActivityIndicator color={action.primary ? '#FFFFFF' : action.color} />
                      ) : (
                        <>
                          <Ionicons name={action.icon} size={18} color={action.primary ? '#FFFFFF' : action.color} />
                          <Text style={[styles.detailActionText, { color: action.primary ? '#FFFFFF' : action.color }]}>{action.label}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Evidence gallery */}
      <Modal visible={galleryOpen} transparent animationType="fade" onRequestClose={() => setGalleryOpen(false)}>
        <View style={styles.galleryBackdrop}>
          <View style={styles.galleryHeader}>
            <Text style={styles.galleryTitle}>On-Site Evidence{allEvidence ? ` (${allEvidence.total})` : ''}</Text>
            <TouchableOpacity accessibilityLabel="Close evidence" onPress={() => setGalleryOpen(false)} style={styles.galleryClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {galleryError ? <Text style={[styles.errorText, { color: '#FCA5A5', padding: 16 }]}>{galleryError}</Text> : null}
          {!allEvidence && !galleryError ? <ActivityIndicator style={styles.loading} color="#FFFFFF" /> : null}
          <ScrollView contentContainerStyle={styles.galleryGrid}>
            {allEvidence?.items.map((item) => (
              <View key={`${item.reportId}-${item.index}`} style={styles.galleryItem}>
                <Image source={{ uri: item.image }} style={styles.galleryImage} />
                <Text style={styles.evidenceRef}>{item.ref}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonActive: { backgroundColor: theme.colors.primary },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  subTitles: { flex: 1, marginHorizontal: 10 },
  pageTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  pageSubtitle: { fontSize: 11, color: '#334155', marginTop: 1 },
  scrollContent: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: theme.colors.text, paddingVertical: 12 },
  notice: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14 },
  noticeAlert: { backgroundColor: '#E8EEF8' },
  noticeCalm: { backgroundColor: '#ECFDF5' },
  noticeIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  noticeBody: { flex: 1, marginLeft: 12 },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  noticeText: { fontSize: 12, color: '#334155', marginTop: 2 },
  noticeShield: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: { gap: 8, paddingVertical: 14 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabSelected: { backgroundColor: '#0F172A' },
  tabText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  tabTextSelected: { color: '#FFFFFF' },
  tabCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
    backgroundColor: '#E0E7FF',
    borderRadius: 9,
    minWidth: 18,
    paddingHorizontal: 5,
    textAlign: 'center',
    overflow: 'hidden',
  },
  tabCountSelected: { color: '#FFFFFF', backgroundColor: '#334155' },
  activeFilters: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  activeFiltersText: { fontSize: 12, color: '#475569' },
  linkText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#B42318', fontSize: 13, lineHeight: 19 },
  retryText: { color: theme.colors.primary, fontWeight: '700', fontSize: 13, paddingTop: 8 },
  loading: { marginVertical: 32 },
  reportCard: { backgroundColor: theme.colors.surface, borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  reportTop: { flexDirection: 'row', padding: 14, gap: 12 },
  reportIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  reportBody: { flex: 1 },
  reportTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  reportTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.text },
  statusPill: {
    fontSize: 10,
    fontWeight: '800',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  reportDescription: { fontSize: 13, lineHeight: 19, color: '#334155', marginTop: 4 },
  reportTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  smallTag: {
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
    maxWidth: 220,
  },
  eventTag: { color: '#166534', backgroundColor: '#DCFCE7' },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reportFooterText: { flex: 1, fontSize: 11, color: '#334155' },
  evidenceCount: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  evidenceCountText: { fontSize: 11, color: '#475569' },
  empty: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 19, color: theme.colors.muted, textAlign: 'center' },
  evidenceCard: { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, marginTop: 12 },
  evidenceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  evidenceTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  evidenceRow: { flexDirection: 'row', gap: 8 },
  evidenceThumb: { flex: 1, aspectRatio: 0.85, borderRadius: 10, overflow: 'hidden', backgroundColor: '#E2E8F0' },
  evidenceImage: { width: '100%', height: '100%' },
  evidenceRef: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  evidenceMore: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0E7FF', gap: 4 },
  evidenceMoreText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  evidenceEmpty: { fontSize: 12, color: theme.colors.muted },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2F6E3B',
    borderRadius: 26,
    minHeight: 52,
    marginTop: 20,
  },
  logButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
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
  detailSheet: { maxHeight: '88%' },
  detailLoading: { paddingVertical: 32, alignItems: 'center' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  sheetLabel: { fontSize: 11, fontWeight: '700', color: '#667085', letterSpacing: 0.8, marginTop: 18, marginBottom: 10 },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetChip: { borderWidth: 1, borderColor: '#DCE3EC', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  sheetChipSelected: { backgroundColor: '#166534', borderColor: '#166534' },
  sheetChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.text },
  sheetChipTextSelected: { color: '#FFFFFF' },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  applyButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  detailRef: { fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 0.4 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  detailTitle: { flex: 1, fontSize: 19, fontWeight: '800', color: theme.colors.text },
  detailDescription: { fontSize: 14, lineHeight: 21, color: '#334155', marginTop: 12 },
  detailInfo: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 12, gap: 4 },
  detailInfoText: { fontSize: 12, lineHeight: 18, color: '#334155' },
  detailEvidence: { gap: 8, marginTop: 12 },
  detailEvidenceImage: { width: 140, height: 110, borderRadius: 10, backgroundColor: '#E2E8F0' },
  resolutionInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#DCE3EC',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.text,
  },
  detailActions: { gap: 8, marginTop: 16 },
  detailAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
  },
  detailActionText: { fontSize: 14, fontWeight: '700' },
  galleryBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.92)' },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  galleryTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  galleryClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  galleryItem: { width: '48%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1F2937' },
  galleryImage: { width: '100%', height: '100%' },
});
