import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';

export type AuthorityTab = 'Home' | 'Events' | 'Reports' | 'Profile';

interface AuthorityBottomNavProps {
  activeTab: AuthorityTab | null;
  onTabPress: (tab: AuthorityTab) => void;
}

const tabs: {
  key: AuthorityTab;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'Home', activeIcon: 'grid', inactiveIcon: 'grid-outline' },
  { key: 'Events', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
  { key: 'Reports', activeIcon: 'flag', inactiveIcon: 'flag-outline' },
  { key: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline' },
];

export function AuthorityBottomNav({ activeTab, onTabPress }: AuthorityBottomNavProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onTabPress(tab.key)}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.inactiveIcon}
              size={22}
              color={isActive ? theme.colors.primary : '#4B5563'}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.key}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 3,
  },
  activeLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
