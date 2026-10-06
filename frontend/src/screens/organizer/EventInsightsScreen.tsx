import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { OrganizerBottomNav } from './components/OrganizerBottomNav';

interface Props {
  navigation?: any;
  route?: any;
}

export default function EventInsightsScreen({ navigation, route }: Props) {
  const eventId = route?.params?.eventId || 'evt_1';

  const [activeTab, setActiveTab] = useState<'Overview' | 'Attendees' | 'Messages'>('Overview');
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInsightsData = async () => {
    try {
      const data = await organizerEventService.getEventInsights(eventId);
      setInsights(data);
    } catch (err) {
      setInsights(defaultInsights);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsightsData();
  }, [eventId]);

  const displayData = insights || defaultInsights;

  return (
    <View style={styles.container}>
      {/* Top Header Bar matching teammate shared style */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Event Header Mini Card matching prototype Screen 6 */}
        <View style={styles.eventMiniCard}>
          <Image
            source={{
              uri:
                displayData.eventSummary?.images?.[0] ||
                'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=300&auto=format&fit=crop',
            }}
            style={styles.miniImage}
          />
          <View style={styles.miniDetails}>
            <Text style={styles.miniTitle}>{displayData.eventSummary?.title || 'Kandy Esala Perahera'}</Text>
            <Text style={styles.miniSubText}>
              {displayData.eventSummary?.startDate || 'Aug 10'} - {displayData.eventSummary?.endDate || 'Aug 20, 2025'}
            </Text>
            <Text style={styles.miniSubText}>{displayData.eventSummary?.city || 'Kandy'}</Text>
          </View>
        </View>

        {/* Tab Navigation (Overview / Attendees / Messages) */}
        <View style={styles.tabBar}>
          {(['Overview', 'Attendees', 'Messages'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            {/* Top Stat Cards */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="eye-outline" size={20} color={theme.colors.primary} style={{ marginBottom: 4 }} />
                <Text style={styles.statValue}>12.4K</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="heart-outline" size={20} color={theme.colors.danger} style={{ marginBottom: 4 }} />
                <Text style={styles.statValue}>1.2K</Text>
                <Text style={styles.statLabel}>Interested</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={20} color="#0284C7" style={{ marginBottom: 4 }} />
                <Text style={styles.statValue}>850</Text>
                <Text style={styles.statLabel}>Going</Text>
              </View>
            </View>

            {/* Interest Over Time Graph */}
            <Text style={styles.sectionTitle}>Interest Over Time</Text>

            <View style={styles.chartCard}>
              {/* Y-axis labels and chart visual */}
              <View style={styles.chartContainer}>
                <View style={styles.yAxis}>
                  <Text style={styles.axisLabel}>1.5K</Text>
                  <Text style={styles.axisLabel}>1K</Text>
                  <Text style={styles.axisLabel}>500</Text>
                  <Text style={styles.axisLabel}>0</Text>
                </View>

                <View style={styles.chartArea}>
                  {/* Grid Lines */}
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />

                  {/* Trend Line Visual matching prototype green area graph */}
                  <View style={styles.trendVisualLine} />
                  <View style={styles.trendFillArea} />
                  <View style={[styles.dataDot, { left: '8%', bottom: '25%' }]} />
                  <View style={[styles.dataDot, { left: '36%', bottom: '50%' }]} />
                  <View style={[styles.dataDot, { left: '64%', bottom: '60%' }]} />
                  <View style={[styles.dataDot, { left: '92%', bottom: '90%' }]} />
                </View>
              </View>

              {/* X-axis dates */}
              <View style={styles.xAxis}>
                <Text style={styles.axisLabel}>Jul 1</Text>
                <Text style={styles.axisLabel}>Jul 15</Text>
                <Text style={styles.axisLabel}>Aug 1</Text>
                <Text style={styles.axisLabel}>Aug 15</Text>
              </View>
            </View>

            {/* Recent Messages / Inquiries */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Messages / Inquiries</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {displayData.recentMessages?.map((msg: any) => (
              <View key={msg.id} style={styles.messageCard}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={{
                      uri:
                        msg.sender === 'Nimal Perera'
                          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop'
                          : msg.sender === 'Sahara Fernando'
                          ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop'
                          : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
                    }}
                    style={styles.msgAvatar}
                  />
                  {msg.isOnline && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.msgContent}>
                  <View style={styles.msgHeaderRow}>
                    <Text style={styles.senderName}>{msg.sender}</Text>
                    <Text style={styles.timeAgo}>{msg.timeAgo}</Text>
                  </View>
                  <Text style={styles.msgBody} numberOfLines={2}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Shared Bottom Nav */}
      <OrganizerBottomNav
        activeTab="Events"
        onTabPress={(tab) => {
          if (tab === 'Home') navigation?.navigate('OrganizerDashboard');
          if (tab === 'Events') navigation?.navigate('ManageEvent');
        }}
      />
    </View>
  );
}

const defaultInsights = {
  eventSummary: {
    title: 'Kandy Esala Perahera',
    startDate: 'Aug 10',
    endDate: 'Aug 20, 2025',
    city: 'Kandy',
    images: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=300&auto=format&fit=crop'],
  },
  viewsCount: 12400,
  interestedCount: 1200,
  goingCount: 850,
  recentMessages: [
    {
      id: 'm1',
      sender: 'Nimal Perera',
      timeAgo: '2 hours ago',
      isOnline: true,
      text: 'Hi! Are there group discounts available?',
    },
    {
      id: 'm2',
      sender: 'Sahara Fernando',
      timeAgo: '5 hours ago',
      isOnline: true,
      text: 'Is parking available at the venue?',
    },
    {
      id: 'm3',
      sender: 'Tharindu Silva',
      timeAgo: '1 day ago',
      isOnline: true,
      text: 'Can I get more information about VIP tickets?',
    },
  ],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  eventMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 10,
    marginBottom: 16,
  },
  miniImage: {
    width: 58,
    height: 58,
    borderRadius: 8,
  },
  miniDetails: {
    marginLeft: 12,
  },
  miniTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  miniSubText: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: 16,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabItem: {
    backgroundColor: '#DCFCE7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },
  seeAllText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 140,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  axisLabel: {
    fontSize: 10,
    color: theme.colors.muted,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  trendVisualLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    height: 60,
    borderTopWidth: 3,
    borderTopColor: theme.colors.primary,
    borderRadius: 30,
    transform: [{ skewY: '-12deg' }],
  },
  trendFillArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    backgroundColor: 'rgba(11, 122, 62, 0.12)',
    transform: [{ skewY: '-12deg' }],
  },
  dataDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 28,
    marginTop: 8,
  },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  msgAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  msgContent: {
    flex: 1,
    marginLeft: 12,
  },
  msgHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  timeAgo: {
    fontSize: 11,
    color: theme.colors.muted,
  },
  msgBody: {
    fontSize: 13,
    color: theme.colors.text,
  },
});
