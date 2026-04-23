/**
 * @file SensorModal.tsx
 * @description Modal optimizado para crear/editar sensores con 3 tipos únicos por tanque.
 * @author Kevin Mariano
 * @version 6.0.2
 * @since 1.0.0
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createSensor, updateSensor } from '@/services/sensorService';
import { Tank, Sensor, SensorType } from '@/types';
import { 
  X, 
  Cpu, 
  MapPin,
  Thermometer, 
  Droplets, 
  Wind, 
  Settings,
  AlertCircle,
  Calendar,
  Hash,
  CheckCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';

const MAX_SENSORS_PER_TYPE_PER_TANK = 1;

interface SensorModalProps {
  isOpen: boolean;
  isEditing: boolean;
  sensorData?: {
    sensor?: Sensor;
    tankId?: string;
    preselectedType?: SensorType;
  };
  tanks: Tank[];
  sensorsByTank: Map<string, Sensor[]>;
  sensorCountsByTankAndType: Map<string, Record<SensorType, number>>;
  onClose: () => void;
  onSave: () => void;
}

const getSensorInfo = (type: SensorType) => ({
  TEMPERATURE: { 
    Icon: Thermometer, 
    name: 'Temperatura', 
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
    unit: '°C',
    description: 'Monitorea la temperatura del agua'
  },
  PH: { 
    Icon: Droplets, 
    name: 'pH', 
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    unit: '',
    description: 'Mide el nivel de acidez/alcalinidad'
  },
  OXYGEN: { 
    Icon: Wind, 
    name: 'Oxígeno Disuelto', 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    unit: 'mg/L',
    description: 'Controla la concentración de oxígeno'
  }
}[type] || { 
  Icon: Settings, 
  name: 'Desconocido', 
  color: 'text-gray-500',
  bgColor: 'bg-gray-500',
  unit: '',
  description: 'Tipo de sensor no reconocido'
});

const SENSOR_TYPES: SensorType[] = [
  SensorType.TEMPERATURE,
  SensorType.PH,
  SensorType.OXYGEN,
];

export const SensorModal: React.FC<SensorModalProps> = ({
  isOpen,
  isEditing,
  sensorData,
  tanks,
  sensorsByTank,
  sensorCountsByTankAndType,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [formData, setFormData] = useState({
    name: '',
    hardwareId: '',
    type: '' as SensorType | '',
    tankId: '',
    calibrationDate: sensorData?.sensor?.calibrationDate 
        ? format(new Date(sensorData.sensor.calibrationDate), 'yyyy-MM-dd')
        : '', // Initialize date to empty string if not present/editing
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (isEditing && sensorData?.sensor) {
        const sensor = sensorData.sensor;
        setFormData({
          name: sensor.name,
          hardwareId: sensor.hardwareId,
          type: sensor.type,
          tankId: sensor.tankId,
          calibrationDate: sensor.calibrationDate 
            ? format(new Date(sensor.calibrationDate), 'yyyy-MM-dd')
            : '', // Use empty string if no date
        });
      } else {
        const suggestedName = sensorData?.preselectedType 
          ? `Sensor ${getSensorInfo(sensorData.preselectedType).name}`
          : '';
        
        setFormData({
          name: suggestedName,
          hardwareId: '',
          type: sensorData?.preselectedType || '',
          tankId: sensorData?.tankId || '',
          calibrationDate: '', // Use empty string for new sensors
        });
      }
      setErrors({});
    }
  }, [isOpen, isEditing, sensorData]);

  const availableTanks = useMemo(() => {
    if (!formData.type || !user) return tanks;

    return tanks.filter(tank => {
      if (!isAdmin && tank.userId !== user.id) return false;

      const counts = sensorCountsByTankAndType.get(tank.id);
      if (!counts) return true;

      const currentCount = counts[formData.type as SensorType] || 0;
      
      // Si estamos editando, excluir el sensor actual del conteo
      if (isEditing && sensorData?.sensor?.tankId === tank.id && sensorData?.sensor?.type === formData.type) {
        return currentCount - 1 < MAX_SENSORS_PER_TYPE_PER_TANK;
      }
      
      return currentCount < MAX_SENSORS_PER_TYPE_PER_TANK;
    });
  }, [formData.type, tanks, sensorCountsByTankAndType, isEditing, sensorData, user, isAdmin]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!isEditing && !formData.hardwareId.trim()) {
      newErrors.hardwareId = 'El ID de hardware es obligatorio';
    }

    if (!isEditing && !formData.type) {
      newErrors.type = 'Debe seleccionar un tipo de sensor';
    }

    if (!formData.tankId || formData.tankId.trim() === '') {
      newErrors.tankId = 'Debe seleccionar un tanque válido';
    }

    // if (!formData.calibrationDate) { // <-- REMOVIDO: Fecha de calibración ya no es obligatoria en el DTO
    //   newErrors.calibrationDate = 'La fecha de calibración es obligatoria';
    // }

    if (formData.tankId && formData.tankId.trim() !== '' && !availableTanks.some(tank => tank.id === formData.tankId)) {
      newErrors.tankId = 'El tanque seleccionado no está disponible para este tipo de sensor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const selectedTank = useMemo(() => tanks.find(tank => tank.id === formData.tankId), [tanks, formData.tankId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'tankId' && value === '') {
      setFormData(prev => ({ ...prev, [name]: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isEditing && sensorData?.sensor) {
        const updatePayload: any = {
          name: formData.name,
        };
        
        // CORRECCIÓN 1: Enviar calibrationDate solo si tiene un valor
        if (formData.calibrationDate && formData.calibrationDate.trim()) {
            updatePayload.calibrationDate = new Date(formData.calibrationDate).toISOString();
        }

        const tankChanged = formData.tankId !== sensorData.sensor.tankId;
        const tankIsValid = formData.tankId && formData.tankId.trim() !== '' && formData.tankId !== 'undefined' && formData.tankId !== 'null';
        
        if (tankChanged && tankIsValid) {
          updatePayload.tankId = formData.tankId;
          //console.log('✅ Including tankId in payload:', formData.tankId);
        } else {
          console.log('❌ Not including tankId in payload');
          if (!tankChanged) console.log('  - Reason: tankId did not change');
          if (!tankIsValid) console.log('  - Reason: tankId is not valid');
        }

        console.log('📦 Final update payload:', updatePayload);

        await updateSensor(sensorData.sensor.id, updatePayload);
        await Swal.fire({
          title: '¡Sensor actualizado!',
          text: 'Los cambios se han guardado correctamente.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          color: '#39A900'
        });
      } else {
        const createPayload: any = {
          name: formData.name,
          hardwareId: formData.hardwareId,
          type: formData.type as SensorType,
          tankId: formData.tankId,
          // REMOVIDO: location: selectedTank?.location || '', <-- CAUSABA ERROR 400
        };
        
        // CORRECCIÓN 2: Enviar calibrationDate solo si tiene un valor
        if (formData.calibrationDate && formData.calibrationDate.trim()) {
            createPayload.calibrationDate = new Date(formData.calibrationDate).toISOString();
        }

        await createSensor(createPayload);
        await Swal.fire({
          title: '¡Sensor creado!',
          text: 'El sensor se ha configurado correctamente.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          color: '#39A900'
        });
      }

      onSave();
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error response:', error.response?.data);
      
      let errorMessage = error.response?.data?.message || 
        `Error al ${isEditing ? 'actualizar' : 'crear'} el sensor`;

      if (Array.isArray(errorMessage)) {
        errorMessage = errorMessage.map(msg => {
          if (msg.includes('tankId must be a UUID')) return 'El ID del tanque debe ser válido';
          if (msg.includes('hardwareId should not exist')) return 'El ID de hardware no se puede modificar';
          if (msg.includes('type should not exist')) return 'El tipo de sensor no se puede modificar';
          if (msg.includes('name should not be empty')) return 'El nombre no puede estar vacío';
          if (msg.includes('calibrationDate must be a valid date')) return 'La fecha de calibración debe ser válida';
          return msg;
        }).join(', ');
      } else if (typeof errorMessage === 'string') {
        if (errorMessage.includes('tankId must be a UUID')) errorMessage = 'El ID del tanque debe ser válido';
        if (errorMessage.includes('hardwareId should not exist')) errorMessage = 'El ID de hardware no se puede modificar';
        if (errorMessage.includes('type should not exist')) errorMessage = 'El tipo de sensor no se puede modificar';
        if (errorMessage.includes('name should not be empty')) errorMessage = 'El nombre no puede estar vacío';
        if (errorMessage.includes('calibrationDate must be a valid date')) errorMessage = 'La fecha de calibración debe ser válida';
      }
      
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

  const selectedSensorInfo = formData.type ? getSensorInfo(formData.type as SensorType) : null;
  // const selectedTank = tanks.find(tank => tank.id === formData.tankId); // Replaced with useMemo above

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#39A900]/10 rounded-lg">
                <Cpu className="w-8 h-8 text-[#39A900]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Editar Sensor' : 'Nuevo Sensor'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isEditing ? 'Modifica la configuración del sensor' : 'Configura un nuevo sensor de monitoreo'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Sensor Type Preview */}
          {selectedSensorInfo && (
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className={clsx("p-3 rounded-lg", selectedSensorInfo.color.replace('text-', 'bg-') + '/10')}>
                  <selectedSensorInfo.Icon className={clsx("w-6 h-6", selectedSensorInfo.color)} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {selectedSensorInfo.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedSensorInfo.description}
                  </p>
                </div>
                {selectedTank && (
                  <div className="ml-auto text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedTank.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedTank.location}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Sensor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Sensor *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                disabled={isEditing || !!sensorData?.preselectedType}
                className={clsx(
                  "w-full px-4 py-3 border rounded-lg focus:ring-[#39A900] focus:border-[#39A900] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors",
                  (isEditing || !!sensorData?.preselectedType) && "bg-gray-100 dark:bg-gray-600 cursor-not-allowed",
                  errors.type && "border-red-500"
                )}
              >
                <option value="">Seleccionar tipo...</option>
                {SENSOR_TYPES.map(type => (
                  <option key={type} value={type}>
                    {getSensorInfo(type).name}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.type}
                </p>
              )}
              {isEditing && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  El tipo de sensor no se puede modificar después de la creación
                </p>
              )}
            </div>

            {/* Nombre del Sensor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Sensor *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Sensor de Temperatura Principal"
                className={clsx(
                  "w-full px-4 py-3 border rounded-lg focus:ring-[#39A900] focus:border-[#39A900] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors",
                  errors.name && "border-red-500"
                )}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* ID de Hardware */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID de Hardware *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="hardwareId"
                  value={formData.hardwareId}
                  onChange={handleInputChange}
                  disabled={isEditing}
                  placeholder="Ej: temp-001-tank-a"
                  className={clsx(
                    "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-[#39A900] focus:border-[#39A900] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors",
                    isEditing && "bg-gray-100 dark:bg-gray-600 cursor-not-allowed",
                    errors.hardwareId && "border-red-500"
                  )}
                />
              </div>
              {errors.hardwareId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.hardwareId}
                </p>
              )}
              {isEditing && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  El ID de hardware no se puede modificar después de la creación
                </p>
              )}
            </div>

            {/* Tanque */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tanque de Destino *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  name="tankId"
                  value={formData.tankId}
                  onChange={handleInputChange}
                  className={clsx(
                    "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-[#39A900] focus:border-[#39A900] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors appearance-none",
                    errors.tankId && "border-red-500"
                  )}
                >
                  <option value="">Seleccionar tanque...</option>
                  {availableTanks.map(tank => (
                    <option key={tank.id} value={tank.id}>
                      {tank.name} - {tank.location}
                    </option>
                  ))}
                </select>
              </div>
              {errors.tankId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.tankId}
                </p>
              )}
              {availableTanks.length === 0 && formData.type && (
                <p className="mt-1 text-sm text-yellow-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  No hay tanques disponibles para este tipo de sensor
                </p>
              )}
            </div>

            {/* Fecha de Calibración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Calibración
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="date"
                  name="calibrationDate"
                  value={formData.calibrationDate}
                  onChange={handleInputChange}
                  className={clsx(
                    "w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-[#39A900] focus:border-[#39A900] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors",
                    errors.calibrationDate && "border-red-500"
                  )}
                />
              </div>
              {errors.calibrationDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.calibrationDate}
                </p>
              )}
               <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Campo opcional. Se recomienda llenarlo al calibrar el sensor.
                </p>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || (!isEditing && availableTanks.length === 0)}
                className="px-6 py-3 bg-[#39A900] text-white rounded-lg hover:bg-[#2F8B00] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {isEditing ? 'Actualizar Sensor' : 'Crear Sensor'}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Información Adicional */}
          {formData.type && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                Información del Sensor
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <p>• Tipo: {getSensorInfo(formData.type as SensorType).name}</p>
                <p>• Unidad de medida: {getSensorInfo(formData.type as SensorType).unit || 'Sin unidad'}</p>
                <p>• Máximo por tanque: 1 sensor por tipo</p>
                {selectedTank && (
                  <p>• Ubicación: {selectedTank.location}</p>
                )}
                {isEditing && (
                  <p className="text-amber-600 dark:text-amber-400">
                    • Nota: El tipo de sensor y ID de hardware no se pueden modificar
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};