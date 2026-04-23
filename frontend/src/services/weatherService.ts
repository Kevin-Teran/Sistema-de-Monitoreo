/**
 * @file weatherService.ts
 * @route frontend/src/services
 * @description Servicio REFORZADO para obtener datos del clima desde OpenWeatherMap API.
 * Soporta coordenadas (Lat, Lon) y nombres de ciudades.
 * FIX: Usar formato ISO (yyyy-MM-dd) para fechas, evitando Invalid Date.
 * @author Kevin Mariano
 * @version 2.2.1
 * @since 1.0.0
 */

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY || '56661711020895ed3c361ae25d46de7a';

interface OpenWeatherItem {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
}

interface OpenWeatherResponse {
  list: OpenWeatherItem[];
  city?: {
    name: string;
    coord: { lat: number; lon: number };
  };
}

export interface WeatherForecast {
  date: string; // ISO format: yyyy-MM-dd
  temp: number;
  temp_min: number;
  temp_max: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
}

/**
 * @description Intenta extraer coordenadas si el formato es "lat,lon"
 */
const parseCoordinates = (location: string): { lat: number; lon: number } | null => {
  if (!location || typeof location !== 'string') return null;

  const cleaned = location.trim();
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(part => parseFloat(part.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [lat, lon] = parts;
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { lat, lon };
      }
    }
  }
  return null;
};

/**
 * @description Formatea una fecha Unix timestamp a formato ISO yyyy-MM-dd
 * Esto es CRÍTICO para evitar Invalid Date al parsear después con new Date()
 */
const formatToIsoDate = (dt: number): string => {
  const date = new Date(dt * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * @description Obtiene el pronóstico del clima para una ubicación (Coords o Ciudad)
 * @param {string} location - Puede ser coordenadas "4.71,-74.07" o ciudad "Barranquilla"
 * @param {number} days - Número de días de pronóstico (máx 5 con API gratuita)
 */
export const getWeatherForecast = async (
  location: string, 
  days: number = 5
): Promise<WeatherForecast[]> => {
  try {
    if (!location) {
      console.warn('⚠️ Ubicación vacía, omitiendo clima.');
      return [];
    }

    let apiUrl = '';
    const coords = parseCoordinates(location);

    if (coords) {
      console.log(`🌤️ Buscando clima por coordenadas: ${coords.lat}, ${coords.lon}`);
      apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
    } else {
      const cityQuery = encodeURIComponent(location.trim());
      console.log(`🌤️ Buscando clima por ciudad: "${location}"`);
      apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityQuery}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
    }

    const response = await fetch(apiUrl, { cache: 'no-store' });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`⚠️ Ciudad no encontrada: ${location}`);
      } else {
        console.error(`Error de API del clima: ${response.status}`);
      }
      return [];
    }

    const data: OpenWeatherResponse = await response.json();

    if (!data.list || data.list.length === 0) {
      return [];
    }

    return processForecastData(data.list, days);

  } catch (error: any) {
    console.error('❌ Error crítico en servicio de clima:', error.message);
    return [];
  }
};

/**
 * @description Procesa los datos crudos de la API
 * FIX: Usar formatToIsoDate() en lugar de toLocaleDateString() para evitar Invalid Date
 */
const processForecastData = (forecastList: OpenWeatherItem[], days: number): WeatherForecast[] => {
  const dailyData: { [isoDate: string]: OpenWeatherItem[] } = {};

  forecastList.forEach((item) => {
    // FIX CRÍTICO: Usar formato ISO yyyy-MM-dd en lugar de toLocaleDateString
    // toLocaleDateString('es-CO') produce "15/01/2025" que new Date() NO puede parsear
    const isoDate = formatToIsoDate(item.dt);
    
    if (!dailyData[isoDate]) {
      dailyData[isoDate] = [];
    }
    dailyData[isoDate].push(item);
  });

  const dailyForecasts: WeatherForecast[] = Object.entries(dailyData)
    .slice(0, days)
    .map(([isoDate, items]) => {
      const temps = items.map(i => i.main.temp);
      const temps_min = items.map(i => i.main.temp_min);
      const temps_max = items.map(i => i.main.temp_max);
      const humidity = items.map(i => i.main.humidity);
      const feels_like = items.map(i => i.main.feels_like);
      
      const representativeItem = items[Math.floor(items.length / 2)];

      return {
        date: isoDate, // ISO format: "2025-01-15" - parseado correctamente por new Date()
        temp: Math.round(average(temps) * 10) / 10, 
        temp_min: Math.min(...temps_min),
        temp_max: Math.max(...temps_max),
        feels_like: Math.round(average(feels_like) * 10) / 10,
        humidity: Math.round(average(humidity)),
        description: representativeItem.weather[0].description,
        icon: representativeItem.weather[0].icon,
      };
    });

  return dailyForecasts;
};

const average = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;

export const getWeatherIconUrl = (iconCode: string): string => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};