export type TemperatureUnit = 'metric' | 'imperial';

export interface City {
  id: string;
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherCondition {
  main: string;
  description: string;
  iconCode: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  visibility: number | null;
  sunrise: number;
  sunset: number;
  condition: WeatherCondition;
}

export interface ForecastEntry {
  dateTime: number;
  temperature: number;
  minimumTemperature: number;
  maximumTemperature: number;
  precipitationChance: number;
  condition: WeatherCondition;
}

export interface WeatherData {
  city: City;
  current: CurrentWeather;
  forecast: ForecastEntry[];
  fetchedAt: number;
}