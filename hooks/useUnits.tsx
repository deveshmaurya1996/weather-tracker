import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItem, saveItem } from '../utils/storage';

const UNITS_KEY = 'UNITS_PREFERENCE';

type Units = 'metric' | 'imperial';

interface UnitsContextType {
  units: Units;
  setUnits: (units: Units) => void;
  getTemperatureUnit: () => string;
  getSpeedUnit: () => string;
  convertSpeed: (speed: number) => number;
  formatTemperature: (temp: number) => string;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export const UnitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [units, setUnitsState] = useState<Units>('metric');

  useEffect(() => {
    // Load units from storage on mount
    (async () => {
      const savedUnits = await getItem(UNITS_KEY);
      if (savedUnits) {
        setUnitsState(savedUnits);
      }
    })();
  }, []);

  const setUnits = async (newUnits: Units) => {
    setUnitsState(newUnits);
    await saveItem(UNITS_KEY, newUnits);
  };

  const getTemperatureUnit = () => units === 'metric' ? '°C' : '°F';
  
  const getSpeedUnit = () => units === 'metric' ? 'km/h' : 'mph';
  
  const convertSpeed = (speed: number) => {
    if (units === 'metric') {
      return Math.round(speed * 3.6); // m/s to km/h
    } else {
      return Math.round(speed * 2.237); // m/s to mph
    }
  };

  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}${getTemperatureUnit()}`;
  };

  return (
    <UnitsContext.Provider value={{ 
      units, 
      setUnits, 
      getTemperatureUnit, 
      getSpeedUnit, 
      convertSpeed,
      formatTemperature 
    }}>
      {children}
    </UnitsContext.Provider>
  );
};

export const useUnits = () => {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
};