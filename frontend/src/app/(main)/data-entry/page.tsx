/**
 * @file page.tsx
 * @route /frontend/src/app/(main)/data-entry
 * @description Página optimizada para la Recolección de Datos, con un diseño
 * profesional adaptado y panel de simulaciones activas en tiempo real.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useState, useMemo, memo } from 'react';
import { useDataEntry } from '@/hooks/useDataEntry';
import { 
  Play, Square, Loader2, Thermometer, Beaker, Wind, Activity, Users,
  Database, Signal, CheckCircle2, XCircle, AlertTriangle, Search, SlidersHorizontal,
  LayoutGrid, MessageSquare, Network
} from 'lucide-react';
import { Sensor, SensorType, Role } from '@/types';
import clsx from 'clsx';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Skeleton } from '@/components/common/Skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { withAuth } from '@/hoc/withAuth';
import { useAuth } from '@/context/AuthContext';

const DataEntryPage: React.FC = () => {
  const {
    users, selectedUserId, tanks, selectedTankId, sensors, loading,
    manualReadings, isSubmittingManual, activeSimulations, mqttStatus,
    isTogglingSimulation, handleUserChange, handleTankChange,
    handleManualReadingChange, handleManualSubmit, toggleSimulation,
    startMultipleSimulations, stopMultipleSimulations, getUnitForSensorType,
  } = useDataEntry();

  const [activeTab, setActiveTab] = useState<'simulation' | 'manual'>('simulation');
  const [selectedSensors, setSelectedSensors] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const stats = useMemo(() => ({
      activeSimulations: activeSimulations.length,
      messagesSent: activeSimulations.reduce((acc, sim) => acc + (sim.messagesCount || 0), 0),
      tanksWithSimulations: new Set(activeSimulations.map(sim => sim.tankId)).size,
      sensorsInTank: sensors.length,
  }), [activeSimulations, sensors.length]);

  const filteredSensors = useMemo(() => sensors.filter(sensor => 
      sensor.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [sensors, searchTerm]);

  if (loading.users) {
    return <PageSkeleton />;
  }

  return (
    <div className="w-full">
      <PageHeader mqttStatus={mqttStatus} />

      <StatCardsGrid stats={stats} />
      
      <Filters 
        // @ts-ignore
        isAdmin={isAdmin}
        users={users}
        selectedUserId={selectedUserId}
        handleUserChange={handleUserChange}
        tanks={tanks}
        selectedTankId={selectedTankId}
        handleTankChange={handleTankChange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <DataInputTabs 
        // @ts-ignore
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sensors={filteredSensors} 
        selectedTankId={selectedTankId} 
        isTogglingSimulation={isTogglingSimulation} 
        activeSimulations={activeSimulations} 
        toggleSimulation={toggleSimulation} 
        selectedSensors={selectedSensors} 
        setSelectedSensors={setSelectedSensors} 
        startMultipleSimulations={startMultipleSimulations} 
        stopMultipleSimulations={stopMultipleSimulations} 
        getUnitForSensorType={getUnitForSensorType} 
        manualReadings={manualReadings} 
        handleManualReadingChange={handleManualReadingChange} 
        handleManualSubmit={handleManualSubmit} 
        isSubmittingManual={isSubmittingManual} 
        isLoadingSensors={loading.sensors} 
      />

      <ActiveSimulationsPanel 
        // @ts-ignore
        activeSimulations={activeSimulations}
        getSensorIcon={getSensorIcon}
        getUnitForSensorType={getUnitForSensorType}
        isAdmin={isAdmin}
      />
    </div>
  );
};

const PageHeader = memo(({ mqttStatus }: { mqttStatus: string }) => {
  const MqttStatusInfo = {
    connected: { icon: CheckCircle2, color: 'text-green-500', text: 'Conectado' },
    connecting: { icon: Loader2, color: 'text-yellow-500 animate-spin', text: 'Conectando' },
    disconnected: { icon: XCircle, color: 'text-red-500', text: 'Desconectado' },
  };
  const status = MqttStatusInfo[mqttStatus as keyof typeof MqttStatusInfo] || { icon: AlertTriangle, color: 'text-gray-500', text: 'Desconocido' };

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recolección de Datos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestiona y simula el flujo de datos de tus sensores.
        </p>
      </div>
    </header>
  );
});
PageHeader.displayName = 'PageHeader';

const StatCardsGrid = memo(({ stats }: { stats: any }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* @ts-ignore */}
        <StatCard icon={Activity} title="Simulaciones Activas" value={stats.activeSimulations} color="text-primary" />
        {/* @ts-ignore */}
        <StatCard icon={MessageSquare} title="Mensajes Simulados" value={stats.messagesSent} color="text-sky-500" />
        {/* @ts-ignore */}
        <StatCard icon={LayoutGrid} title="Tanques con Sim." value={stats.tanksWithSimulations} color="text-amber-500" />
        {/* @ts-ignore */}
        <StatCard icon={Signal} title="Sensores en Tanque" value={stats.sensorsInTank} color="text-red-500" />
    </div>
));
StatCardsGrid.displayName = 'StatCardsGrid';
// @ts-ignore
const StatCard = memo(({ icon: Icon, title, value, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className={clsx("p-3 rounded-xl", color.replace('text-', 'bg-') + '/10')}>
            <Icon className={clsx("h-8 w-8", color)} />
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
));
StatCard.displayName = 'StatCard';
// @ts-ignore
const Filters = memo(({ isAdmin, users, selectedUserId, handleUserChange, tanks, selectedTankId, handleTankChange, searchTerm, setSearchTerm }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-8">
        <div className={clsx("grid gap-4", isAdmin ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>
            {isAdmin && users.length > 0 && (
                <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <select value={selectedUserId || ''} onChange={(e) => handleUserChange(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900] transition-colors appearance-none cursor-pointer">
                        {/* @ts-ignore */}
                        {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                </div>
            )}
            <div className="relative">
                <LayoutGrid className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select value={selectedTankId || ''} onChange={(e) => handleTankChange(e.target.value)} disabled={!selectedUserId || tanks.length === 0} className="w-full pl-10 pr-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900] transition-colors appearance-none cursor-pointer">
                    <option value="">{tanks.length > 0 ? '' : 'Sin tanques disponibles'}</option>
                    {/* @ts-ignore */}
                    {tanks.map(tank => <option key={tank.id} value={tank.id}>{tank.name}</option>)}
                </select>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="text" placeholder="Buscar sensor por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900] transition-colors" />
            </div>
        </div>
    </div>
));
Filters.displayName = 'Filters';
// @ts-ignore
const DataInputTabs = memo(({ activeTab, setActiveTab, sensors, selectedTankId, isLoadingSensors, ...props }) => (
    <Card className="rounded-xl mb-8">
        <div className="border-b border-border grid grid-cols-2">
            <TabButton icon={Signal} label="Simulación" isActive={activeTab === 'simulation'} onClick={() => setActiveTab('simulation')} />
            <TabButton icon={Database} label="Entrada Manual" isActive={activeTab === 'manual'} onClick={() => setActiveTab('manual')} />
        </div>
        <CardContent className="p-4 sm:p-6 min-h-[300px]">
            {isLoadingSensors ? <div className="flex justify-center items-center h-full pt-10"><LoadingSpinner /></div>
            : !selectedTankId ? <Placeholder text="Selecciona un tanque para empezar." />
            : sensors.length === 0 ? <Placeholder text="Este tanque no tiene sensores." />
            // @ts-ignore
            : activeTab === 'simulation' ? <SimulationTabContent sensors={sensors} {...props} />
            // @ts-ignore
            : <ManualEntryTabContent sensors={sensors} {...props} />}
        </CardContent>
    </Card>
));
DataInputTabs.displayName = 'DataInputTabs';
// @ts-ignore
const ActiveSimulationsPanel = memo(({ activeSimulations, getSensorIcon, getUnitForSensorType, isAdmin }) => {
    const simulationsByUser = useMemo(() => {
        // @ts-ignore
        return activeSimulations.reduce((acc, sim) => {
            (acc[sim.userId] = acc[sim.userId] || { userName: sim.userName, simulations: [] }).simulations.push(sim);
            return acc;
        }, {} as Record<string, { userName: string; simulations: typeof activeSimulations }>);
    }, [activeSimulations]);

    return (
        <Card className="rounded-xl">
            <CardHeader>
                <CardTitle className="flex items-center text-xl gap-2"><Activity className="h-5 w-5 text-primary" />Simulaciones Activas</CardTitle>
                <CardDescription>Vista en tiempo real de los sensores simulados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[80vh] overflow-y-auto">
                {activeSimulations.length === 0 ? (
                    <Placeholder text="No hay simulaciones activas en este momento." />
                ) : (
                    Object.values(simulationsByUser).map((data) => (
                    // @ts-ignore
                    <div key={data.userName}>
                        {/* @ts-ignore */}
                        {isAdmin && <h4 className="font-semibold text-sm text-foreground mb-2 px-1">{data.userName}</h4>}
                        <div className="space-y-2">
                        {/* @ts-ignore */}
                        {data.simulations.map(sim => (
                            <div key={sim.sensorId} className="flex items-center justify-between text-xs bg-gray-100 dark:bg-gray-800/50 p-3 rounded-xl">
                              <div className="flex items-center gap-3 text-foreground font-medium">{getSensorIcon(sim.type)}<span>{sim.sensorName} ({sim.tankName})</span></div>
                              <div className="text-right">
                                  <div className="font-mono text-lg font-bold text-primary dark:text-primary-400">{sim.currentValue.toFixed(2)}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{getUnitForSensorType(sim.type)}</div>
                              </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
});
ActiveSimulationsPanel.displayName = 'ActiveSimulationsPanel';
// @ts-ignore
const SimulationTabContent = ({ sensors, activeSimulations, isTogglingSimulation, toggleSimulation, selectedSensors, setSelectedSensors, startMultipleSimulations, stopMultipleSimulations }) => {
  // @ts-ignore
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedSensors(e.target.checked ? new Set(sensors.map(s => s.id)) : new Set());
  return (
    <div className="space-y-4">
      <BatchActions selectedCount={selectedSensors.size} onStart={() => startMultipleSimulations(Array.from(selectedSensors))} onStop={() => stopMultipleSimulations(Array.from(selectedSensors))} onClear={() => setSelectedSensors(new Set())} />
      <div className="border border-border rounded-xl">
        <div className="flex items-center p-3 border-b border-border">
            <input type="checkbox" onChange={handleSelectAll} checked={selectedSensors.size > 0 && selectedSensors.size === sensors.length} className="w-4 h-4 rounded text-primary-600 bg-gray-200 dark:bg-gray-700 border-border focus:ring-primary" />
            <label className="text-sm font-medium text-foreground ml-3">Seleccionar todos</label>
        </div>
        <div className="divide-y divide-border">
          {/* @ts-ignore */}
          {sensors.map(sensor => { const sim = activeSimulations.find(s => s.sensorId === sensor.id); return <SensorRow key={sensor.id} sensor={sensor} simulation={sim} isToggling={isTogglingSimulation.has(sensor.id)} isSelected={selectedSensors.has(sensor.id)} onToggle={() => toggleSimulation(sensor.id)} onSelect={() => setSelectedSensors(prev => { const newSet = new Set(prev); newSet.has(sensor.id) ? newSet.delete(sensor.id) : newSet.add(sensor.id); return newSet; })} />; })}
        </div>
      </div>
    </div>
  );
};
// @ts-ignore
const SensorRow = ({ sensor, simulation, isToggling, isSelected, onToggle, onSelect }) => {
    const isActive = !!simulation;
    return (
      <div className={clsx("p-3 grid grid-cols-3 sm:grid-cols-4 items-center gap-4 transition-colors", isSelected && 'bg-primary-50 dark:bg-primary-900/40')}>
        <div className="col-span-2 sm:col-span-2 flex items-center gap-3">
          <input type="checkbox" checked={isSelected} onChange={onSelect} className="w-4 h-4 rounded text-primary-600 bg-gray-200 dark:bg-gray-700 border-border focus:ring-primary" />
          {getSensorIcon(sensor.type)}
          <div>
            <span className="font-medium text-card-foreground">{sensor.name}</span>
            <div className="text-xs text-gray-500 dark:text-gray-400">{sensor.type}</div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 text-sm">
          {isActive && <span className="font-mono text-primary dark:text-primary-400 animate-pulse-dot">{simulation.currentValue.toFixed(2)}</span>}
        </div>
        <div className="flex items-center justify-end gap-3">
          <span className={clsx("px-2 py-0.5 text-xs font-semibold rounded-xl", isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200")}>
            {isActive ? 'Activa' : 'Inactiva'}
          </span>
          <button onClick={onToggle} disabled={isToggling} className={clsx("p-2 text-sm font-medium text-white rounded-xl shadow-sm flex items-center justify-center w-9 h-9 transition-colors", isActive ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary-600", "disabled:bg-gray-400 dark:disabled:bg-gray-600")}>
            {isToggling ? <Loader2 className="h-5 w-5 animate-spin" /> : isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
};
// @ts-ignore
const ManualEntryTabContent = ({ sensors, manualReadings, handleManualReadingChange, handleManualSubmit, isSubmittingManual, getUnitForSensorType }) => (
  <form onSubmit={(e) => { e.preventDefault(); handleManualSubmit(); }} className="space-y-4">
    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
      {/* @ts-ignore */}
      {sensors.map(sensor => (
        <div key={sensor.id} className="grid grid-cols-3 items-center gap-3 p-3 border border-border rounded-xl hover:border-primary/50 transition-colors">
          <div className="col-span-2 flex items-center gap-3">
            {getSensorIcon(sensor.type)}
            <div>
              <label htmlFor={`sensor-${sensor.id}`} className="font-medium text-card-foreground">{sensor.name}</label>
              <div className="text-xs text-gray-500 dark:text-gray-400">{sensor.type}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id={`sensor-${sensor.id}`} type="number" step="0.01" placeholder="Valor" value={manualReadings[sensor.id] || ''} onChange={(e) => handleManualReadingChange(sensor.id, e.target.value)} className="w-full p-2 border border-border rounded-xl bg-background shadow-sm focus:ring-primary focus:border-primary" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{getUnitForSensorType(sensor.type)}</span>
          </div>
        </div>
      ))}
    </div>
    <button type="submit" disabled={isSubmittingManual} className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-700 disabled:bg-gray-400 dark:disabled:bg-gray-600">
      {isSubmittingManual ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar Lecturas"}
    </button>
  </form>
);
// @ts-ignore
const BatchActions = ({ selectedCount, onStart, onStop, onClear }) => (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
        <span className="text-sm font-medium text-foreground mr-4">{selectedCount} seleccionados</span>
        <button onClick={onStart} disabled={selectedCount === 0} className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-xl shadow-sm hover:bg-primary-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 inline-flex items-center">
            <Play className="h-4 w-4 mr-1" /> Iniciar
        </button>
        <button onClick={onStop} disabled={selectedCount === 0} className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-xl shadow-sm hover:bg-red-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 inline-flex items-center">
            <Square className="h-4 w-4 mr-1" /> Detener
        </button>
        <button onClick={onClear} disabled={selectedCount === 0} className="px-3 py-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-xl shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 ml-auto">
            Limpiar
        </button>
    </div>
);

const Placeholder: React.FC<{ text: string }> = ({ text }) => <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500 dark:text-gray-400"><Database className="h-10 w-10 mb-2" /><p>{text}</p></div>;
// @ts-ignore
const TabButton = ({ icon: Icon, label, isActive, onClick }) => <button onClick={onClick} className={clsx("w-full inline-flex items-center justify-center p-4 font-semibold gap-2 border-b-2 transition-colors", isActive ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-foreground hover:border-border')}>{<Icon className="h-5 w-5" />} {label}</button>;
const getSensorIcon = (type: SensorType | string) => ({
    TEMPERATURE: <Thermometer className="h-5 w-5 text-red-500" />,
    PH: <Beaker className="h-5 w-5 text-green-500" />,
    OXYGEN: <Wind className="h-5 w-5 text-blue-500" />,
})[type] || <Activity className="h-5 w-5 text-gray-500" />;

const PageSkeleton = () => ( <div className="space-y-6"><div className="space-y-2"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-6 w-1/2" /></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-1 space-y-6"><Skeleton className="h-48 w-full rounded-xl" /></div><div className="lg:col-span-2 space-y-6"><Skeleton className="h-96 w-full rounded-xl" /></div></div></div>);

export default withAuth(DataEntryPage, [Role.ADMIN]);