import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';

interface OrganizerBottomNavProps {
  activeTab: 'Home' | 'Events' | 'Messages' | 'Profile';
  onTabPress?: (tabName: 'Home' | 'Events' | 'Messages' | 'Profile') => void;
}

export const OrganizerBottomNav: React.FC<OrganizerBottomNavProps> = ({ activeTab, onTabPress }) => {
  const tabs: {
    key: 'Home' | 'Events' | 'Messages' | 'Profile';
    label: string;
    activeIcon: keyof typeof Ionicons.glyphMap;
    inactiveIcon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { key: 'Home', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
    { key: 'Events', label: 'Events', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
    { key: 'Messages', label: 'Messages', activeIcon: 'chatbubbles', inactiveIcon: 'chatbubbles-outline' },
    { key: 'Profile', label: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((t) => {
        const isActive = activeTab === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tabButton}
            activeOpacity={0.7}
            onPress={() => onTabPress?.(t.key)}
          >
            <Ionicons
              name={isActive ? t.activeIcon : t.inactiveIcon}
              size={22}
              color={isActive ? theme.colors.primary : theme.colors.muted}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: '500',
    marginTop: 2,
  },
  activeLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
