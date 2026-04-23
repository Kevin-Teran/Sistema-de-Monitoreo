/**
 * @file SensorDetailModal.tsx
 * @description Modal optimizado para mostrar detalles completos del sensor.
 * @author Kevin Mariano
 * @version 3.0.0
 * @since 1.0.0
 */
'use client';

import React from 'react';
import { Sensor, SensorType } from '@/types';
import { 
  X, 
  FileText,
  Thermometer, 
  Droplets, 
  Wind, 
  Settings,
  MapPin,
  Calendar,
  Hash,
  Activity,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  WifiOff,
  Wrench,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SensorDetailModalProps {
  isOpen: boolean;
  sensor: Sensor & {
    tank?: {
      id: string;
      name: string;
      location: string;
      userId: string;
      user?: {
        id: string;
        name: string;
        email: string;
      };
    };
    _count?: {
      SensorData: number;
    };
  };
  lastReading: number | null; 
  onClose: () => void;
}

const getSensorInfo = (type: SensorType) => ({
  TEMPERATURE: { 
    Icon: Thermometer, 
    name: 'Temperatura', 
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
    unit: '°C',
    description: 'Sensor de temperatura del agua',
    range: '0°C - 50°C',
    accuracy: '±0.1°C'
  },
  PH: { 
    Icon: Droplets, 
    name: 'pH', 
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    unit: '',
    description: 'Medidor de acidez/alcalinidad',
    range: '0 - 14 pH',
    accuracy: '±0.01 pH'
  },
  OXYGEN: { 
    Icon: Wind, 
    name: 'Oxígeno Disuelto', 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    unit: 'mg/L',
    description: 'Sensor de oxígeno disuelto en agua',
    range: '0 - 20 mg/L',
    accuracy: '±0.1 mg/L'
  }
}[type] || { 
  Icon: Settings, 
  name: 'Desconocido', 
  color: 'text-gray-500',
  bgColor: 'bg-gray-500',
  unit: '',
  description: 'Tipo de sensor no reconocido',
  range: 'N/A',
  accuracy: 'N/A'
});

const getStatusInfo = (status: Sensor['status']) => {
  const statusConfig = {
    ACTIVE: {
      icon: CheckCircle,
      label: 'Activo',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Funcionando correctamente'
    },
    INACTIVE: {
      icon: WifiOff,
      label: 'Inactivo',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      description: 'Sin actividad reciente'
    },
    MAINTENANCE: {
      icon: Wrench,
      label: 'Mantenimiento',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'En proceso de mantenimiento'
    },
    ERROR: {
      icon: AlertCircle,
      label: 'Error',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Requiere atención inmediata'
    },
    CALIBRATING: {
      icon: Zap,
      label: 'Calibrando',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'En proceso de calibración'
    }
  };

  return statusConfig[status] || statusConfig.INACTIVE;
};

export const SensorDetailModal: React.FC<SensorDetailModalProps> = ({
  isOpen,
  sensor,
  lastReading, 
  onClose,
}) => {
  if (!isOpen) return null;

  const sensorInfo = getSensorInfo(sensor.type);
  const statusInfo = getStatusInfo(sensor.status);
  const StatusIcon = statusInfo.icon;

  const formatLastUpdate = (date: string | Date | null) => {
    if (!date) return 'Sin datos';
    
    try {
      const parsedDate = typeof date === 'string' ? parseISO(date) : date;
      return {
        formatted: format(parsedDate, 'dd/MM/yyyy HH:mm:ss', { locale: es }),
        relative: formatDistanceToNow(parsedDate, { addSuffix: true, locale: es })
      };
    } catch {
      return { formatted: 'Fecha inválida', relative: 'Fecha inválida' };
    }
  };

  const lastUpdateInfo = formatLastUpdate(sensor.updatedAt);
  const calibrationInfo = formatLastUpdate(sensor.calibrationDate);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={clsx("p-3 rounded-xl", sensorInfo.color.replace('text-', 'bg-') + '/10')}>
                <FileText className="w-8 h-8 text-[#39A900]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Detalles del Sensor
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Información completa y estado actual
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Sensor Overview */}
          <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={clsx("p-4 rounded-xl", sensorInfo.color.replace('text-', 'bg-') + '/10')}>
                  <sensorInfo.Icon className={clsx("w-10 h-10", sensorInfo.color)} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    {sensor.name}
                  </h4>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {sensorInfo.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {sensorInfo.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end mb-2">
                  <div className={clsx("flex items-center space-x-2 px-3 py-2 rounded-lg", statusInfo.bgColor)}>
                    <StatusIcon className={clsx("w-5 h-5", statusInfo.color)} />
                    <span className={clsx("font-medium", statusInfo.color)}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Current Reading */}
          <div className="mb-8">
            <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Lectura Actual
            </h5>
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 text-center">
              <div className="flex items-baseline justify-center mb-4">
                <span className="text-6xl font-bold text-gray-900 dark:text-white">
                  {lastReading !== null && lastReading !== undefined 
                    ? lastReading.toFixed(sensor.type === 'PH' ? 2 : 1) 
                    : '--'
                  }
                </span>
                <span className="text-2xl text-gray-500 dark:text-gray-400 ml-2">
                  {sensorInfo.unit}
                </span>
              </div>
              <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-1" />
                <span>
                  Última actualización: {typeof lastUpdateInfo === 'string' ? lastUpdateInfo : lastUpdateInfo.formatted}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {typeof lastUpdateInfo === 'string' ? '' : lastUpdateInfo.relative}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Technical Information */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Hash className="w-5 h-5 mr-2 text-[#39A900]" />
                Información Técnica
              </h5>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ID de Hardware
                  </label>
                  <p className="text-lg font-mono bg-gray-50 dark:bg-gray-600 px-3 py-2 rounded-lg mt-1">
                    {sensor.hardwareId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tipo de Sensor
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white mt-1">
                    {sensorInfo.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Rango de Medición
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white mt-1">
                    {sensorInfo.range}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Precisión
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white mt-1">
                    {sensorInfo.accuracy}
                  </p>
                </div>
              </div>
            </div>

            {/* Location & Maintenance */}
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#39A900]" />
                Ubicación y Mantenimiento
              </h5>
              <div className="space-y-4">
                {sensor.tank && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Tanque
                      </label>
                      <p className="text-lg text-gray-900 dark:text-white mt-1">
                        {sensor.tank.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Ubicación
                      </label>
                      <p className="text-lg text-gray-900 dark:text-white mt-1">
                        {sensor.tank.location}
                      </p>
                    </div>
                    {sensor.tank.user && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Propietario
                        </label>
                        <p className="text-lg text-gray-900 dark:text-white mt-1 flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          {sensor.tank.user.name}
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Última Calibración
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white mt-1">
                    {typeof calibrationInfo === 'string' ? calibrationInfo : calibrationInfo.formatted}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {typeof calibrationInfo === 'string' ? '' : calibrationInfo.relative}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {sensor._count && (
            <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-[#39A900]" />
                Estadísticas de Operación
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                  <p className="text-3xl font-bold text-[#39A900]">
                      {sensor._count.SensorData || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Lecturas Registradas
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                  <p className="text-3xl font-bold text-blue-500">
                      {lastReading !== null ? '24/7' : '0/7'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Días Activos
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                  <p className={clsx(
                      "text-3xl font-bold",
                      sensor.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'
                  )}>
                      {sensor.status === 'ACTIVE' ? '99%' : '0%'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Tiempo Operativo
                  </p>
                </div>
              </div>
            </div>  
          )}

          {/* Close Button */}
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#39A900] text-white rounded-lg hover:bg-[#2F8B00] transition-colors font-medium flex items-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};