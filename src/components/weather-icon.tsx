import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface WeatherIconProps {
  condition: string;
  color: string;
  size?: number;
}

function getIconName(condition: string): IconName {
  switch (condition.toLowerCase()) {
    case 'clear':
      return 'sunny-outline';
    case 'clouds':
      return 'cloudy-outline';
    case 'rain':
    case 'drizzle':
      return 'rainy-outline';
    case 'thunderstorm':
      return 'thunderstorm-outline';
    case 'snow':
      return 'snow-outline';
    case 'mist':
    case 'fog':
    case 'haze':
      return 'cloud-outline';
    default:
      return 'partly-sunny-outline';
  }
}

export function WeatherIcon({
  condition,
  color,
  size = 32,
}: WeatherIconProps) {
  return <Ionicons name={getIconName(condition)} size={size} color={color} />;
}