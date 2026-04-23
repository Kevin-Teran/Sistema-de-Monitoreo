/**
 * @file api.ts
 * @route frontend/src/config
 * @description Configuración centralizada y a prueba de fallos del cliente Axios.
 * Esta es la configuración definitiva que intercepta cada petición para inyectar
 * el token de autenticación, con logging detallado para depuración.
 * @author Kevin Mariano
 * @version 1.0.1 
 * @since 1.0.0
 */

import axios, { AxiosError } from 'axios'; 
import Swal from 'sweetalert2';


const API_HOST_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'; 
const API_PREFIX = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'; 
const FINAL_API_URL = `${API_HOST_URL}${API_PREFIX}`;

/**
 * @constant api
 * @description Instancia de Axios preconfigurada con la URL base de la API.
 */
const api = axios.create({
  baseURL: FINAL_API_URL, 
});

/**
 * @interceptor request
 * @description Interceptor que se ejecuta ANTES de cada petición.
 */
api.interceptors.request.use(
  (config) => {
    //console.log(`🌐 [API Request] -> Petición ${config.method?.toUpperCase()} a: ${config.url}`);

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        //console.log('🔑 [API Request] -> Token encontrado. Longitud:', token.length);
        //console.log('🔑 [API Request] -> Primeros 20 caracteres:', token.substring(0, 20) + '...');
        config.headers.Authorization = `Bearer ${token}`;
        //console.log('✅ [API Request] -> Token adjuntado a cabecera Authorization');
      } else {
        /**
        * console.warn(`⚠️ [API Request] -> No se encontró 'accessToken' en localStorage.`);
        * console.log('📝 [API Request] -> Contenido actual de localStorage:', 
        * Object.keys(localStorage).map(key => `${key}: ${localStorage.getItem(key)?.substring(0, 20)}...`)
        );
        */
      }
    } else {
      console.log('🪟 [API Request] -> Ejecutándose en servidor (window undefined)');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ [API Request] -> Error al configurar la petición:', error);
    return Promise.reject(error);
  }
);

/**
 * @interceptor response
 * @description Interceptor que se ejecuta DESPUÉS de recibir cada respuesta.
 * Principalmente, maneja errores globales como el 401.
 */
 api.interceptors.response.use( 
 (response) => {
   //console.log(`✅ [API Response] -> ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
   return response;
 },
 (error) => {
   const status = error.response?.status;
   const url = error.config?.url;
   const method = error.config?.method?.toUpperCase();
   
   console.error(`💥 [API Response] -> ${method} ${url} - Error ${status}:`, error.response?.data);

   if (status === 401) {
     console.error('🚨 [API Response] -> ERROR 401 DETECTADO! Token inválido o expirado.');
     console.log('🔍 [API Response] -> localStorage antes de limpiar:', {
       accessToken: localStorage.getItem('accessToken')?.substring(0, 20) + '...',
       refreshToken: localStorage.getItem('refreshToken')?.substring(0, 20) + '...'
     });
     
     localStorage.removeItem('accessToken');
     localStorage.removeItem('refreshToken');
     
     Swal.fire({
         title: 'Sesión Expirada',
         text: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
         icon: 'warning',
         confirmButtonText: 'Aceptar'
     }).then(() => {
          if (typeof window !== 'undefined') {
             window.location.href = '/login'; 
          }
     });
   } else if (status === 403) {
     console.error('🔒 [API Response] -> ERROR 403: Sin permisos suficientes');
   } else if (status >= 500) {
     console.error('🔥 [API Response] -> ERROR del servidor:', status);
   }

   return Promise.reject(error);
 }
);

export default api;
