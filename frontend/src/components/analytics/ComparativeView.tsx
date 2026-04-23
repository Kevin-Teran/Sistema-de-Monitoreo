/**
 * @file ComparativeView.tsx
 * @route frontend/src/components/analytics/
 * @description Vista principal que muestra un resumen de KPIs, el estado de los tanques 
 * (para navegabilidad) y los gráficos de resumen globales (alertas y correlación).
 * @author kevin mariano
 * @version 1.0.7
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import React, { useMemo } from 'react';
import { BaseViewProps } from '@/app/(main)/analytics/page';
import { Card } from '@/components/common/Card';
import { KpiCards } from './KpiCards';
import { TimeSeriesChart } from './TimeSeriesChart';
import { AlertsSummaryCharts } from './AlertsSummaryCharts'; // Gráfico inferior izquierdo
import { ParameterCorrelation } from './ParameterCorrelation'; // Gráfico inferior derecho
import { ChevronRight, Droplet, Thermometer, Zap } from 'lucide-react';
import Link from 'next/link';
import { SensorType } from '@/types';
import { sensorTypeTranslations } from '@/utils/translations';
// Nota: Se asume que el código que causaba el error (línea 182, PieChart) ha sido eliminado de aquí,
// ya que AlertsSummaryCharts.tsx maneja esa lógica. Solo mantenemos los imports necesarios.

interface ComparativeViewProps extends BaseViewProps {
    tankStats: {
        id: string;
        name: string;
        sensorsCount: number;
        temperature: number;
        ph: number;
        oxygen: number;
    }[];
}

export const ComparativeView: React.FC<ComparativeViewProps> = ({
  kpis,
  isAnalyticsLoading,
  timeSeriesData,
  alertsSummary,
  correlationData,
  tankStats,
  currentRange,
  userSettings,
  mainSensorType, 
  secondarySensorTypes, // Usado para mostrar los 3 principales
  correlationX,
  correlationY,
}) => {
  
  // En la vista comparativa (global), mainSensorType es TEMPERATURE y secondaryTypes son pH, O2.
  const selectedSensorType = mainSensorType || SensorType.TEMPERATURE; 

  // Determina qué sensores se trajeron para la tendencia global
  const typesInChart = [selectedSensorType, ...secondarySensorTypes].filter(Boolean) as SensorType[];
  
  // Título dinámico para la gráfica de tendencia
  const chartTitle = typesInChart.length >= 3 
    ? 'Tendencias de Parámetros Principales (T°, pH, O₂)'
    : `Tendencia: ${typesInChart.map(t => sensorTypeTranslations[t] || t).join(', ')}`;


  return (
    <div className="space-y-6">
      {/* 1. KPIs Globales */}
      <KpiCards kpis={kpis} loading={isAnalyticsLoading.kpis} sensorType={selectedSensorType} />

      {/* 2. Tendencia Global de Series de Tiempo (T°, pH, O₂) */}
      <Card>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 p-4 border-b dark:border-slate-700">
          {chartTitle} ({currentRange.from.toLocaleDateString()} - {currentRange.to.toLocaleDateString()})
        </h2>
        <div className="p-4">
            {/* Se pasan todos los tipos (principal + secundarios) para que el TimeSeriesChart los dibuje */}
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

      {/* 3. Resumen de Alertas y Correlación (Sección Inferior Mejorada) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna 1: Navegación/Resumen de Tanques */}
        <Card className="p-6 h-[450px]">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Estado de Tanques</h2>
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {tankStats.length > 0 ? (
              tankStats.map(tank => (
                <div 
                  key={tank.id} 
                  className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm hover:shadow-md transition-all flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{tank.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Sensores activos: {tank.sensorsCount}</p>
                    <div className="flex space-x-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center"><Thermometer className="w-3 h-3 mr-1 text-orange-500" /> T: {tank.temperature}</span>
                      <span className="flex items-center"><Droplet className="w-3 h-3 mr-1 text-blue-500" /> pH: {tank.ph}</span>
                      <span className="flex items-center"><Zap className="w-3 h-3 mr-1 text-cyan-500" /> O₂: {tank.oxygen}</span>
                    </div>
                  </div>
                  <Link href={`/analytics?tankId=${tank.id}`} className="p-2 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-slate-500 dark:text-slate-400">No hay tanques registrados o activos.</div>
            )}
          </div>
        </Card>
        
        {/* Columna 2: Resumen de Alertas (Gráfico de torta) */}
        <div className="col-span-1">
          <AlertsSummaryCharts 
            summary={alertsSummary} 
            loading={isAnalyticsLoading.alerts} 
          />
        </div>

        {/* Columna 3: Correlación */}
        <div className="col-span-1">
          <ParameterCorrelation
            data={correlationData}
            loading={isAnalyticsLoading.correlation}
            sensorTypeX={correlationX}
            sensorTypeY={correlationY}
          />
        </div>
      </div>
    </div>
  );
};
