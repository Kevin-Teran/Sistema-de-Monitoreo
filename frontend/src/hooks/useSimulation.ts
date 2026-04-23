/**
 * @file useSimulation.ts
 * @route frontend/src/hooks/
 * @description Hook para gestionar la lógica de la página de simulación de datos de sensores.
 * @author Kevin Mariano 
 * @version 1.0.0
 * @since 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Tank, Sensor, UserFromApi as User } from '@/types';
import * as tankService from '@/services/tankService';
import * as sensorService from '@/services/sensorService';
import * as userService from '@/services/userService';
import * as dataService from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

export const useSimulation = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(currentUser?.id || null);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [selectedTankId, setSelectedTankId] = useState<string>('');
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensors, setSelectedSensors] = useState<Set<string>>(new Set());
  const [activeEmitters, setActiveEmitters] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      userService.getUsers()
        .then(setUsers)
        .catch(err => setError('No se pudo cargar la lista de usuarios.'));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedUserId) {
      setLoading(true);
      tankService.getTanks(selectedUserId)
        .then(data => {
          setTanks(data);
          if (data.length > 0) {
            setSelectedTankId(data[0].id);
          } else {
            setSelectedTankId('');
            setSensors([]);
          }
        })
        .catch(() => setError('No se pudieron cargar los tanques.'))
        .finally(() => setLoading(false));
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (selectedTankId) {
      setLoading(true);
      sensorService.getSensorsByTank(selectedTankId)
        .then(setSensors)
        .catch(() => setError('No se pudieron cargar los sensores.'))
        .finally(() => setLoading(false));
    } else {
      setSensors([]);
    }
    setSelectedSensors(new Set()); 
  }, [selectedTankId]);

  const fetchEmitterStatus = useCallback(async () => {
    try {
      const status = await dataService.getEmitterStatus();
      setActiveEmitters(status.map((s: any) => s.sensorId));
    } catch (err) {
      console.error('Error fetching emitter status:', err);
    }
  }, []);

  useEffect(() => {
    fetchEmitterStatus();
    const interval = setInterval(fetchEmitterStatus, 5000); 
    return () => clearInterval(interval);
  }, [fetchEmitterStatus]);

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

  const handleStartSimulators = async () => {
    const idsToStart = Array.from(selectedSensors);
    if (idsToStart.length === 0) {
      Swal.fire('Atención', 'Seleccione al menos un sensor para iniciar la simulación.', 'warning');
      return;
    }
    try {
      await dataService.startEmitters(idsToStart);
      Swal.fire('¡Éxito!', 'Simuladores iniciados correctamente.', 'success');
      fetchEmitterStatus();
      setSelectedSensors(new Set());
    } catch (err) {
      Swal.fire('Error', 'No se pudieron iniciar los simuladores.', 'error');
    }
  };

  const handleStopSimulator = async (sensorId: string) => {
    try {
      await dataService.stopEmitter(sensorId);
      Swal.fire('¡Éxito!', 'Simulador detenido correctamente.', 'success');
      fetchEmitterStatus();
    } catch (err) {
      Swal.fire('Error', 'No se pudo detener el simulador.', 'error');
    }
  };
  
  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setTanks([]);
    setSelectedTankId('');
    setSensors([]);
  };

  return {
    users,
    selectedUserId,
    tanks,
    selectedTankId,
    sensors,
    loading,
    error,
    isAdmin,
    selectedSensors,
    activeEmitters,
    handleUserChange,
    setSelectedTankId,
    handleSensorSelection,
    handleStartSimulators,
    handleStopSimulator,
  };
};