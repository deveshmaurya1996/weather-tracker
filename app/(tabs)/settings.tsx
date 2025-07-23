import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView, Switch, Platform } from 'react-native';
import { getItem, saveItem } from '../../utils/storage';
import { useTheme } from '../../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUnits } from '@/hooks/useUnits';
import { useFocusEffect } from 'expo-router';

const SAVED_LOCATIONS_KEY = 'SAVED_LOCATIONS';
const DEFAULT_LOCATION_KEY = 'DEFAULT_LOCATION';
const UNITS_KEY = 'UNITS_PREFERENCE';

const SettingsScreen = () => {
  const { theme, toggleTheme, colors } = useTheme();
  const [saved, setSaved] = useState<any[]>([]);
  const [defaultLoc, setDefaultLoc] = useState<any>(null);
  const { units, setUnits } = useUnits();

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const locs = await getItem(SAVED_LOCATIONS_KEY);
        setSaved(locs || []);
        const def = await getItem(DEFAULT_LOCATION_KEY);
        setDefaultLoc(def);
        const savedUnits = await getItem(UNITS_KEY);
        if (savedUnits) {
          setUnits(savedUnits);
        }
      };
      loadData();
    }, [])
  );

  const handleSetDefault = async (loc: any) => {
    setDefaultLoc(loc);
    await saveItem(DEFAULT_LOCATION_KEY, loc);
  };

  const handleUnitsChange = async (newUnits: 'metric' | 'imperial') => {
    setUnits(newUnits);
  };

  const settingsSections = [
    {
      title: 'Appearance',
      icon: 'palette',
      items: [
        {
          title: 'Theme',
          subtitle: `Currently using ${theme} mode`,
          icon: theme === 'dark' ? 'weather-sunny' : 'weather-night',
          action: toggleTheme,
          type: 'button',
        },
      ],
    },
    {
      title: 'Units',
      icon: 'thermometer',
      items: [
        {
          title: 'Temperature',
          subtitle: 'Choose your preferred unit',
          type: 'selection',
          options: [
            { label: 'Celsius (°C)', value: 'metric' },
            { label: 'Fahrenheit (°F)', value: 'imperial' },
          ],
          currentValue: units,
          onChange: handleUnitsChange,
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => {
    switch (item.type) {
      case 'button':
        return (
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]} onPress={item.action}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name={item.icon} size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.settingSubtitle, { color: colors.secondary }]}>{item.subtitle}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.secondary} />
          </TouchableOpacity>
        );
      case 'toggle':
        return (
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingInfo}>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.settingSubtitle, { color: colors.secondary }]}>{item.subtitle}</Text>
              </View>
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : item.value ? colors.primary : '#f4f3f4'}
              ios_backgroundColor={colors.border}
            />
          </View>
        );
      case 'selection':
        return (
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.settingSubtitle, { color: colors.secondary }]}>{item.subtitle}</Text>
              <View style={styles.optionsContainer}>
                {item.options.map((option: any) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: item.currentValue === option.value ? colors.primary : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => item.onChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: item.currentValue === option.value ? '#fff' : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={theme === 'dark' ? ['#1A1A2E', '#16213E'] : ['#3366FF', '#6B9FFF']}
        style={styles.header}
      >
        <MaterialCommunityIcons name="weather-partly-cloudy" size={64} color="#fff" />
        <Text style={styles.headerTitle}>Weather Tracker</Text>
        <Text style={styles.headerSubtitle}>Version 1.0.0</Text>
      </LinearGradient>

      {settingsSections.map((section, index) => (
        <View key={index} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name={section.icon as any} size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
          </View>
          {section.items.map((item, itemIndex) => (
            <View key={itemIndex}>{renderSettingItem(item)}</View>
          ))}
        </View>
      ))}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Default Location</Text>
        </View>
        {defaultLoc ? (
          <View style={[styles.defaultCard, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="map-marker-check" size={24} color={colors.success} />
            <Text style={[styles.defaultText, { color: colors.text }]}>
              {defaultLoc.name}
              {defaultLoc.country ? `, ${defaultLoc.country}` : ''}
            </Text>
          </View>
        ) : (
          <View style={[styles.defaultCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.noDefaultText, { color: colors.secondary }]}>No default location set</Text>
          </View>
        )}
        
        <Text style={[styles.locationListTitle, { color: colors.secondary }]}>Choose from saved locations:</Text>
        {saved.length > 0 ? (
          <FlatList
            data={saved}
            keyExtractor={(item) => `${item.lat},${item.lon}`}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSetDefault(item)}
                style={[
                  styles.locationItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: defaultLoc && item.lat === defaultLoc.lat && item.lon === defaultLoc.lon
                      ? colors.primary
                      : 'transparent',
                    borderWidth: 2,
                  },
                ]}
              >
                <Text style={[styles.locationName, { color: colors.text }]}>
                  {item.name}
                  {item.country ? `, ${item.country}` : ''}
                </Text>
                {defaultLoc && item.lat === defaultLoc.lat && item.lon === defaultLoc.lon && (
                  <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.secondary }]}>
              No saved locations. Add locations from the Locations tab.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.secondary }]}>
          Made with <Text style={{ color: colors.error }}>❤️</Text> for weather enthusiasts by Devesh Maurya
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 60,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  defaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  defaultText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noDefaultText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  locationListTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 100,
  },
  footerText: {
    fontSize: 14,
    textAlign:'center',
    padding:30
  },
});

export default SettingsScreen;