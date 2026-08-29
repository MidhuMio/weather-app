import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSettingsStyles } from '@/assets/styles/settings.styles';
import { useAppTheme } from '@/context/theme-context';
import { useWeather } from '@/context/weather-context';

export default function SettingsScreen() {
  const { mode, colors, toggleTheme } = useAppTheme();
  const { units, windUnit, setTemperatureUnit, setWindUnit } = useWeather();
  const styles = createSettingsStyles(colors);

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Personalise your weather experience.
          </Text>

          <LinearGradient
            colors={colors.gradients.surface}
            style={styles.themeSection}>
            <Text style={styles.sectionLabel}>App theme</Text>

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
          </LinearGradient>

          <LinearGradient
            colors={colors.gradients.surface}
            style={styles.themeSection}>
            <Text style={styles.sectionLabel}>Temperature</Text>

            <View style={styles.themeOptions}>
              <Pressable
                style={[
                  styles.themeOption,
                  units === 'metric' && styles.themeOptionSelected,
                ]}
                onPress={() => setTemperatureUnit('metric')}>
                <Text style={styles.themeOptionText}>Celsius °C</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.themeOption,
                  units === 'imperial' && styles.themeOptionSelected,
                ]}
                onPress={() => setTemperatureUnit('imperial')}>
                <Text style={styles.themeOptionText}>Fahrenheit °F</Text>
              </Pressable>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={colors.gradients.surface}
            style={styles.themeSection}>
            <Text style={styles.sectionLabel}>Wind speed</Text>

            <View style={styles.themeOptions}>
              <Pressable
                style={[
                  styles.themeOption,
                  windUnit === 'kph' && styles.themeOptionSelected,
                ]}
                onPress={() => setWindUnit('kph')}>
                <Text style={styles.themeOptionText}>km/h</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.themeOption,
                  windUnit === 'mph' && styles.themeOptionSelected,
                ]}
                onPress={() => setWindUnit('mph')}>
                <Text style={styles.themeOptionText}>mph</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}