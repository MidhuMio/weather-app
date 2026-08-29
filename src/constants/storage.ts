import type { TemperatureUnit } from '@/types/weather';

export const STORAGE_KEYS = {
  THEME_MODE: '@weather_app/theme_mode',
  TEMPERATURE_UNIT: '@weather_app/temperature_units',
  WIND_UNIT: '@weather_app/wind_unit',
  SAVED_CITIES: '@weather_app/saved_cities',
  SELECTED_CITY: '@weather_app/selected_city',
  FAVOURITE_CITY: '@weather_app/favourite_city',
} as const;

export function getWeatherCacheKey(units: TemperatureUnit) {
  return `@weather_app/weather_cache_${units}`;
}

export function getFavouriteWeatherCacheKey(units: TemperatureUnit) {
  return `@weather_app/favourite_weather_cache_${units}`;
}