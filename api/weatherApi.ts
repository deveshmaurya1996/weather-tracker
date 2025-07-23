import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const fetchCurrentWeather = async (lat: number, lon: number, units: 'metric' | 'imperial' = 'metric') => {
  const { data } = await api.get('/weather', {
    params: { lat, lon, units, appid: API_KEY },
  });
  return data;
};

export const fetch7DayForecast = async (lat: number, lon: number, units: 'metric' | 'imperial' = 'metric') => {
  const { data } = await api.get('/forecast', {
    params: { lat, lon, units, appid: API_KEY },
  });
  
  const transformedData = {
    daily: data.list
      .filter((_: any, index: number) => index % 8 === 0)
      .slice(0, 7)
      .map((item: any) => ({
        dt: item.dt,
        temp: {
          max: item.main.temp_max,
          min: item.main.temp_min,
        },
        weather: item.weather,
      })),
    hourly: data.list.slice(0, 12).map((item: any) => ({
      dt: item.dt,
      temp: item.main.temp,
      weather: item.weather,
    })),
  };
  
  return transformedData;
};

export const searchCity = async (query: string, limit: number = 5) => {
  const { data } = await axios.get(GEO_URL, {
    params: { q: query, limit, appid: API_KEY },
  });
  return data;
}; 