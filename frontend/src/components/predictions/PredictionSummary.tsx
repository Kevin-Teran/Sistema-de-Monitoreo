/**
 * @file PredictionSummary.tsx
 * @route frontend/src/components/predictions/PredictionSummary.tsx
 * @description Resumen general de todas las predicciones del tanque
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React from 'react';
import { Card, CardBody, Chip } from '@nextui-org/react';
import { 
  AlertTriangle, CheckCircle, Activity, TrendingUp, 
  TrendingDown, Cloud, Target
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface PredictionResult {
  predicted: Array<{ timestamp: string; value: number }>;
  thresholds: {
    minCritical: number;
    maxCritical: number;
    minWarning: number;
    maxWarning: number;
  } | null;
  sensorType: string;
  sensorName: string;
}

interface PredictionSummaryProps {
  results: Record<string, PredictionResult>;
  horizon: string;
  weatherData?: any[];
}

export const PredictionSummary: React.FC<PredictionSummaryProps> = ({ 
  results, 
  horizon,
  weatherData 
}) => {
  // Calcular estadísticas generales
  const stats = React.useMemo(() => {
    let critical = 0;
    let warning = 0;
    let stable = 0;
    let increasing = 0;
    let decreasing = 0;

    Object.values(results).forEach(result => {
      if (!result.predicted || result.predicted.length < 2 || !result.thresholds) return;

      const initialValue = result.predicted[0].value;
      const finalValue = result.predicted[result.predicted.length - 1].value;
      const { minCritical, maxCritical, minWarning, maxWarning } = result.thresholds;

      // Clasificar riesgo
      if (finalValue < minCritical || finalValue > maxCritical) {
        critical++;
      } else if (finalValue < minWarning || finalValue > maxWarning) {
        warning++;
      } else {
        stable++;
      }

      // Clasificar tendencia
      const trend = ((finalValue - initialValue) / initialValue) * 100;
      if (Math.abs(trend) > 5) {
        if (trend > 0) increasing++;
        else decreasing++;
      }
    });

    return {
      total: Object.keys(results).length,
      critical,
      warning,
      stable,
      increasing,
      decreasing,
    };
  }, [results]);

  // Determinar estado general del sistema
  const getOverallStatus = () => {
    if (stats.critical > 0) {
      return {
        text: 'Crítico',
        color: 'danger' as const,
        icon: AlertTriangle,
        description: 'Se detectaron riesgos críticos en las predicciones'
      };
    }
    if (stats.warning > 0) {
      return {
        text: 'Alerta',
        color: 'warning' as const,
        icon: AlertTriangle,
        description: 'Algunos sensores muestran tendencias de alerta'
      };
    }
    return {
      text: 'Estable',
      color: 'success' as const,
      icon: CheckCircle,
      description: 'Todas las predicciones dentro de rangos óptimos'
    };
  };

  const overallStatus = getOverallStatus();
  const StatusIcon = overallStatus.icon;

  return (
    <Card className="rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Resumen de Predicciones</h2>
            <p className="text-sm text-default-500">
              Análisis general del sistema para los próximos {horizon} días
            </p>
          </div>
          <Chip 
            color={overallStatus.color}
            variant="flat"
            size="lg"
            startContent={<StatusIcon className="w-5 h-5" />}
          >
            {overallStatus.text}
          </Chip>
        </div>

        {/* Grid de Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {/* Total de Sensores */}
          <div className="p-4 rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <p className="text-xs text-default-500">Total</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>

          {/* Estados Estables */}
          <div className="p-4 rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-success-500" />
              <p className="text-xs text-success-700 dark:text-success-300">Estables</p>
            </div>
            <p className="text-2xl font-bold text-success-600">{stats.stable}</p>
          </div>

          {/* Alertas */}
          <div className="p-4 rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-warning-500" />
              <p className="text-xs text-warning-700 dark:text-warning-300">Alertas</p>
            </div>
            <p className="text-2xl font-bold text-warning-600">{stats.warning}</p>
          </div>

          {/* Críticos */}
          <div className="p-4 rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
              <p className="text-xs text-danger-700 dark:text-danger-300">Críticos</p>
            </div>
            <p className="text-2xl font-bold text-danger-600">{stats.critical}</p>
          </div>

          {/* Tendencia Creciente */}
          <div className="p-4 rounded-xl shadow-xl border bg-orange-50 dark:bg-orange-950 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <p className="text-xs text-orange-700 dark:text-orange-300">↑ Subiendo</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.increasing}</p>
          </div>

          {/* Tendencia Decreciente */}
          <div className="p-4 rounded-xl shadow-xl border  bg-blue-50 dark:bg-blue-950 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-blue-500" />
              <p className="text-xs text-blue-700 dark:text-blue-300">↓ Bajando</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.decreasing}</p>
          </div>
        </div>

        {/* Información del Clima */}
        {weatherData && weatherData.length > 0 && (
          <div className="p-4 rounded-lg bg-sky-50 dark:bg-sky-950 border border-sky-200">
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="w-5 h-5 text-sky-500" />
              <h3 className="text-sm font-semibold">Pronóstico del Clima</h3>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
              {weatherData.slice(0, 7).map((day: any, idx: number) => (
                <div key={idx} className="text-center">
                  <p className="text-xs text-default-500 mb-1">
                    {idx === 0 ? 'Hoy' : new Date(day.date).toLocaleDateString('es-CO', { weekday: 'short' })}
                  </p>
                  <img 
                    src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                    alt={day.description}
                    className="w-12 h-12 mx-auto"
                  />
                  <p className="text-sm font-bold">{day.temp.toFixed(0)}°C</p>
                  <p className="text-xs text-default-400 capitalize truncate">
                    {day.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje de Estado */}
        <div className={cn(
          "mt-4 p-4 rounded-lg border-l-4",
          overallStatus.color === 'danger' && "bg-danger-50 dark:bg-danger-950 border-danger-500",
          overallStatus.color === 'warning' && "bg-warning-50 dark:bg-warning-950 border-warning-500",
          overallStatus.color === 'success' && "bg-success-50 dark:bg-success-950 border-success-500"
        )}>
          <p className="text-sm font-medium">{overallStatus.description}</p>
          {stats.critical > 0 && (
            <p className="text-xs text-default-600 mt-1">
              ⚠️ Se recomienda revisar inmediatamente los {stats.critical} sensor(es) 
              con predicciones críticas.
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};