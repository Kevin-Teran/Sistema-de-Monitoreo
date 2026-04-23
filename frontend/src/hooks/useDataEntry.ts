/**
 * @file useDataEntry.ts
 * @route frontend/src/hooks/
 * @description Hook optimizado para la recolección de datos, con estado MQTT real,
 * escucha de WebSockets y optimización de re-renders.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Tank, Sensor, UserFromApi as User, SensorData, Role, SensorType, ManualEntryDto } from '@/types';
import * as tankService from '@/services/tankService';
import * as sensorService from '@/services/sensorService';
import * as userService from '@/services/userService';
import * as dataService from '@/services/dataService';
import { EmitterStatus } from '@/services/dataService';
import { socketManager } from '@/services/socketService';
import { mqttService } from '@/services/mqttService';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

type LoadingState = {
  users: boolean;
  tanks: boolean;
  sensors: boolean;
  simulations: boolean;
};

type MqttStatus = 'disconnected' | 'connecting' | 'connected';

export const useDataEntry = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(currentUser?.id || null);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [selectedTankId, setSelectedTankId] = useState<string>('');
  const [sensors, setSensors] = useState<Sensor[]>([]);

  const [loading, setLoading] = useState<LoadingState>({ users: true, tanks: true, sensors: true, simulations: true });
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [isTogglingSimulation, setIsTogglingSimulation] = useState<Set<string>>(new Set());

  const [manualReadings, setManualReadings] = useState<Record<string, string>>({});

  const [activeSimulations, setActiveSimulations] = useState<EmitterStatus[]>([]);
  const [mqttStatus, setMqttStatus] = useState<MqttStatus>('disconnected');

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncSimulationStatus = useCallback(async () => {
    if (!currentUser) return;
    try {
      const statusData = await dataService.getEmitterStatus();
      setActiveSimulations(statusData);
    } catch (err) {
      console.error('❌ [SYNC] Error sincronizando estado:', err);
    } finally {
      setLoading(prev => ({ ...prev, simulations: false }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (socketManager && socketManager.socket) {
      socketManager.socket.connect();
    } else {
      console.error('❌ SocketManager o su socket no están disponibles');
    }

    mqttService.connect();
    
    const unsubscribeMqtt = mqttService.onStatusChange(status => {
      if (status.connected) setMqttStatus('connected');
      else if (status.connecting) setMqttStatus('connecting');
      else setMqttStatus('disconnected');
    });

    const handleSensorUpdate = (data: SensorData) => {
      setActiveSimulations(prevSims =>
        prevSims.map(sim => {
          if (sim.sensorId === data.sensorId) {
            const updatedValue = data.value !== undefined ? data.value : sim.currentValue;
            return { ...sim, currentValue: updatedValue };
          }
          return sim;
        })
      );
    };

    if (socketManager && socketManager.socket) {
      socketManager.socket.on('new_sensor_data', handleSensorUpdate);
    }

    syncSimulationStatus();
    syncIntervalRef.current = setInterval(syncSimulationStatus, 15000);

    return () => {
      if (socketManager && socketManager.socket) {
        socketManager.socket.off('new_sensor_data', handleSensorUpdate);
        socketManager.socket.disconnect();
      }
      
      mqttService.disconnect();
      unsubscribeMqtt();
      
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncSimulationStatus]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!isAdmin) {
        if (currentUser) setUsers([currentUser as User]);
        setLoading(prev => ({ ...prev, users: false }));
        return;
      }
      try {
        const usersData = await userService.getUsers();
        setUsers(usersData);
      } catch (err) { setError('No se pudo cargar la lista de usuarios.'); }
      finally { setLoading(prev => ({ ...prev, users: false })); }
    };
    loadUsers();
  }, [isAdmin, currentUser]);

  useEffect(() => {
    if (!selectedUserId) {
        setTanks([]);
        setSensors([]);
        setLoading(prev => ({...prev, tanks: false, sensors: false}));
        return;
    };
    const loadTanks = async () => {
      setLoading(prev => ({ ...prev, tanks: true }));
      try {
        const tanksData = await tankService.getTanks(selectedUserId);
        setTanks(tanksData);
        if (tanksData.length > 0 && !tanksData.some(t => t.id === selectedTankId)) {
          setSelectedTankId(tanksData[0].id);
        } else if (tanksData.length === 0) {
          setSelectedTankId('');
          setSensors([]);
        }
      } catch (err) { setError('No se pudieron cargar los tanques.'); }
      finally { setLoading(prev => ({ ...prev, tanks: false })); }
    };
    loadTanks();
  }, [selectedUserId, selectedTankId]);

  useEffect(() => {
    if (!selectedTankId) {
        setSensors([]);
        setLoading(prev => ({...prev, sensors: false}));
        return;
    };
    const loadSensors = async () => {
        setLoading(prev => ({ ...prev, sensors: true }));
        try {
            const sensorsData = await sensorService.getSensorsByTank(selectedTankId);
            setSensors(sensorsData);
        } catch(err) { setError("No se pudieron cargar los sensores."); }
        finally { setLoading(prev => ({ ...prev, sensors: false })); }
    };
    loadSensors();
  }, [selectedTankId]);

  const handleUserChange = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setSelectedTankId('');
  }, []);

  const handleTankChange = useCallback((tankId: string) => {
    setSelectedTankId(tankId);
  }, []);

  const handleManualReadingChange = useCallback((sensorId: string, value: string) => {
    setManualReadings(prev => ({ ...prev, [sensorId]: value }));
  }, []);

  const handleManualSubmit = useCallback(async () => {
    const entries: ManualEntryDto[] = Object.entries(manualReadings)
      .map(([sensorId, value]) => ({ sensorId, value: parseFloat(value), timestamp: new Date() }))
      .filter(entry => !isNaN(entry.value));

    if (entries.length === 0) {
      Swal.fire('Atención', 'Debe ingresar al menos un valor numérico válido.', 'warning');
      return;
    }
    setIsSubmittingManual(true);
    try {
      await dataService.addManualEntries(entries);
      setManualReadings({});
      Swal.fire('¡Éxito!', `Se guardaron ${entries.length} lecturas.`, 'success');
    } catch (err) {
      Swal.fire('Error', 'No se pudieron guardar los datos.', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  }, [manualReadings]);

  const toggleSimulation = useCallback(async (sensorId: string) => {
    if (isTogglingSimulation.has(sensorId)) return;
    const isActive = activeSimulations.some(sim => sim.sensorId === sensorId);
    setIsTogglingSimulation(prev => new Set(prev).add(sensorId));
    try {
      if (isActive) {
        await dataService.stopEmitter(sensorId);
      } else {
        await dataService.startEmitters([sensorId]);
      }
      await syncSimulationStatus(); 
    } catch (error) {
      Swal.fire('Error', 'No se pudo cambiar el estado de la simulación.', 'error');
    } finally {
      setIsTogglingSimulation(prev => { const newSet = new Set(prev); newSet.delete(sensorId); return newSet; });
    }
  }, [isTogglingSimulation, activeSimulations, syncSimulationStatus]);

  const batchOperation = useCallback(async (operation: 'start' | 'stop', sensorIds: string[]) => {
    if (sensorIds.length === 0) return;
    try {
      operation === 'start'
        ? await dataService.startEmitters(sensorIds)
        : await dataService.stopMultipleEmitters(sensorIds);
      await syncSimulationStatus();
    } catch (error) {
      Swal.fire('Error', `La operación por lotes (${operation}) falló.`, 'error');
    }
  }, [syncSimulationStatus]);

  const getUnitForSensorType = useCallback((type: SensorType | string): string => {
    const units: Record<string, string> = { TEMPERATURE: '°C', PH: 'pH', OXYGEN: 'mg/L' };
    return units[type] || '';
  }, []);

  const isSimulationActive = useCallback((sensorId: string) => {
    return activeSimulations.some(sim => sim.sensorId === sensorId);
  }, [activeSimulations]);

  const getSimulationStatus = useCallback((sensorId: string) => {
    return activeSimulations.find(sim => sim.sensorId === sensorId);
  }, [activeSimulations]);

  return {
    users, tanks, sensors, activeSimulations, mqttStatus,
    selectedUserId, selectedTankId, manualReadings,
    loading, error, isAdmin, isSubmittingManual, isTogglingSimulation,
    handleUserChange, handleTankChange, handleManualReadingChange, handleManualSubmit,
    toggleSimulation,
    startMultipleSimulations: (ids: string[]) => batchOperation('start', ids),
    stopMultipleSimulations: (ids: string[]) => batchOperation('stop', ids),
    getUnitForSensorType,
    getActiveSimulationsSummary: () => {
      const summary: any = {
        totalActive: 0,
        totalMessages: 0,
        byTank: {},
        byType: {},
      };
  
      activeSimulations.forEach(sim => {
        summary.totalActive++;
        summary.totalMessages += sim.messagesCount;
  
        if (!summary.byTank[sim.tankId]) {
          summary.byTank[sim.tankId] = {
            tankName: sim.tankName,
            count: 0,
            simulations: [],
          };
        }
        summary.byTank[sim.tankId].count++;
        summary.byTank[sim.tankId].simulations.push(sim);
  
        if (!summary.byType[sim.type]) {
          summary.byType[sim.type] = 0;
        }
        summary.byType[sim.type]++;
      });
  
      return summary;
    },
    isSimulationActive,
    getSimulationStatus,
    simulationMetrics: { systemUptime: 0 }, 
    lastSyncTime: Date.now(),
  };
};