import { StyleSheet } from 'react-native';

import type { AppColors } from '@/context/theme-context';

export const createSettingsStyles = (colors: AppColors) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 24,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '700',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      marginTop: 8,
    },
    themeSection: {
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      marginTop: 24,
      padding: 18,
    },
    sectionLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 12,
    },
    themeOptions: {
      flexDirection: 'row',
      gap: 10,
    },
    themeOption: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      paddingVertical: 14,
    },
    themeOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeOptionText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
  });