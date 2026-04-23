/**
 * @file sensorService.ts
 * @route frontend/src/services
 * @description Servicio para gestionar las operaciones CRUD de sensores.
 * Versión corregida para exportar todas las funciones necesarias.
 * @author kevin mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */
import api from '@/config/api';
import { Sensor, CreateSensorDto, UpdateSensorDto } from '@/types';

/**
 * @description Obtiene todos los sensores de un usuario específico.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<Sensor[]>}
 */
export const getSensors = async (userId?: string): Promise<Sensor[]> => {
  try {
    //console.log(`🔧 Fetching sensors for user: ${userId}`);
    const params = userId ? { userId } : {};
    const response = await api.get('/sensors', { params });
    //console.log(`✅ Sensors response:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching sensors:', error);
    throw error;
  }
};

/**
 * @description Obtiene los sensores asociados a un tanque específico.
 * @param {string} tankId - ID del tanque.
 * @returns {Promise<Sensor[]>}
 */
export const getSensorsByTank = async (tankId: string): Promise<Sensor[]> => {
  try {
    const response = await api.get(`/sensors`, { params: { tankId } });
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching sensors by tank:', error);
    throw error;
  }
};

/**
 * @description Obtiene un sensor por su ID.
 * @param {string} id - ID del sensor.
 * @returns {Promise<Sensor>}
 */
export const getSensorById = async (id: string): Promise<Sensor> => {
  try {
    const response = await api.get(`/sensors/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching sensor by ID:', error);
    throw error;
  }
};

/**
 * @description Crea un nuevo sensor.
 * @param {CreateSensorDto} sensorData - Datos para crear el sensor.
 * @returns {Promise<Sensor>}
 */
export const createSensor = async (sensorData: CreateSensorDto): Promise<Sensor> => {
  try {
    //console.log('🆕 Creating sensor:', sensorData);
    const response = await api.post('/sensors', sensorData);
    //console.log('✅ Sensor created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creating sensor:', error);
    throw error;
  }
};

/**
 * @description Actualiza un sensor existente.
 * @param {string} id - ID del sensor a actualizar.
 * @param {UpdateSensorDto} sensorData - Datos para actualizar.
 * @returns {Promise<Sensor>}
 */
export const updateSensor = async (id: string, sensorData: UpdateSensorDto): Promise<Sensor> => {
  try {
    //console.log('🔄 Updating sensor:', id, sensorData);
    const response = await api.patch(`/sensors/${id}`, sensorData);
    //console.log('✅ Sensor updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating sensor:', error);
    throw error;
  }
};

/**
 * @description Elimina un sensor.
 * @param {string} id - ID del sensor a eliminar.
 * @returns {Promise<void>}
 */
export const deleteSensor = async (id: string): Promise<void> => {
  try {
    //console.log('🗑️ Deleting sensor:', id);
    await api.delete(`/sensors/${id}`);
    //console.log('✅ Sensor deleted successfully');
  } catch (error: any) {
    console.error('❌ Error deleting sensor:', error);
    throw error;
  }
};

export const sensorService = {
  getSensors,
  getSensorsByTank,
  getSensorById,
  createSensor,
  updateSensor,
  deleteSensor,
};