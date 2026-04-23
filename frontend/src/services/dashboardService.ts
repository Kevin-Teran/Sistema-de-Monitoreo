/**
 * @file dashboardService.ts
 * @route frontend/src/services
 * @description Servicio frontend corregido con transformación de datos y manejo de errores robusto
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import api from '@/config/api';
import { UserFromApi } from '@/types';
import { 
    RealtimeData, 
    HistoricalData, 
    DashboardFilters, 
    DashboardSummary 
} from '@/types/dashboard';

/**
 * @function cleanFilters
 * @description Limpia filtros eliminando valores undefined/null
 */
const cleanFilters = (filters: DashboardFilters): Record<string, string> => {
    return Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            acc[key] = value.toString();
        }
        return acc;
    }, {} as Record<string, string>);
};

/**
 * @function getSummary
 * @description Obtiene el resumen de estadísticas del dashboard
 */
export const getSummary = async (
    filters: DashboardFilters,
): Promise<DashboardSummary> => {
    try {
        //console.log('📊 [dashboardService] Obteniendo resumen con filtros:', filters);
        
        const cleanedFilters = cleanFilters(filters);
        //console.log('🧹 [dashboardService] Filtros limpios:', cleanedFilters);
        
        const { data } = await api.get('/dashboard/summary', { 
            params: cleanedFilters 
        });
        
        //console.log('✅ [dashboardService] Resumen recibido:', data);

        const summary: DashboardSummary = {
            tanksCount: data.tanksCount || 0,
            sensorsCount: data.sensorsCount || 0,
            recentAlerts: data.recentAlerts || 0,
            totalDataPoints: data.totalDataPoints || 0,
            activeSimulations: 0,
        };

        return summary;
    } catch (error: any) {
        console.error('❌ [dashboardService] Error obteniendo resumen:', error);
        console.error('❌ [dashboardService] Detalles:', error.response?.data);
        throw new Error(
            error.response?.data?.message || 
            'Error al obtener el resumen del dashboard'
        );
    }
};

/**
 * @function getRealtimeData
 * @description Obtiene los datos en tiempo real de los sensores
 */
export const getRealtimeData = async (
    filters: DashboardFilters,
): Promise<RealtimeData> => {
    try {
        //console.log('⚡ [dashboardService] Obteniendo datos en tiempo real:', filters);

        if (!filters.tankId) {
            console.warn('⚠️ [dashboardService] No se proporcionó tankId');
            return { TEMPERATURE: [], PH: [], OXYGEN: [] };
        }

        const cleanedFilters = cleanFilters(filters);
        const { data } = await api.get('/dashboard/realtime', { 
            params: cleanedFilters 
        });

        //console.log('✅ [dashboardService] Datos en tiempo real recibidos:', data);

        const realtimeData: RealtimeData = {
            TEMPERATURE: data.TEMPERATURE || [],
            PH: data.PH || [],
            OXYGEN: data.OXYGEN || [],
        };

        /* 
         * console.log('📊 [dashboardService] Datos procesados:', {
         *   TEMPERATURE: realtimeData.TEMPERATURE.length,
         *   PH: realtimeData.PH.length,
         *   OXYGEN: realtimeData.OXYGEN.length,
         * });
        */

        return realtimeData;
    } catch (error: any) {
        console.error('❌ [dashboardService] Error obteniendo datos en tiempo real:', error);
        console.error('❌ [dashboardService] Detalles:', error.response?.data);
        
        return { TEMPERATURE: [], PH: [], OXYGEN: [] };
    }
};

/**
 * @function getHistoricalData
 * @description Obtiene los datos históricos para los gráficos
 */
export const getHistoricalData = async (
    filters: DashboardFilters,
): Promise<HistoricalData> => {
    try {
        //console.log('📈 [dashboardService] Obteniendo datos históricos:', filters);

        if (!filters.tankId) {
            console.warn('⚠️ [dashboardService] No se proporcionó tankId');
            return { TEMPERATURE: [], PH: [], OXYGEN: [] };
        }

        const effectiveFilters: DashboardFilters = {
            ...filters,
            startDate: filters.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: filters.endDate || new Date().toISOString().split('T')[0],
        };

        const cleanedFilters = cleanFilters(effectiveFilters);
        //console.log('🧹 [dashboardService] Filtros históricos limpios:', cleanedFilters);

        const { data } = await api.get('/dashboard/historical', {
            params: cleanedFilters,
        });

        //console.log('✅ [dashboardService] Datos históricos recibidos:', data);

        const historicalData: HistoricalData = {
            TEMPERATURE: data.TEMPERATURE || [],
            PH: data.PH || [],
            OXYGEN: data.OXYGEN || [],
        };

        /**
         * console.log('📊 [dashboardService] Datos históricos procesados:', {
         *   TEMPERATURE: historicalData.TEMPERATURE.length,
         *   PH: historicalData.PH.length,
         *   OXYGEN: historicalData.OXYGEN.length,
         * });
        */
        return historicalData;
    } catch (error: any) {
        console.error('❌ [dashboardService] Error obteniendo datos históricos:', error);
        console.error('❌ [dashboardService] Detalles:', error.response?.data);
        
        return { TEMPERATURE: [], PH: [], OXYGEN: [] };
    }
};

/**
 * @function getUsersListForAdmin
 * @description Obtiene la lista de usuarios (solo para administradores)
 */
export const getUsersListForAdmin = async (): Promise<UserFromApi[]> => {
    try {
        //console.log('👥 [dashboardService] Obteniendo lista de usuarios');
        
        const { data } = await api.get('/dashboard/users');
        
        //console.log('✅ [dashboardService] Usuarios recibidos:', data.length);
        
        return data;
    } catch (error: any) {
        console.error('❌ [dashboardService] Error obteniendo usuarios:', error);
        console.error('❌ [dashboardService] Detalles:', error.response?.data);
        throw new Error(
            error.response?.data?.message || 
            'Error al obtener la lista de usuarios'
        );
    }
};