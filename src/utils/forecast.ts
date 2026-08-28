import type { ForecastEntry, WeatherCondition } from '@/types/weather';

export interface DailyForecast {
  dateTime: number;
  minimumTemperature: number;
  maximumTemperature: number;
  condition: WeatherCondition;
}

export function getDailyForecast(entries: ForecastEntry[]): DailyForecast[] {
  const groupedEntries = new Map<string, ForecastEntry[]>();

  entries.forEach((entry) => {
    const dateKey = new Date(entry.dateTime * 1000).toLocaleDateString('en-CA');
    const dayEntries = groupedEntries.get(dateKey) ?? [];

    dayEntries.push(entry);
    groupedEntries.set(dateKey, dayEntries);
  });

  return Array.from(groupedEntries.values())
    .slice(0, 5)
    .map((dayEntries) => {
      const middayEntry = dayEntries.reduce((closest, entry) => {
        const entryHour = new Date(entry.dateTime * 1000).getHours();
        const closestHour = new Date(closest.dateTime * 1000).getHours();

        return Math.abs(entryHour - 12) < Math.abs(closestHour - 12)
          ? entry
          : closest;
      });

      return {
        dateTime: dayEntries[0].dateTime,
        minimumTemperature: Math.min(
          ...dayEntries.map((entry) => entry.minimumTemperature)
        ),
        maximumTemperature: Math.max(
          ...dayEntries.map((entry) => entry.maximumTemperature)
        ),
        condition: middayEntry.condition,
      };
    });
}