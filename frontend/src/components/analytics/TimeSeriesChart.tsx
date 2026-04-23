/**
 * @file TimeSeriesChart.tsx
 * @route frontend/src/components/analytics/
 * @description Componente contenedor que mapea los sensores seleccionados y renderiza 
 * múltiples instancias del LineChart avanzado.
 * @author kevin mariano
 * @version 1.0.3
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import React from 'react';
import { LineChart } from '@/components/dashboard/LineChart'; 
import { Skeleton } from '@/components/common/Skeleton';
import { Card } from '@/components/common/Card';
import { SensorType, UserSettings } from '@/types';
import { sensorTypeTranslations } from '@/utils/translations';
import { Info } from 'lucide-react';
import { format } from 'date-fns';

type MultiTimeSeriesData = {
  timestamp: string;
  [key: string]: number | string | null;
};

interface TimeSeriesChartProps {
  data: MultiTimeSeriesData[];
  loading: boolean;
  mainSensorType: SensorType;
  secondarySensorTypes: SensorType[] | null | undefined;
  userSettings: UserSettings | null; 
  dateRange: { from: Date; to: Date } | undefined; 
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ 
    data, 
    loading, 
    mainSensorType, 
    secondarySensorTypes, 
    userSettings,
    dateRange
}) => {
    
    if (loading) {
        return (
            <Card>
                <Skeleton className="h-[480px] w-full" />
            </Card>
        );
    }
    
    const validSecondaryTypes = Array.isArray(secondarySensorTypes) ? secondarySensorTypes : [];
    
    const allSensorTypes = [...new Set([mainSensorType, ...validSecondaryTypes])].filter(type => 
        type && data.some(item => item[type] !== null && item[type] !== undefined)
    ) as SensorType[];

    if (!data || data.length === 0 || allSensorTypes.length === 0) {
        return (
            <Card>
                <div className="h-96 w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <Info className="w-12 h-12 text-slate-400 mb-4" />
                    <h4 className="text-lg font-semibold text-slate-600 dark:text-slate-300">No se encontraron datos</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Seleccione parámetros y un rango de fechas con datos disponibles.</p>
                </div>
            </Card>
        );
    }
    
    const getChartDataForSensor = (sensorType: SensorType): { time: string; value: number }[] => {
        return data
            .filter(d => typeof d[sensorType] === 'number')
            .map(d => ({
                time: d.timestamp as string,
                value: d[sensorType] as number, 
            })); 
    };
    
    const getUnitForSensor = (sensorType: SensorType): string => {
        switch (sensorType) {
            case SensorType.TEMPERATURE: return 'Temperatura (°C)';
            case SensorType.PH: return 'pH';
            case SensorType.OXYGEN: return 'Oxígeno (mg/L)';
            default: return sensorTypeTranslations[sensorType] || sensorType;
        }
    };

    return (
        <div className="space-y-12">
            {allSensorTypes.map(type => {
                const chartData = getChartDataForSensor(type);
                const isMain = type === mainSensorType;
                
                return (
                    <Card 
                        key={type} 
                        className={`shadow-lg transition-shadow hover:shadow-xl ${isMain ? 'border-4 border-green-500/50' : ''}`}
                        style={{ padding: 0 }} 
                    >
                        <LineChart
                            data={chartData} 
                            title={sensorTypeTranslations[type] || type}
                            yAxisLabel={getUnitForSensor(type)}
                            sensorType={type}
                            settings={userSettings} 
                            loading={false}
                            isLive={false} 
                            dateRange={dateRange} 
                        />
                    </Card>
                );
            })}
        </div>
    );
};
