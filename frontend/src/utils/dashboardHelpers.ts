/**
 * @file dashboardHelpers.ts
 * @route /frontend/src/utils
 * @description Utilidades y helpers para el dashboard.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */
import { SensorType } from '@/types';

export const getSensorTypeConfig = (type: SensorType) => {
  const configs = {
    TEMPERATURE: {
      label: 'Temperatura',
      unit: '°C',
      color: '#ef4444',
      min: 0,
      max: 40,
      optimal: { min: 22, max: 28 },
      icon: '🌡️'
    },
    PH: {
      label: 'pH',
      unit: 'pH',
      color: '#3b82f6',
      min: 0,
      max: 14,
      optimal: { min: 6.8, max: 7.6 },
      icon: '💧'
    },
    OXYGEN: {
      label: 'Oxígeno',
      unit: 'mg/L',
      color: '#10b981',
      min: 0,
      max: 15,
      optimal: { min: 6, max: 10 },
      icon: '🫧'
    },
  };
  return configs[type];
};

export const getValueStatus = (value: number, type: SensorType): 'optimal' | 'warning' | 'critical' => {
  const config = getSensorTypeConfig(type);
  if (value >= config.optimal.min && value <= config.optimal.max) {
    return 'optimal';
  } else if (value < config.optimal.min * 0.8 || value > config.optimal.max * 1.2) {
    return 'critical';
  }
  return 'warning';
};

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }
};

export const getStatusColor = (status: 'optimal' | 'warning' | 'critical'): string => {
  const colors = {
    optimal: 'text-green-500',
    warning: 'text-yellow-500',
    critical: 'text-red-500'
  };
  return colors[status];
};

export const getStatusBgColor = (status: 'optimal' | 'warning' | 'critical'): string => {
  const colors = {
    optimal: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500'
  };
  return colors[status];
};