import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createCitiesStyles } from '@/assets/styles/cities.styles';
import { useAppTheme } from '@/context/theme-context';
import { useWeather } from '@/context/weather-context';
import { searchCities } from '@/services/weather-service';
import type { City } from '@/types/weather';
import { WEATHER_CONFIG } from '@/constants/weather';
import { citiesMatch } from '@/utils/city';
import { LinearGradient } from 'expo-linear-gradient';

export default function CitiesScreen() {
  const { colors } = useAppTheme();
  const {
    savedCities,
    selectedCity,
    favouriteCity,
    isLoading,
    loadWeatherForCity,
    addSavedCity,
    removeSavedCity,
    setFavouriteCity,
    removeFavouriteCity,
  } = useWeather();

  const handleQueryChange = (value: string) => {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      setSearchError(null);
    }
  };
  const styles = createCitiesStyles(colors);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const cityQuery = query.trim();

    if (!cityQuery) {
      return;
    }

    let isCurrent = true;

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const cities = await searchCities(cityQuery);

        if (isCurrent) {
          setResults(cities);
        }
      } catch (error) {
        if (isCurrent) {
          setResults([]);
          setSearchError(
            error instanceof Error
              ? error.message
              : 'Unable to search for cities.'
          );
        }
      } finally {
        if (isCurrent) {
          setIsSearching(false);
        }
      }
    }, WEATHER_CONFIG.SEARCH_DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [query]);

  const handleSelectCity = async (city: City) => {
    setQuery('');
    setResults([]);
    await loadWeatherForCity(city);
    router.replace('/');
  };

  const handleAddCity = async (city: City) => {
    await addSavedCity(city);
    setQuery('');
    setResults([]);
    setSearchError(null);
  };

  const isSaved = (city: City) =>
    savedCities.some((savedCity) => citiesMatch(savedCity, city));

  const isSelected = (city: City) =>
    selectedCity ? citiesMatch(selectedCity, city) : false;

  const isFavourite = (city: City) =>
    favouriteCity ? citiesMatch(favouriteCity, city) : false;

  const handleFavouriteCity = async (city: City) => {
    if (isFavourite(city)) {
      await removeFavouriteCity();
      return;
    }

    await setFavouriteCity(city);
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Location</Text>
          <Text style={styles.subtitle}>
            Search for a city or choose one you have saved.
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search city"
              placeholderTextColor={colors.textMuted}
            />

            {isSearching && (
              <ActivityIndicator
                style={styles.searchSpinner}
                color={colors.primary}
              />
            )}
          </View>

          {searchError && <Text style={styles.errorText}>{searchError}</Text>}

          {query.trim() && !isSearching && results.length === 0 && !searchError && (
            <Text style={styles.message}>No matching cities were found.</Text>
          )}

          {results.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Search results</Text>

              <View style={styles.cityList}>
                {results.map((city) => (
                  <LinearGradient
                    key={city.id}
                    colors={colors.gradients.surface}
                    style={styles.cityCard}>
                    <Pressable
                      style={styles.cityButton}
                      onPress={() => handleSelectCity(city)}>
                      <Text style={styles.cityName}>{city.name}</Text>
                      <Text style={styles.cityDetails}>
                        {[city.state, city.country].filter(Boolean).join(', ')}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.actionButton, styles.addButton]}
                      onPress={() => handleAddCity(city)}>
                      <Ionicons
                        name={isSaved(city) ? 'checkmark' : 'add'}
                        size={22}
                        color={colors.text}
                      />
                    </Pressable>
                  </LinearGradient>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Saved locations</Text>

          {savedCities.length === 0 ? (
            <Text style={styles.message}>
              Search for a city and press + to save it here.
            </Text>
          ) : (
            <View style={styles.cityList}>
              {savedCities.map((city) => (
                <LinearGradient
                  key={city.id}
                  colors={colors.gradients.surface}
                  style={[
                    styles.cityCard,
                    isSelected(city) && styles.selectedCity,
                  ]}>
                  <Pressable
                    style={styles.cityButton}
                    onPress={() => handleSelectCity(city)}>
                    <Text style={styles.cityName}>{city.name}</Text>
                    <Text style={styles.cityDetails}>
                      {[city.state, city.country].filter(Boolean).join(', ')}
                    </Text>
                  </Pressable>

                  <View style={styles.actionGroup}>
                    <Pressable
                      style={[
                        styles.actionButton,
                        styles.favouriteButton,
                        isFavourite(city) && styles.activeFavouriteButton,
                      ]}
                      onPress={() => handleFavouriteCity(city)}>
                      <Ionicons
                        name={isFavourite(city) ? "star" : "star-outline"}
                        size={20}
                        color={
                          isFavourite(city) ? "#FFFFFF" : colors.textMuted
                        }
                      />
                    </Pressable>

                    {isLoading && isSelected(city) ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <Pressable
                        style={[styles.actionButton, styles.removeButton]}
                        onPress={() => removeSavedCity(city)}>
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={colors.textMuted}
                        />
                      </Pressable>
                    )}
                  </View>
                </LinearGradient>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}