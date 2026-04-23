/**
 * @file settingsService.ts
 * @route frontend/src/services
 * @description Servicio para obtener y actualizar las configuraciones de los usuarios.
 * @author kevin mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

 import api from '@/config/api';

 /**
  * @function getSettings
  * @description Obtiene las configuraciones de un usuario.
  * @param {string} [userId] - El ID del usuario a consultar. Si no se provee, se usa el del usuario autenticado.
  * @returns {Promise<any>} Una promesa que resuelve a un objeto con las configuraciones.
  */
 export const getSettings = async (userId?: string): Promise<any> => {
     const response = await api.get('/settings', {
         params: userId ? { userId } : {},
     });
     return response.data;
 };
 
 /**
  * @function updateSettings
  * @description Actualiza las configuraciones para un usuario específico.
  * @param {any} settingsData - El objeto completo de configuraciones a guardar.
  * @param {string} userId - El ID del usuario cuyas configuraciones se están actualizando.
  * @returns {Promise<any>} Las configuraciones actualizadas.
  */
 export const updateSettings = async (settingsData: any, userId: string): Promise<any> => {
     const response = await api.put('/settings', settingsData, { params: { userId } });
     return response.data;
 };