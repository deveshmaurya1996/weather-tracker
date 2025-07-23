import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { searchCity } from '../../api/weatherApi';
import { saveItem, getItem } from '../../utils/storage';
import { useTheme } from '../../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Loader from '../../components/Loader';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { LinearGradient } from 'expo-linear-gradient';

const SAVED_LOCATIONS_KEY = 'SAVED_LOCATIONS';

const LocationsScreen = () => {
  const { colors, theme } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<any[]>([]);

  const { location: detectedLocation, loading: locating, error: locationError, askLocation } = useCurrentLocation();

  useEffect(() => {
    (async () => {
      const stored = await getItem(SAVED_LOCATIONS_KEY);
      setSaved(stored || []);
    })();
  }, []);

  useEffect(() => {
    if (detectedLocation) {
      setSaved((prevSaved) => {
        const exists = prevSaved.some(
          (loc) => loc.lat === detectedLocation.lat && loc.lon === detectedLocation.lon
        );
        if (!exists) {
          const updated = [...prevSaved, detectedLocation];
          saveItem(SAVED_LOCATIONS_KEY, updated);
          return updated;
        }
        return prevSaved;
      });
    }
  }, [detectedLocation]);

  useEffect(()=>{
    if(query.trim() === ''){
      setResults([]);
    }
  },[query])

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const data = await searchCity(query);
      setResults(data);
      if (data.length === 0) {
        setError('No cities found. Try a different search.');
      }
    } catch {
      setError('Failed to search cities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (city: any) => {
    const exists = saved.some((loc) => loc.lat === city.lat && loc.lon === city.lon);
    if (!exists) {
      const updated = [...saved, city];
      setSaved(updated);
      await saveItem(SAVED_LOCATIONS_KEY, updated);
      Alert.alert('Success', `${city.name} added to your locations!`);
    } else {
      Alert.alert('Info', 'This location is already saved.');
    }
  };

  const handleRemove = async (city: any) => {
    Alert.alert(
      'Remove Location',
      `Are you sure you want to remove ${city.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updated = saved.filter((loc) => loc.lat !== city.lat || loc.lon !== city.lon);
            setSaved(updated);
            await saveItem(SAVED_LOCATIONS_KEY, updated);
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={[styles.title, { color: colors.text }]}>Locations</Text>
      <TouchableOpacity 
        onPress={askLocation} 
        disabled={locating}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme === 'dark' ? ['#3366FF', '#5B8DEE'] : ['#3366FF', '#6B9FFF']}
          style={[
            styles.detectButton,
            locating && styles.detectButtonDisabled
          ]}
        >
          <View style={styles.detectInner}>
            {locating ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.detectText}>Detecting location...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#fff" />
                <Text style={styles.detectText}>Detect My Location</Text>
              </>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
      
      {locationError && (
        <View style={[styles.errorBanner, { backgroundColor: colors.error + '20' }]}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{locationError}</Text>
        </View>
      )}

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <MaterialCommunityIcons name="magnify" size={24} color={colors.secondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Search for a city..."
          placeholderTextColor={colors.secondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading && <Loader text="Searching cities..." />}
      
      {error && !loading && (
        <Text style={[styles.searchError, { color: colors.secondary }]}>{error}</Text>
      )}

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Search Results</Text>
          <FlatList
            data={results}
            keyExtractor={(item) => `${item.name}_${item.lat}_${item.lon}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.locationCard, { backgroundColor: colors.card }]}
                onPress={() => handleAdd(item)}
              >
                <View style={styles.locationInfo}>
                  <Text style={[styles.cityName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.countryName, { color: colors.secondary }]}>
                    {item.state ? `${item.state}, ` : ''}{item.country}
                  </Text>
                </View>
                <MaterialCommunityIcons name="plus-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            )}
            style={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <View style={styles.savedContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved Locations</Text>
        {saved.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="map-marker-off" size={48} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>No saved locations yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.secondary }]}>
              Search for cities or detect your location to get started
            </Text>
          </View>
        ) : (
          <FlatList
            data={saved}
            keyExtractor={(item) => `${item.lat},${item.lon}`}
            renderItem={({ item }) => (
              <View style={[styles.savedCard, { backgroundColor: colors.card }]}>
                <View style={styles.savedInfo}>
                  <MaterialCommunityIcons name="map-marker" size={24} color={colors.primary} />
                  <View style={styles.savedText}>
                    <Text style={[styles.savedName, { color: colors.text }]}>{item.name}</Text>
                    {item.country && (
                      <Text style={[styles.savedCountry, { color: colors.secondary }]}>{item.country}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleRemove(item)} style={styles.removeButton}>
                  <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.savedList}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title:{
    paddingHorizontal:20,
    paddingTop:20,
    fontSize:24,
    fontWeight:500
  },
  detectButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },

  detectButtonDisabled: {
    opacity: 0.8,
  },
  detectInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  detectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  searchError: {
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    fontSize: 14,
  },
  resultsContainer: {
    maxHeight: 250,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  resultsList: {
    maxHeight: 200,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  locationInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  countryName: {
    fontSize: 14,
  },
  savedContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  savedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  savedText: {
    flex: 1,
  },
  savedName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  savedCountry: {
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
  },
  savedList: {
    paddingBottom: 100,
  },
});

export default LocationsScreen;