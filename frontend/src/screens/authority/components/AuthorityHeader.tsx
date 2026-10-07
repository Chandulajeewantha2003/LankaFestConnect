import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { User } from '../../../services/api';

export type AuthorityScreen = 'Home' | 'Events' | 'Audit' | 'Reports' | 'NewReport' | 'Profile' | 'PublishAlert' | 'TouristSupport' | 'Notifications';
type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  title: string;
  user: User;
  onNavigate: (screen: AuthorityScreen) => void;
  logout: () => void;
}

const menuItems: { label: string; icon: IconName; target: AuthorityScreen }[] = [
  { label: 'Dashboard', icon: 'grid-outline', target: 'Home' },
  { label: 'Review Event Listings', icon: 'calendar-outline', target: 'Events' },
  { label: 'Reports & Complaints', icon: 'flag-outline', target: 'Reports' },
  { label: 'Publish Notice / Alert', icon: 'megaphone-outline', target: 'PublishAlert' },
  { label: 'Tourist Support', icon: 'headset-outline', target: 'TouristSupport' },
  { label: 'Profile', icon: 'person-outline', target: 'Profile' },
];

// Shared top bar for Tourism Officer screens: menu, title, notifications and profile.
export default function AuthorityHeader({ title, user, onNavigate, logout }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Open menu" onPress={() => setMenuOpen(true)} style={styles.headerIcon}>
          <Ionicons name="menu" size={26} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerBrand}>LANKAFEST CONNECT</Text>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <TouchableOpacity accessibilityLabel="Open notifications" onPress={() => onNavigate('Notifications')} style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={23} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Open tourist support" onPress={() => onNavigate('TouristSupport')} style={styles.headerIcon}>
          <Ionicons name="headset-outline" size={23} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Open profile" onPress={() => onNavigate('Profile')} style={styles.headerAvatar}>
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} accessibilityLabel="Close menu" onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuPanel} onPress={() => undefined}>
            <Text style={styles.menuBrand}>LANKAFEST CONNECT</Text>
            <Text style={styles.menuName} numberOfLines={1}>{user.fullName}</Text>
            <Text style={styles.menuEmail} numberOfLines={1}>{user.email}</Text>
            <View style={styles.menuDivider} />
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  onNavigate(item.target);
                }}
              >
                <Ionicons name={item.icon} size={20} color={theme.colors.text} />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                logout();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
              <Text style={[styles.menuItemText, { color: theme.colors.danger }]}>Log Out</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
  headerTitles: {
    flex: 1,
    marginLeft: 4,
  },
  headerBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 1,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  menuPanel: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingTop: 56,
  },
  menuBrand: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.8,
  },
  menuName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 10,
  },
  menuEmail: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 46,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
