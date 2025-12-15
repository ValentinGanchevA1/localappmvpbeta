// src/screens/settings/NotificationSettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/config/theme';

export const NotificationSettingsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      <Text style={styles.subtitle}>
        Manage your notification preferences here.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    padding: 20,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZES.LG,
    fontWeight: TYPOGRAPHY.WEIGHTS.BOLD,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.GRAY,
  },
});

export default NotificationSettingsScreen;
