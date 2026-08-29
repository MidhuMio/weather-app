import { createWeatherStyles, type WeatherStyles } from "@/assets/styles/weather.styles";
import { WeatherIcon } from "@/components/weather-icon";
import { AppColors, useAppTheme } from "@/context/theme-context";
import { useWeather } from "@/context/weather-context";
import { getDailyForecast } from "@/utils/forecast";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WEATHER_CONFIG } from '@/constants/weather';
import { formatWindSpeed } from '@/utils/weather';

export default function WeatherScreen() {
  const { colors } = useAppTheme();
  const {
    weatherData,
    selectedCity,
    favouriteCity,
    favouriteWeather,
    units,
    windUnit,
    isReady,
    isLoading,
    isFavouriteLoading,
    isUsingCachedData,
    isFavouriteUsingCachedData,
    error,
    favouriteError,
    loadWeatherForCity,
    refreshWeather,
    refreshFavouriteWeather,
  } = useWeather();

  const [locationError, setLocationError] = useState<string | null>(null);
  const hasRequestedLocation = useRef(false);
  const hasRequestedFavourite = useRef(false);
  const styles = createWeatherStyles(colors);

  const loadDeviceLocation = useCallback(async () => {
    setLocationError(null);

    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== "granted") {
      setLocationError(
        "Location permission was not granted. Search for a city instead.",
      );
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await loadWeatherForCity({
        id: "device-location",
        name: "Current location",
        country: "",
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch {
      setLocationError(
        "Your location could not be found. Check location services and try again.",
      );
    }
  }, [loadWeatherForCity]);

  useEffect(() => {
    if (!isReady || weatherData || hasRequestedLocation.current) {
      return;
    }

    hasRequestedLocation.current = true;
    loadDeviceLocation();
  }, [isReady, loadDeviceLocation, weatherData]);

  useEffect(() => {
    if (!isReady || !favouriteCity || hasRequestedFavourite.current) {
      return;
    }

    hasRequestedFavourite.current = true;
    refreshFavouriteWeather();
  }, [favouriteCity, isReady, refreshFavouriteWeather]);

  const handleRefresh = async () => {
    if (selectedCity) {
      await refreshWeather();
    } else {
      await loadDeviceLocation();
    }
  };

  const temperatureUnit = units === "metric" ? "°C" : "°F";
  const visibleError = locationError ?? error;

  if (!isReady || (isLoading && !weatherData)) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading weather…</Text>
      </View>
    );
  }

  if (!weatherData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <WeatherIcon condition="Clear" color={colors.primary} size={72} />
          <Text style={styles.emptyTitle}>Weather is ready when you are</Text>
          <Text style={styles.emptyText}>
            Allow location access to see the current forecast.
          </Text>

          {visibleError && <Text style={styles.errorText}>{visibleError}</Text>}

          <Pressable style={styles.primaryButton} onPress={loadDeviceLocation}>
            <Ionicons name="location-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Use my location</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const dailyForecast = getDailyForecast(weatherData.forecast);

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.cityName}>{weatherData.city.name}</Text>
            <Text style={styles.countryName}>{weatherData.city.country}</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerActionButton}
              onPress={loadDeviceLocation}>
              <Ionicons name="location-outline" size={20} color={colors.text} />
              <Text style={styles.headerActionText}>My location</Text>
            </Pressable>

            <Pressable
              style={styles.headerActionButton}
              onPress={handleRefresh}>
              <Ionicons name="refresh-outline" size={20} color={colors.text} />
              <Text style={styles.headerActionText}>Refresh</Text>
            </Pressable>
          </View>

          {isUsingCachedData && (
            <View style={styles.offlineBanner}>
              <Ionicons
                name="cloud-offline-outline"
                size={18}
                color={colors.text}
              />
              <Text style={styles.offlineText}>
                Saved weather ·{" "}
                {new Date(weatherData.fetchedAt).toLocaleTimeString()}
              </Text>
            </View>
          )}

          {visibleError && <Text style={styles.errorText}>{visibleError}</Text>}

          <LinearGradient
            colors={colors.gradients.surface}
            style={styles.heroCard}>
            <WeatherIcon
              condition={weatherData.current.condition.main}
              color={colors.primary}
              size={88}
            />
            <Text style={styles.temperature}>
              {weatherData.current.temperature}
              {temperatureUnit}
            </Text>
            <Text style={styles.condition}>
              {weatherData.current.condition.description}
            </Text>
            <Text style={styles.feelsLike}>
              Feels like {weatherData.current.feelsLike}
              {temperatureUnit}
            </Text>
          </LinearGradient>

          {favouriteCity && (

            <LinearGradient
              colors={colors.gradients.surface}
              style={styles.favouriteCard}>
              {isFavouriteLoading && !favouriteWeather ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : favouriteWeather ? (
                <>
                  <View style={styles.favouriteHeader}>
                    <View>
                      <View style={styles.favouriteLabel}>
                        <Ionicons
                          name="star"
                          size={14}
                          color={colors.primary}
                        />
                        <Text style={styles.favouriteLabelText}>Favourite</Text>
                      </View>

                      <Text style={styles.favouriteCityName}>
                        {favouriteWeather.city.name}
                      </Text>
                      <Text style={styles.favouriteCountry}>
                        {favouriteWeather.city.country}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.favouriteRefreshButton}
                      onPress={refreshFavouriteWeather}>
                      <Ionicons
                        name="refresh-outline"
                        size={20}
                        color={colors.text}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.favouriteWeather}>
                    <WeatherIcon
                      condition={favouriteWeather.current.condition.main}
                      color={colors.primary}
                      size={42}
                    />

                    <View>
                      <Text style={styles.favouriteTemperature}>
                        {favouriteWeather.current.temperature}
                        {temperatureUnit}
                      </Text>
                      <Text style={styles.favouriteCondition}>
                        {favouriteWeather.current.condition.description}
                      </Text>
                    </View>
                  </View>

                  {isFavouriteUsingCachedData && (
                    <Text style={styles.favouriteCachedText}>
                      Showing saved weather
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.favouriteError}>
                  {favouriteError ?? "Favourite weather is unavailable."}
                </Text>
              )}
            </LinearGradient>
          )}

          <Text style={styles.sectionTitle}>Current conditions</Text>

          <View style={styles.metricsGrid}>
            <Metric
              icon="water-outline"
              label="Humidity"
              value={`${weatherData.current.humidity}%`}
              colors={colors}
              styles={styles}
            />
            <Metric
              icon="leaf-outline"
              label="Wind"
              value={formatWindSpeed(
                weatherData.current.windSpeed,
                units,
                windUnit
              )}
              colors={colors}
              styles={styles}
            />
            <Metric
              icon="eye-outline"
              label="Visibility"
              value={
                weatherData.current.visibility === null
                  ? "—"
                  : `${weatherData.current.visibility} km`
              }
              colors={colors}
              styles={styles}
            />
            <Metric
              icon="speedometer-outline"
              label="Pressure"
              value={`${weatherData.current.pressure} hPa`}
              colors={colors}
              styles={styles}
            />
          </View>

          <Text style={styles.sectionTitle}>Upcoming forecast</Text>


          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.forecastList}
          >
            {weatherData.forecast.slice(0, WEATHER_CONFIG.UPCOMING_FORECAST_ITEMS).map((forecast) => (
              <LinearGradient
                key={forecast.dateTime}
                colors={colors.gradients.surface}
                style={styles.forecastCard}>
                <Text style={styles.forecastTime}>
                  {new Date(forecast.dateTime * 1000).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit"
                  })}
                </Text>
                <WeatherIcon
                  condition={forecast.condition.main}
                  color={colors.primary}
                  size={28}
                />
                <Text style={styles.forecastTemperature}>
                  {forecast.temperature}
                  {temperatureUnit}
                </Text>
                <Text style={styles.precipitation}>
                  {forecast.precipitationChance}% Rain
                </Text>
              </LinearGradient>
            ))}
          </ScrollView>
          <Text style={styles.sectionTitle}>5-day forecast</Text>
          <View style={styles.dailyList}>
            {dailyForecast.map((day) => (
              <LinearGradient
                key={day.dateTime}
                colors={colors.gradients.surface}
                style={styles.dailyCard}>
                <Text style={styles.dailyDay}>
                  {new Date(day.dateTime * 1000).toLocaleDateString([], {
                    weekday: 'short',
                  })}
                </Text>

                <WeatherIcon
                  condition={day.condition.main}
                  color={colors.primary}
                  size={26}
                />

                <Text style={styles.dailyCondition}>{day.condition.main}</Text>

                <View style={styles.dailyTemperatures}>
                  <Text style={styles.dailyLow}>
                    {day.minimumTemperature}
                    {temperatureUnit}  -{/* Dash to show min & max of temp */}
                  </Text>
                  <Text style={styles.dailyHigh}>
                    {day.maximumTemperature}
                    {temperatureUnit}
                  </Text>
                </View>
              </LinearGradient>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Metric({
  icon,
  label,
  value,
  colors,
  styles,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  colors: AppColors;
  styles: WeatherStyles;
}) {
  return (
    <LinearGradient
      colors={colors.gradients.surface}
      style={styles.metricCard}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </LinearGradient>
  );
}
