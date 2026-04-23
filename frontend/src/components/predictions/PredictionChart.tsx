/**
 * @file PredictionChart.tsx
 * @route frontend/src/components/predictions
 * @description Gráfico de línea para la predicción de sensores con umbrales.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '@/utils/cn';

interface ChartDataPoint {
    time: string;
    value: number;
}

interface PredictionThresholds {
    minCritical: number;
    maxCritical: number;
    minWarning: number;
    maxWarning: number;
}

interface PredictionChartProps {
    data: ChartDataPoint[];
    thresholds: PredictionThresholds;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-default-50 p-2 rounded-lg shadow-md border border-default-200">
                <p className="text-sm font-semibold text-foreground">{`Fecha: ${label}`}</p>
                <p className="text-sm text-primary-500">{`Valor: ${payload[0].value.toFixed(2)}`}</p>
            </div>
        );
    }
    return null;
};

export const PredictionChart: React.FC<PredictionChartProps> = ({ data, thresholds }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" className="stroke-default-200" />
                <XAxis dataKey="time" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />

                {/* Líneas de Referencia para Umbrales */}
                {thresholds && (
                    <>
                        <ReferenceLine 
                            y={thresholds.maxCritical} 
                            stroke="#f31260" 
                            strokeDasharray="3 3" 
                            label={{ 
                                value: 'Crítico Alto', 
                                position: 'right', 
                                fill: '#f31260',
                                className: 'text-xs font-semibold'
                            }} 
                        />
                        <ReferenceLine 
                            y={thresholds.maxWarning} 
                            stroke="#f5a524" 
                            strokeDasharray="3 3" 
                            label={{ 
                                value: 'Alerta Alta', 
                                position: 'right', 
                                fill: '#f5a524',
                                className: 'text-xs font-semibold'
                            }} 
                        />
                        <ReferenceLine 
                            y={thresholds.minWarning} 
                            stroke="#f5a524" 
                            strokeDasharray="3 3" 
                            label={{ 
                                value: 'Alerta Baja', 
                                position: 'right', 
                                fill: '#f5a524',
                                className: 'text-xs font-semibold'
                            }} 
                        />
                        <ReferenceLine 
                            y={thresholds.minCritical} 
                            stroke="#f31260" 
                            strokeDasharray="3 3" 
                            label={{ 
                                value: 'Crítico Bajo', 
                                position: 'right', 
                                fill: '#f31260',
                                className: 'text-xs font-semibold'
                            }} 
                        />
                    </>
                )}

                <Line type="monotone" dataKey="value" stroke="#39A900" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
        </ResponsiveContainer>
    );
};