/**
 * @file useUsers.ts
 * @description Hook personalizado para la gestión del estado de los usuarios en la UI.
 * Proporciona lógica para obtener, agregar, editar y eliminar usuarios.
 * @author Kevin Mariano 
 * @version 1.0.0
 * @since 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { getUsers, createUser, updateUser, deleteUser as deleteUserService } from '../services/userService';
import { UserFromApi } from '../types';

/**
 * @typedef {Omit<UserFromApi, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin' | '_count' | 'tanks'> & { password?: string }} UserFormData
 * @description Define la estructura de los datos del formulario para crear o editar un usuario.
 */
export type UserFormData = Omit<UserFromApi, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin' | '_count' | 'tanks'> & {
  password?: string;
};

/**
 * @function useUsers
 * @description Hook de React para manejar la lógica y el estado de la lista de usuarios.
 */
export const useUsers = () => {
  const [users, setUsers] = useState<UserFromApi[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * @name fetchUsers
   * @description Función para obtener la lista de usuarios desde el servicio y actualizar el estado.
   */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userList = await getUsers();
      setUsers(userList);
    } catch (err) {
      const errorMessage = 'Error al obtener la lista de usuarios';
      setError(errorMessage);
      console.error(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * @name addUser
   * @description Agrega un nuevo usuario y actualiza la lista local.
   */
  const addUser = async (userData: UserFormData) => {
    try {
      await createUser(userData);
      await fetchUsers();
    } catch (err) {
      console.error('Error al agregar el usuario:', err);
      throw err;
    }
  };

  /**
   * @name editUser
   * @description Edita un usuario existente y actualiza la lista local.
   */
  const editUser = async (id: string, userData: Partial<UserFormData>) => {
    try {
      const updatedUserResponse = await updateUser(id, userData);
      setUsers(prevUsers =>
        prevUsers.map(user => (user.id === id ? { ...user, ...updatedUserResponse } : user)),
      );
    } catch (err) {
      console.error('Error al editar el usuario:', err);
      throw err;
    }
  };

  /**
   * @name deleteUser
   * @description Elimina un usuario y recarga la lista desde el servidor.
   */
  const deleteUser = async (id: string) => {
    try {
      await deleteUserService(id);
      await fetchUsers();
    } catch (err) {
      const errorMessage = 'Error al eliminar el usuario';
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    editUser,
    deleteUser,
    clearError,
  };
};