import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { User } from '../../services/api';
import { AuthorityDashboard, authorityService } from '../../services/authority';
import AuthorityHeader, { AuthorityScreen } from './components/AuthorityHeader';

export type { AuthorityScreen };
type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  user: User;
  onNavigate: (screen: AuthorityScreen) => void;
  logout: () => void;
}

const SYNC_INTERVAL_MS = 30000;

export default function AuthorityDashboardScreen({ user, onNavigate, logout }: Props) {
  const [stats, setStats] = useState<AuthorityDashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const active = useRef(true);
  const busy = useRef(false);

  const fetchStats = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setSyncing(true);
    try {
      const data = await authorityService.getDashboard();
      if (active.current) {
        setStats(data);
        setError('');
      }
    } catch (err) {
      if (active.current) setError(err instanceof Error ? err.message : 'Could not load the festival queue. Please retry.');
    } finally {
      busy.current = false;
      if (active.current) {
        setLoading(false);
        setRefreshing(false);
        setSyncing(false);
      }
    }
  }, []);

  // Live sync: refresh periodically and whenever the app returns to the foreground.
  useEffect(() => {
    active.current = true;
    fetchStats();
    const timer = setInterval(fetchStats, SYNC_INTERVAL_MS);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchStats();
    });
    return () => {
      active.current = false;
      clearInterval(timer);
      listener.remove();
    };
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const firstName = user.fullName.trim().split(/\s+/)[0] || user.fullName;
  const value = (count?: number) => (stats && count !== undefined ? String(count) : '–');

  const queueCards: {
    key: string;
    label: string;
    count?: number;
    icon: IconName;
    iconColor: string;
    iconBackground: string;
    accent: string;
    badge?: { text: string; color: string; background: string };
    numberColor?: string;
  }[] = [
    {
      key: 'pending',
      label: 'Pending Review',
      count: stats?.pendingReview,
      icon: 'hourglass',
      iconColor: '#B45309',
      iconBackground: '#FEF3C7',
      accent: '#FEF3C7',
      badge: stats?.newPendingToday ? { text: `+${stats.newPendingToday} new`, color: '#92400E', background: '#FDE68A' } : undefined,
    },
    {
      key: 'verified',
      label: 'Verified Active',
      count: stats?.verifiedActive,
      icon: 'shield-checkmark',
      iconColor: '#FFFFFF',
      iconBackground: '#22C55E',
      accent: '#BBF7D0',
      badge: stats
        ? stats.pendingReview === 0 && stats.flagged === 0
          ? { text: 'All Clear', color: '#166534', background: '#DCFCE7' }
          : { text: 'Active', color: '#166534', background: '#DCFCE7' }
        : undefined,
    },
    {
      key: 'flagged',
      label: 'Flagged Items',
      count: stats?.flagged,
      icon: 'flag',
      iconColor: '#B91C1C',
      iconBackground: '#FEE2E2',
      accent: '#FEE2E2',
      numberColor: '#B91C1C',
      badge: stats?.flagged ? { text: 'Urgent', color: '#B91C1C', background: '#FEE2E2' } : undefined,
    },
    {
      key: 'reports',
      label: 'Public Reports',
      count: stats?.openReports,
      icon: 'warning-outline',
      iconColor: '#1E3A8A',
      iconBackground: '#DBEAFE',
      accent: '#DBEAFE',
      badge: stats?.openReports ? { text: 'Open', color: '#1E3A8A', background: '#DBEAFE' } : undefined,
    },
  ];

  const actions: {
    title: string;
    subtitle: string;
    icon: IconName;
    iconColor: string;
    iconBackground: string;
    target: AuthorityScreen;
    dot?: boolean;
    tag?: string;
  }[] = [
    {
      title: 'Review Event Listings',
      subtitle: 'Approve or reject events',
      icon: 'calendar-outline',
      iconColor: theme.colors.primary,
      iconBackground: '#E0F2FE',
      target: 'Events',
      dot: !!stats?.pendingReview,
    },
    {
      title: 'Reports & Complaints',
      subtitle: 'Manage flagged content',
      icon: 'shield-outline',
      iconColor: '#B91C1C',
      iconBackground: '#FEE2E2',
      target: 'Reports',
      tag: stats && stats.openReports + stats.flagged > 0 ? 'Action Needed' : undefined,
    },
    {
      title: 'Publish Notice / Alert',
      subtitle: 'Share safety updates',
      icon: 'megaphone-outline',
      iconColor: '#1E3A8A',
      iconBackground: '#E0E7FF',
      target: 'PublishAlert',
    },
    {
      title: 'Tourist Support',
      subtitle: 'Help visitors & guide them',
      icon: 'headset-outline',
      iconColor: '#166534',
      iconBackground: '#DCFCE7',
      target: 'TouristSupport',
    },
  ];

  return (
    <View style={styles.container}>
      <AuthorityHeader title="Dashboard" user={user} onNavigate={onNavigate} logout={logout} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
      >
        {/* Officer card */}
        <View style={styles.officerCard}>
          <View style={styles.officerAvatar}>
            <Text style={styles.officerInitial}>{firstName.slice(0, 1).toUpperCase()}</Text>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.officerInfo}>
            <View style={styles.helloRow}>
              <Text style={styles.helloText} numberOfLines={1}>Hello, {firstName}</Text>
              <Text style={styles.onlinePill}>Online</Text>
            </View>
            <Text style={styles.officerTitle}>Tourism Officer</Text>
            <Text style={styles.officerMeta}>Tourism Authority • Sri Lanka</Text>
          </View>
          <TouchableOpacity accessibilityLabel="View officer profile" onPress={() => onNavigate('Profile')} style={styles.idButton}>
            <Ionicons name="id-card-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Festival queue status */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Festival Queue Status</Text>
          <TouchableOpacity accessibilityLabel="Sync now" onPress={fetchStats} style={styles.syncButton}>
            {syncing ? <ActivityIndicator size="small" color={theme.colors.text} /> : <Ionicons name="sync-outline" size={13} color={theme.colors.text} />}
            <Text style={styles.syncText}>Live Sync</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchStats}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.grid}>
          {queueCards.map((card) => (
            <View key={card.key} style={styles.statCard}>
              <View style={[styles.statAccent, { backgroundColor: card.accent }]} />
              <View style={styles.statTop}>
                <View style={[styles.statIcon, { backgroundColor: card.iconBackground }]}>
                  <Ionicons name={card.icon} size={18} color={card.iconColor} />
                </View>
                {card.badge ? (
                  <Text style={[styles.statBadge, { color: card.badge.color, backgroundColor: card.badge.background }]}>{card.badge.text}</Text>
                ) : null}
              </View>
              {loading && !stats ? (
                <ActivityIndicator style={styles.statLoading} color={theme.colors.primary} />
              ) : (
                <Text style={[styles.statNumber, card.numberColor ? { color: card.numberColor } : null]}>{value(card.count)}</Text>
              )}
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Administrative actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Administrative Actions</Text>
          <Text style={styles.quickAccess}>Quick Access</Text>
        </View>

        {actions.map((action) => (
          <TouchableOpacity
            key={action.title}
            style={styles.actionCard}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={action.title}
            onPress={() => onNavigate(action.target)}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.iconBackground }]}>
              <Ionicons name={action.icon} size={22} color={action.iconColor} />
            </View>
            <View style={styles.actionBody}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionTitle} numberOfLines={1}>{action.title}</Text>
                {action.dot ? <View style={styles.actionDot} /> : null}
                {action.tag ? <Text style={styles.actionTag}>{action.tag}</Text> : null}
              </View>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            <View style={styles.chevron}>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Heritage banner */}
        <ImageBackground
          source={require('../../../assets/welcome.jpg')}
          style={styles.banner}
          imageStyle={styles.bannerImage}
          accessibilityLabel="Sigiriya rock fortress"
        >
          <View style={styles.bannerOverlay}>
            <View style={styles.bannerPill}>
              <Ionicons name="leaf" size={11} color="#FFFFFF" />
              <Text style={styles.bannerPillText}>SRI LANKA TOURISM</Text>
            </View>
            <Text style={styles.bannerTitle}>Festival Safety & Heritage</Text>
            <Text style={styles.bannerText}>• Safe Events • Stronger Communities • A Brighter Sri Lanka</Text>
          </View>
        </ImageBackground>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.primary} />
          <Text style={styles.footerText}>Authorized Tourism Regulatory System • Sri Lanka</Text>
        </View>
      </ScrollView>

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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  officerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  officerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  officerInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  officerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  helloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helloText: {
    fontSize: 13,
    color: '#374151',
    flexShrink: 1,
  },
  onlinePill: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  officerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 2,
  },
  officerMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 2,
  },
  idButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minHeight: 32,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
  },
  quickAccess: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  statCard: {
    width: '48.5%',
    minHeight: 112,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    overflow: 'hidden',
  },
  statAccent: {
    position: 'absolute',
    top: -14,
    right: -14,
    width: 48,
    height: 48,
    borderRadius: 14,
    opacity: 0.8,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadge: {
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 10,
  },
  statLoading: {
    alignSelf: 'flex-start',
    marginTop: 14,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: {
    flex: 1,
    marginLeft: 14,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    flexShrink: 1,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  actionTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 3,
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  banner: {
    height: 190,
    marginTop: 14,
  },
  bannerImage: {
    borderRadius: 16,
  },
  bannerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 20, 10, 0.45)',
  },
  bannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#166534',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  bannerPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  bannerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#F1F5F9',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 20,
  },
  footerText: {
    fontSize: 11,
    color: '#374151',
  },
});
