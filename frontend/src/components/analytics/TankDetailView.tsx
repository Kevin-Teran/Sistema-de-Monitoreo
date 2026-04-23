/**
 * @file TankDetailView.tsx
 * @route frontend/src/components/analytics/
 * @description Muestra la vista detallada de un tanque con todos sus sensores.
 * @author kevin mariano
 * @version 1.0.3
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useMemo } from 'react';
import { BaseViewProps } from '@/app/(main)/analytics/page';
import { Card } from '@/components/common/Card';
import { KpiCards } from './KpiCards';
import { TimeSeriesChart } from './TimeSeriesChart';
import { ParameterCorrelation } from './ParameterCorrelation';
import { AlertsSummaryCharts } from './AlertsSummaryCharts';
import { Info, Gauge, Container } from 'lucide-react';
import { SensorType } from '@/types';
import { sensorTypeTranslations } from '@/utils/translations';

// Hereda BaseViewProps, que contiene todas las props necesarias.
interface TankDetailViewProps extends BaseViewProps {}

export const TankDetailView: React.FC<TankDetailViewProps> = ({
  tanks,
  kpis,
  isAnalyticsLoading,
  timeSeriesData,
  alertsSummary,
  correlationData,
  currentRange,
  userSettings,
  selectedTankId,
  mainSensorType, // El tipo principal (e.g., Temperatura)
  secondarySensorTypes, // Los tipos secundarios (e.g., pH, Oxígeno)
  correlationX,
  correlationY,
}) => {
  
  const selectedTank = useMemo(() => tanks.find((t: any) => t.id === selectedTankId), [tanks, selectedTankId]);
  
  // El KPI se calcula usando el mainSensorType (el primer tipo en la lista)
  const kpiSensorType = mainSensorType || SensorType.TEMPERATURE; 
  const kpiSensorName = sensorTypeTranslations[kpiSensorType] || kpiSensorType;
  
  // Lista combinada de sensores para la gráfica (para el título)
  const allSensorTypes = [kpiSensorType, ...secondarySensorTypes].filter(Boolean) as SensorType[];
  const chartTitle = allSensorTypes.length > 1 
    ? `Tendencias de Parámetros Activos (${allSensorTypes.map(t => sensorTypeTranslations[t]).join(', ')})`
    : `Tendencia Histórica de ${kpiSensorName}`;


  if (selectedTankId === 'ALL' || !selectedTank) {
    return (
      <Card className="p-10 text-center">
        <Container className="w-12 h-12 mx-auto mb-4 text-indigo-500" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Seleccione un Tanque para el Detalle
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Utilice el filtro de Tanque para ver el desempeño histórico y las métricas de un tanque específico.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700">
        Análisis Detallado del Tanque: {selectedTank.name}
      </h2>
      
      {/* 1. KPIs */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center">
          <Gauge className="w-5 h-5 mr-2 text-indigo-500" /> Métricas Clave de {kpiSensorName}
        </h3>
        {/* CORRECCIÓN CLAVE: Pasar la prop sensorType, que es requerida por KpiCards */}
        <KpiCards 
          kpis={kpis} 
          loading={isAnalyticsLoading.kpis} 
          sensorType={kpiSensorType} // <-- ¡Propiedad Requerida Añadida!
        />
      </div>

      {/* 2. Tendencia Histórica de todos los sensores del tanque */}
      <Card>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 p-4 border-b dark:border-slate-700">
          {chartTitle}
        </h2>
        <div className="p-4">
            <TimeSeriesChart
                data={timeSeriesData}
                loading={isAnalyticsLoading.timeSeries}
                mainSensorType={kpiSensorType} // El primario (T° si existe)
                secondarySensorTypes={secondarySensorTypes} // El resto (pH, O₂)
                userSettings={userSettings}
                dateRange={currentRange}
            />
        </div>
      </Card>
      
      {/* 3. Correlación y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Correlación (Por defecto T° vs pH si ambos existen) */}
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
