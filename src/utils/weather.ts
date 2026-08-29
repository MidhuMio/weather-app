import type { TemperatureUnit, WindUnit } from '@/types/weather';

export function formatWindSpeed(
  speed: number,
  temperatureUnit: TemperatureUnit,
  windUnit: WindUnit
) {
  const speedInKph =
    temperatureUnit === 'metric' ? speed * 3.6 : speed * 1.609344;

  if (windUnit === 'kph') {
    return `${Math.round(speedInKph)} km/h`;
  }

  return `${Math.round(speedInKph / 1.609344)} mph`;
}