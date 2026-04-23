/**
 * @file LineChart.tsx
 * @route frontend/src/components/dashboard
 * @description Componente de gráfico de líneas con sistema de muestreo inteligente, formateo 
 * automático del eje X con formato de 12 horas, márgenes optimizados y línea dinámica 
 * con colores basados en umbrales de sensores.
 * @author Kevin Mariano
 * @version 1.0.3
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useMemo } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    BarChart3,
    Minus,
    Thermometer,
    TrendingDown,
    TrendingUp,
    Waves,
    Wind,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserSettings, SensorType } from '@/types';
import { 
    differenceInDays, 
    differenceInHours, 
    differenceInMinutes, 
    parseISO,
    isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

interface ChartDataPoint {
    time: string;
    value: number; 
}

interface LineChartProps {
    data: ChartDataPoint[];
    title: string;
    yAxisLabel: string;
    sensorType: SensorType;
    settings: UserSettings | null;
    loading: boolean;
    isLive: boolean;
    dateRange?: { from: Date; to: Date };
}

interface SampledDataPoint extends ChartDataPoint {
    originalIndex: number;
}

interface ProcessedDataPoint extends ChartDataPoint {
    status: 'optimal' | 'low' | 'high';
    color: string;
    originalValue: number; 
}

const TIME_ZONE = 'America/Bogota';
const MAX_VISIBLE_POINTS = 150;
const MIN_POINTS_FOR_SAMPLING = 50;

const SENSOR_HARD_LIMITS = {
    [SensorType.TEMPERATURE]: { min: 0, max: 50 },
    [SensorType.PH]: { min: 0, max: 14 },
    [SensorType.OXYGEN]: { min: 0, max: 14 },
    default: { min: 0, max: 100 },
};

enum TimeRangeType {
    MINUTES = 'MINUTES',
    HOURS = 'HOURS', 
    DAYS = 'DAYS',
    WEEKS = 'WEEKS',
    MONTHS = 'MONTHS',
    YEARS = 'YEARS'
}

const STATUS_COLORS = {
    optimal: '#22c55e', 
    low: '#3b82f6',     
    high: '#ef4444',    
};

const SENSOR_THEMES = {
    [SensorType.TEMPERATURE]: {
        icon: Thermometer,
        color: '#3b82f6',
        gradientId: 'tempGradient',
        name: 'Temperatura',
    },
    [SensorType.PH]: {
        icon: Waves,
        color: '#22c55e',
        gradientId: 'phGradient',
        name: 'pH',
    },
    [SensorType.OXYGEN]: {
        icon: Wind,
        color: '#06b6d4',
        gradientId: 'oxygenGradient',
        name: 'Oxígeno',
    },
};

const determineTimeRangeType = (startDate: Date, endDate: Date): TimeRangeType => {
    const diffInMinutes = differenceInMinutes(endDate, startDate);
    const diffInHours = differenceInHours(endDate, startDate);
    const diffInDays = differenceInDays(endDate, startDate);

    if (diffInMinutes <= 120) {
        return TimeRangeType.MINUTES;
    } else if (diffInHours <= 48) {
        return TimeRangeType.HOURS;
    } else if (diffInDays <= 14) {
        return TimeRangeType.DAYS;
    } else if (diffInDays <= 90) {
        return TimeRangeType.WEEKS;
    } else if (diffInDays <= 730) {
        return TimeRangeType.MONTHS;
    } else {
        return TimeRangeType.YEARS;
    }
};

const getTickFormatter = (rangeType: TimeRangeType, startDate?: Date, endDate?: Date) => {
    const formatters = {
        [TimeRangeType.MINUTES]: (tick: string) => 
            formatInTimeZone(new Date(tick), TIME_ZONE, 'h:mm:ss a', { locale: es }),
        
        [TimeRangeType.HOURS]: (tick: string) => {
            if (startDate && endDate && !isSameDay(startDate, endDate)) {
                return formatInTimeZone(new Date(tick), TIME_ZONE, 'dd/MM h a', { locale: es });
            }
            return formatInTimeZone(new Date(tick), TIME_ZONE, 'h:mm a', { locale: es });
        },
        
        [TimeRangeType.DAYS]: (tick: string) => 
            formatInTimeZone(new Date(tick), TIME_ZONE, 'dd/MM h a', { locale: es }),
        
        [TimeRangeType.WEEKS]: (tick: string) => 
            formatInTimeZone(new Date(tick), TIME_ZONE, 'dd MMM', { locale: es }),
        
        [TimeRangeType.MONTHS]: (tick: string) => 
            formatInTimeZone(new Date(tick), TIME_ZONE, 'MMM yyyy', { locale: es }),
        
        [TimeRangeType.YEARS]: (tick: string) => 
            formatInTimeZone(new Date(tick), TIME_ZONE, 'yyyy', { locale: es }),
    };

    return formatters[rangeType];
};

/**
 * Determina el estado del valor de la lectura, usando el valor original sin truncar.
 * @param value Valor original de la lectura.
 * @param thresholds Umbrales min/max.
 * @returns Estado de la lectura ('optimal' | 'low' | 'high').
 */
const getValueStatus = (value: number, thresholds: any): 'optimal' | 'low' | 'high' => {
    if (!thresholds) return 'optimal';
    
    if (value < thresholds.min) return 'low';
    if (value > thresholds.max) return 'high';
    return 'optimal';
};

const intelligentSampling = (data: ChartDataPoint[], maxPoints: number): ChartDataPoint[] => {
    if (data.length <= maxPoints) {
        return data;
    }

    const sampledData: SampledDataPoint[] = [];
    const step = data.length / maxPoints;
    
    sampledData.push({ ...data[0], originalIndex: 0 });
    
    for (let i = 1; i < maxPoints - 1; i++) {
        const targetIndex = Math.round(i * step);
        const actualIndex = Math.min(targetIndex, data.length - 1);
        
        const windowStart = Math.max(0, actualIndex - Math.floor(step / 2));
        const windowEnd = Math.min(data.length - 1, actualIndex + Math.floor(step / 2));
        
        let selectedIndex = actualIndex;
        let maxVariation = 0;
        
        for (let j = windowStart; j <= windowEnd; j++) {
            const prevValue = j > 0 ? data[j - 1].value : data[j].value;
            const nextValue = j < data.length - 1 ? data[j + 1].value : data[j].value;
            const variation = Math.abs(data[j].value - prevValue) + Math.abs(data[j].value - nextValue);
            
            if (variation > maxVariation) {
                maxVariation = variation;
                selectedIndex = j;
            }
        }
        
        sampledData.push({ ...data[selectedIndex], originalIndex: selectedIndex });
    }
    
    const lastIndex = data.length - 1;
    sampledData.push({ ...data[lastIndex], originalIndex: lastIndex });
    
    const uniqueSampled = sampledData
        .filter((item, index, arr) => 
            arr.findIndex(other => other.originalIndex === item.originalIndex) === index
        )
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    return uniqueSampled.map(({ originalIndex, ...rest }) => rest);
};

const getTickInterval = (dataLength: number, rangeType: TimeRangeType): number => {
    const maxTicks = 8;
    
    if (dataLength <= maxTicks) {
        return 0;
    }
    
    const interval = Math.ceil(dataLength / maxTicks);
    
    switch (rangeType) {
        case TimeRangeType.MINUTES:
            return Math.max(interval, 2);
        case TimeRangeType.HOURS:
            return Math.max(interval, 3);
        case TimeRangeType.DAYS:
            return Math.max(interval, 2);
        default:
            return interval;
    }
};

const generateDateRangeLabel = (from: Date, to: Date, rangeType: TimeRangeType): string => {
    const fromDayKey = formatInTimeZone(from, TIME_ZONE, 'yyyyMMdd');
    const toDayKey = formatInTimeZone(to, TIME_ZONE, 'yyyyMMdd');

    const isSingleCalendarDay = fromDayKey === toDayKey; 
    
    if (isSingleCalendarDay) {
        const dateStr = formatInTimeZone(from, TIME_ZONE, 'd MMM yyyy', { locale: es });
        const startTime = formatInTimeZone(from, TIME_ZONE, 'h:mm a', { locale: es });
        const endTime = formatInTimeZone(to, TIME_ZONE, 'h:mm a', { locale: es });
        return `${dateStr} (${startTime} - ${endTime})`;
    }
    
    switch (rangeType) {
        case TimeRangeType.MINUTES:
        case TimeRangeType.HOURS:
            const startDateTime = formatInTimeZone(from, TIME_ZONE, 'd MMM, h:mm a', { locale: es });
            const endDateTime = formatInTimeZone(to, TIME_ZONE, 'd MMM, h:mm a', { locale: es });
            return `${startDateTime} - ${endDateTime}`;
            
        case TimeRangeType.DAYS:
        case TimeRangeType.WEEKS:
        case TimeRangeType.MONTHS:
        case TimeRangeType.YEARS:
            const dateStart = formatInTimeZone(from, TIME_ZONE, 'd MMM, h:mm a', { locale: es }); 
            const dateEnd = formatInTimeZone(to, TIME_ZONE, 'd MMM, h:mm a', { locale: es });     
            
            return `${dateStart} - ${dateEnd}`;
            
        default:
            const startMonth = formatInTimeZone(from, TIME_ZONE, 'MMM yyyy', { locale: es });
            const endMonth = formatInTimeZone(to, TIME_ZONE, 'MMM yyyy', { locale: es });
            return `${startMonth} - ${endMonth}`;
    }
};


/**
 * Tooltip personalizado para mostrar el valor original de la lectura.
 */
const CustomTooltip = ({ active, payload, label, themeColor, rangeType }: any) => {
    if (active && payload && payload.length) {
        let formattedLabel: string;
        
        switch (rangeType) {
            case TimeRangeType.MINUTES:
                formattedLabel = formatInTimeZone(
                    new Date(label),
                    TIME_ZONE,
                    'd MMM yyyy, h:mm:ss a',
                    { locale: es }
                );
                break;
            case TimeRangeType.HOURS:
                formattedLabel = formatInTimeZone(
                    new Date(label),
                    TIME_ZONE,
                    'd MMM yyyy, h:mm a',
                    { locale: es }
                );
                break;
            case TimeRangeType.DAYS:
            case TimeRangeType.WEEKS:
                formattedLabel = formatInTimeZone(
                    new Date(label),
                    TIME_ZONE,
                    'EEEE, d MMM yyyy, h:mm a',
                    { locale: es }
                );
                break;
            default:
                formattedLabel = formatInTimeZone(
                    new Date(label),
                    TIME_ZONE,
                    'd MMM yyyy',
                    { locale: es }
                );
        }

        const dataPoint = payload[0].payload;
        const displayValue = dataPoint.originalValue 
            ? dataPoint.originalValue.toFixed(2) 
            : dataPoint.value.toFixed(2);
        
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className='rounded-xl border border-gray-200 bg-white/90 p-3 shadow-xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90'
            >
                <p className='mb-1 text-sm font-semibold text-gray-900 dark:text-white'>
                    {formattedLabel}
                </p>
                <p
                    className='flex items-center text-base font-bold'
                    style={{ color: themeColor }}
                >
                    {/* El Tooltip muestra el valor ORIGINAL */}
                    {`${payload[0].name}: ${displayValue}`} 
                </p>
            </motion.div>
        );
    }
    return null;
};

const TrendIndicator = ({ data }: { data: ChartDataPoint[] }) => {
    const trend = useMemo(() => {
        if (data.length < 2) return null;
        const first = data[0].value; 
        const last = data[data.length - 1].value;
        const diff = last - first;
        if (Math.abs(diff) < 0.1)
            return { Icon: Minus, color: 'text-gray-500', text: 'Estable' };
        if (diff > 0)
            return {
                Icon: TrendingUp,
                color: 'text-green-600 dark:text-green-400',
                text: 'Al alza',
            };
        return {
            Icon: TrendingDown,
            color: 'text-red-600 dark:text-red-400',
            text: 'A la baja',
        };
    }, [data]);

    if (!trend) return null;
    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-sm font-medium dark:border-gray-700 dark:bg-gray-800 ${trend.color}`}
        >
            <trend.Icon className='h-4 w-4' />
            <span>{trend.text}</span>
        </div>
    );
};

const EmptyState = ({ title }: { title: string }) => (
    <div className='flex h-full min-h-[400px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50'>
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <BarChart3 className='mx-auto h-16 w-16 text-gray-400 dark:text-gray-500' />
            <h3 className='mt-4 text-xl font-semibold text-gray-800 dark:text-gray-200'>
                No hay datos para {title}
            </h3>
            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                Prueba a cambiar el rango de fechas o seleccionar otro tanque.
            </p>
        </motion.div>
    </div>
);

const LoadingState = () => (
    <div className='flex h-full min-h-[480px] w-full animate-pulse items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800/50' />
);

export const LineChart: React.FC<LineChartProps> = ({
    data,
    title,
    yAxisLabel,
    sensorType,
    settings,
    loading,
    isLive,
    dateRange,
}) => {
    const theme = SENSOR_THEMES[sensorType] || SENSOR_THEMES.TEMPERATURE;
    const IconComponent = theme.icon;

    const thresholds = useMemo(() => {
        if (!settings || !settings.thresholds) return null;
        switch (sensorType) {
            case SensorType.PH:
                return { min: settings.thresholds.ph.min, max: settings.thresholds.ph.max };
            case SensorType.TEMPERATURE:
                return { min: settings.thresholds.temperature.min, max: settings.thresholds.temperature.max };
            case SensorType.OXYGEN:
                return { min: settings.thresholds.oxygen.min, max: settings.thresholds.oxygen.max };
            default:
                return null;
        }
    }, [settings, sensorType]);

    const { processedData, stats, xAxisConfig, rangeType, dataInfo, dominantColor, finalYDomain } = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                processedData: [],
                stats: { min: 0, max: 0, avg: 0 },
                xAxisConfig: { 
                    tickFormatter: () => '', 
                    interval: 0, 
                    domain: ['auto', 'auto'] 
                },
                rangeType: TimeRangeType.HOURS,
                dataInfo: { 
                    original: 0, 
                    displayed: 0, 
                    samplingRatio: 0,
                    timeSpan: 'Sin datos'
                },
                dominantColor: theme.color,
                finalYDomain: [0, 100] as [number, number], 
            };
        }

        const firstDate = parseISO(data[0].time);
        const lastDate = parseISO(data[data.length - 1].time);
        const detectedRangeType = dateRange 
            ? determineTimeRangeType(dateRange.from, dateRange.to)
            : determineTimeRangeType(firstDate, lastDate);

        const shouldSample = data.length > MIN_POINTS_FOR_SAMPLING;
        const sampledData = shouldSample 
            ? intelligentSampling(data, MAX_VISIBLE_POINTS)
            : data;

        const hardLimits = SENSOR_HARD_LIMITS[sensorType] || SENSOR_HARD_LIMITS.default;
        const dataWithOriginalValue = sampledData.map(point => {
            const originalValue = point.value;
            const clampedValue = Math.min(hardLimits.max, Math.max(hardLimits.min, originalValue));
            const finalPlotValue = clampedValue;
            
            return {
                ...point, 
                value: finalPlotValue, 
                originalValue: originalValue, 
            };
        });

        const processedDataWithStatus: ProcessedDataPoint[] = dataWithOriginalValue.map(point => {
            const status = getValueStatus(point.originalValue, thresholds); 
            return {
                ...point,
                status,
                color: STATUS_COLORS[status],
            } as ProcessedDataPoint; 
        });

        const statusCounts = processedDataWithStatus.reduce((acc, point) => {
            acc[point.status] = (acc[point.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

       const dominantStatus = Object.keys(statusCounts).length > 0 
            ? Object.entries(statusCounts)
                .reduce((a, b) => a[1] > b[1] ? a : b)[0] as keyof typeof STATUS_COLORS
            : 'optimal';
        
        const calculatedDominantColor = STATUS_COLORS[dominantStatus] || theme.color;

        const originalValues = data.map((d) => d.value);
        const min = originalValues.length > 0 ? Math.min(...originalValues) : 0;
        const max = originalValues.length > 0 ? Math.max(...originalValues) : 0;
        const avg = originalValues.reduce((a, b) => a + b, 0) / originalValues.length;
                
        let minFocus = min;
        let maxFocus = max;

        if (thresholds) {
            minFocus = Math.min(min, thresholds.min);
            maxFocus = Math.max(max, thresholds.max);
        }
        
        const rangeFocus = maxFocus - minFocus;
        
        const dynamicPadding = Math.max(1, rangeFocus * 0.2); 
        
        let yMin = minFocus - dynamicPadding;
        let yMax = maxFocus + dynamicPadding;
        
        yMin = Math.max(hardLimits.min, yMin); 
        yMax = Math.min(hardLimits.max, yMax);
        
        if (rangeFocus === 0 || data.length === 0) {
            yMin = Math.max(hardLimits.min, minFocus - 2);
            yMax = Math.min(hardLimits.max, maxFocus + 2);
        }

        const calculatedYDomain: [number, number] = [yMin, yMax];
        const finalYDomain = calculatedYDomain as [number, number];
        
        const tickFormatter = getTickFormatter(detectedRangeType, firstDate, lastDate);
        const tickInterval = getTickInterval(processedDataWithStatus.length, detectedRangeType);

        const samplingRatio = data.length > 0 ? (processedDataWithStatus.length / data.length) * 100 : 0;
        const timeSpanLabels = {
            [TimeRangeType.MINUTES]: 'Minutos',
            [TimeRangeType.HOURS]: 'Horas', 
            [TimeRangeType.DAYS]: 'Días',
            [TimeRangeType.WEEKS]: 'Semanas',
            [TimeRangeType.MONTHS]: 'Meses',
            [TimeRangeType.YEARS]: 'Años'
        };

        return {
            processedData: processedDataWithStatus,
            stats: { min, max, avg },
            xAxisConfig: { 
                tickFormatter, 
                interval: tickInterval, 
                domain: ['dataMin', 'dataMax'] as [string, string]
            },
            rangeType: detectedRangeType,
            dataInfo: {
                original: data.length,
                displayed: processedDataWithStatus.length,
                samplingRatio: Math.round(samplingRatio),
                timeSpan: timeSpanLabels[detectedRangeType]
            },
            dominantColor: calculatedDominantColor,
            finalYDomain,
        };
    }, [data, dateRange, thresholds, theme.color, sensorType]);

    const chartTitle = useMemo(() => {
        if (isLive) {
            return `Tiempo Real: ${title}`;
        }
        
        if (dateRange) {
            const dateLabel = generateDateRangeLabel(dateRange.from, dateRange.to, rangeType);
            return `${title} (${dateLabel})`;
        }
        
        return `Histórico ${title}`;
    }, [title, isLive, dateRange, rangeType]);

    if (loading) return <LoadingState />;
    if (!data || data.length === 0) return <EmptyState title={title} />;

    const minStatus = thresholds ? getValueStatus(stats.min, thresholds) : 'optimal';
    const avgStatus = thresholds ? getValueStatus(stats.avg, thresholds) : 'optimal';
    const maxStatus = thresholds ? getValueStatus(stats.max, thresholds) : 'optimal';

    const minColor = STATUS_COLORS[minStatus];
    const avgColor = STATUS_COLORS[avgStatus];
    const maxColor = STATUS_COLORS[maxStatus];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='w-full p-4'
        >
            <div className='mb-8 px-4'>
                <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                    <div className='flex items-center gap-4'>
                        <div
                            className='flex h-12 w-12 items-center justify-center rounded-xl'
                            style={{ backgroundColor: `${dominantColor}20` }}
                        >
                            <IconComponent
                                className='h-6 w-6'
                                style={{ color: dominantColor }}
                            />
                        </div>
                        <div>
                            <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                                {chartTitle}
                            </h3>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                Mostrando {dataInfo.displayed} de {dataInfo.original} puntos 
                                ({dataInfo.samplingRatio}% - Rango: {dataInfo.timeSpan})
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-4'>
                        {isLive && (
                            <div className='flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase text-green-600 dark:bg-green-900/20 dark:text-green-400'>
                                <span className='relative flex h-3 w-3'>
                                    <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75'></span>
                                    <span className='relative inline-flex h-3 w-3 rounded-full bg-green-500'></span>
                                </span>
                                En Vivo
                            </div>
                        )}
                        <TrendIndicator data={processedData} />
                    </div>
                </div>
            </div>

            <div className='h-96 w-full rounded-2xl bg-white px-4 py-6 dark:bg-gray-800/50'>
                <ResponsiveContainer>
                    <AreaChart
                        data={processedData}
                        margin={{ top: 10, right: 50, left: 20, bottom: 50 }}
                    >
                        <defs>
                            <linearGradient id={`${theme.gradientId}_dynamic`} x1='0' y1='0' x2='0' y2='1'>
                                <stop offset='0%' stopColor={dominantColor} stopOpacity={0.4} />
                                <stop offset='75%' stopColor={dominantColor} stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray='3 3'
                            className='stroke-gray-200/50 dark:stroke-gray-700/50'
                        />
                        <XAxis
                            dataKey='time'
                            tickFormatter={xAxisConfig.tickFormatter}
                            className='text-xs text-gray-600 dark:text-gray-400'
                            dy={10}
                            interval={xAxisConfig.interval}
                            domain={xAxisConfig.domain}
                            type='category'
                            angle={rangeType === TimeRangeType.MINUTES || (rangeType === TimeRangeType.HOURS && !isSameDay(parseISO(processedData[0]?.time || ''), parseISO(processedData[processedData.length - 1]?.time || ''))) ? -45 : 0}
                            textAnchor={rangeType === TimeRangeType.MINUTES || (rangeType === TimeRangeType.HOURS && !isSameDay(parseISO(processedData[0]?.time || ''), parseISO(processedData[processedData.length - 1]?.time || ''))) ? 'end' : 'middle'}
                            height={rangeType === TimeRangeType.MINUTES || (rangeType === TimeRangeType.HOURS && !isSameDay(parseISO(processedData[0]?.time || ''), parseISO(processedData[processedData.length - 1]?.time || ''))) ? 80 : 60}
                        />
                        <YAxis
                            type='number'
                            className='text-xs text-gray-600 dark:text-gray-400'
                            domain={finalYDomain} 
                            label={{
                                value: yAxisLabel,
                                angle: -90,
                                position: 'insideLeft',
                                style: { fill: 'currentColor', fontSize: '14px' },
                                className: 'fill-gray-600 dark:fill-gray-400 font-medium',
                            }}
                            allowDataOverflow={false} 
                            tickFormatter={(value) => Math.floor(value).toString()} 
                        />
                        <Tooltip
                            content={<CustomTooltip themeColor={dominantColor} rangeType={rangeType} />}
                            cursor={{
                                stroke: dominantColor,
                                strokeWidth: 1,
                                strokeDasharray: '4 4',
                            }}
                        />                        

                        {thresholds && (
                            <>
                                <ReferenceLine
                                    y={thresholds.max}
                                    label={{
                                        value: 'Alto',
                                        position: 'right',
                                        className: 'fill-red-500 text-sm font-extrabold',
                                        dx: 10,
                                    }}
                                    stroke='#ef4444'
                                    strokeWidth={1.5} 
                                    strokeDasharray='4 4'
                                    ifOverflow='extendDomain'
                                />
                                <ReferenceLine
                                    y={thresholds.min}
                                    label={{
                                        value: 'Bajo',
                                        position: 'right',
                                        className: 'fill-blue-500 text-sm font-extrabold',
                                        dx: 10,
                                    }}
                                    stroke='#3b82f6'
                                    strokeWidth={1.5} 
                                    strokeDasharray='4 4'
                                    ifOverflow='extendDomain'
                                />
                            </>
                        )}
                        <Area
                            type='monotone'
                            dataKey='value'
                            stroke='transparent'
                            fill={`url(#${theme.gradientId}_dynamic)`}
                            name={title}
                        />
                        <Line
                            type='monotone'
                            dataKey='value' 
                            name={title}
                            stroke={dominantColor}
                            strokeWidth={3}
                            dot={processedData.length <= 20}
                            activeDot={{
                                r: 7,
                                fill: dominantColor,
                                stroke: '#ffffff',
                                strokeWidth: 2,
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                            }}
                            connectNulls
                            animationDuration={1200}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {thresholds && (
                <div className='mt-8 flex flex-wrap justify-center gap-6 rounded-xl bg-gray-50 px-6 py-4 dark:bg-gray-800/30'>
                    <div className='flex items-center gap-3'>
                        <div className='h-3 w-8 rounded-full bg-blue-500'></div>
                        <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                            Bajo (&lt; {thresholds.min})
                        </span>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div className='h-3 w-8 rounded-full bg-green-500'></div>
                        <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                            Óptimo ({thresholds.min} - {thresholds.max})
                        </span>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div className='h-3 w-8 rounded-full bg-red-500'></div>
                        <span className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                            Alto (&gt; {thresholds.max})
                        </span>
                    </div>
                </div>
            )}

            <div className='mt-8 px-4'>
                <div className='grid grid-cols-1 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white shadow-sm dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0'>
                    <div className='flex items-center justify-between p-6'>
                        <div className='flex items-center gap-3'>
                            <div 
                                className='h-3 w-3 rounded-full'
                                style={{ backgroundColor: minColor }}
                            />
                            <p className='text-base font-semibold text-gray-700 dark:text-gray-300'>
                                Mínimo
                            </p>
                        </div>
                        <p 
                            className='text-3xl font-bold tracking-tight'
                            style={{ color: minColor }}
                        >
                            {stats.min.toFixed(2)} 
                        </p>
                    </div>
                    <div className='flex items-center justify-between p-6'>
                        <div className='flex items-center gap-3'>
                            <div 
                                className='h-3 w-3 rounded-full'
                                style={{ backgroundColor: avgColor }}
                            />
                            <p className='text-base font-semibold text-gray-700 dark:text-gray-300'>
                                Promedio
                            </p>
                        </div>
                        <p 
                            className='text-3xl font-bold tracking-tight'
                            style={{ color: avgColor }}
                        >
                            {stats.avg.toFixed(2)}
                        </p>
                    </div>
                    <div className='flex items-center justify-between p-6'>
                        <div className='flex items-center gap-3'>
                            <div 
                                className='h-3 w-3 rounded-full'
                                style={{ backgroundColor: maxColor }}
                            />
                            <p className='text-base font-semibold text-gray-700 dark:text-gray-300'>
                                Máximo
                            </p>
                        </div>
                        <p 
                            className='text-3xl font-bold tracking-tight'
                            style={{ color: maxColor }}
                        >
                            {stats.max.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
