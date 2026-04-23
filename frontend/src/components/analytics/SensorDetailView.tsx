/**
 * @file SensorDetailView.tsx
 * @route frontend/src/components/analytics/
 * @description Muestra la vista detallada de un parámetro específico (sin importar el tanque).
 * @author kevin mariano
 * @version 1.0.3
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React from 'react';
import { BaseViewProps } from '@/app/(main)/analytics/page';
import { Card } from '@/components/common/Card';
import { KpiCards } from './KpiCards';
import { TimeSeriesChart } from './TimeSeriesChart';
import { ParameterCorrelation } from './ParameterCorrelation';
import { AlertsSummaryCharts } from './AlertsSummaryCharts';
import { Info, Gauge } from 'lucide-react';
import { sensorTypeTranslations } from '@/utils/translations';
import { SensorType } from '@/types';

// Hereda BaseViewProps, que contiene todas las props necesarias.
interface SensorDetailViewProps extends BaseViewProps {}

export const SensorDetailView: React.FC<SensorDetailViewProps> = ({
  kpis,
  isAnalyticsLoading,
  timeSeriesData,
  alertsSummary,
  correlationData,
  currentRange,
  userSettings,
  mainSensorType,
  secondarySensorTypes,
  correlationX,
  correlationY,
}) => {
  
  const selectedSensorType = mainSensorType || SensorType.TEMPERATURE;
  const sensorName = sensorTypeTranslations[selectedSensorType] || selectedSensorType;

  if (!mainSensorType) {
    return (
      <Card className="p-10 text-center">
        <Info className="w-12 h-12 mx-auto mb-4 text-amber-500" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Seleccione un Parámetro Específico
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Utilice el filtro de Parámetro para ver las estadísticas detalladas de un sensor en particular.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700">
        Análisis Detallado: {sensorName}
      </h2>
      
      {/* 1. KPIs */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center">
          <Gauge className="w-5 h-5 mr-2 text-indigo-500" /> Métricas Clave de {sensorName}
        </h3>
        {/* CORRECCIÓN CLAVE: Pasar la prop sensorType, que es requerida por KpiCards */}
        <KpiCards 
          kpis={kpis} 
          loading={isAnalyticsLoading.kpis} 
          sensorType={selectedSensorType} // <-- ¡Propiedad Requerida Añadida!
        />
      </div>

      {/* 2. Tendencia Histórica */}
      <Card>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 p-4 border-b dark:border-slate-700">
          Tendencia Histórica de {sensorName}
        </h2>
        <div className="p-4">
            <TimeSeriesChart
                data={timeSeriesData}
                loading={isAnalyticsLoading.timeSeries}
                mainSensorType={selectedSensorType}
                secondarySensorTypes={secondarySensorTypes}
                userSettings={userSettings}
                dateRange={currentRange}
            />
        </div>
      </Card>
      
      {/* 3. Correlación y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Correlación (Si se está comparando con un sensor secundario) */}
          <ParameterCorrelation
            data={correlationData}
            loading={isAnalyticsLoading.correlation}
            sensorTypeX={correlationX}
            sensorTypeY={correlationY}
          />

          {/* Resumen de Alertas */}
          <AlertsSummaryCharts 
            summary={alertsSummary} 
            loading={isAnalyticsLoading.alerts} 
          />
      </div>
    </div>
  );
};
