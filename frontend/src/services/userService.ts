/**
 * @file userService.ts
 * @route frontend/src/services
 * @description Servicio para interactuar con la API de usuarios del backend.
 * Este archivo centraliza todas las llamadas HTTP relacionadas con la gestión de usuarios.
 * @author kevin mariano
 * @version 2.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import api from '../config/api';
import { User, UserFromApi } from '../types'; 

/**
 * @typedef {Omit<UserFromApi, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin' | '_count' | 'tanks'> & { password?: string }} CreateUserInput
 * @description Tipo de datos para crear un nuevo usuario. Excluye campos generados por el servidor.
 */
type CreateUserInput = Omit<UserFromApi, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin' | '_count' | 'tanks'> & {
  password?: string;
};

/**
 * @typedef {Partial<CreateUserInput>} UpdateUserInput
 * @description Tipo de datos para actualizar un usuario existente. Todas las propiedades son opcionales.
 */
type UpdateUserInput = Partial<CreateUserInput>;

/**
 * @method getUsers
 * @description Obtiene la lista completa de usuarios desde el backend.
 * @returns {Promise<UserFromApi[]>} Una promesa que se resuelve con un arreglo de objetos de usuario.
 * @throws {Error} Si la petición a la API falla.
 */
export const getUsers = async (): Promise<UserFromApi[]> => {
  try {
    const response = await api.get<UserFromApi[]>('/users');
    return response.data;
  } catch (error) {
    console.error('Error en getUsers:', error);
    throw new Error('Error al obtener la lista de usuarios');
  }
};

/**
 * @method createUser
 * @description Envía una petición para crear un nuevo usuario.
 * @param {CreateUserInput} userData - Los datos del nuevo usuario a crear.
 * @returns {Promise<UserFromApi>} El objeto del usuario creado.
 */
export const createUser = async (userData: CreateUserInput): Promise<UserFromApi> => {
  try {
    const response = await api.post<UserFromApi>('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error en createUser:', error);
    throw new Error('Error al crear el usuario');
  }
};

/**
 * @method updateUser
 * @description Envía una petición para actualizar un usuario existente.
 * @param {string} id - El ID del usuario a actualizar.
 * @param {UpdateUserInput} userData - Los datos del usuario a modificar.
 * @returns {Promise<UserFromApi>} El objeto del usuario actualizado.
 */
export const updateUser = async (id: string, userData: UpdateUserInput): Promise<UserFromApi> => {
  try {
    const response = await api.patch<UserFromApi>(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error en updateUser:', error);
    throw new Error('Error al actualizar el usuario');
  }
};

/**
 * @method deleteUser
 * @description Envía una petición para eliminar un usuario.
 * @param {string} id - El ID del usuario a eliminar.
 */
export const deleteUser = async (id: string): Promise<void> => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error) {
    console.error('Error en deleteUser:', error);
    throw new Error('Error al eliminar el usuario');
  }
};