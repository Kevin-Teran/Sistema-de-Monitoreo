/**
 * @file TankModal.tsx
 * @description Modal optimizado para crear y editar tanques, con validación de nombre único por usuario.
 * @author Kevin Mariano (Refactorizado por Claude)
 * @version 2.3.0
 * @since 1.0.0
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // Importar useAuth para obtener el usuario actual
import { Tank } from '@/types';
import { createTank, updateTank } from '@/services/tankService';
import { 
  X, 
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  Droplets as TankIcon
} from 'lucide-react';
import { clsx } from 'clsx';
import Swal from 'sweetalert2';

interface TankModalProps {
  isOpen: boolean;
  isEditing: boolean;
  tankData?: Tank;
  allTanks?: Tank[];
  onClose: () => void;
  onSave: () => void;
}

export const TankModal: React.FC<TankModalProps> = ({
  isOpen,
  isEditing,
  tankData,
  allTanks = [],
  onClose,
  onSave,
}) => {
  const { user } = useAuth(); // Obtener el usuario logueado desde el contexto

  const [formData, setFormData] = useState({
    name: '',
    location: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (isEditing && tankData) {
        setFormData({ name: tankData.name, location: tankData.location });
      } else {
        setFormData({ name: '', location: '' });
      }
      setErrors({});
    }
  }, [isOpen, isEditing, tankData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = formData.name.trim();

    // DEBUG: Agregar logs para identificar el problema
    console.log('🔍 DEBUG - Validación:');
    console.log('Usuario actual:', user);
    console.log('Todos los tanques:', allTanks);
    console.log('Nombre a validar:', trimmedName);

    if (!user) { // Asegurarse de que el usuario esté cargado
      newErrors.name = 'No se pudo verificar el usuario. Inténtalo de nuevo.';
      setErrors(newErrors);
      return false;
    }

    if (!trimmedName) {
      newErrors.name = 'El nombre del tanque es obligatorio';
    } else if (trimmedName.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    } else {
      // **LÓGICA DE VALIDACIÓN MEJORADA CON DEBUGGING**
      // 1. Filtra los tanques para obtener solo los del usuario actual.
      const userTanks = allTanks.filter(tank => {
        // Convertir ambos a string para comparación segura
        const tankUserId = String(tank.userId);
        const currentUserId = String(user.id);
        return tankUserId === currentUserId;
      });

      console.log('Tanques del usuario actual:', userTanks);

      // 2. Comprueba si el nombre ya existe entre los tanques de ESE usuario.
      const isNameTaken = userTanks.some(tank => {
        const nameMatch = tank.name.toLowerCase() === trimmedName.toLowerCase();
        const isNotCurrentTank = !isEditing || tank.id !== tankData?.id;
        
        console.log(`Comparando "${tank.name}" con "${trimmedName}":`, {
          nameMatch,
          isNotCurrentTank,
          tankId: tank.id,
          currentTankId: tankData?.id
        });
        
        return nameMatch && isNotCurrentTank;
      });

      console.log('¿Nombre ya existe?:', isNameTaken);

      if (isNameTaken) {
        newErrors.name = `Ya tienes un tanque con el nombre "${trimmedName}"`;
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La ubicación es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        location: formData.location.trim(),
      };

      if (isEditing && tankData) {
        await updateTank(tankData.id, payload);
        await Swal.fire({
          title: '¡Tanque actualizado!',
          text: 'Los cambios se guardaron correctamente.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          color: '#39A900'
        });
      } else {
        await createTank(payload);
        await Swal.fire({
          title: '¡Tanque creado!',
          text: 'El nuevo tanque se ha añadido al sistema.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          color: '#39A900'
        });
      }
      onSave();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Error al ${isEditing ? 'actualizar' : 'crear'} el tanque`;
      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
      <div 
        className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#39A900]/10 rounded-lg">
              <TankIcon className="w-8 h-8 text-[#39A900]" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Editar Tanque' : 'Nuevo Tanque'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditing ? 'Modifica los detalles del tanque' : 'Añade un nuevo tanque a tu sistema'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 rounded-lg transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del Tanque */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre del Tanque *
            </label>
            <div className="relative">
              <FileText className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Tanque de Tilapias A"
                className={clsx(
                  "w-full px-10 py-3 pr-4 border rounded-lg focus:ring-[#39A900] focus:border-[#39A900] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors",
                  errors.name && "border-red-500"
                )}
              />
            </div>
            {errors.name && (
              <p className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Ubicación */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Ubicación *
            </label>
            <div className="relative">
              <MapPin className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Ej: Invernadero Principal, Fila 2"
                className={clsx(
                  "w-full px-10 py-3 pr-4 border rounded-lg focus:ring-[#39A900] focus:border-[#39A900] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors",
                  errors.location && "border-red-500"
                )}
              />
            </div>
            {errors.location && (
              <p className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.location}
              </p>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end pt-6 space-x-3 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg dark:text-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 font-medium text-white bg-[#39A900] rounded-lg hover:bg-[#2F8B00] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {isEditing ? 'Actualizar Tanque' : 'Crear Tanque'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};