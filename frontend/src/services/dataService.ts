/**
 * @file dataService.ts
 * @route frontend/src/services
 * @description Servicio frontend mejorado para gestión de datos y simulaciones (sin cambios en BD).
 * @author kevin mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import api from '@/config/api';
import { ManualEntryDto } from '@/types';

export interface EmitterStatus {
  sensorId: string;
  sensorName: string;
  type: string;
  tankId: string;
  tankName: string;
  userName: string;
  userId: string;
  thresholds: { min: number; max: number };
  currentValue: number;
  state: string;
  startTime: string;
  messagesCount: number;
  uptime: number;
  unit: string;
  messagesPerMinute: number;
  isPersistent: boolean;
}

export interface SimulationMetrics {
  totalActiveSimulations: number;
  totalMessagesSent: number;
  averageUptime: number;
  simulationsByType: Record<string, number>;
  simulationsByUser: Record<string, number>;
  systemUptime: number;
}

export interface StartEmittersResponse {
  started: string[];
  skipped: string[];
  errors: string[];
}

export interface StopEmittersResponse {
  stopped: string[];
  notFound: string[];
  noPermission: string[];
}

/**
 * @description Envía una entrada manual de datos
 */
export const addManualEntry = async (entry: ManualEntryDto) => {
  try {
    const response = await api.post('/data/manual', [entry]);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error enviando entrada manual:', error);
    throw error;
  }
};

/**
 * @description Envía múltiples entradas manuales de datos
 */
export const addManualEntries = async (entries: ManualEntryDto[]) => {
  try {
    const response = await api.post('/data/manual', entries);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error enviando entradas manuales:', error);
    throw error;
  }
};

/**
 * @description Inicia simuladores para los sensores especificados
 */
export const startEmitters = async (sensorIds: string[]): Promise<StartEmittersResponse> => {
  try {
    const response = await api.post('/data/emitter/start', { sensorIds });
    return response.data;
  } catch (error: any) {
    console.error('❌ Error iniciando simuladores:', error);
    throw error;
  }
};

/**
 * @description Detiene un simulador específico
 */
export const stopEmitter = async (sensorId: string) => {
  try {
    const response = await api.post('/data/emitter/stop', { sensorId });
    return response.data;
  } catch (error: any) {
    console.error('❌ Error deteniendo simulador:', error);
    throw error;
  }
};

/**
 * @description Detiene múltiples simuladores
 */
export const stopMultipleEmitters = async (sensorIds: string[]): Promise<StopEmittersResponse> => {
  try {
    const response = await api.post('/data/emitter/stop-multiple', { sensorIds });
    return response.data;
  } catch (error: any) {
    console.error('❌ Error deteniendo múltiples simuladores:', error);
    throw error;
  }
};

/**
 * @description Reinicia simuladores específicos
 */
export const restartEmitters = async (sensorIds: string[]) => {
  try {
    const response = await api.post('/data/emitter/restart', { sensorIds });
    return response.data;
  } catch (error: any) {
    console.error('❌ Error reiniciando simuladores:', error);
    throw error;
  }
};

/**
 * @description Obtiene el estado de todos los simuladores activos
 */
export const getEmitterStatus = async (): Promise<EmitterStatus[]> => {
  try {
    const response = await api.get('/data/emitter/status');
    return response.data;
  } catch (error: any) {
    console.error('❌ Error obteniendo estado de simuladores:', error);
    throw error;
  }
};

/**
 * @description Obtiene métricas detalladas de simulación
 */
export const getSimulationMetrics = async (): Promise<SimulationMetrics> => {
  try {
    const response = await api.get('/data/emitter/metrics');
    return response.data;
  } catch (error: any) {
    console.error('❌ Error obteniendo métricas de simulación:', error);
    throw error;
  }
};

/**
 * @description Obtiene datos más recientes de sensores
 */
export const getLatestData = async (tankId?: string, type?: string) => {
  try {
    const params: any = {};
    if (tankId) params.tankId = tankId;
    if (type) params.type = type;
    
    const response = await api.get('/data/latest', { params });
    return response.data;
  } catch (error: any) {
    console.error('❌ Error obteniendo datos más recientes:', error);
    throw error;
  }
};

/**
 * @description Obtiene datos históricos de sensores
 */
export const getHistoricalData = async (tankId: string, startDate: string, endDate: string) => {
  try {
    const response = await api.get('/data/historical', {
      params: { tankId, startDate, endDate }
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Error obteniendo datos históricos:', error);
    throw error;
  }
};