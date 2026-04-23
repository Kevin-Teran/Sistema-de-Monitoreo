/**
 * @file ParameterCorrelation.tsx
 * @route frontend/src/components/analytics/
 * @description Muestra un gráfico de dispersión para analizar la correlación entre dos tipos de sensores.
 * @author kevin mariano
 * @version 1.0.2 // Versión corregida
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React from 'react';
import { Card } from '@/components/common/Card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CorrelationData, SensorType } from '@/types';
import { TrendingUp, Info } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';
import { sensorTypeTranslations } from '@/utils/translations';

interface ParameterCorrelationProps {
  data: CorrelationData[] | null; // Aceptar que puede ser null al inicio
  loading: boolean;
  sensorTypeX?: SensorType;
  sensorTypeY?: SensorType;
}

/**
 * @function calculateCorrelation
 * @description Calcula el coeficiente de correlación de Pearson (r).
 * @param {CorrelationData[] | null} data - Datos de correlación.
 * @returns {number} Coeficiente r.
 */
const calculateCorrelation = (data: CorrelationData[] | null): number => {
  // 🚩 CORRECCIÓN: Verifica si 'data' es null o tiene menos de 2 elementos
  if (!data || data.length < 2) return 0;

  const n = data.length;
  const sumX = data.reduce((acc, d) => acc + d.x, 0);
  const sumY = data.reduce((acc, d) => acc + d.y, 0);
  const sumX2 = data.reduce((acc, d) => acc + d.x * d.x, 0);
  const sumY2 = data.reduce((acc, d) => acc + d.y * d.y, 0);
  const sumXY = data.reduce((acc, d) => acc + d.x * d.y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
};

/**
 * @function interpretCorrelation
 * @description Devuelve una interpretación cualitativa de la correlación.
 * @param {number} r - Coeficiente de correlación.
 * @returns {string} Interpretación.
 */
const interpretCorrelation = (r: number): string => {
  const absR = Math.abs(r);
  if (absR >= 0.9) return 'Correlación muy fuerte.';
  if (absR >= 0.7) return 'Correlación fuerte.';
  if (absR >= 0.5) return 'Correlación moderada.';
  if (absR >= 0.3) return 'Correlación débil.';
  return 'Correlación muy débil o nula.';
};

export const ParameterCorrelation: React.FC<ParameterCorrelationProps> = ({ 
  data, 
  loading, 
  sensorTypeX = SensorType.TEMPERATURE, 
  sensorTypeY = SensorType.PH 
}) => {
  
  if (loading) {
    return (
      <Card className="p-6 h-[400px]">
        <Skeleton className="h-full w-full" />
      </Card>
    );
  }

  // Se asegura que data sea al menos un array vacío si es null
  const safeData = data || []; 

  const r = calculateCorrelation(safeData);
  const interpretation = interpretCorrelation(r);
  const sign = r >= 0 ? 'Positiva' : 'Negativa';
  const correlationLabel = `${r.toFixed(4)} (${sign})`;

  if (safeData.length === 0) {
    return (
      <Card className="p-6 text-center h-[400px] flex flex-col justify-center">
        <Info className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          No hay datos para Correlación
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Asegúrate de que los dos tipos de sensores seleccionados tengan datos en el rango de tiempo.
        </p>
      </Card>
    );
  }

  // Asumimos que los datos provienen de un contexto donde los tipos X e Y están definidos
  // Usaremos valores por defecto para la representación del eje X/Y
  const xAxisLabel = sensorTypeTranslations[sensorTypeX] || sensorTypeX;
  const yAxisLabel = sensorTypeTranslations[sensorTypeY] || sensorTypeY;

  return (
    <Card className="p-6 shadow-lg h-[450px] flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            Correlación entre Parámetros
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Coeficiente de Correlación de Pearson ($r$): 
            <span 
              className={`ml-2 font-bold ${r > 0.5 ? 'text-green-500' : r < -0.5 ? 'text-red-500' : 'text-amber-500'}`}
            >
              {correlationLabel}
            </span>
          </p>
        </div>
        <div className="text-right">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{interpretation}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-slate-700" />
            <XAxis
              type="number"
              dataKey="x"
              name={xAxisLabel}
              label={{ value: xAxisLabel, position: 'bottom' }}
              tickLine={false}
              axisLine={false}
              className="text-xs fill-slate-500 dark:fill-slate-400"
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yAxisLabel}
              label={{ value: yAxisLabel, angle: -90, position: 'left' }}
              tickLine={false}
              axisLine={false}
              className="text-xs fill-slate-500 dark:fill-slate-400"
            />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
            <Scatter name="Correlación" data={safeData} fill="#8884d8" shape="circle" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
