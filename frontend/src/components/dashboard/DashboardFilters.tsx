/**
 * @file DashboardFilters.tsx
 * @route frontend/src/components/dashboard
 * @description Filtros con validación estricta para evitar mezcla de datos
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import React, { useEffect } from 'react';
import { Role, Tank, UserFromApi as User } from '@/types';
import { cn } from '@/utils/cn';

interface DashboardFiltersProps {
  filters: any;
  onFiltersChange: (newFilters: any) => void;
  usersList: User[];
  tanksList: Tank[];
  currentUserRole: Role;
  loading: boolean;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  usersList,
  tanksList,
  currentUserRole,
  loading,
}) => {
  
  /**
   * VALIDACIÓN CRÍTICA: Verificar que el tanque seleccionado pertenece al usuario
   */
  useEffect(() => {
    if (filters.tankId && tanksList.length > 0) {
      const selectedTank = tanksList.find(t => t.id === filters.tankId);
      if (!selectedTank) {
        onFiltersChange({ ...filters, tankId: undefined, sensorType: undefined });
      }
    }
  }, [filters.tankId, filters.userId, tanksList]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'userId') {
      onFiltersChange({ 
        ...filters, 
        userId: value, 
        tankId: undefined, 
        sensorType: undefined 
      });
    } else if (name === 'tankId') {
      const selectedTank = tanksList.find(t => t.id === value);
      if (selectedTank) {
        onFiltersChange({ ...filters, tankId: value });
      } else {
        console.error('❌ [DashboardFilters] Tanque no válido');
      }
    } else {
      onFiltersChange({ ...filters, [name]: value || undefined });
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isAdmin = currentUserRole === Role.ADMIN;

  const inputBaseClasses = "w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 disabled:opacity-50";
  const inputFocusClasses = "focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  const filteredTanksList = React.useMemo(() => {
    if (!filters.userId) return [];
    return tanksList.filter(tank => tank.userId === filters.userId);
  }, [tanksList, filters.userId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        {/* Alerta de validación */}
        {filters.tankId && filteredTanksList.length > 0 && !filteredTanksList.find(t => t.id === filters.tankId) && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ El tanque seleccionado no pertenece al usuario actual. Por favor, selecciona otro tanque.
            </p>
          </div>
        )}

        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 gap-4",
            isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"
          )}
        >
          {/* Selector de Usuario (solo admin) */}
          {isAdmin && (
            <div className="space-y-1">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Usuario
              </label>
              <select
                id="userId"
                name="userId"
                value={filters.userId || ''}
                onChange={handleInputChange}
                disabled={loading || usersList.length === 0}
                className={cn(inputBaseClasses, inputFocusClasses)}
              >
                {usersList.length === 0 ? (
                  <option value="">No hay usuarios</option>
                ) : (
                  usersList.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user._count?.tanks || 0} tanques)
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Selector de Tanque */}
          <div className="space-y-1">
            <label htmlFor="tankId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tanque {filteredTanksList.length > 0 && `(${filteredTanksList.length})`}
            </label>
            <select
              id="tankId"
              name="tankId"
              value={filters.tankId || ''}
              onChange={handleInputChange}
              disabled={loading || filteredTanksList.length === 0 || !filters.userId}
              className={cn(inputBaseClasses, inputFocusClasses)}
            >
              {!filters.userId ? (
                <option value="">Selecciona un usuario primero</option>
              ) : filteredTanksList.length === 0 ? (
                <option value="">No hay tanques disponibles</option>
              ) : (
                <>
                  <option value="">Selecciona un tanque</option>
                  {filteredTanksList.map(tank => (
                    <option key={tank.id} value={tank.id}>
                      {tank.name} - {tank.location}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Selector de Tipo de Sensor */}
          <div className="space-y-1">
            <label htmlFor="sensorType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de Sensor
            </label>
            <select
              id="sensorType"
              name="sensorType"
              value={filters.sensorType || ''}
              onChange={handleInputChange}
              disabled={loading || !filters.tankId}
              className={cn(inputBaseClasses, inputFocusClasses)}
            >
              <option value="">Todos los Sensores</option>
              <option value="TEMPERATURE">Temperatura</option>
              <option value="PH">pH</option>
              <option value="OXYGEN">Oxígeno</option>
            </select>
          </div>

          {/* Fecha de Inicio */}
          <div className="space-y-1">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha Inicio
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate || ''}
              onChange={handleInputChange}
              disabled={loading}
              max={filters.endDate || today}
              className={cn(inputBaseClasses, inputFocusClasses)}
            />
          </div>

          {/* Fecha de Fin */}
          <div className="space-y-1">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha Fin
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate || today}
              onChange={handleInputChange}
              disabled={loading}
              min={filters.startDate || ''}
              max={today}
              className={cn(inputBaseClasses, inputFocusClasses)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};