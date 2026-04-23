/**
 * @file PredictionCard.tsx
 * @route frontend/src/components/predictions
 * @description Tarjeta de predicción mejorada con datos reales y análisis
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Card, CardHeader, CardBody, Chip, Progress, Button, Divider } from '@nextui-org/react';
import { 
  AlertTriangle, Thermometer, Droplet, Wind, TrendingUp, 
  TrendingDown, Activity, CheckCircle, Cloud, Download 
} from 'lucide-react';
import { PredictionChart } from './PredictionChart';
import { ThresholdGauge } from './ThresholdGauge';
import { cn } from '@/utils/cn';
import { SensorType } from '@/types';

interface PredictedDataPoint {
  timestamp: string;
  value: number;
}

interface HistoricalDataPoint {
  id: string;
  value: number;
  timestamp: string;
}

interface PredictionThresholds {
  minCritical: number;
  maxCritical: number;
  minWarning: number;
  maxWarning: number;
}

interface WeatherData {
  date: string;
  temp: number;
  temp_max: number;
  temp_min: number;
  description: string;
  icon: string;
}

interface PredictionResult {
  predicted: PredictedDataPoint[];
  historical: HistoricalDataPoint[];
  thresholds: PredictionThresholds | null;
  sensorType: SensorType;
  sensorName: string;
  message?: string;
  weatherData?: WeatherData[] | null;
}

interface PredictionCardProps {
  result: PredictionResult;
  tankName: string;
}

const sensorInfo = {
  [SensorType.TEMPERATURE]: { 
    icon: Thermometer, 
    unit: '°C', 
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  [SensorType.PH]: { 
    icon: Droplet, 
    unit: '', 
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  [SensorType.OXYGEN]: { 
    icon: Wind, 
    unit: 'mg/L', 
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
};

export const PredictionCard: React.FC<PredictionCardProps> = ({ result, tankName }) => {
  const info = sensorInfo[result.sensorType] || {};
  const Icon = info.icon || Activity;
  const { predicted, historical, thresholds, weatherData } = result;

  // Validar que hay datos suficientes
  if (!predicted || predicted.length < 2) {
    return (
      <Card className={cn("w-full shadow-lg border", info.borderColor)}>
        <CardBody className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-warning-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Datos Insuficientes</h3>
            <p className="text-sm text-default-500 max-w-md">
              {result.message || 'Se requieren al menos 2 puntos de datos históricos para generar una predicción.'}
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Calcular métricas
  const initialValue = predicted[0]?.value || 0;
  const finalValue = predicted[predicted.length - 1]?.value || 0;
  const trend = initialValue !== 0 ? ((finalValue - initialValue) / initialValue) * 100 : 0;
  const dataPoints = historical?.length || 0;

  // Calcular confianza basada en cantidad de datos históricos
  const calculateConfidence = (): number => {
    if (dataPoints < 10) return 0.5;
    if (dataPoints < 50) return 0.65;
    if (dataPoints < 100) return 0.75;
    if (dataPoints < 200) return 0.85;
    return 0.92;
  };

  const confidence = calculateConfidence();

  // Determinar estado actual
  const getStatus = (): { 
      text: string; 
      color: 'default' | 'danger' | 'warning' | 'success'; 
  } => {
    if (!thresholds) return { text: 'Sin Umbrales', color: 'default' };
    
    if (initialValue < thresholds.minCritical || initialValue > thresholds.maxCritical) {
      return { text: 'Crítico', color: 'danger' };
    }
    if (initialValue < thresholds.minWarning || initialValue > thresholds.maxWarning) {
      return { text: 'Alerta', color: 'warning' };
    }
    return { text: 'Normal', color: 'success' };
  };

  const status = getStatus();

  // Calcular nivel de riesgo de la predicción
  const getRiskLevel = () => {
    if (!thresholds) return { level: 'unknown', text: 'Desconocido', color: 'default' };
    
    if (finalValue < thresholds.minCritical || finalValue > thresholds.maxCritical) {
      return { level: 'critical', text: 'Riesgo Crítico', color: 'danger' };
    }
    if (finalValue < thresholds.minWarning || finalValue > thresholds.maxWarning) {
      return { level: 'high', text: 'Riesgo Alto', color: 'warning' };
    }
    if (finalValue < thresholds.minWarning * 1.05 || finalValue > thresholds.maxWarning * 0.95) {
      return { level: 'medium', text: 'Riesgo Medio', color: 'warning' };
    }
    return { level: 'low', text: 'Riesgo Bajo', color: 'success' };
  };

  const risk = getRiskLevel();

  // Preparar datos para el gráfico - CORRECCIÓN DE FECHA
  const chartData = predicted.map((d, i) => {
    const timestamp = d.timestamp;
    let timeLabel;
    
    if (i === 0) {
      timeLabel = 'Hoy';
    } else if (timestamp) {
      const date = new Date(timestamp);
      // Validar si la fecha es válida
      if (!isNaN(date.getTime())) {
        timeLabel = date.toLocaleDateString('es-CO', { 
          day: '2-digit', 
          month: 'short' 
        });
      } else {
        // Fallback si la fecha es inválida (previene "Invalid Date")
        timeLabel = `Día ${i}`; 
      }
    } else {
      timeLabel = `Día ${i}`;
    }

    return {
      time: timeLabel,
      value: d.value,
    };
  });

  return (
    <Card className={cn("w-full rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900", info.borderColor)}>
      <CardHeader className="flex justify-between items-start pb-2">
        <div className='flex items-center gap-3'>
          <div className={cn("p-3 rounded-xl", info.bgColor)}>
            <Icon className={cn("w-7 h-7", info.color)} />
          </div>
          <div>
            <h3 className="text-xl font-bold">{result.sensorName}</h3>
            <p className="text-sm text-default-500">{tankName} • {result.sensorType}</p>
          </div>
        </div>
        <Chip color={status.color} variant="flat" size="lg">
          {status.text}
        </Chip>
      </CardHeader>

      <CardBody className="pt-2">
        {/* Métricas Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Valor Actual */}
          <div className={cn("p-4 rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900", info.borderColor, info.bgColor)}>
            <p className="text-xs text-default-500 mb-1">Valor Actual</p>
            <p className={cn("text-2xl font-bold", info.color)}>
              {initialValue.toFixed(1)}
              <span className="text-sm font-normal ml-1">{info.unit}</span>
            </p>
          </div>

          {/* Predicción Final */}
          <div className={cn("p-4 rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900", info.borderColor, info.bgColor)}>
            <p className="text-xs text-default-500 mb-1">Predicción 7d</p>
            <p className={cn("text-2xl font-bold", info.color)}>
              {finalValue.toFixed(1)}
              <span className="text-sm font-normal ml-1">{info.unit}</span>
            </p>
          </div>

          {/* Tendencia */}
          <div className={cn("p-4 rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900", info.borderColor, info.bgColor)}>
            <p className="text-xs text-default-500 mb-1">Tendencia</p>
            <div className="flex items-center gap-2">
              {trend > 0 ? (
                <TrendingUp className="w-5 h-5 text-danger-500" />
              ) : trend < 0 ? (
                <TrendingDown className="w-5 h-5 text-success-500" />
              ) : (
                <Activity className="w-5 h-5 text-default-500" />
              )}
              <span className={cn("text-xl font-bold", trend > 0 ? 'text-danger-500' : 'text-success-500')}>
                {Math.abs(trend).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Confianza */}
          <div className={cn("p-4 rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900", info.borderColor, info.bgColor)}>
            <p className="text-xs text-default-500 mb-1">Confianza</p>
            <p className="text-2xl font-bold text-primary">
              {(confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Gauge de Valor Actual */}
        {thresholds && (
          <div className="mb-6">
            <p className='text-sm font-semibold mb-3'>Posición Actual en Umbrales</p>
            <ThresholdGauge 
              value={initialValue} 
              thresholds={thresholds} 
              unit={info.unit} 
              aria-label={`Indicador de umbral para ${result.sensorName}`}
            />
          </div>
        )}

        {/* Gráfico de Predicción */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Proyección Temporal</h4>
            <Chip size="sm" color={risk.color as any} variant="flat">
              {risk.text}
            </Chip>
          </div>
          <div className="h-64 w-full">
            <PredictionChart 
              data={chartData} 
              thresholds={thresholds!} 
              aria-label={`Gráfico de predicción de ${result.sensorName} para los próximos días`}
            />
          </div>
        </div>

        <Divider className="my-4" />

        {/* Información del Clima (solo para temperatura) */}
        {weatherData && weatherData.length > 0 && result.sensorType === SensorType.TEMPERATURE && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="w-5 h-5 text-default-500" />
              <h4 className="text-sm font-semibold">Pronóstico del Clima (Próximos días)</h4>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {weatherData.slice(0, 7).map((day, idx) => (
                <div key={idx} className="text-center p-2 rounded-lg bg-default-100 dark:bg-default-50">
                  <p className="text-xs text-default-500 mb-1">
                    {new Date(day.date).toLocaleDateString('es-CO', { weekday: 'short' })}
                  </p>
                  <img 
                    src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                    alt={day.description}
                    className="w-10 h-10 mx-auto"
                  />
                  <p className="text-sm font-bold">{day.temp.toFixed(0)}°C</p>
                  <p className="text-xs text-default-400">
                    {day.temp_min.toFixed(0)}° / {day.temp_max.toFixed(0)}°
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Análisis de Calidad */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Métricas de Confianza */}
          <div className={cn("p-4 rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900", info.borderColor)}>
            <h4 className="text-sm font-semibold mb-3">Métricas de Calidad</h4>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-default-500">Confianza de Predicción</span>
                  <span className="font-semibold">{(confidence * 100).toFixed(0)}%</span>
                </div>
                <Progress 
                  value={confidence * 100} 
                  color={confidence >= 0.8 ? 'success' : confidence >= 0.6 ? 'warning' : 'danger'}
                  size="sm"
                  aria-label="Confianza de Predicción"
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-default-500">Datos Históricos</span>
                <span className="font-semibold">{dataPoints} puntos</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-default-500">Horizonte</span>
                <span className="font-semibold">{predicted.length - 1} días</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-default-500">Última Lectura</span>
                <span className="font-semibold text-xs">
                  {new Date(predicted[0].timestamp).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          <div className={cn("p-4 rounded-xl shadow-xl border border-default-200 dark:border-default-800 bg-white dark:bg-gray-900", info.borderColor)}>
            <h4 className="text-sm font-semibold mb-3">Recomendaciones</h4>
            
            <div className="space-y-2">
              {risk.level === 'critical' && (
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-default-700">
                    <strong className="text-danger-500">Acción Inmediata:</strong> Los valores predichos están 
                    fuera del rango crítico. Revise el sistema de inmediato.
                  </p>
                </div>
              )}

              {risk.level === 'high' && (
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-default-700">
                    <strong className="text-warning-500">Monitoreo Cercano:</strong> Los valores se acercan 
                    a niveles críticos. Mantenga vigilancia continua.
                  </p>
                </div>
              )}

              {risk.level === 'medium' && (
                <div className="flex gap-2">
                  <Activity className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-default-700">
                    <strong className="text-warning-500">Precaución:</strong> Los parámetros están 
                    cerca de los límites de alerta. Monitoree regularmente.
                  </p>
                </div>
              )}

              {risk.level === 'low' && (
                <div className="flex gap-2">
                  <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-default-700">
                    <strong className="text-success-500">Sistema Estable:</strong> Los valores predichos 
                    se mantienen en rangos óptimos. Continúe con el monitoreo rutinario.
                  </p>
                </div>
              )}

              {confidence < 0.7 && (
                <div className="flex gap-2 mt-2 p-2 bg-warning-50 dark:bg-warning-950 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-warning-700 dark:text-warning-300">
                    Confianza baja debido a datos históricos limitados. Se recomienda 
                    acumular más lecturas para mejorar la precisión.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};