import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';

interface Props {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onBack: () => void;
  backLabel?: string;
  children?: React.ReactNode;
}

// Shown for Tourism Officer sections whose screens have not been built yet.
export default function AuthorityPlaceholder({ title, description, icon, onBack, backLabel = 'Dashboard', children }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity accessibilityLabel={`Back to ${backLabel}`} onPress={onBack} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        <Text style={styles.backText}>{backLabel}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.empty}>
        <View style={styles.iconTile}>
          <Ionicons name={icon} size={30} color={theme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Coming soon</Text>
        <Text style={styles.emptyText}>{description}</Text>
      </View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: theme.spacing.md },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, marginLeft: -4 },
  backText: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginLeft: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#182230', marginTop: 8, marginBottom: 20 },
  empty: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3E5E1',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  iconTile: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#182230', marginBottom: 6 },
  emptyText: { fontSize: 13, lineHeight: 20, color: theme.colors.muted, textAlign: 'center' },
});
