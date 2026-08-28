import { StyleSheet } from 'react-native';

import type { AppColors } from '@/context/theme-context';

export const createCitiesStyles = (colors: AppColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 32,
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
    searchRow: {
      marginTop: 24,
      position: 'relative',
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      color: colors.text,
      fontSize: 16,
      paddingHorizontal: 16,
      paddingRight: 48,
      paddingVertical: 13,
    },
    searchSpinner: {
      position: 'absolute',
      right: 16,
      top: 13,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginTop: 28,
    },
    message: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 12,
    },
    errorText: {
      color: '#C44747',
      fontSize: 14,
      marginTop: 12,
    },
    cityList: {
      gap: 10,
      marginTop: 14,
    },
    cityCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      padding: 14,
    },
    cityButton: {
      flex: 1,
    },
    cityName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    cityDetails: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 3,
    },
    actionButton: {
      alignItems: 'center',
      borderRadius: 12,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    addButton: {
      backgroundColor: colors.primary,
    },
    removeButton: {
      backgroundColor: colors.background,
    },
    selectedCity: {
      borderColor: colors.primary,
    },
  });