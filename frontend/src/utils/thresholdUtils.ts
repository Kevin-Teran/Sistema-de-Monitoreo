/**
 * @file thresholdUtils.ts
 * @route frontend/src/utils
 * @description Utilidades para procesar umbrales desde user.settings
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { SensorType } from '@/types';

export interface ThresholdValues {
  minCritical: number;
  minWarning: number;
  maxWarning: number;
  maxCritical: number;
}

/**
 * @description Convierte los umbrales simples (min/max) en umbrales completos con zonas
 * @example
 * Input: { min: 19, max: 30 }
 * Output: { minCritical: 15.2, minWarning: 17.1, maxWarning: 33, maxCritical: 36 }
 */
export const expandThresholds = (
  min: number,
  max: number
): ThresholdValues => {
  // Calcular márgenes (20% para crítico, 10% para warning)
  const range = max - min;
  const criticalMargin = range * 0.2;
  const warningMargin = range * 0.1;

  return {
    minCritical: parseFloat((min - criticalMargin).toFixed(2)),
    minWarning: parseFloat((min - warningMargin).toFixed(2)),
    maxWarning: parseFloat((max + warningMargin).toFixed(2)),
    maxCritical: parseFloat((max + criticalMargin).toFixed(2)),
  };
};

/**
 * @description Extrae umbrales desde la estructura de user.settings
 * @param {any} settings - Objeto settings del usuario (puede ser string JSON)
 * @param {SensorType} sensorType - Tipo de sensor
 * @returns {ThresholdValues | null} Umbrales expandidos o null
 */
export const parseThresholds = (
  settings: any,
  sensorType: SensorType
): ThresholdValues | null => {
  try {
    // Si settings es string, parsearlo
    let parsedSettings = settings;
    if (typeof settings === 'string') {
      parsedSettings = JSON.parse(settings);
    }

    // Verificar estructura
    if (!parsedSettings?.thresholds) {
      console.warn('No se encontró campo thresholds en settings');
      return null;
    }

    // Mapear tipo de sensor a key en settings (minúsculas)
    const sensorKey = sensorType.toLowerCase();
    const thresholdData = parsedSettings.thresholds[sensorKey];

    if (!thresholdData) {
      console.warn(`No se encontraron umbrales para ${sensorType}`);
      return null;
    }

    // Verificar que tiene min y max
    if (typeof thresholdData.min !== 'number' || typeof thresholdData.max !== 'number') {
      console.warn('Umbrales no tienen formato válido (min/max)');
      return null;
    }

    // Expandir a estructura completa
    return expandThresholds(thresholdData.min, thresholdData.max);
    
  } catch (error) {
    console.error('Error parseando umbrales:', error);
    return null;
  }
};

/**
 * @description Obtiene umbrales por defecto si no existen en settings
 */
export const getDefaultThresholds = (sensorType: SensorType): ThresholdValues => {
  const defaults = {
    [SensorType.TEMPERATURE]: expandThresholds(22, 28),
    [SensorType.PH]: expandThresholds(6.8, 7.6),
    [SensorType.OXYGEN]: expandThresholds(6, 10),
  };

  return defaults[sensorType] || expandThresholds(0, 100);
};

/**
 * @description Determina el estado de un valor según los umbrales
 */
export const getValueStatus = (
  value: number,
  thresholds: ThresholdValues
): 'optimal' | 'warning' | 'critical' => {
  if (value < thresholds.minCritical || value > thresholds.maxCritical) {
    return 'critical';
  }
  if (value < thresholds.minWarning || value > thresholds.maxWarning) {
    return 'warning';
  }
  return 'optimal';
};