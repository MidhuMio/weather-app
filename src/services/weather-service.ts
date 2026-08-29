import {
  City,
  ForecastEntry,
  TemperatureUnit,
  WeatherData,
  WeatherCondition,
} from '@/types/weather';

import { WEATHER_CONFIG } from '@/constants/weather';

interface OpenWeatherCondition {
  main: string;
  description: string;
  icon: string;
}

interface OpenWeatherCurrentResponse {
  id: number;
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: OpenWeatherCondition[];
  wind: {
    speed: number;
  };
  visibility?: number;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
}

interface OpenWeatherForecastResponse {
  list: {
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
    };
    weather: OpenWeatherCondition[];
    pop: number;
  }[];
}

interface OpenWeatherGeocodingResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export class WeatherApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

function getApiKey() {
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new WeatherApiError(
      'OpenWeather API key is missing. Add it to the .env file and restart Expo.'
    );
  }

  return apiKey;
}

async function request<T>(url: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new WeatherApiError(
      'Unable to connect. Check your internet connection and try again.'
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new WeatherApiError('Your OpenWeather API key is invalid or inactive.');
    }

    if (response.status === 404) {
      throw new WeatherApiError('Weather data was not found for this location.');
    }

    throw new WeatherApiError('Weather data could not be loaded. Please try again.');
  }

  return response.json() as Promise<T>;
}

function mapCondition(condition?: OpenWeatherCondition): WeatherCondition {
  return {
    main: condition?.main ?? 'Unknown',
    description: condition?.description ?? 'Weather information unavailable',
    iconCode: condition?.icon ?? '01d',
  };
}

function mapCity(response: OpenWeatherCurrentResponse): City {
  return {
    id: String(response.id),
    name: response.name,
    country: response.sys.country,
    latitude: response.coord.lat,
    longitude: response.coord.lon,
  };
}

function buildWeatherUrl(
  endpoint: 'weather' | 'forecast',
  latitude: number,
  longitude: number,
  units: TemperatureUnit
) {
  const apiKey = getApiKey();

  return (
    `${WEATHER_CONFIG.API_BASE_URL}/data/2.5/${endpoint}` +
    `?lat=${latitude}&lon=${longitude}&units=${units}&appid=${apiKey}`
  );
}

export async function searchCities(query: string): Promise<City[]> {
    
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const apiKey = getApiKey();
  const url =
    `${WEATHER_CONFIG.API_BASE_URL}/geo/1.0/direct` +
    `?q=${encodeURIComponent(trimmedQuery)}&limit=${WEATHER_CONFIG.GEOCODING_LIMIT}&appid=${apiKey}`;

  const results = await request<OpenWeatherGeocodingResult[]>(url);

  return results.map((city) => ({
    id: `${city.lat},${city.lon}`,
    name: city.name,
    country: city.country,
    state: city.state,
    latitude: city.lat,
    longitude: city.lon,
  }));
}

export async function getWeatherForCoordinates(
  latitude: number,
  longitude: number,
  units: TemperatureUnit
): Promise<WeatherData> {
  const [currentResponse, forecastResponse] = await Promise.all([
    request<OpenWeatherCurrentResponse>(
      buildWeatherUrl('weather', latitude, longitude, units)
    ),
    request<OpenWeatherForecastResponse>(
      buildWeatherUrl('forecast', latitude, longitude, units)
    ),
  ]);

  const forecast: ForecastEntry[] = forecastResponse.list.map((entry) => ({
    dateTime: entry.dt,
    temperature: Math.round(entry.main.temp),
    minimumTemperature: Math.round(entry.main.temp_min),
    maximumTemperature: Math.round(entry.main.temp_max),
    precipitationChance: Math.round(entry.pop * 100),
    condition: mapCondition(entry.weather[0]),
  }));

  return {
    city: mapCity(currentResponse),
    current: {
      temperature: Math.round(currentResponse.main.temp),
      feelsLike: Math.round(currentResponse.main.feels_like),
      humidity: currentResponse.main.humidity,
      pressure: currentResponse.main.pressure,
      windSpeed: currentResponse.wind.speed,
      visibility: currentResponse.visibility
        ? Math.round(currentResponse.visibility / 1000)
        : null,
      sunrise: currentResponse.sys.sunrise,
      sunset: currentResponse.sys.sunset,
      condition: mapCondition(currentResponse.weather[0]),
    },
    forecast,
    fetchedAt: Date.now(),
  };
}