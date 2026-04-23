/**
 * @file SimulationSensorRow.tsx
 * @route frontend/src/components/Simulation
 * @description Componente para mostrar y controlar cada sensor individual en la simulación.
 * @author Kevin Mariano
 * @version 1.1.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React from 'react';
import { useDataEntry } from '@/hooks/useDataEntry';
import { Sensor } from '@/types';
import { Button, Badge, Checkbox } from '@nextui-org/react';
import { Card, CardContent } from '@/components/common/Card';
import { Play, Square, Loader2, Thermometer, Beaker, Wind, Activity } from 'lucide-react';

interface SimulationSensorRowProps {
  sensor: Sensor;
  isSelected: boolean;
  onSelect: (sensorId: string) => void;
}

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

export const SimulationSensorRow: React.FC<SimulationSensorRowProps> = ({
  sensor,
  isSelected,
  onSelect,
}) => {
  const { 
    toggleSimulation, 
    isSimulationActive, 
    getSimulationStatus, 
    isTogglingSimulation,
    getUnitForSensorType 
  } = useDataEntry();

  const isActive = isSimulationActive(sensor.id);
  const simulationStatus = getSimulationStatus(sensor.id);
  const isToggling = isTogglingSimulation.has(sensor.id);
  const unit = getUnitForSensorType(sensor.type as any);

  const handleToggle = async () => {
    await toggleSimulation(sensor.id);
  };

  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Información del sensor */}
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onValueChange={() => onSelect(sensor.id)}
              disabled={isToggling}
            />
            <div className="flex items-center gap-2">
              {getSensorIcon(sensor.type)}
              <div>
                <h4 className="font-medium">{sensor.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {sensor.hardwareId} • {sensor.type}
                </p>
              </div>
            </div>
          </div>
  
          {/* Estado y controles */}
          <div className="flex items-center gap-3">
            {/* Estado de la simulación */}
            {isActive && simulationStatus ? (
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Badge color="secondary" className="bg-green-100 text-green-800">
                    Activa
                  </Badge>
                  <span className="font-mono text-sm">
                    {simulationStatus.currentValue} {unit}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {simulationStatus.messagesCount} mensajes • {formatUptime(simulationStatus.uptime)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {simulationStatus.messagesPerMinute} msg/min
                </div>
              </div>
            ) : (
              <Badge variant="flat">Inactiva</Badge>
            )}
  
            {/* Botón de control */}
            <Button
              size="sm"
              color={isActive ? "danger" : "default"}
              onClick={handleToggle}
              disabled={isToggling}
              className="min-w-[100px]"
            >
              {isToggling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  {isActive ? 'Deteniendo' : 'Iniciando'}
                </>
              ) : isActive ? (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  Detener
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Iniciar
                </>
              )}
            </Button>
          </div>
        </div>
  
        {/* Información adicional si está activa */}
        {isActive && simulationStatus && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Estado:</span> {simulationStatus.state}
              </div>
              <div>
                <span className="font-medium">Rango:</span> {simulationStatus.thresholds.min} - {simulationStatus.thresholds.max} {unit}
              </div>
              <div>
                <span className="font-medium">Tanque:</span> {simulationStatus.tankName}
              </div>
              <div>
                <span className="font-medium">Usuario:</span> {simulationStatus.userName}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimulationSensorRow;