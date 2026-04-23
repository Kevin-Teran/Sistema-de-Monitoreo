/**
 * @file authService.ts
 * @route frontend/src/services
 * @description Servicio de frontend para gestionar la autenticación con la API.
 * Versión final, corregida y sin código de backend.
 * @author kevin mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import api from '@/config/api';
import { User, LoginCredentials, ResetPasswordCredentials } from '../types';
import { AxiosError } from 'axios';

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface MessageResponse {
    message: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión. Revisa tus credenciales.';
      throw new Error(errorMessage);
    }
  },

  getMe: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'No se pudo obtener la información del usuario.';
      throw new Error(errorMessage);
    }
  },

  forgotPassword: async (email: string): Promise<string> => {
    try {
        const response = await api.post<MessageResponse>('/auth/forgot-password', { email });
        return response.data.message;
    } catch (error: any) {
        const axiosError = error as AxiosError;
        const errorMessage = (axiosError.response?.data as { message?: string })?.message ||
                           'Ocurrió un error al intentar recuperar la contraseña.';
        throw new Error(errorMessage);
    }
  },

  resetPassword: async (credentials: ResetPasswordCredentials): Promise<string> => {
    const { token, newPassword } = credentials;
    try {
        const response = await api.post<MessageResponse>('/auth/reset-password', { token, newPassword });
        return response.data.message;
    } catch (error: any) {
        const axiosError = error as AxiosError;
        const errorMessage = (axiosError.response?.data as { message?: string })?.message ||
                           'El enlace de recuperación es inválido o ha expirado.';
        throw new Error(errorMessage);
    }
  },
};