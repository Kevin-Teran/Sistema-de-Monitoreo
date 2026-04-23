/**
 * @file KpiCards.tsx
 * @route frontend/src/components/analytics/
 * @description Muestra las tarjetas de indicadores clave de rendimiento (KPIs).
 * @author kevin mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import React from 'react';
import { Card } from '@/components/common/Card';
import { Kpi, SensorType } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/utils/cn';
import { Thermometer, Droplet, Zap, Gauge } from 'lucide-react';
import { sensorTypeTranslations } from '@/utils/translations';

interface KpiCardsProps {
  kpis: Kpi | null;
  loading: boolean;
  // CORRECCIÓN CLAVE: Agregamos sensorType
  sensorType: SensorType | undefined; 
}

const getUnit = (sensorType: SensorType | undefined) => {
    switch (sensorType) {
        case SensorType.TEMPERATURE: return '°C';
        case SensorType.PH: return '';
        case SensorType.OXYGEN: return 'mg/L';
        default: return '';
    }
};

const getIcon = (sensorType: SensorType | undefined) => {
    switch (sensorType) {
        case SensorType.TEMPERATURE: return <Thermometer className="w-6 h-6 text-orange-500" />;
        case SensorType.PH: return <Droplet className="w-6 h-6 text-blue-500" />;
        case SensorType.OXYGEN: return <Zap className="w-6 h-6 text-cyan-500" />;
        default: return <Gauge className="w-6 h-6 text-gray-500" />;
    }
};

const KpiCard: React.FC<{ title: string; value: number | null; unit: string; icon: React.ReactNode }> = ({ title, value, unit, icon }) => (
    <Card className="p-4 flex items-center justify-between shadow-md transition-shadow hover:shadow-lg">
        <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
            {value !== null && value !== undefined ? (
                <div className="mt-1 text-2xl font-bold text-slate-800 dark:text-white">
                    {value.toFixed(2)} {unit}
                </div>
            ) : (
                <div className="mt-1 text-2xl font-bold text-slate-400 dark:text-slate-500">N/A</div>
            )}
        </div>
        <div className="flex-shrink-0 p-3 rounded-full bg-gray-100 dark:bg-gray-700">
            {icon}
        </div>
    </Card>
);


export const KpiCards: React.FC<KpiCardsProps> = ({ kpis, loading, sensorType }) => {
    
    const unit = getUnit(sensorType);
    const primaryIcon = getIcon(sensorType);
    const primarySensorName = sensorTypeTranslations[sensorType as SensorType] || 'Parámetro';

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            
            {/* 1. Promedio */}
            <KpiCard 
                title={`${primarySensorName} Promedio`} 
                value={kpis?.average || null} 
                unit={unit} 
                icon={primaryIcon}
            />

            {/* 2. Máximo */}
            <KpiCard 
                title={`${primarySensorName} Máx`} 
                value={kpis?.max || null} 
                unit={unit} 
                icon={primaryIcon}
            />
            
            {/* 3. Mínimo */}
            <KpiCard 
                title={`${primarySensorName} Mín`} 
                value={kpis?.min || null} 
                unit={unit} 
                icon={primaryIcon}
            />

            {/* 4. Desviación Estándar */}
            <KpiCard 
                title="Desv. Estándar" 
                value={kpis?.stdDev || null} 
                unit={unit} 
                icon={<Gauge className="w-6 h-6 text-indigo-500" />}
            />

            {/* 5. Conteo de Datos */}
            <KpiCard 
                title="Puntos de Dato" 
                value={kpis?.count || null} 
                unit="puntos" 
                icon={<Gauge className="w-6 h-6 text-green-500" />}
            />
        </div>
    );
};