/**
 * @file useAlerts.ts
 * @route frontend/src/hooks
 * @description Hook CORREGIDO para gestionar el estado de las alertas con filtrado por usuario
 * @author kevin mariano
 * @version 2.0.0 // VERSIÓN FINAL CORREGIDA
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { useState, useEffect, useCallback } from 'react';
import { Alert, AlertSeverity } from '@/types';
import alertsService from '@/services/alertService';
import { socketManager } from '@/services/socketService'; 
import Swal from 'sweetalert2'; 
import { useAuth } from '@/context/AuthContext'; 

export const useAlerts = () => {
  const { user } = useAuth(); 
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = !!user;

  /**
   * 🔥 CORRECCIÓN: fetchAlerts con manejo robusto de errores
   */
  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('⚠️ [useAlerts] Usuario no autenticado, limpiando alertas');
      setAlerts([]);
      setLoading(false);
      return;
    }
    
    // Solo mostrar spinner en la primera carga
    if (alerts.length === 0) {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      console.log('🔄 [useAlerts] Obteniendo alertas...');
      const fetchedAlerts = await alertsService.getUnresolvedAlerts();
      
      // 🔥 CORRECCIÓN: Validar que sea un array
      if (!Array.isArray(fetchedAlerts)) {
        console.error('❌ [useAlerts] La respuesta no es un array:', fetchedAlerts);
        setError('Formato de respuesta inválido');
        setAlerts([]);
        return;
      }
      
      // 🔥 CORRECCIÓN CRÍTICA: Filtrar alertas por usuario en el frontend también
      const filteredAlerts = fetchedAlerts.filter(alert => {
        // Si es admin, mostrar todas
        if (user?.role === 'ADMIN') return true;
        
        // Si no es admin, solo mostrar las del usuario
        return alert.userId === user?.id;
      });
      
      // Ordenar por fecha descendente
      const sortedAlerts = filteredAlerts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log(`✅ [useAlerts] ${sortedAlerts.length} alertas cargadas (${fetchedAlerts.length} total, ${sortedAlerts.length} filtradas)`);
      setAlerts(sortedAlerts);
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 
                      err.message || 
                      'No se pudieron cargar las alertas. Verifique la conexión con el servidor.';
      
      console.error('❌ [useAlerts] Error:', errorMsg);
      setError(errorMsg);
      setAlerts([]);
      
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, alerts.length, user?.id, user?.role]); 

  /**
   * 🔥 CORRECCIÓN: handleNewAlert con validación completa y filtrado por usuario
   */
  const handleNewAlert = useCallback((newAlert: any) => {
    console.log('🚨 [useAlerts] Nueva alerta recibida por WebSocket:', newAlert);
    
    // 🔥 VALIDACIÓN CLAVE: Verificar estructura de la alerta
    if (!newAlert || !newAlert.id) {
      console.error('❌ [useAlerts] Alerta inválida recibida:', newAlert);
      return;
    }

    // 🔥 CORRECCIÓN CRÍTICA: Verificar que la alerta pertenece al usuario actual
    if (user?.role !== 'ADMIN' && newAlert.userId !== user?.id) {
      console.log(`⚠️ [useAlerts] Alerta ignorada: pertenece a otro usuario (${newAlert.userId} vs ${user?.id})`);
      return;
    }
    
    console.log(`✅ [useAlerts] Alerta aceptada para usuario ${user?.id}`);
    
    // Mapear la alerta al formato esperado
    const mappedAlert: Alert = {
      id: newAlert.id,
      type: newAlert.type,
      severity: newAlert.severity || AlertSeverity.WARNING,
      message: newAlert.message || 'Alerta sin descripción',
      userId: newAlert.userId || newAlert.sensor?.tank?.userId || user?.id || '',
      tankId: newAlert.sensor?.tank?.id,
      sensorId: newAlert.sensorId || newAlert.sensor?.id,
      resolved: newAlert.resolved || false,
      createdAt: newAlert.createdAt || new Date().toISOString(),
      resolvedAt: newAlert.resolvedAt,
      metadata: newAlert.sensor ? {
        sensorName: newAlert.sensor.name,
        tankName: newAlert.sensor.tank?.name,
        sensorType: newAlert.sensor.type,
        value: newAlert.value,
        threshold: newAlert.threshold
      } : undefined
    };
    
    console.log('📋 [useAlerts] Alerta mapeada:', mappedAlert);
    
    setAlerts(prevAlerts => {
      // Evitar duplicados
      if (prevAlerts.some(a => a.id === mappedAlert.id)) {
        console.log('⚠️ [useAlerts] Alerta duplicada, ignorando');
        return prevAlerts;
      }
      
      // Solo agregar si no está resuelta
      if (!mappedAlert.resolved) {
        // Determinar tipo de notificación según severidad
        const isCritical = mappedAlert.severity === AlertSeverity.CRITICAL || 
                          mappedAlert.severity === AlertSeverity.ERROR;

        console.log('🔔 [useAlerts] Mostrando notificación SweetAlert');
        
        // Mostrar notificación visual
        Swal.fire({
          title: `🚨 ${mappedAlert.severity.toUpperCase()}`,
          html: `
            <div style="text-align: left;">
              <p><strong>${mappedAlert.message}</strong></p>
              ${mappedAlert.metadata ? `
                <hr style="margin: 10px 0;">
                <p><strong>Tanque:</strong> ${mappedAlert.metadata.tankName || 'N/A'}</p>
                <p><strong>Sensor:</strong> ${mappedAlert.metadata.sensorName || 'N/A'}</p>
                <p><strong>Valor:</strong> ${mappedAlert.metadata.value || 'N/A'}</p>
                <p><strong>Umbral:</strong> ${mappedAlert.metadata.threshold || 'N/A'}</p>
              ` : ''}
            </div>
          `,
          icon: isCritical ? 'error' : 'warning',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 10000,
          timerProgressBar: true,
          customClass: {
            container: 'z-[9999]' 
          }
        });
        
        // Agregar al inicio del array
        return [mappedAlert, ...prevAlerts];
      }
      
      return prevAlerts;
    });

  }, [user?.id, user?.role]);

  /**
   * 🔥 CORRECCIÓN: markAsResolved con feedback visual y actualización optimista
   */
  const markAsResolved = useCallback(async (alertId: string) => {
    try {
      console.log(`🔄 [useAlerts] Resolviendo alerta: ${alertId}`);
      
      // 🔥 CORRECCIÓN: Actualización optimista - remover inmediatamente
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
      
      // Llamar al servicio
      await alertsService.resolveAlert(alertId);
      
      console.log(`✅ [useAlerts] Alerta ${alertId} resuelta`);
      
      Swal.fire({
        title: 'Resuelta',
        text: 'Alerta marcada como resuelta.',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      
    } catch (err: any) {
      console.error(`❌ [useAlerts] Error resolviendo alerta:`, err);
      
      // 🔥 CORRECCIÓN: Si falla, volver a cargar las alertas
      await fetchAlerts();
      
      Swal.fire({
        title: 'Error',
        text: err.message || 'No se pudo resolver la alerta. Intente de nuevo.',
        icon: 'error'
      });
    }
  }, [fetchAlerts]);

  /**
   * 🔥 EFECTO PRINCIPAL: Inicialización y suscripción a WebSocket
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setAlerts([]);
      if (socketManager) {
        socketManager.close();
      }
      return;
    }
    
    console.log('🚀 [useAlerts] Inicializando...');
    fetchAlerts();

    const token = localStorage.getItem('accessToken') || '';

    if (token && socketManager) {
      console.log('🔌 [useAlerts] Conectando socket y suscribiendo a new-alert');
      socketManager.connect(token);
      socketManager.on('new-alert', handleNewAlert);
    } else {
      console.warn('⚠️ [useAlerts] Token o SocketManager no disponible');
    }

    return () => {
      if (socketManager) {
        console.log('🔌 [useAlerts] Desuscribiendo de new-alert');
        socketManager.off('new-alert', handleNewAlert);
      }
    };
    
  }, [isAuthenticated, fetchAlerts, handleNewAlert]);

  return {
    alerts,
    unresolvedCount: alerts.length,
    loading,
    error,
    markAsResolved,
    refreshAlerts: fetchAlerts,
  };
};