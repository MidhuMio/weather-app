import type { City } from '@/types/weather';

export function citiesMatch(first: City, second: City) {
  return (
    first.latitude.toFixed(3) === second.latitude.toFixed(3) &&
    first.longitude.toFixed(3) === second.longitude.toFixed(3)
  );
}