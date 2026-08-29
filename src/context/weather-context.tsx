import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getFavouriteWeatherCacheKey,
  getWeatherCacheKey,
  STORAGE_KEYS,
} from '@/constants/storage';
import { getWeatherForCoordinates } from '@/services/weather-service';
import type { City, TemperatureUnit, WeatherData, WindUnit } from '@/types/weather';
import { citiesMatch } from '@/utils/city';

interface WeatherContextValue {
  weatherData: WeatherData | null;
  selectedCity: City | null;
  savedCities: City[];
  favouriteCity: City | null;
  favouriteWeather: WeatherData | null;
  units: TemperatureUnit;
  windUnit: WindUnit;
  isReady: boolean;
  isLoading: boolean;
  isFavouriteLoading: boolean;
  isUsingCachedData: boolean;
  isFavouriteUsingCachedData: boolean;
  error: string | null;
  favouriteError: string | null;
  loadWeatherForCity: (city: City) => Promise<void>;
  refreshWeather: () => Promise<void>;
  refreshFavouriteWeather: () => Promise<void>;
  addSavedCity: (city: City) => Promise<void>;
  removeSavedCity: (city: City) => Promise<void>;
  setFavouriteCity: (city: City) => Promise<void>;
  removeFavouriteCity: () => Promise<void>;
  setTemperatureUnit: (units: TemperatureUnit) => Promise<void>;
  setWindUnit: (windUnit: WindUnit) => Promise<void>;
}

const WeatherContext = createContext<WeatherContextValue | undefined>(
  undefined
);

async function getCachedWeather(key: string) {
  const savedWeather = await AsyncStorage.getItem(key);

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
  const [favouriteCity, setFavouriteCityState] = useState<City | null>(null);
  const [favouriteWeather, setFavouriteWeather] = useState<WeatherData | null>(
    null
  );
  const [units, setUnits] = useState<TemperatureUnit>('metric');
  const [windUnit, setWindUnitState] = useState<WindUnit>('kph');
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavouriteLoading, setIsFavouriteLoading] = useState(false);
  const [isUsingCachedData, setIsUsingCachedData] = useState(false);
  const [isFavouriteUsingCachedData, setIsFavouriteUsingCachedData] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favouriteError, setFavouriteError] = useState<string | null>(null);

  useEffect(() => {
    async function restoreAppState() {
      try {
        const [
          [, savedUnits],
          [, savedWindUnit],
          [, storedCities],
          [, storedSelectedCity],
          [, storedFavouriteCity],
        ] = await AsyncStorage.multiGet([
          STORAGE_KEYS.TEMPERATURE_UNIT,
          STORAGE_KEYS.WIND_UNIT,
          STORAGE_KEYS.SAVED_CITIES,
          STORAGE_KEYS.SELECTED_CITY,
          STORAGE_KEYS.FAVOURITE_CITY,
        ]);

        const restoredUnits: TemperatureUnit =
          savedUnits === 'imperial' ? 'imperial' : 'metric';

        setUnits(restoredUnits);
        setWindUnitState(savedWindUnit === 'mph' ? 'mph' : 'kph');

        if (storedCities) {
          setSavedCities(JSON.parse(storedCities) as City[]);
        }

        if (storedSelectedCity) {
          setSelectedCity(JSON.parse(storedSelectedCity) as City);
        }

        if (storedFavouriteCity) {
          setFavouriteCityState(JSON.parse(storedFavouriteCity) as City);
        }

        const [cachedWeather, cachedFavouriteWeather] = await Promise.all([
          getCachedWeather(getWeatherCacheKey(restoredUnits)),
          getCachedWeather(getFavouriteWeatherCacheKey(restoredUnits)),
        ]);

        if (cachedWeather) {
          setWeatherData(cachedWeather);
          setIsUsingCachedData(true);

          if (!storedSelectedCity) {
            setSelectedCity(cachedWeather.city);
          }
        }

        if (cachedFavouriteWeather) {
          setFavouriteWeather(cachedFavouriteWeather);
          setIsFavouriteUsingCachedData(true);
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

      const cachedWeather = await getCachedWeather(
        getWeatherCacheKey(requestedUnits)
      );

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
          [getWeatherCacheKey(requestedUnits), JSON.stringify(freshWeather)],
          [STORAGE_KEYS.SELECTED_CITY, JSON.stringify(freshWeather.city)],
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

  const loadFavouriteWeather = useCallback(
    async (city: City, requestedUnits = units) => {
      setIsFavouriteLoading(true);
      setFavouriteError(null);

      const cachedWeather = await getCachedWeather(
        getFavouriteWeatherCacheKey(requestedUnits)
      );

      if (!(await canUseNetwork())) {
        if (cachedWeather && citiesMatch(cachedWeather.city, city)) {
          setFavouriteWeather(cachedWeather);
          setIsFavouriteUsingCachedData(true);
          setFavouriteError(
            'You are offline. Showing the most recently saved favourite weather.'
          );
        } else {
          setFavouriteError(
            'You are offline and no saved weather is available for this favourite.'
          );
        }

        setIsFavouriteLoading(false);
        return;
      }

      try {
        const freshWeather = await getWeatherForCoordinates(
          city.latitude,
          city.longitude,
          requestedUnits
        );

        await AsyncStorage.setItem(
          getFavouriteWeatherCacheKey(requestedUnits),
          JSON.stringify(freshWeather)
        );

        setFavouriteWeather(freshWeather);
        setIsFavouriteUsingCachedData(false);
      } catch (loadError) {
        if (cachedWeather && citiesMatch(cachedWeather.city, city)) {
          setFavouriteWeather(cachedWeather);
          setIsFavouriteUsingCachedData(true);
          setFavouriteError(
            'Could not refresh favourite weather. Showing saved data.'
          );
        } else {
          setFavouriteError(
            loadError instanceof Error
              ? loadError.message
              : 'Favourite weather could not be loaded.'
          );
        }
      } finally {
        setIsFavouriteLoading(false);
      }
    },
    [units]
  );

  const refreshWeather = useCallback(async () => {
    if (selectedCity) {
      await loadWeatherForCity(selectedCity);
    }
  }, [loadWeatherForCity, selectedCity]);

  const refreshFavouriteWeather = useCallback(async () => {
    if (favouriteCity) {
      await loadFavouriteWeather(favouriteCity);
    }
  }, [favouriteCity, loadFavouriteWeather]);

  const addSavedCity = useCallback(
    async (city: City) => {
      const nextCities = savedCities.some((savedCity) =>
        citiesMatch(savedCity, city)
      )
        ? savedCities
        : [...savedCities, city];

      setSavedCities(nextCities);

      await AsyncStorage.setItem(
        STORAGE_KEYS.SAVED_CITIES,
        JSON.stringify(nextCities)
      );
    },
    [savedCities]
  );

  const removeFavouriteCity = useCallback(async () => {
    setFavouriteCityState(null);
    setFavouriteWeather(null);
    setFavouriteError(null);
    setIsFavouriteUsingCachedData(false);

    await AsyncStorage.multiRemove([
      STORAGE_KEYS.FAVOURITE_CITY,
      getFavouriteWeatherCacheKey('metric'),
      getFavouriteWeatherCacheKey('imperial'),
    ]);
  }, []);

  const removeSavedCity = useCallback(
    async (city: City) => {
      const nextCities = savedCities.filter(
        (savedCity) => !citiesMatch(savedCity, city)
      );

      setSavedCities(nextCities);

      await AsyncStorage.setItem(
        STORAGE_KEYS.SAVED_CITIES,
        JSON.stringify(nextCities)
      );

      if (favouriteCity && citiesMatch(favouriteCity, city)) {
        await removeFavouriteCity();
      }
    },
    [favouriteCity, removeFavouriteCity, savedCities]
  );

  const setFavouriteCity = useCallback(
    async (city: City) => {
      setFavouriteCityState(city);

      await AsyncStorage.setItem(
        STORAGE_KEYS.FAVOURITE_CITY,
        JSON.stringify(city)
      );

      await loadFavouriteWeather(city);
    },
    [loadFavouriteWeather]
  );

  const setTemperatureUnit = useCallback(
    async (nextUnits: TemperatureUnit) => {
      if (nextUnits === units) {
        return;
      }

      setUnits(nextUnits);
      await AsyncStorage.setItem(
        STORAGE_KEYS.TEMPERATURE_UNIT,
        nextUnits
      );

      const [cachedWeather, cachedFavouriteWeather] = await Promise.all([
        getCachedWeather(getWeatherCacheKey(nextUnits)),
        getCachedWeather(getFavouriteWeatherCacheKey(nextUnits)),
      ]);

      setWeatherData(cachedWeather);
      setFavouriteWeather(cachedFavouriteWeather);
      setIsUsingCachedData(Boolean(cachedWeather));
      setIsFavouriteUsingCachedData(Boolean(cachedFavouriteWeather));

      const refreshTasks: Promise<void>[] = [];

      if (selectedCity) {
        refreshTasks.push(loadWeatherForCity(selectedCity, nextUnits));
      }

      if (favouriteCity) {
        refreshTasks.push(loadFavouriteWeather(favouriteCity, nextUnits));
      }

      await Promise.all(refreshTasks);
    },
    [
      favouriteCity,
      loadFavouriteWeather,
      loadWeatherForCity,
      selectedCity,
      units,
    ]
  );

  const setWindUnit = useCallback(async (nextWindUnit: WindUnit) => {
    if (nextWindUnit === windUnit) {
      return;
    }

    setWindUnitState(nextWindUnit);
    await AsyncStorage.setItem(STORAGE_KEYS.WIND_UNIT, nextWindUnit);
  }, [windUnit]);

  const value = useMemo(
    () => ({
      weatherData,
      selectedCity,
      savedCities,
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
      addSavedCity,
      removeSavedCity,
      setFavouriteCity,
      removeFavouriteCity,
      setTemperatureUnit,
      setWindUnit,
    }),
    [
      addSavedCity,
      error,
      favouriteCity,
      favouriteError,
      favouriteWeather,
      isFavouriteLoading,
      isFavouriteUsingCachedData,
      isLoading,
      isReady,
      isUsingCachedData,
      loadWeatherForCity,
      refreshFavouriteWeather,
      refreshWeather,
      removeFavouriteCity,
      removeSavedCity,
      savedCities,
      selectedCity,
      setFavouriteCity,
      setTemperatureUnit,
      setWindUnit,
      windUnit,
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