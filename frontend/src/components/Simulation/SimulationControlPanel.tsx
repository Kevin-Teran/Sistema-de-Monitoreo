/**
 * @file SimulationControlPanel.tsx
 * @route frontend/src/components/Simulation
 * @description Panel para gestionar simulaciones MQTT, incluyendo acciones en lote.
 * @author Kevin Mariano
 * @version 1.1.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useState } from 'react';
import { useDataEntry } from '@/hooks/useDataEntry';
import { Button } from '@nextui-org/react';
import { SimulationSensorRow } from './SimulationSensorRow'; 
import { Play, Square } from 'lucide-react';

export const SimulationControlPanel: React.FC = () => {
  const { sensors, selectedTankId, startMultipleSimulations, stopMultipleSimulations } = useDataEntry();
  const [selectedSensors, setSelectedSensors] = useState<Set<string>>(new Set());

  const handleSensorSelection = (sensorId: string) => {
    setSelectedSensors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sensorId)) {
        newSet.delete(sensorId);
      } else {
        newSet.add(sensorId);
      }
      return newSet;
    });
  };

  const handleStartSelected = async () => {
    if (selectedSensors.size === 0) return;
    await startMultipleSimulations(Array.from(selectedSensors));
    setSelectedSensors(new Set());
  };

  const handleStopSelected = async () => {
    if (selectedSensors.size === 0) return;
    await stopMultipleSimulations(Array.from(selectedSensors));
    setSelectedSensors(new Set());
  };

  return (
    <div className="space-y-4">
      {sensors.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 p-3 bg-muted/50 rounded-lg">
          <Button size="sm" onClick={handleStartSelected} disabled={selectedSensors.size === 0}>
            <Play className="h-4 w-4 mr-1" />
            Iniciar Seleccionados ({selectedSensors.size})
          </Button>
          <Button size="sm" color="danger" onClick={handleStopSelected} disabled={selectedSensors.size === 0}>
            <Square className="h-4 w-4 mr-1" />
              Detener Seleccionados ({selectedSensors.size})
          </Button>
          <Button size="sm" variant="bordered" onClick={() => setSelectedSensors(new Set())} disabled={selectedSensors.size === 0}>
            Limpiar Selección
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {sensors.length > 0 ? (
          sensors.map((sensor) => (
            <SimulationSensorRow
              key={sensor.id}
              sensor={sensor}
              isSelected={selectedSensors.has(sensor.id)}
              onSelect={handleSensorSelection}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {selectedTankId ? 'No hay sensores configurados' : 'Selecciona un tanque'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationControlPanel;