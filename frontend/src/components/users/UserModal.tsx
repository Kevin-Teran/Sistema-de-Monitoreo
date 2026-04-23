/**
 * @file UserModal.tsx
 * @route /frontend/src/components/users
 * @description Modal para crear y editar usuarios, con un diseño moderno y validación.
 * @author Kevin Mariano 
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Role, UserFromApi } from '@/types';
import {
  X,
  Save,
  User,
  Mail,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';

interface UserModalProps {
  isOpen: boolean;
  isEditing: boolean;
  user?: UserFromApi | null;
  currentUser: UserFromApi | null;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  isEditing,
  user,
  currentUser,
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.USER,
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditingSelf = user?.id === currentUser?.id;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          role: user.role || Role.USER,
          status: user.status || 'ACTIVE',
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          role: Role.USER,
          status: 'ACTIVE',
        });
      }
      setErrors({});
    }
  }, [isOpen, isEditing, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del correo no es válido.';
    }
    if (!isEditing && !formData.password) {
      newErrors.password = 'La contraseña es obligatoria para nuevos usuarios.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSend: any = { ...formData };
    if (!dataToSend.password) delete dataToSend.password;
    if (isEditingSelf) {
      delete dataToSend.role;
      delete dataToSend.status;
    }
    onSubmit(dataToSend);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
      <div
        className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#39A900]/10 rounded-xl">
              <User className="w-8 h-8 text-[#39A900]" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? `Editar a ${user?.name}` : 'Crear Nuevo Usuario'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditing ? 'Modifica los detalles del usuario.' : 'Añade un nuevo usuario al sistema.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 rounded-xl transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className={clsx("w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900]", errors.name && "border-red-500")} required />
            {errors.name && <p className="flex items-center mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 mr-1" />{errors.name}</p>}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className={clsx("w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900]", errors.email && "border-red-500")} required />
            {errors.email && <p className="flex items-center mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 mr-1" />{errors.email}</p>}
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditing ? '(Dejar en blanco para no cambiar)' : ''} className={clsx("w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900]", errors.password && "border-red-500")} required={!isEditing} />
            {errors.password && <p className="flex items-center mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 mr-1" />{errors.password}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
              <select name="role" value={formData.role} onChange={handleChange} disabled={isEditingSelf} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900] disabled:bg-gray-200 dark:disabled:bg-gray-800">
                <option value={Role.USER}>Usuario</option>
                <option value={Role.ADMIN}>Administrador</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
              <select name="status" value={formData.status} onChange={handleChange} disabled={isEditingSelf} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900] disabled:bg-gray-200 dark:disabled:bg-gray-800">
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="SUSPENDED">Suspendido</option>
              </select>
            </div>
          </div>

          {isEditingSelf && <p className="text-xs text-center text-yellow-600 dark:text-yellow-400"><Lock className="inline h-3 w-3 mr-1" />No puedes editar tu propio rol o estado.</p>}

          <div className="flex justify-end pt-6 space-x-3 border-t border-gray-200 dark:border-gray-600">
            <button type="button" onClick={onClose} className="px-6 py-3 font-medium text-gray-700 transition-colors bg-gray-100 rounded-xl dark:text-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500">
              Cancelar
            </button>
            <button type="submit" className="flex items-center px-6 py-3 font-medium text-white bg-[#39A900] rounded-xl hover:bg-[#2F8B00] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
              <Save className="w-5 h-5 mr-2" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};