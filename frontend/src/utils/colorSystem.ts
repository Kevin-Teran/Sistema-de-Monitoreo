/**
 * @file colorSystem.ts
 * @route frontend/src/utils
 * @description Sistema de colores unificado para toda la aplicación
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { SensorType } from '@/types';

/**
 * Sistema de Colores por Estado
 */
export const StatusColors = {
  // ÓPTIMO - Verde
  optimal: {
    text: 'text-success-600 dark:text-success-400',
    bg: 'bg-success-50 dark:bg-success-950',
    border: 'border-success-200 dark:border-success-800',
    icon: 'text-success-500',
    chip: 'success' as const,
  },
  // ALERTA - Naranja/Amarillo
  warning: {
    text: 'text-warning-600 dark:text-warning-400',
    bg: 'bg-warning-50 dark:bg-warning-950',
    border: 'border-warning-200 dark:border-warning-800',
    icon: 'text-warning-500',
    chip: 'warning' as const,
  },
  // CRÍTICO - Rojo
  critical: {
    text: 'text-danger-600 dark:text-danger-400',
    bg: 'bg-danger-50 dark:bg-danger-950',
    border: 'border-danger-200 dark:border-danger-800',
    icon: 'text-danger-500',
    chip: 'danger' as const,
  },
  // TENDENCIA ALTA - Azul
  high: {
    text: 'text-primary-600 dark:text-primary-400',
    bg: 'bg-primary-50 dark:bg-primary-950',
    border: 'border-primary-200 dark:border-primary-800',
    icon: 'text-primary-500',
    chip: 'primary' as const,
  },
  // TENDENCIA BAJA - Azul claro
  low: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
    chip: 'primary' as const,
  },
  // NEUTRAL/DEFAULT
  default: {
    text: 'text-default-600 dark:text-default-400',
    bg: 'bg-default-50 dark:bg-default-900',
    border: 'border-default-200 dark:border-default-800',
    icon: 'text-default-500',
    chip: 'default' as const,
  },
};

/**
 * Colores por Tipo de Sensor
 */
export const SensorColors = {
  [SensorType.TEMPERATURE]: {
    primary: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950',
    border: 'border-orange-200 dark:border-orange-800',
    gradient: 'from-orange-500 to-red-500',
    hex: '#f97316',
  },
  [SensorType.PH]: {
    primary: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500 to-cyan-500',
    hex: '#3b82f6',
  },
  [SensorType.OXYGEN]: {
    primary: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    border: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500 to-green-500',
    hex: '#10b981',
  },
};

/**
 * Colores para Gráficos (Recharts)
 */
export const ChartColors = {
  // Líneas principales
  temperature: '#f97316',
  ph: '#3b82f6',
  oxygen: '#10b981',
  
  // Umbrales
  critical: '#f31260',
  warning: '#f5a524',
  optimal: '#17c964',
  
  // Grid y ejes
  grid: '#e5e7eb',
  gridDark: '#374151',
  axis: '#6b7280',
};

/**
 * Estilos de Tarjetas Base
 */
export const CardStyles = {
  base: 'bg-white dark:bg-gray-900 border border-default-200 dark:border-default-800 rounded-xl shadow-sm',
  elevated: 'bg-white dark:bg-gray-900 border border-default-200 dark:border-default-800 rounded-xl shadow-lg',
  interactive: 'bg-white dark:bg-gray-900 border border-default-200 dark:border-default-800 rounded-xl shadow-sm hover:shadow-md transition-shadow',
};

/**
 * Helpers para obtener colores según estado
 */
export const getStatusColor = (status: 'optimal' | 'warning' | 'critical' | 'default') => {
  return StatusColors[status] || StatusColors.default;
};

export const getSensorColor = (sensorType: SensorType) => {
  return SensorColors[sensorType];
};