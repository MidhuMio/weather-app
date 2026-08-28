import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WeatherProvider } from '@/context/weather-context';
import { ThemeProvider, useAppTheme } from '@/context/theme-context';

function AppNavigator() {
  const { colors, isReady } = useAppTheme();

  if (!isReady) {
    return null;
  }

  return (
    <>
      <StatusBar style={colors.statusBarStyle} />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 72,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Weather',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="partly-sunny-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="cities"
          options={{
            title: 'Location',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="location-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <WeatherProvider>
        <AppNavigator />
      </WeatherProvider>
    </ThemeProvider>
  );
}