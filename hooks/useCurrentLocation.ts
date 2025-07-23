import { useState } from 'react';
import * as Location from 'expo-location';

export function useCurrentLocation() {
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const askLocation = async () => {
    setLoading(true);
    setError('');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      let cityName = 'Current Location';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (geocode && geocode[0]) {
          cityName = geocode[0].city || geocode[0].name || cityName;
        }
      } catch {}
      setLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude, name: cityName });
    } catch (e: any) {
      setError(e.message || 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  return { location, loading, error, askLocation };
} 