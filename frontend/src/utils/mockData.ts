/**
 * @file mockData.tsx
 * @route /frontend/src/utils
 * @description 
 * @author Kevin Mariano 
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
*/

import { SensorData, DataSummary, PredictionData } from '@/types';

/**
 * @function generarDatosSensoresSimulados
 * @description Genera un array de objetos de datos simulados para sensores.
 * Cada objeto contiene un timestamp y valores aleatorios para temperatura, pH y oxígeno.
 * @param {number} count - El número de puntos de datos a generar (por defecto: 20).
 * @returns {SensorData[]} Un array de objetos con datos de sensores.
 */
export const generarDatosSensoresSimulados = (count: number = 20): SensorData[] => {
  const data: SensorData[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 30 * 1000); // Cada 30 segundos
    data.push({
      timestamp: timestamp.toISOString(),
      temperature: 24 + Math.sin(i * 0.1) * 3 + (Math.random() - 0.5) * 2,
      ph: 7.2 + Math.cos(i * 0.15) * 0.8 + (Math.random() - 0.5) * 0.3,
      oxygen: 8 + Math.sin(i * 0.12) * 2 + (Math.random() - 0.5) * 1,
    });
  }
  return data;
};

/**
 * @function calcularResumenDatos
 * @description Calcula un resumen estadístico (mínimo, máximo, promedio, actual) de los datos de los sensores.
 * @param {SensorData[]} data - Un array de objetos con datos de sensores.
 * @returns {DataSummary} Un objeto que resume los datos para cada parámetro.
 */
 export const calcularResumenDatos = (data: SensorData[]): DataSummary => {
  if (data.length === 0) {
    return {
      temperature: { min: 0, max: 0, avg: 0, current: 0 },
      ph: { min: 0, max: 0, avg: 0, current: 0 },
      oxygen: { min: 0, max: 0, avg: 0, current: 0 },
    };
  }

  const temps = data.map(d => d.temperature).filter(Boolean) as number[];
  const phs = data.map(d => d.ph).filter(Boolean) as number[];
  const oxygens = data.map(d => d.oxygen).filter(Boolean) as number[];

  return {
    temperature: {
      min: Math.min(...temps),
      max: Math.max(...temps),
      avg: temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0,
      current: data[data.length - 1].temperature ?? 0,
    },
    ph: {
      min: Math.min(...phs),
      max: Math.max(...phs),
      avg: phs.length > 0 ? phs.reduce((a, b) => a + b, 0) / phs.length : 0,
      current: data[data.length - 1].ph ?? 0,
    },
    oxygen: {
      min: Math.min(...oxygens),
      max: Math.max(...oxygens),
      avg: oxygens.length > 0 ? oxygens.reduce((a, b) => a + b, 0) / oxygens.length : 0,
      current: data[data.length - 1].oxygen ?? 0,
    },
  };
};

/**
 * @function generarDatosPrediccion
 * @description Genera datos simulados de predicción a 7 días, incluyendo un historial de 3 días.
 * Si se proporcionan, se utilizan las temperaturas del clima para influir en las predicciones.
 * @param {number} currentValue - El valor actual del parámetro del sensor.
 * @param {number[] | undefined} weatherTemps - Un array de temperaturas del pronóstico del tiempo. Opcional.
 * @returns {PredictionData[]} Un array de objetos con datos históricos y predichos.
 */
export const generarDatosPrediccion = (currentValue: number, weatherTemps?: number[]): PredictionData[] => {
  const data: PredictionData[] = [];
  const now = new Date();
  
  // Datos históricos (últimos 3 días)
  for (let i = 3; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const actual = currentValue + Math.sin(i * 0.5) * 2 + (Math.random() - 0.5) * 1;
    data.push({
      timestamp: timestamp.toISOString(),
      actual,
      predicted: actual + (Math.random() - 0.5) * 0.5, // Predicción cercana al valor real
    });
  }

  // Predicciones futuras (7 días)
  for (let i = 0; i < 7; i++) {
    const timestamp = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
    let predicted = currentValue;

    // Ajusta la predicción de temperatura si se proporcionan datos del clima
    if (weatherTemps && i < weatherTemps.length) {
      // Ajuste simple: la predicción se acerca a la temperatura del clima
      predicted = weatherTemps[i] + (Math.random() - 0.5) * 1; 
    } else {
      predicted = currentValue + Math.sin((i + 1) * 0.3) * 1.5 + (Math.random() - 0.5) * 0.8;
    }
    
    data.push({
      timestamp: timestamp.toISOString(),
      predicted,
    });
  }

  return data;
};