/**
 * @file alertService.ts
 * @route frontend/src/services
 * @description Servicios para la gestión de alertas CORREGIDO
 * @author kevin mariano
 * @version 1.1.0 // VERSIÓN CORREGIDA
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import api from '@/config/api';
import { Alert, ApiResponse } from '@/types';

const ALERTS_BASE_URL = '/alerts';

/**
 * @description Servicios para la gestión de alertas del sistema.
 */
export const alertsService = {
  /**
   * Obtiene todas las alertas no resueltas para el usuario actual.
   * 🔥 CORRECCIÓN: Manejo robusto de la respuesta de la API
   */
  async getUnresolvedAlerts(): Promise<Alert[]> {
    try {
      console.log('📡 [AlertService] Solicitando alertas no resueltas...');
      
      const response = await api.get<Alert[] | ApiResponse<Alert[]>>(`${ALERTS_BASE_URL}/unresolved`); 
      
      // 🔥 CORRECCIÓN CLAVE: Manejar ambos formatos de respuesta
      let alerts: Alert[] = [];
      
      // Si la respuesta tiene estructura ApiResponse
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        alerts = (response.data as ApiResponse<Alert[]>).data || [];
      } 
      // Si la respuesta es directamente el array
      else if (Array.isArray(response.data)) {
        alerts = response.data;
      }
      
      console.log(`✅ [AlertService] ${alerts.length} alertas recibidas`);
      
      // 🔥 CORRECCIÓN: Validar y mapear cada alerta
      const validatedAlerts = alerts.map(alert => ({
        ...alert,
        // Asegurar que las fechas sean strings ISO
        createdAt: typeof alert.createdAt === 'string' 
          ? alert.createdAt 
          : new Date(alert.createdAt).toISOString(),
        resolvedAt: alert.resolvedAt 
          ? (typeof alert.resolvedAt === 'string' 
              ? alert.resolvedAt 
              : new Date(alert.resolvedAt).toISOString())
          : undefined
      }));
      
      return validatedAlerts;
      
    } catch (error: any) {
      console.error('❌ [AlertService] Error al obtener alertas:', error);
      console.error('Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error; 
    }
  },

  /**
   * Marca una alerta específica como resuelta.
   * 🔥 CORRECCIÓN: Logging mejorado
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      console.log(`🔄 [AlertService] Resolviendo alerta: ${alertId}`);
      await api.patch(`${ALERTS_BASE_URL}/${alertId}/resolve`); 
      console.log(`✅ [AlertService] Alerta ${alertId} resuelta exitosamente`);
    } catch (error: any) {
      console.error(`❌ [AlertService] Error al resolver la alerta ${alertId}:`, error);
      console.error('Detalles del error:', {
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },
};

export default alertsService;