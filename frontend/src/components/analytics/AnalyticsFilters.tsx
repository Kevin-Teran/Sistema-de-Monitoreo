/**
 * @file AnalyticsFilters.tsx
 * @route frontend/src/components/analytics/
 * @description Componente para los filtros de la página de analíticas, con estilo y ORDEN unificado al DashboardFilters, y lógica de RANGO CONSOLIDADA.
 * @author kevin mariano
 * @version 1.0.10
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import React, { useMemo } from 'react';
import { SensorType, Role } from '@/types';
import { cn } from '@/utils/cn'; 
// Íconos para los selectores
import { Clock, User, Container, Activity } from 'lucide-react'; 
import { sensorTypeTranslations } from '@/utils/translations'; 

interface RangeAvailability {
    hour: boolean;
    day: boolean;
    week: boolean;
    month: boolean;
    year: boolean;
    custom: boolean;
}

interface AnalyticsFiltersProps {
  filters: any;
  onFiltersChange: (newFilters: any) => void;
  onRangeChange: (range: string) => void; 
  tanksList: any[];
  usersList: any[];
  currentUserRole?: Role;
  loading: boolean;
  allSensorsList: any[];
  selectedRange: string;
  availableRanges: RangeAvailability;
  rangesMap: { label: string, value: string }[];
}

// Componente auxiliar para Select con Icono (redefinido para claridad)
const SelectWithIcon: React.FC<any> = ({ name, id, value, onChange, disabled, children, Icon }) => {
    const inputBaseClasses = "w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 disabled:opacity-50";
    const inputFocusClasses = "focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    
    return (
        <div className="relative">
            <select
                name={name}
                id={id}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={cn(inputBaseClasses, inputFocusClasses, "appearance-none pr-10")} 
            >
                {children}
            </select>
            <Icon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
    );
};

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  onFiltersChange,
  onRangeChange, 
  tanksList,
  usersList,
  currentUserRole,
  loading,
  allSensorsList,
  selectedRange,
  availableRanges,
  rangesMap,
}: AnalyticsFiltersProps) => {
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    
    if (name === 'range') {
        onRangeChange(value);
    } else {
        let finalValue: string | undefined = value;
        
        // LÓGICA DE CORRECCIÓN: Si es sensorType y el valor es 'ALL', lo convertimos a undefined
        // para que el hook de analíticas active la vista comparativa global.
        if (name === 'sensorType' && value === 'ALL') {
            finalValue = undefined; 
        }
        
        onFiltersChange({ [name]: finalValue });
    }
  };
  
  const isAdmin = currentUserRole === Role.ADMIN;
  const today = new Date().toISOString().split('T')[0];
  
  const inputBaseClasses = "w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 disabled:opacity-50";
  const inputFocusClasses = "focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  // Lógica de filtrado inteligente de sensores
  const availableSensorTypes = useMemo(() => {
    if (filters.tankId && filters.tankId !== 'ALL') {
      const sensorsInTank = allSensorsList.filter((s: any) => s.tankId === filters.tankId);
      return Array.from(new Set(sensorsInTank.map((s: any) => s.type))) as SensorType[];
    }
    return Object.values(SensorType);
  }, [filters.tankId, allSensorsList]);


  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div 
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 gap-4",
            isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3" 
          )}
        >
          {/* 1. Filtro de Usuario (solo para Admins) */}
          {currentUserRole === Role.ADMIN && (
            <div className="space-y-1">
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Usuario
              </label>
              <SelectWithIcon
                name="userId"
                id="userId"
                value={filters.userId || 'ALL'} 
                onChange={handleInputChange}
                disabled={loading}
                Icon={User} 
              >
                <option value="ALL">Todos los Usuarios</option>
                {(usersList || []).map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </SelectWithIcon>
            </div>
          )}

          {/* 2. Filtro de Tanque */}
          <div className="space-y-1">
            <label
              htmlFor="tankId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tanque
            </label>
            <SelectWithIcon
              name="tankId"
              id="tankId"
              value={filters.tankId || 'ALL'} 
              onChange={handleInputChange}
              disabled={loading}
              Icon={Container} 
            >
              <option value="ALL">Todos los Tanques</option>
              {(tanksList || []).map((tank: any) => (
                <option key={tank.id} value={tank.id}>
                  {tank.name}
                </option>
              ))}
            </SelectWithIcon>
          </div>

          {/* 3. Filtro de Tipo de Sensor / Parámetro */}
          <div className="space-y-1">
            <label
              htmlFor="sensorType"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Parámetro
            </label>
            <SelectWithIcon
              name="sensorType"
              id="sensorType"
              // CORRECCIÓN: Si filters.sensorType es undefined, la UI usa 'ALL' para seleccionar 'Todos los Parámetros'
              value={filters.sensorType || 'ALL'} 
              onChange={handleInputChange}
              disabled={loading}
              Icon={Activity} 
            >
              {/* Opción global, su valor es 'ALL' */}
              <option value="ALL">Todos los Parámetros</option> 
              {/* Opciones individuales */}
              {availableSensorTypes.map((type) => (
                  <option 
                      key={type} 
                      value={type}
                  >
                    {sensorTypeTranslations[type] || type}
                  </option>
              ))}
            </SelectWithIcon>
          </div>
          
          {/* 4. Selector de Rango de Tiempo */}
          <div className="space-y-1">
            <label
              htmlFor="range"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Rango de Tiempo
            </label>
            <SelectWithIcon
                name="range"
                id="range"
                value={selectedRange}
                onChange={handleInputChange}
                disabled={loading}
                Icon={Clock} 
            >
                {rangesMap.map(range => (
                    <option 
                        key={range.value} 
                        value={range.value}
                        disabled={range.value !== 'custom' && !availableRanges[range.value as keyof RangeAvailability]}
                    >
                        {range.label}
                    </option>
                ))}
            </SelectWithIcon>
          </div>
          
        </div>
        
        {/* Campo de fecha manual, si el rango es 'custom' */}
        {selectedRange === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-1">
                    <label
                        htmlFor="startDate"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Fecha Inicio
                    </label>
                    <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        value={filters.startDate || ''}
                        onChange={handleInputChange}
                        className={cn(inputBaseClasses, inputFocusClasses)}
                        max={filters.endDate || today} 
                        disabled={loading}
                    />
                </div>
                <div className="space-y-1">
                    <label
                        htmlFor="endDate"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Fecha Fin
                    </label>
                    <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        value={filters.endDate || today}
                        onChange={handleInputChange}
                        className={cn(inputBaseClasses, inputFocusClasses)}
                        min={filters.startDate || ''}
                        max={today} 
                        disabled={loading}
                    />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};