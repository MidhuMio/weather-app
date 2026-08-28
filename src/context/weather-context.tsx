import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getWeatherForCoordinates } from '@/services/weather-service';
import { City, TemperatureUnit, WeatherData } from '@/types/weather';

interface WeatherContextValue {
  weatherData: WeatherData | null;
  selectedCity: City | null;
  savedCities: City[];
  units: TemperatureUnit;
  isReady: boolean;
  isLoading: boolean;
  isUsingCachedData: boolean;
  error: string | null;
  loadWeatherForCity: (city: City) => Promise<void>;
  refreshWeather: () => Promise<void>;
  addSavedCity: (city: City) => Promise<void>;
  removeSavedCity: (city: City) => Promise<void>;
  setTemperatureUnit: (units: TemperatureUnit) => Promise<void>;
  clearError: () => void;
}

const WEATHER_CACHE_PREFIX = '@weather_app/weather_cache_';
const UNITS_STORAGE_KEY = '@weather_app/temperature_units';
const SAVED_CITIES_STORAGE_KEY = '@weather_app/saved_cities';
const SELECTED_CITY_STORAGE_KEY = '@weather_app/selected_city';

const WeatherContext = createContext<WeatherContextValue | undefined>(undefined);

function getCacheKey(units: TemperatureUnit) {
  return `${WEATHER_CACHE_PREFIX}${units}`;
}

function citiesMatch(first: City, second: City) {
  return (
    first.latitude.toFixed(3) === second.latitude.toFixed(3) &&
    first.longitude.toFixed(3) === second.longitude.toFixed(3)
  );
}

async function getCachedWeather(units: TemperatureUnit) {
  const savedWeather = await AsyncStorage.getItem(getCacheKey(units));

  return savedWeather ? (JSON.parse(savedWeather) as WeatherData) : null;
}

async function canUseNetwork() {
  try {
    const networkState = await Network.getNetworkStateAsync();

    return (
      networkState.isConnected !== false &&
      networkState.isInternetReachable !== false
    );
  } catch {
    return true;
  }
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [savedCities, setSavedCities] = useState<City[]>([]);
  const [units, setUnits] = useState<TemperatureUnit>('metric');
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingCachedData, setIsUsingCachedData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function restoreAppState() {
      try {
        const [savedUnits, storedCities, storedSelectedCity] =
          await AsyncStorage.multiGet([
            UNITS_STORAGE_KEY,
            SAVED_CITIES_STORAGE_KEY,
            SELECTED_CITY_STORAGE_KEY,
          ]);

        const restoredUnits: TemperatureUnit =
          savedUnits[1] === 'imperial' ? 'imperial' : 'metric';

        setUnits(restoredUnits);

        if (storedCities[1]) {
          setSavedCities(JSON.parse(storedCities[1]) as City[]);
        }

        if (storedSelectedCity[1]) {
          setSelectedCity(JSON.parse(storedSelectedCity[1]) as City);
        }

        const cachedWeather = await getCachedWeather(restoredUnits);

        if (cachedWeather) {
          setWeatherData(cachedWeather);
          setIsUsingCachedData(true);

          if (!storedSelectedCity[1]) {
            setSelectedCity(cachedWeather.city);
          }
        }
      } catch (storageError) {
        console.warn('Unable to restore saved app data:', storageError);
      } finally {
        setIsReady(true);
      }
    }

    restoreAppState();
  }, []);

  const loadWeatherForCity = useCallback(
    async (city: City, requestedUnits = units) => {
      setIsLoading(true);
      setError(null);

      const cachedWeather = await getCachedWeather(requestedUnits);

      if (!(await canUseNetwork())) {
        if (cachedWeather && citiesMatch(cachedWeather.city, city)) {
          setWeatherData(cachedWeather);
          setSelectedCity(cachedWeather.city);
          setIsUsingCachedData(true);
          setError('You are offline. Showing the most recently saved weather.');
        } else {
          setError('You are offline and no saved weather is available for this city.');
        }

        setIsLoading(false);
        return;
      }

      try {
        const freshWeather = await getWeatherForCoordinates(
          city.latitude,
          city.longitude,
          requestedUnits
        );

        await AsyncStorage.multiSet([
          [getCacheKey(requestedUnits), JSON.stringify(freshWeather)],
          [SELECTED_CITY_STORAGE_KEY, JSON.stringify(freshWeather.city)],
        ]);

        setWeatherData(freshWeather);
        setSelectedCity(freshWeather.city);
        setIsUsingCachedData(false);
      } catch (loadError) {
        if (cachedWeather && citiesMatch(cachedWeather.city, city)) {
          setWeatherData(cachedWeather);
          setSelectedCity(cachedWeather.city);
          setIsUsingCachedData(true);
          setError(
            'Could not refresh weather. Showing the most recently saved data.'
          );
        } else {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Weather data could not be loaded.'
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [units]
  );

  const refreshWeather = useCallback(async () => {
    if (selectedCity) {
      await loadWeatherForCity(selectedCity);
    }
  }, [loadWeatherForCity, selectedCity]);

  const addSavedCity = useCallback(
    async (city: City) => {
      const nextCities = savedCities.some((savedCity) =>
        citiesMatch(savedCity, city)
      )
        ? savedCities
        : [...savedCities, city];

      setSavedCities(nextCities);
      await AsyncStorage.setItem(
        SAVED_CITIES_STORAGE_KEY,
        JSON.stringify(nextCities)
      );
    },
    [savedCities]
  );

  const removeSavedCity = useCallback(
    async (city: City) => {
      const nextCities = savedCities.filter(
        (savedCity) => !citiesMatch(savedCity, city)
      );

      setSavedCities(nextCities);
      await AsyncStorage.setItem(
        SAVED_CITIES_STORAGE_KEY,
        JSON.stringify(nextCities)
      );
    },
    [savedCities]
  );

  const setTemperatureUnit = useCallback(
    async (nextUnits: TemperatureUnit) => {
      if (nextUnits === units) {
        return;
      }

      setUnits(nextUnits);
      await AsyncStorage.setItem(UNITS_STORAGE_KEY, nextUnits);

      const cachedWeather = await getCachedWeather(nextUnits);

      if (cachedWeather) {
        setWeatherData(cachedWeather);
        setIsUsingCachedData(true);
      } else {
        setWeatherData(null);
      }

      if (selectedCity) {
        await loadWeatherForCity(selectedCity, nextUnits);
      }
    },
    [loadWeatherForCity, selectedCity, units]
  );

  const value = useMemo(
    () => ({
      weatherData,
      selectedCity,
      savedCities,
      units,
      isReady,
      isLoading,
      isUsingCachedData,
      error,
      loadWeatherForCity,
      refreshWeather,
      addSavedCity,
      removeSavedCity,
      setTemperatureUnit,
      clearError: () => setError(null),
    }),
    [
      addSavedCity,
      error,
      isLoading,
      isReady,
      isUsingCachedData,
      loadWeatherForCity,
      refreshWeather,
      removeSavedCity,
      savedCities,
      selectedCity,
      setTemperatureUnit,
      units,
      weatherData,
    ]
  );

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);

  if (!context) {
    throw new Error('useWeather must be used within WeatherProvider.');
  }

  return context;
}