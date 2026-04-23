/**
 * @file useInfrastructure.ts
 * @route frontend/src/hooks/
 * @description Hook unificado para cargar tanques, sensores y usuarios de forma optimizada y correcta.
 * @author Kevin Mariano 
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tank, Sensor, UserFromApi as User } from '@/types';
import * as tankService from '@/services/tankService';
import * as sensorService from '@/services/sensorService';
import * as userService from '@/services/userService';

export interface UseInfrastructureReturn {
  tanks: Tank[];
  sensors: Sensor[];
  users: User[];
  loading: boolean;
  error: string | null;
  fetchDataForUser: (userId: string) => Promise<void>;
  refetchData: (userId: string) => Promise<void>;
}

export const useInfrastructure = (isAdmin: boolean = false): UseInfrastructureReturn => {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      // console.log('👥 Fetching users list...');
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (err: any) {
      console.error('❌ Error fetching users:', err);
      setError('No se pudo cargar la lista de usuarios.');
    }
  }, [isAdmin]);

  const fetchDataForUser = useCallback(async (userId: string) => {
    if (!userId) {
      console.warn('⚠️ `fetchDataForUser` requiere un `userId`.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // console.log(`🔄 Fetching infrastructure for user: ${userId}`);
      const [tanksData, sensorsData] = await Promise.all([
        tankService.getTanks(userId),
        sensorService.getSensors(userId),
      ]);
      setTanks(tanksData);
      setSensors(sensorsData);
    } catch (err: any) {
      console.error('❌ Error fetching infrastructure data:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos de infraestructura.');
      setTanks([]);
      setSensors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchData = useCallback((userId: string) => {
    return fetchDataForUser(userId);
  }, [fetchDataForUser]);

  useEffect(() => {
    setLoading(true);
    fetchAllUsers().finally(() => {
      setLoading(false);
    });
  }, [fetchAllUsers]);

  return {
    tanks,
    sensors,
    users,
    loading,
    error,
    fetchDataForUser,
    refetchData,
  };
};