/**
 * @file aiAssistantService.ts
 * @route frontend/src/services
 * @description Servicios para la interacción con el Asistente de IA.
 * @author kevin mariano
 * @version 1.0.3
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import api from '@/config/api';
import { ApiResponse } from '@/types';

const AI_BASE_URL = '/asistente';

/**
 * @description Servicios para la interacción con el Asistente de IA.
 */
export const aiAssistantService = {
  /**
   * Envía una pregunta al asistente y espera una respuesta en texto natural.
   * @param query El texto de la pregunta del usuario.
   * @returns La respuesta de texto del asistente.
   */
  async getAIResponse(query: string): Promise<string> {
    try {
      // Llama a POST /api/asistente, que es el endpoint del controlador
      const response = await api.post<ApiResponse<any>>(`${AI_BASE_URL}`, {
        pregunta: query,
      });
      
      const responseData = response.data.data || response.data;
      
      if (typeof responseData === 'string') {
        return responseData;
      }
      
      // Si el controlador devuelve { respuesta: string }, lo extraemos aquí.
      if (responseData && typeof responseData === 'object' && typeof responseData.respuesta === 'string') {
        return responseData.respuesta;
      }
      
      return 'Lo siento, no pude obtener una respuesta de la IA.';
    } catch (error) {
      console.error('Error al obtener respuesta de la IA:', error);
      // Se lanza el error para que sea capturado por el hook y muestre un mensaje en la UI
      throw new Error('Error de comunicación con el asistente de IA.');
    }
  },
};

export default aiAssistantService;