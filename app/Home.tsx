import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { fetchCurrentWeather, fetch7DayForecast } from '../api/weatherApi';
import Loader from '../components/Loader';
import WeatherIcon from '../components/WeatherIcon';
import { useTheme } from '../hooks/useTheme';
import NetInfo from '@react-native-community/netinfo';
import { getItem, saveItem } from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { LinearGradient } from 'expo-linear-gradient';
import { useUnits } from '@/hooks/useUnits';
import { useFocusEffect } from 'expo-router';

const DEFAULT_LOCATION = { lat: 28.6139, lon: 77.209, name: 'New Delhi' };
const SAVED_LOCATIONS_KEY = 'SAVED_LOCATIONS';

const getCacheKey = (loc: any, units: string) => `WEATHER_CACHE_${loc.lat}_${loc.lon}_${units}`;

const HomeScreen = () => {
  const { colors, theme } = useTheme();
  const { units, formatTemperature, convertSpeed, getSpeedUnit } = useUnits();
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [location, setLocation] = useState<any>(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);

  const {
    location: detectedLocation,
    loading: locating,
    error: locationError,
    askLocation
  } = useCurrentLocation();

  const loadWeather = async () => {
    setError('');
    try {
      const state = await NetInfo.fetch();
      setOffline(!state.isConnected);

      if (state.isConnected) {
        const w = await fetchCurrentWeather(location.lat, location.lon, units);
        const f = await fetch7DayForecast(location.lat, location.lon, units);

        setWeather(w);
        setForecast(f);

        await saveItem(getCacheKey(location, units), { weather: w, forecast: f });
      } else {
        const cached = await getItem(getCacheKey(location, units));
        if (cached) {
          setWeather(cached.weather);
          setForecast(cached.forecast);
        } else {
          setError('No cached data available.');
        }
      }
    } catch (e:any) {
      console.error('Weather loading error:', e);
      setError(`Failed to load weather: ${e.message || 'Unknown error'}`);
    }
  };

  useEffect(() => {
    (async () => {
      const stored = await getItem(SAVED_LOCATIONS_KEY);
      const locs = stored || [DEFAULT_LOCATION];
      setSavedLocations(locs);
      setCurrentIdx(0);
      setLocation(locs[0]);
    })();
  }, []);

  useEffect(() => {
    if (detectedLocation) {
      const exists = savedLocations.some(
        (loc) => loc.lat === detectedLocation.lat && loc.lon === detectedLocation.lon
      );

      if (!exists) {
        const newLocs = [detectedLocation, ...savedLocations];
        setSavedLocations(newLocs);
        setCurrentIdx(0);
        setLocation(detectedLocation);
        saveItem(SAVED_LOCATIONS_KEY, newLocs);
      } else {
        const idx = savedLocations.findIndex(
          (loc) => loc.lat === detectedLocation.lat && loc.lon === detectedLocation.lon
        );
        setCurrentIdx(idx);
        setLocation(detectedLocation);
      }
    }
  }, [detectedLocation]);

  useEffect(() => {
    if (savedLocations.length > 0) {
      setLocation(savedLocations[currentIdx]);
    }
  }, [currentIdx, savedLocations.length]);

  useEffect(() => {
    setLoading(true);
    loadWeather().finally(() => setLoading(false));
    const unsub = NetInfo.addEventListener(state => setOffline(!state.isConnected));
    return () => unsub();
  }, [location, units]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const stored = await getItem(SAVED_LOCATIONS_KEY);
        const locs = stored || [DEFAULT_LOCATION];
        setSavedLocations(locs);
        setCurrentIdx(0);
        setLocation(locs[0]);
      })();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeather();
    setRefreshing(false);
  };

  const handlePrev = () => {
    if (savedLocations.length > 1) {
      setCurrentIdx((prev) => (prev - 1 + savedLocations.length) % savedLocations.length);
    }
  };

  const handleNext = () => {
    if (savedLocations.length > 1) {
      setCurrentIdx((prev) => (prev + 1) % savedLocations.length);
    }
  };

  if (loading) return <Loader text="Loading weather..." />;

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>...
      </View>
    );
  }

  if (!weather || !forecast) return null;

  const gradientColors = theme === 'dark'
    ? ['#1A1A2E', '#16213E', '#0F3460']
    : ['#4A90E2', '#5B9FE8', '#6CB4EE'];

  return (
    <ScrollView 
      style={{ backgroundColor: colors.background }} 
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >

      {offline && (
        <LinearGradient colors={['#FF6B6B', '#EE5A6F']} style={styles.offlineBanner}>
          <MaterialCommunityIcons name="wifi-off" size={18} color="#fff" />
          <Text style={styles.offlineText}>Offline: Showing cached data</Text>
        </LinearGradient>
      )}
      
      <LinearGradient colors={gradientColors as any} style={styles.headerCard}>
        <View style={styles.locationHeader}>
          <TouchableOpacity onPress={handlePrev} style={styles.navButton} disabled={savedLocations.length <= 1}>
            <MaterialCommunityIcons 
              name="chevron-left" 
              size={28} 
              color={savedLocations.length > 1 ? '#fff' : 'rgba(255,255,255,0.3)'} 
            />
          </TouchableOpacity>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{location.name}</Text>
            {
              locating ? 
                <TouchableOpacity style={styles.gpsButton} disabled={locating}>
                  <ActivityIndicator color={colors.text} size={'small'}/>
                </TouchableOpacity> 
                :   
                <TouchableOpacity onPress={askLocation} style={styles.gpsButton} disabled={locating}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#fff" />
                  <Text style={styles.gpsText}>Update Location</Text>
                </TouchableOpacity>
            }
          </View>
          <TouchableOpacity onPress={handleNext} style={styles.navButton} disabled={savedLocations.length <= 1}>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={28} 
              color={savedLocations.length > 1 ? '#fff' : 'rgba(255,255,255,0.3)'} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weatherMain}>
          <WeatherIcon code={weather.weather[0].icon} size={120} color="#fff" />
          <View style={styles.tempContainer}>
            <Text style={styles.temperature}>
            {formatTemperature(weather.main.temp)}
            </Text>
            <Text style={styles.description}>{weather.weather[0].description}</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="water-percent" size={20} color="#fff" />
            <Text style={styles.statValue}>{weather.main.humidity}%</Text>
            <Text style={styles.statLabel}>Humidity</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="weather-windy" size={20} color="#fff" />
            <Text style={styles.statValue}>
              {convertSpeed(weather.wind.speed)} {getSpeedUnit()}
            </Text>
            <Text style={styles.statLabel}>Wind</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="thermometer" size={20} color="#fff" />
            <Text style={styles.statValue}>
            {formatTemperature(weather.main.feels_like)}
            </Text>
            <Text style={styles.statLabel}>Feels Like</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.forecastSection, { backgroundColor: colors.background }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7-Day Forecast</Text>
          <View style={[styles.unitBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.unitBadgeText, { color: colors.primary }]}>
              {units === 'metric' ? 'Celsius' : 'Fahrenheit'}
            </Text>
          </View>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.forecastScroll}
        >
          {forecast.daily.slice(1, 8).map((day: any, idx: number) => (
            <View key={idx} style={[styles.dayCard, { 
              backgroundColor: colors.card,
              shadowColor: theme === 'dark' ? '#000' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: 3,
            }]}>
              <Text style={[styles.dayName, { color: colors.text }]}>
                {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <WeatherIcon code={day.weather[0].icon} size={40} color={colors.primary} />
              <Text style={[styles.dayTemp, { color: colors.text }]}>
                {Math.round(day.temp.max)}°
              </Text>
              <Text style={[styles.dayTempMin, { color: colors.secondary }]}>
                {Math.round(day.temp.min)}°
              </Text>
            </View>
          ))}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Hourly Forecast</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.forecastScroll}
        >
          {forecast.hourly.slice(0, 12).map((hour: any, idx: number) => (
            <View key={idx} style={[styles.hourCard, { 
              backgroundColor: colors.card,
              shadowColor: theme === 'dark' ? '#000' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: 3,
            }]}>
                            <Text style={[styles.hourTime, { color: colors.secondary }]}>
                {new Date(hour.dt * 1000).getHours()}:00
              </Text>
              <WeatherIcon code={hour.weather[0].icon} size={32} color={colors.primary} />
              <Text style={[styles.hourTemp, { color: colors.text }]}>
                {Math.round(hour.temp)}°
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  headerCard: {
    padding: 20,
    paddingBottom: 30,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  locationInfo: {
    alignItems: 'center',
    flex: 1,
  },
  locationName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gpsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  weatherMain: {
    alignItems: 'center',
    marginBottom: 30,
  },
  tempContainer: {
    alignItems: 'center',
    marginTop: -10,
  },
  temperature: {
    fontSize: 72,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -2,
  },
  description: {
    fontSize: 18,
    color: '#fff',
    textTransform: 'capitalize',
    marginTop: -8,
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  forecastSection: {
    padding: 20,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  unitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  forecastScroll: {
    paddingRight: 20,
    paddingTop:10,
    paddingBottom:10
  },
  dayCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 90,
    backgroundColor: '#fff',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dayTemp: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  dayTempMin: {
    fontSize: 14,
    marginTop: 2,
  },
  hourCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginRight: 10,
    minWidth: 70,
    backgroundColor: '#fff',
  },
  hourTime: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  hourTemp: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
});

export default HomeScreen;