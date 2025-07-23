import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface WeatherIconProps {
  code: string; // e.g., '01d', '09n', etc.
  size?: number;
  color?: string;
}

const iconMap: Record<string, string> = {
  '01d': 'weather-sunny',
  '01n': 'weather-night',
  '02d': 'weather-partly-cloudy',
  '02n': 'weather-night-partly-cloudy',
  '03d': 'weather-cloudy',
  '03n': 'weather-cloudy',
  '04d': 'weather-cloudy',
  '04n': 'weather-cloudy',
  '09d': 'weather-pouring',
  '09n': 'weather-pouring',
  '10d': 'weather-rainy',
  '10n': 'weather-rainy',
  '11d': 'weather-lightning',
  '11n': 'weather-lightning',
  '13d': 'weather-snowy',
  '13n': 'weather-snowy',
  '50d': 'weather-fog',
  '50n': 'weather-fog',
};

const WeatherIcon: React.FC<WeatherIconProps> = ({ code, size = 32, color = '#333' }) => {
  const iconName = iconMap[code] || 'weather-cloudy';
  return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
};

export default WeatherIcon; 