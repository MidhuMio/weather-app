import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createSettingsStyles } from '@/assets/styles/settings.styles';
import { useAppTheme } from '@/context/theme-context';

export default function SettingsScreen() {
  const { mode, colors, toggleTheme } = useAppTheme();
  const styles = createSettingsStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Personalise your weather experience.</Text>

        <View style={styles.themeSection}>
          <Text style={styles.sectionLabel}>App Theme</Text>

          <View style={styles.themeOptions}>
            <Pressable
              style={[
                styles.themeOption,
                mode === 'light' && styles.themeOptionSelected,
              ]}
              onPress={() => {
                if (mode !== 'light') {
                  toggleTheme();
                }
              }}>
              <Ionicons name="sunny" size={18} color={colors.text} />
              <Text style={styles.themeOptionText}>Light Mode</Text>
            </Pressable>

            <Pressable
              style={[
                styles.themeOption,
                mode === 'dark' && styles.themeOptionSelected,
              ]}
              onPress={() => {
                if (mode !== 'dark') {
                  toggleTheme();
                }
              }}>
              <Ionicons name="moon" size={18} color={colors.text} />
              <Text style={styles.themeOptionText}>Dark Mode</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}