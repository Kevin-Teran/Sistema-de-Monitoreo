/**
 * @file translations.ts
 * @route frontend/src/utils/
 * @description Centraliza las traducciones de términos técnicos a español para la UI.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { SensorType } from '@/types';

export const sensorTypeTranslations: Record<SensorType, string> = {
  [SensorType.TEMPERATURE]: 'Temperatura',
  [SensorType.PH]: 'pH',
  [SensorType.OXYGEN]: 'Oxígeno Disuelto',
};

export const rangeTranslations: Record<string, string> = {
  day: 'Hoy',
  week: 'Última Semana',
  month: 'Último Mes',
  year: 'Último Año',
};