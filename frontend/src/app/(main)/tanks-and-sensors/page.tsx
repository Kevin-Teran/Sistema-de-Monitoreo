/**
 * @file page.tsx
 * @route /frontend/src/app/(main)/tanks-and-sensors
 * @description Página optimizada para la gestión de Tanques y Sensores con 3 tipos de sensores.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useInfrastructure } from '@/hooks/useInfrastructure';
import { Tank, Sensor, SensorType } from '@/types';
import * as tankService from '@/services/tankService';
import { deleteSensor } from '@/services/sensorService';
import { TankModal } from '@/components/devices/TankModal';
import { SensorModal } from '@/components/devices/SensorModal';
import { SensorDetailModal } from '@/components/devices/SensorDetailModal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  MapPin, Cpu, AlertCircle, Plus, Edit, Trash2, ChevronDown, User as UserIcon,
  Thermometer, Droplets, Wind, Settings, FileText,
  Search, CheckCircle2, AlertTriangle as WarningIcon, SlidersHorizontal,
  LayoutGrid, Users
} from 'lucide-react';
import Swal from 'sweetalert2';
import { clsx } from 'clsx';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const MAX_SENSORS_PER_TYPE_PER_TANK = 1;

const getStatusChip = (status: Tank['status'] | Sensor['status']) => {
    const styles: Record<string, string> = {
        ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        MAINTENANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        CALIBRATING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    };
    const text: Record<string, string> = {
        ACTIVE: 'Activo',
        MAINTENANCE: 'Mantenimiento',
        INACTIVE: 'Inactivo',
        ERROR: 'Error',
        CALIBRATING: 'Calibrando'
    };
    return <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', styles[status])}>{text[status] || 'Desconocido'}</span>;
};

const getSensorInfo = (type: SensorType) => ({
    TEMPERATURE: { Icon: Thermometer, unit: '°C', name: 'Temperatura', color: 'text-orange-500' },
    PH: { Icon: Droplets, unit: '', name: 'pH', color: 'text-green-500' },
    OXYGEN: { Icon: Wind, unit: 'mg/L', name: 'Oxígeno', color: 'text-blue-500' },
}[type] || { Icon: Settings, unit: '', name: 'Desconocido', color: 'text-gray-500' });

export default function DevicesPage() {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'ADMIN';

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { tanks = [], sensors = [], users = [], loading, error, fetchDataForUser, refetchData } = useInfrastructure(isAdmin);

    const [modal, setModal] = useState<{ view: string | null; data?: any; }>({ view: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'>('all');
    const [expandedTanks, setExpandedTanks] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (currentUser && !selectedUserId) {
            setSelectedUserId(currentUser.id);
        }
    }, [currentUser, selectedUserId]);

    useEffect(() => {
        if (selectedUserId) {
            fetchDataForUser(selectedUserId);
        }
    }, [selectedUserId, fetchDataForUser]);

    useEffect(() => {
        if (!loading && tanks.length > 0) {
            setExpandedTanks(new Set(tanks.map(t => t.id)));
        }
    }, [loading, tanks]);

    const stats = useMemo(() => ({
        totalTanks: tanks.length,
        totalSensors: sensors.length,
        activeTanks: tanks.filter(t => t.status === 'ACTIVE').length,
        maintenanceTanks: tanks.filter(t => t.status === 'MAINTENANCE').length,
    }), [tanks, sensors]);

    const filteredTanks = useMemo(() => {
        return tanks.filter(tank => {
            const term = searchTerm.toLowerCase().trim();
            const nameMatch = tank.name.toLowerCase().includes(term);
            const locationMatch = tank.location?.toLowerCase().includes(term) || false;
            const statusMatch = statusFilter === 'all' || tank.status === statusFilter;
            return (nameMatch || locationMatch) && statusMatch;
        });
    }, [tanks, searchTerm, statusFilter]);

    const sensorsByTank = useMemo(() => {
        const map = new Map<string, Sensor[]>();
        tanks.forEach(tank => map.set(tank.id, []));
        sensors.forEach(sensor => {
            if (map.has(sensor.tankId)) {
                map.get(sensor.tankId)!.push(sensor);
            }
        });
        return map;
    }, [sensors, tanks]);

    const sensorCountsByTankAndType = useMemo(() => {
        const countMap = new Map<string, Record<SensorType, number>>();
        
        tanks.forEach(tank => {
            countMap.set(tank.id, {
                TEMPERATURE: 0,
                PH: 0,
                OXYGEN: 0,
            } as Record<SensorType, number>);
        });

        sensors.forEach(sensor => {
            const tankCounts = countMap.get(sensor.tankId);
            if (tankCounts && ['TEMPERATURE', 'PH', 'OXYGEN'].includes(sensor.type)) {
                tankCounts[sensor.type]++;
            }
        });

        return countMap;
    }, [sensors, tanks]);

    const getAvailableSensorTypes = useCallback((tankId: string): SensorType[] => {
        const counts = sensorCountsByTankAndType.get(tankId);
        if (!counts) return [];
        // @ts-ignore
        const allowedTypes: SensorType[] = ['TEMPERATURE', 'PH', 'OXYGEN'];
        return allowedTypes.filter(
            type => counts[type] < MAX_SENSORS_PER_TYPE_PER_TANK
        );
    }, [sensorCountsByTankAndType]);

    const handleOpenModal = useCallback((view: string, data: any = {}) => setModal({ view, data }), []);
    const handleCloseModal = useCallback(() => setModal({ view: null }), []);

    const handleActionCompletion = useCallback(() => {
        handleCloseModal();
        if (selectedUserId) {
            refetchData(selectedUserId);
        }
    }, [selectedUserId, refetchData, handleCloseModal]);

    const handleUserChange = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleDelete = useCallback(async (type: 'tanque' | 'sensor', item: Tank | Sensor) => {
        const result = await Swal.fire({
            title: `¿Eliminar ${type} "${item.name}"?`,
            text: "Esta acción es irreversible.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'rounded-2xl' }
        });

        if (result.isConfirmed) {
            const action = type === 'tanque' ? tankService.deleteTank : deleteSensor;
            try {
                await action(item.id);
                await Swal.fire({ 
                    title: '¡Eliminado!', 
                    text: `${type.charAt(0).toUpperCase() + type.slice(1)} eliminado correctamente.`,
                    icon: 'success', 
                    timer: 1500, 
                    showConfirmButton: false 
                });
                handleActionCompletion();
            } catch (err: any) {
                await Swal.fire('Error', err.response?.data?.message || `No se pudo eliminar el ${type}.`, 'error');
            }
        }
    }, [handleActionCompletion]);

    return (
        <div className="w-full">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Tanques y Sensores</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Administra tu infraestructura de monitoreo acuapónico
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal('create-tank', { userId: selectedUserId })}
                    className="rounded-xl flex items-center px-6 py-3 bg-[#39A900] text-white rounded-xl hover:bg-[#2F8B00] transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105"
                    disabled={!selectedUserId}
                >
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>Nuevo Tanque</span>
                </button>
            </header>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={LayoutGrid} title="Total Tanques" value={stats.totalTanks} color="text-blue-500" />
                <StatCard icon={Cpu} title="Total Sensores" value={stats.totalSensors} color="text-indigo-500" />
                <StatCard icon={CheckCircle2} title="Tanques Activos" value={stats.activeTanks} color="text-green-500" />
                <StatCard icon={WarningIcon} title="En Mantenimiento" value={stats.maintenanceTanks} color="text-yellow-500" />
            </div>

            {/* Filters */}
            <div className="rounded-xl bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
                <div className={clsx(
                    "grid gap-4",
                    isAdmin ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
                )}>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o ubicación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900] transition-colors"
                        />
                    </div>
                    
                    {/* User Filter - Only for ADMIN */}
                    {isAdmin && users.length > 0 && (
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <select
                                value={selectedUserId || ''}
                                onChange={(e) => handleUserChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900] transition-colors appearance-none cursor-pointer"
                            >
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Status Filter */}
                    <div className="relative">
                        <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full pl-10 pr-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900] transition-colors appearance-none cursor-pointer"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="ACTIVE">Activos</option>
                            <option value="MAINTENANCE">Mantenimiento</option>
                            <option value="INACTIVE">Inactivos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="text-center text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-6 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-6 h-6 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="lg" message="Cargando datos..." />
                </div>
            )}

            {/* Content */}
            <div className="space-y-4">
                {!loading && !selectedUserId && isAdmin && (
                    <EmptyState 
                        icon={Users} 
                        title="Selecciona un usuario" 
                        message="Elige un usuario de la lista para ver y gestionar sus tanques y sensores." 
                    />
                )}
                
                {!loading && selectedUserId && filteredTanks.length === 0 && (
                    <EmptyState 
                        icon={MapPin} 
                        title="No se encontraron tanques" 
                        message="Prueba a cambiar los filtros o crea un nuevo tanque para comenzar." 
                    />
                )}

                {!loading && filteredTanks.map(tank => {
                    const tankSensors = sensorsByTank.get(tank.id) || [];
                    const availableSensorTypes = getAvailableSensorTypes(tank.id);
                    const isExpanded = expandedTanks.has(tank.id);
                    const sensorCounts = sensorCountsByTankAndType.get(tank.id);
                    
                    return (
                        <div key={tank.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 dark:border-gray-700">
                            <header
                                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => setExpandedTanks(prev => {
                                    const next = new Set(prev);
                                    next.has(tank.id) ? next.delete(tank.id) : next.add(tank.id);
                                    return next;
                                })}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-[#39A900]/10 rounded-xl">
                                        <MapPin className="w-8 h-8 text-[#39A900]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-xl text-gray-900 dark:text-white">
                                            {tank.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            <MapPin className="w-4 h-4 inline mr-1" />
                                            {tank.location}
                                        </p>
                                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                            <span>
                                                {tankSensors.length} de 3 sensores instalados
                                            </span>
                                            {sensorCounts && (
                                                <div className="flex space-x-2">
                                                    {Object.entries(sensorCounts).map(([type, count]) => {
                                                        const { name, color } = getSensorInfo(type as SensorType);
                                                        return count > 0 ? (
                                                            <span key={type} className={clsx("px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700", color)}>
                                                                {name}
                                                            </span>
                                                        ) : null;
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    {getStatusChip(tank.status)}
                                    <div className="flex items-center space-x-1">
                                        <ActionButton 
                                            icon={Edit} 
                                            title="Editar Tanque" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleOpenModal('edit-tank', tank); 
                                            }} 
                                        />
                                        <ActionButton 
                                            icon={Trash2} 
                                            title="Eliminar Tanque" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleDelete('tanque', tank); 
                                            }} 
                                        />
                                    </div>
                                    <ChevronDown 
                                        className={clsx(
                                            "w-5 h-5 transition-transform text-gray-400",
                                            isExpanded ? "rotate-180" : ""
                                        )} 
                                    />
                                </div>
                            </header>
                            
                            {isExpanded && (
                                <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <div className="pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {tankSensors.map(sensor => (
                                                <SensorCard 
                                                    key={sensor.id} 
                                                    sensor={sensor} 
                                                    onOpenModal={handleOpenModal} 
                                                    onDelete={handleDelete} 
                                                />
                                            ))}
                                            
                                            {/* Add Sensor Cards */}
                                            {availableSensorTypes.map(sensorType => (
                                                <AddSensorCard
                                                    key={sensorType}
                                                    sensorType={sensorType}
                                                    tankId={tank.id}
                                                    onClick={() => handleOpenModal('create-sensor', { 
                                                        tankId: tank.id, 
                                                        preselectedType: sensorType 
                                                    })}
                                                />
                                            ))}
                                            
                                            {availableSensorTypes.length === 0 && tankSensors.length === 0 && (
                                                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                                                    <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                    <p>No hay sensores instalados en este tanque</p>
                                                    <p className="text-sm mt-1">Todos los sensores han sido instalados</p>
                                                </div>
                                            )}
                                            
                                            {availableSensorTypes.length === 0 && tankSensors.length > 0 && (
                                                <div className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">
                                                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#39A900]" />
                                                    <p className="text-sm">Tanque completamente equipado</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modals - AQUÍ ESTÁ LA CORRECCIÓN */}
            {(modal.view === 'create-tank' || modal.view === 'edit-tank') && (
                <TankModal 
                    isOpen={true} 
                    isEditing={modal.view === 'edit-tank'} 
                    tankData={modal.data} 
                    allTanks={tanks}
                    onClose={handleCloseModal} 
                    onSave={handleActionCompletion} 
                />
            )}
            
            {(modal.view === 'create-sensor' || modal.view === 'edit-sensor') && (
                <SensorModal 
                    isOpen={true} 
                    isEditing={modal.view === 'edit-sensor'} 
                    sensorData={modal.data} 
                    tanks={tanks} 
                    sensorsByTank={sensorsByTank}
                    sensorCountsByTankAndType={sensorCountsByTankAndType}
                    onClose={handleCloseModal} 
                    onSave={handleActionCompletion} 
                />
            )}
            
            {modal.view === 'view-sensor' && modal.data && (
                <SensorDetailModal
                    isOpen={true}
                    sensor={modal.data}
                    lastReading={modal.data.lastReading || null} 
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}

/**
 * @component StatCard
 * @description Componente para mostrar estadísticas en forma de tarjeta.
 */
const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    color 
}: { 
    icon: React.ElementType; 
    title: string; 
    value: number | string; 
    color: string; 
}) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className={clsx("p-3 rounded-xl", color.replace('text-', 'bg-') + '/10')}>
            {/* @ts-ignore */}
            <Icon className={clsx("h-8 w-8", color)} />
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

/**
 * @component ActionButton
 * @description Botón de acción reutilizable con icono.
 */
const ActionButton = ({ 
    icon: Icon, 
    title, 
    onClick,
    variant = 'default'
}: { 
    icon: React.ElementType; 
    title: string; 
    onClick: (e: React.MouseEvent) => void;
    variant?: 'default' | 'danger';
}) => {
    const baseClasses = "p-2 rounded-full transition-colors";
    const variantClasses = {
        default: "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300",
        danger: "text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400"
    };
    
    return (
        <button 
            onClick={onClick} 
            className={clsx(baseClasses, variantClasses[variant])} 
            title={title}
        >
            {/* @ts-ignore */}
            <Icon className="w-4 h-4" />
        </button>
    );
};

/**
 * @component EmptyState
 * @description Componente para mostrar estados vacíos.
 */
const EmptyState = ({ 
    icon: Icon, 
    title, 
    message 
}: { 
    icon: React.ElementType; 
    title: string; 
    message: string; 
}) => (
    <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
        {/* @ts-ignore */}
        <Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm max-w-md mx-auto">{message}</p>
    </div>
);

/**
 * @component AddSensorCard
 * @description Tarjeta para añadir un nuevo sensor de un tipo específico.
 */
const AddSensorCard = ({
    sensorType,
    tankId,
    onClick
}: {
    sensorType: SensorType;
    tankId: string;
    onClick: () => void;
}) => {
    const { Icon, name, color } = getSensorInfo(sensorType);
    
    return (
        <button 
            onClick={onClick} 
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#39A900] hover:bg-[#39A900]/5 text-[#39A900] transition-all duration-200 h-full min-h-[180px] group"
        >
            <div className="p-3 rounded-xl bg-[#39A900]/10 group-hover:bg-[#39A900]/20 transition-colors mb-3">
                <Icon className="w-8 h-8" />
            </div>
            <Plus className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Añadir {name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sensor de {name.toLowerCase()}
            </span>
        </button>
    );
};

/**
 * @component SensorCard
 * @description Tarjeta para mostrar información de un sensor.
 */
const SensorCard = ({ 
    sensor, 
    onOpenModal, 
    onDelete 
}: { 
    sensor: Sensor; 
    onOpenModal: (view: string, data: any) => void; 
    onDelete: (type: 'sensor', item: Sensor) => void; 
}) => {
    const { Icon, unit, name: typeName, color } = getSensorInfo(sensor.type);
    
    return (
        <div className="flex flex-col justify-between p-6 bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 h-full group">
            <div>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className={clsx("p-2 rounded-xl", color.replace('text-', 'bg-') + '/10')}>
                            <Icon className={clsx("w-5 h-5", color)} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                {sensor.name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {typeName} • {sensor.hardwareId}
                            </p>
                        </div>
                    </div>
                    {getStatusChip(sensor.status)}
                </div>
                
                <div className="flex items-baseline justify-center text-center my-6 text-gray-900 dark:text-white">
                    <span className="text-4xl font-bold">
                        {/* @ts-ignore */}
                        {sensor.lastReading !== null && sensor.lastReading !== undefined 
                            // @ts-ignore
                            ? sensor.lastReading.toFixed(sensor.type === 'PH' ? 2 : 1) 
                            : '--'
                        }
                    </span>
                    <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">{unit}</span>
                </div>
                
                <div className="text-xs text-center text-gray-500 dark:text-gray-400 h-4">
                    {/* @ts-ignore */}
                    {sensor.lastUpdate 
                        // @ts-ignore
                        ? `Actualizado: ${format(parseISO(sensor.lastUpdate), 'dd/MM HH:mm', { locale: es })}` 
                        : 'Sin datos recientes'
                    }
                </div>
            </div>
            
            <div className="flex justify-center space-x-2 mt-6 pt-4 border-t dark:border-gray-700">
                <ActionButton 
                    icon={FileText} 
                    title="Ver Detalles" 
                    onClick={() => onOpenModal('view-sensor', sensor)} 
                />
                <ActionButton 
                    icon={Edit} 
                    title="Editar Sensor" 
                    onClick={() => onOpenModal('edit-sensor', { sensor })} 
                />
                <ActionButton 
                    icon={Trash2} 
                    title="Eliminar Sensor" 
                    onClick={() => onDelete('sensor', sensor)}
                    variant="danger"
                />
            </div>
        </div>
    );
};