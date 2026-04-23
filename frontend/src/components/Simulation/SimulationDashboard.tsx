/**
 * @file SimulationDashboard.tsx
 * @route frontend/src/components/Simulation
 * @description Panel lateral con métricas y resúmenes de las simulaciones activas.
 * @author Kevin Mariano
 * @version 1.1.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React from 'react';
import { useDataEntry } from '@/hooks/useDataEntry';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Badge } from '@nextui-org/react';
import { Loader2, AlertTriangle, CheckCircle2, XCircle, BarChart3, Activity, Clock, Thermometer, Beaker, Wind } from 'lucide-react';
import { SimulationSummaryByTank, SimulationSummary, SimulationMetrics } from '@/types/dashboard';
import { EmitterStatus } from '@/services/dataService';

// --- Helper Functions ---
const getSensorIcon = (type: string) => {
    switch (type) {
        case 'TEMPERATURE': return <Thermometer className="h-4 w-4" />;
        case 'PH': return <Beaker className="h-4 w-4" />;
        case 'OXYGEN': return <Wind className="h-4 w-4" />;
        default: return <Activity className="h-4 w-4" />;
    }
};

const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
};

// --- Sub-Components ---
const MqttStatus: React.FC = () => {
    const { mqttStatus } = useDataEntry();
    const statusConfig = {
        connected: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, text: 'Conectado' },
        connecting: { icon: <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />, text: 'Conectando' },
        disconnected: { icon: <XCircle className="h-4 w-4 text-red-500" />, text: 'Desconectado' },
    };
    const { icon, text } = statusConfig[mqttStatus] || { icon: <AlertTriangle className="h-4 w-4 text-gray-500" />, text: 'Desconocido' };

    return (
        <div className="flex items-center gap-1">
            {icon}
            <span className="text-sm font-medium">{text}</span>
        </div>
    );
};

// --- Main Component ---
export const SimulationDashboard: React.FC = () => {
    const { getActiveSimulationsSummary, simulationMetrics, lastSyncTime } = useDataEntry();
    const summary = getActiveSimulationsSummary() as SimulationSummary;

    return (
        <div className="space-y-6">
            {/* Card: System Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Estado del Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Estado MQTT:</span>
                        <MqttStatus />
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Simulaciones Activas:</span>
                        <span className="text-sm font-medium">{summary.totalActive}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Mensajes Enviados:</span>
                        <span className="text-sm font-medium">{summary.totalMessages.toLocaleString()}</span>
                    </div>
                    {simulationMetrics && (
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Tiempo Activo:</span>
                            <span className="text-sm font-medium">{formatUptime(simulationMetrics.systemUptime)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Última sincronización:</span>
                        <span className="text-muted-foreground">{new Date(lastSyncTime).toLocaleTimeString()}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Conditional Cards for Active Simulations */}
            {summary.totalActive > 0 && (
                <>
                    {/* Card: Active by Tank */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Simulaciones Activas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(summary.byTank).map(([tankId, tankInfo]) => (
                                    <div key={tankId} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-sm">{tankInfo.tankName}</h4>
                                            <Badge color="secondary">{tankInfo.count} activa{tankInfo.count !== 1 ? 's' : ''}</Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {tankInfo.simulations.map((sim: EmitterStatus) => (
                                                <div key={sim.sensorId} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                                                    <div className="flex items-center gap-2">{getSensorIcon(sim.type)}<span>{sim.sensorName}</span></div>
                                                    <div className="text-right">
                                                        <div>{sim.currentValue} {sim.unit}</div>
                                                        <div className="text-muted-foreground">{sim.messagesCount} msg • {formatUptime(sim.uptime)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Active by Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Por Tipo de Sensor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(summary.byType).map(([type, count]) =>
                                    count > 0 && (
                                        <div key={type} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">{getSensorIcon(type)}<span className="text-sm">{type}</span></div>
                                            <Badge color="secondary">{count}</Badge>
                                        </div>
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};

export default SimulationDashboard;