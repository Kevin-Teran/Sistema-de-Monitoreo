/**
 * @file UserDetailsModal.tsx
 * @route /frontend/src/components/users
 * @description Modal para mostrar los detalles de un usuario.
 * @author Kevin Mariano 
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React from 'react';
import { UserFromApi } from '@/types';
import {
  X,
  Mail,
  ShieldCheck,
  Clock,
  CalendarDays,
  LogIn,
  Container,
  User,
} from 'lucide-react';

interface UserDetailsModalProps {
  isOpen: boolean;
  user: UserFromApi;
  onClose: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, user, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
      <div
        className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#39A900]/10 rounded-xl">
                    <User className="w-8 h-8 text-[#39A900]" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Ficha de {user.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Detalles del usuario y actividad.
                    </p>
                </div>
            </div>
          <button onClick={onClose} className="p-2 text-gray-400 rounded-xl transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center"><span className="flex items-center text-gray-500 dark:text-gray-400 font-semibold"><Mail className="h-4 w-4 mr-2" />Email</span><span className="text-gray-800 dark:text-gray-200">{user.email}</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center text-gray-500 dark:text-gray-400 font-semibold"><ShieldCheck className="h-4 w-4 mr-2" />Rol</span><span className="text-gray-800 dark:text-gray-200">{user.role}</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center text-gray-500 dark:text-gray-400 font-semibold"><Clock className="h-4 w-4 mr-2" />Estado</span><span className="text-gray-800 dark:text-gray-200">{user.status}</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center text-gray-500 dark:text-gray-400 font-semibold"><CalendarDays className="h-4 w-4 mr-2" />Registrado</span><span className="text-gray-800 dark:text-gray-200">{new Date(user.createdAt).toLocaleDateString()}</span></div>
            <div className="flex justify-between items-center"><span className="flex items-center text-gray-500 dark:text-gray-400 font-semibold"><LogIn className="h-4 w-4 mr-2" />Último Acceso</span><span className="text-gray-800 dark:text-gray-200">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}</span></div>
            
            <hr className="my-3 border-gray-200 dark:border-gray-600" />
            
            <h4 className="font-semibold text-gray-600 dark:text-gray-300 flex items-center"><Container className="h-4 w-4 mr-2" />Tanques Asignados ({user._count?.tanks ?? 0})</h4>
            {(user.tanks ?? []).length > 0 ? (
            <ul className="list-disc list-inside pl-4 text-gray-800 dark:text-gray-200">{(user.tanks ?? []).map(tank => <li key={tank.id}>{tank.name}</li>)}</ul>
            ) : (
            <p className="text-gray-500 dark:text-gray-400 pl-4">No tiene tanques asignados.</p>
            )}
        </div>
        <div className="flex justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-600">
             <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 font-medium text-gray-700 transition-colors bg-gray-100 rounded-xl dark:text-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500"
            >
              Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};