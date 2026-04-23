/**
 * @file dashboard.ts
 * @route frontend/src/types
 * @description Tipos corregidos y actualizados para el módulo de dashboard
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */
import { SensorType } from './index';
import { EmitterStatus } from '@/services/dataService';

/**
 * @interface DashboardFilters
 * @description Filtros para consultas del dashboard
 */
export interface DashboardFilters {
  userId?: string;
  tankId?: string;
  sensorType?: SensorType;
  range?: 'hour' | 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}

/**
 * @interface DashboardSummary
 * @description Resumen de estadísticas del dashboard
 */
export interface DashboardSummary {
  tanksCount: number;
  sensorsCount: number;
  recentAlerts: number;
  totalDataPoints: number;
  activeSimulations: number;
  totalAlerts?: number;
}

/**
 * @interface RealtimeSensorData
 * @description Datos de un sensor en tiempo real con umbrales incluidos
 */
export interface RealtimeSensorData {
  sensorId: string;
  sensorName: string;
  tankName: string;
  value: number;
  timestamp: string;
  hardwareId: string;
  type: SensorType;
  thresholds?: { min: number; max: number }; // Umbrales específicos del sensor
}

/**
 * @interface RealtimeData
 * @description Datos en tiempo real agrupados por tipo de sensor con umbrales globales
 */
export interface RealtimeData {
  TEMPERATURE: RealtimeSensorData[];
  PH: RealtimeSensorData[];
  OXYGEN: RealtimeSensorData[];
  thresholds?: {
    TEMPERATURE?: { min: number; max: number };
    PH?: { min: number; max: number };
    OXYGEN?: { min: number; max: number };
  };
  [key: string]: RealtimeSensorData[] | any;
}

/**
 * @interface HistoricalDataPoint
 * @description Punto de datos histórico simple
 */
export interface HistoricalDataPoint {
  time: string;
  value: number;
}

/**
 * @interface HistoricalData
 * @description Datos históricos agrupados por tipo de sensor
 */
export interface HistoricalData {
  TEMPERATURE: HistoricalDataPoint[];
  PH: HistoricalDataPoint[];
  OXYGEN: HistoricalDataPoint[];
  [key: string]: HistoricalDataPoint[];
}

/**
 * @interface TankOverview
 * @description Vista general de un tanque
 */
export interface TankOverview {
  id: string;
  name: string;
  location: string;
  status: string;
  sensorsCount: number;
  lastReading: string | null;
  sensors: Array<{
    id: string;
    name: string;
    type: SensorType;
    status: string;
    lastValue: number | null;
    lastUpdate: string | null;
  }>;
}

/**
 * @interface DashboardUserOption
 * @description Opción de usuario para selectores
 */
export interface DashboardUserOption {
  id: string;
  name: string;
  email: string;
  _count: { tanks: number };
}

/**
 * @interface SimulationSummaryByTank
 * @description Resumen de simulaciones por tanque
 */
export interface SimulationSummaryByTank {
  tankName: string;
  count: number;
  simulations: EmitterStatus[];
}

/**
 * @interface SimulationSummary
 * @description Resumen general de simulaciones
 */
export interface SimulationSummary {
  totalActive: number;
  totalMessages: number;
  byTank: Record<string, SimulationSummaryByTank>;
  byType: Record<string, number>;
}

/**
 * @interface SimulationMetrics
 * @description Métricas del sistema de simulación
 */
export interface SimulationMetrics {
  systemUptime: number;
}
