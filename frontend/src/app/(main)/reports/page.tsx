/**
 * @file page.tsx
 * @route frontend/src/app/(main)/reports
 * @description Página de reportes completamente funcional con descarga corregida y diseño mejorado.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Download, FileText, Clock, Loader, AlertCircle, Cpu, CheckSquare, Info, Filter, 
    Thermometer, Droplet, Wind 
} from 'lucide-react'; 
import { Card } from '@/components/common/Card';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import * as tankService from '@/services/tankService';
import * as sensorService from '@/services/sensorService';
import * as reportService from '@/services/reportService';
import * as settingsService from '@/services/settingsService'; 
import { Report, ReportStatus, Tank, Sensor } from '@/types'; 
import { cn } from '@/utils/cn';
import { socketManager } from '@/services/socketService';

/**
 * @interface ReportFilters
 * @description Interfaz para los filtros del formulario de reportes.
 * @property {string | null} tankId - ID del tanque seleccionado.
 * @property {string[]} sensorIds - IDs de los sensores seleccionados.
 * @property {string} startDate - Fecha de inicio del reporte (formato YYYY-MM-DD).
 * @property {string} endDate - Fecha de fin del reporte (formato YYYY-MM-DD).
 */
interface ReportFilters {
  tankId: string | null;
  sensorIds: string[];
  startDate: string;
  endDate: string;
}

/**
 * @const statusTranslations
 * @description Traducciones de los estados de los reportes.
 */
const statusTranslations: Record<ReportStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  COMPLETED: 'Completado',
  FAILED: 'Fallido',
};

/**
 * @interface UserSettings
 * @description Tipo para la configuración de notificaciones del usuario.
 */
interface UserSettings {
  notifications: {
    reports: boolean;
    email: boolean;
    critical: boolean;
  };
}

/**
 * @const sensorTypeIcons
 * @description Mapa de íconos por tipo de sensor.
 */
const sensorTypeIcons: Record<string, React.ElementType> = {
  PH: Droplet, 
  TEMPERATURE: Thermometer, 
  OXYGEN: Wind,
  GENERIC: Cpu, 
};

/**
 * @function getSensorIcon
 * @description Obtiene el componente de ícono React basado en el tipo de sensor.
 * @param {string} type - Tipo de sensor (ej: 'DO', 'PH').
 * @returns {React.ElementType} Componente de ícono.
 */
const getSensorIcon = (type: string) => {
  return sensorTypeIcons[type.toUpperCase()] || sensorTypeIcons.GENERIC;
};

/**
 * @component SensorCard
 * @description Componente de tarjeta de sensor seleccionable con diseño de botón.
 * @param {object} props - Propiedades del componente.
 * @param {Sensor} props.sensor - Objeto sensor.
 * @param {boolean} props.isSelected - Indica si el sensor está seleccionado.
 * @param {() => void} props.onToggle - Función para alternar la selección.
 * @param {string} [props.className] - Clases Tailwind CSS adicionales.
 * @returns {JSX.Element}
 */
const SensorCard: React.FC<{ 
  sensor: Sensor; 
  isSelected: boolean; 
  onToggle: () => void;
  className?: string;
}> = ({ sensor, isSelected, onToggle, className }) => {
  const isAllCard = sensor.id === 'all';
  const displayIcon = isAllCard ? CheckSquare : getSensorIcon(sensor.type || 'GENERIC');

  return (
    <div
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      role="checkbox" 
      aria-checked={isSelected}
      tabIndex={0}
      className={cn(
        'p-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center space-x-3 relative shadow-sm ',
        isSelected
          ? 'bg-[#39A900]/30'
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
          
        isSelected 
          ? 'group-hover:bg-[#39A900]/30'
          : 'hover:border-sena-green/70 hover:shadow-md',
          
        'focus:outline-none focus:ring-2 focus:ring-sena-green/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        'max-h-[100px] overflow-hidden',
        className 
      )}
    >
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
        isSelected 
          ? 'bg-[#39A900]/30' 
          : 'bg-gray-100 dark:bg-gray-700 text-sena-green dark:text-sena-green/80' 
      )}>
        {React.createElement(displayIcon, { className: "w-4 h-4" })}
      </div>
      <div>
        <p className={cn(
          "font-semibold text-sm leading-tight truncate",
          isSelected ? 'textt-gray-900' : 'text-gray-900 dark:text-white'
        )}>
          {sensor.name}
        </p>
        {!isAllCard && (
          <p className={cn(
            "text-xs capitalize truncate leading-none",
            isSelected ? 'text-gray-500' : 'text-gray-500 dark:text-gray-400' 
          )}>
            {sensor.type}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * @component Reports
 * @description Componente principal de la página de reportes.
 * @returns {JSX.Element}
 */
export default function Reports() {
  const { user: currentUser } = useAuth();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  const [isAutoReportEnabled, setIsAutoReportEnabled] = useState(false);
  const [reportForm, setReportForm] = useState<ReportFilters>({
    tankId: null,
    sensorIds: ['all'],
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  /**
   * @function fetchInitialData
   * @description Carga inicial de datos (tanques, reportes y settings).
   */
  const fetchInitialData = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [tanksData, reportsData, settingsData] = await Promise.all([
        tankService.getTanks(currentUser.id),
        reportService.getReports(currentUser.id),
        settingsService.getSettings(currentUser.id) as Promise<UserSettings>, 
      ]);
      
      setTanks(tanksData);
      setReports(reportsData);
      
      setIsAutoReportEnabled(settingsData.notifications?.reports === true);
      
      if (tanksData.length > 0) {
        setReportForm(prev => ({ ...prev, tankId: tanksData[0].id }));
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos iniciales.',
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const hasReportsInProgress = useMemo(() => {
    return reports.some(report => report.status === 'PENDING' || report.status === 'PROCESSING');
  }, [reports]);

  useEffect(() => {
    if (!currentUser || !hasReportsInProgress) return;

    const intervalId = window.setInterval(async () => {
      try {
        const refreshedReports = await reportService.getReports(currentUser.id);
        setReports(refreshedReports);
      } catch (error) {
        console.error('Error actualizando reportes por polling:', error);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [currentUser, hasReportsInProgress]);

  /**
   * @function useEffect - WebSocket Setup
   * @description Configuración de WebSocket para actualizaciones en tiempo real de reportes.
   */
  useEffect(() => {
    if (!socketManager) {
      return;
    }

    const handleReportUpdate = (updatedReport: Report) => {
      setReports(prevReports => {
        const index = prevReports.findIndex(r => r.id === updatedReport.id);
        if (index !== -1) {
            return prevReports.map((r, i) => i === index ? updatedReport : r);
        }
        return [updatedReport, ...prevReports]; 
      });
    };

    const handleConnect = () => {
      if (socketManager.socket) {
        socketManager.socket.on('report_status_update', handleReportUpdate);
      }
    };
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      if (!socketManager.getSocket() || !socketManager.getSocket()?.connected) {
        socketManager.connect(token);
      }
    }

    if (socketManager.getSocket()?.connected) {
      handleConnect();
    } else {
      socketManager.getSocket()?.on('connect', handleConnect);
    }
    
    return () => {
      if (socketManager && socketManager.socket) {
        socketManager.socket.off('report_status_update', handleReportUpdate);
        socketManager.socket.off('connect', handleConnect);
      }
    };
  }, []);

  /**
   * @const orderedSensors
   * @description Sensores cargados para el tanque actual, ordenados por nombre.
   */
  const orderedSensors = useMemo(() => {
    return [...sensors].sort((a, b) => a.name.localeCompare(b.name));
  }, [sensors]);

  /**
   * @function useEffect - Load Sensors
   * @description Carga sensores cuando cambia el tanque seleccionado.
   */
  useEffect(() => {
    if (reportForm.tankId && currentUser) {
      sensorService.getSensors(currentUser.id)
        .then(allSensors => {
          const tankSensors = allSensors.filter(s => s.tankId === reportForm.tankId);
          setSensors(tankSensors);
          setReportForm(prev => ({ ...prev, sensorIds: ['all'] }));
        })
        .catch(error => {
        });
    } else {
      setSensors([]);
    }
  }, [reportForm.tankId, currentUser]);

  /**
   * @function handleToggleSensor
   * @description Maneja la selección/deselección de sensores.
   * @param {string} sensorId - ID del sensor a alternar.
   */
  const handleToggleSensor = useCallback((sensorId: string) => {
    setReportForm(prev => {
      if (sensorId === 'all') {
        return { ...prev, sensorIds: ['all'] };
      }

      let newSelection = prev.sensorIds.filter(id => id !== 'all');
      const isSelected = newSelection.includes(sensorId);

      newSelection = isSelected
        ? newSelection.filter(id => id !== sensorId)
        : [...newSelection, sensorId];

      if (sensors.length > 0 && newSelection.length === sensors.length) {
        return { ...prev, sensorIds: ['all'] };
      }
      
      if (newSelection.length === 0) {
        return { ...prev, sensorIds: ['all'] };
      }

      return { ...prev, sensorIds: newSelection };
    });
  }, [sensors]);

  /**
   * @function handleGenerateReport
   * @description Genera un nuevo reporte manual.
   * @param {React.FormEvent} e - Evento de envío del formulario.
   */
  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      if (!reportForm.tankId) {
        throw new Error('Debe seleccionar un tanque.');
      }
      if (reportForm.sensorIds.length === 0) {
        throw new Error('Debe seleccionar al menos un parámetro (sensor).');
      }
      if (!currentUser) {
        throw new Error('Usuario no autenticado.');
      }

      const tank = tanks.find(t => t.id === reportForm.tankId);
      const title = `Reporte ${tank?.name} - ${format(new Date(), 'dd-MM-yy')}`;

      const reportData = {
        reportName: title,
        tankId: reportForm.tankId,
        sensorIds: reportForm.sensorIds.includes('all') 
          ? sensors.map(s => s.id) 
          : reportForm.sensorIds,
        startDate: reportForm.startDate,
        endDate: reportForm.endDate,
      };

      const newReport = await reportService.createReport(reportData);
      
      setReports(prevReports => [newReport, ...prevReports]);
      
      await Swal.fire({
        icon: 'success',
        title: 'Reporte Solicitado',
        text: `El reporte "${title}" se está generando. Recibirás una notificación cuando esté listo.`,
        timer: 3000,
        showConfirmButton: false,
      });
      
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Ocurrió un error al generar el reporte.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * @function handleDownload
   * @description Descarga un reporte en el formato especificado.
   * @param {string} reportId - ID del reporte a descargar.
   * @param {'pdf' | 'xlsx'} format - Formato de descarga ('pdf' o 'xlsx').
   */
  const handleDownload = async (reportId: string, format: 'pdf' | 'xlsx') => {
    const downloadKey = `${reportId}-${format}`;
    setIsDownloading(prev => ({ ...prev, [downloadKey]: true }));
    
    try {
      await reportService.downloadReport(reportId, format);
      
      await Swal.fire({
        icon: 'success',
        title: 'Descarga Exitosa',
        text: `El archivo ${format.toUpperCase()} se ha descargado correctamente.`,
        timer: 2000,
        showConfirmButton: false,
      });
      
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Descarga',
        text: 'No se pudo descargar el archivo. Por favor, intenta nuevamente.',
      });
    } finally {
      setIsDownloading(prev => ({ ...prev, [downloadKey]: false }));
    }
  };

  /**
   * @function getStatusChip
   * @description Retorna un chip de estado con estilos según el estado del reporte.
   * @param {ReportStatus} status - Estado del reporte.
   * @returns {JSX.Element}
   */
  const getStatusChip = (status: ReportStatus) => {
    const styles: Record<ReportStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 animate-pulse',
      PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 animate-pulse',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    
    return (
      <span className={cn('px-3 py-1.5 rounded-full text-xs font-medium', styles[status])}>
        {statusTranslations[status]}
      </span>
    );
  };

  /**
   * @const tankMap
   * @description Mapa de nombres de tanques para referencia rápida.
   */
  const tankMap = useMemo(() => {
    return tanks.reduce((acc, tank) => {
      acc[tank.id] = tank.name;
      return acc;
    }, {} as Record<string, string>);
  }, [tanks]);

  const isAllSelected = reportForm.sensorIds.includes('all');

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Reportes
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Crea nuevos reportes y descarga el historial de datos de tus tanques.
        </p>
      </div>

      {/* Información de reportes automáticos */}
      {!isAutoReportEnabled && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3 p-3 rounded-full "> 
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Reportes Automáticos
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                El sistema genera reportes automáticamente cada 200 datos registrados y al final de cada día. 
                Puedes habilitar o deshabilitar esta función en la sección de{' '}
                <a href="/settings" className="underline font-medium hover:text-blue-600">
                  Configuración → Notificaciones
                </a>.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Formulario de generación de reportes */}
      <Card 
        title="Generar Nuevo Reporte Manual" 
        className="rounded-xl border-l-4 border-sena-orange p-5 md:p-8" 
      >
        <form onSubmit={handleGenerateReport}>
          <fieldset disabled={isGenerating} className="group space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6"> 
              
              {/* Selección de Tanque */}
              <div className="order-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Tanque
                </label>
                <select 
                  value={reportForm.tankId || ''} 
                  onChange={e => setReportForm(prev => ({ 
                    ...prev, 
                    tankId: e.target.value, 
                    sensorIds: ['all'] 
                  }))} 
                  className={cn(
                    "form-select w-xl px-4 py-2 border border-gray-300 dark:border-gray-600", 
                    "rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sena-orange",
                    "focus:border-sena-orange dark:bg-gray-700 dark:text-white text-sm", 
                    "group-disabled:opacity-50 group-disabled:cursor-not-allowed"
                  )}
                  required
                >
                  <option value="" disabled>Seleccione un Tanque</option>
                  {tanks.map(tank => (
                    <option key={tank.id} value={tank.id}>{tank.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Rango de Fechas */}
              <div className="order-3 md:order-2 md:col-span-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Rango de Fechas
                </label>
                <div className="flex space-x-3">
                  <input 
                    type="date" 
                    value={reportForm.startDate} 
                    onChange={e => setReportForm(prev => ({ 
                      ...prev, 
                      startDate: e.target.value 
                    }))} 
                    className={cn(
                      "form-input w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600",
                      "rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sena-orange",
                      "focus:border-sena-orange dark:bg-gray-700 dark:text-white text-sm",
                      "group-disabled:opacity-50"
                    )}
                    required 
                    max={reportForm.endDate || format(new Date(), 'yyyy-MM-dd')} 
                  />
                  <input 
                    type="date" 
                    value={reportForm.endDate} 
                    onChange={e => setReportForm(prev => ({ 
                      ...prev, 
                      endDate: e.target.value 
                    }))} 
                    className={cn(
                      "form-input w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600",
                      "rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sena-orange",
                      "focus:border-sena-orange dark:bg-gray-700 dark:text-white text-sm",
                      "group-disabled:opacity-50"
                    )}
                    required 
                    min={reportForm.startDate} 
                    max={format(new Date(), 'yyyy-MM-dd')} 
                  />
                </div>
              </div>

              {/* Selección de Sensores (Parámetros a Reportar) */}
              <div className="md:col-span-5 order-2 md:order-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-sena-green"/>
                  Parámetros a Reportar
                </label>
                {sensors.length > 0 ? (
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl mt-1 ">
                    <div className="transition-colors grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2"> 
                      <SensorCard 
                        sensor={{ id: 'all', name: 'Todos los Parámetros' } as Sensor} 
                        isSelected={isAllSelected} 
                        onToggle={() => handleToggleSensor('all')} 
                      />
                      {orderedSensors.map(sensor => (
                        <SensorCard 
                          key={sensor.id} 
                          sensor={sensor} 
                          isSelected={!isAllSelected && reportForm.sensorIds.includes(sensor.id)} 
                          onToggle={() => handleToggleSensor(sensor.id)} 
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2 p-3 text-center bg-gray-50 dark:bg-gray-700/50 rounded-full">
                    Seleccione un tanque para ver sus parámetros de monitoreo.
                  </p>
                )}
              </div>
            </div>
            
            {/* Botón de envío */}
            <div className="flex justify-end items-center pt-6 mt-6 border-t dark:border-gray-700 gap-4">
              {isGenerating && (
                <p className="text-sm text-sena-green animate-pulse flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin"/>
                  Generando reporte, por favor espere...
                </p>
              )}
              <button 
                type="submit" 
                disabled={isGenerating || !reportForm.tankId || reportForm.sensorIds.length === 0} 
                className="btn-primary min-w-[200px] rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span>Generar Reporte</span>
              </button>
            </div>
          </fieldset>
        </form>
      </Card>

      {/* Historial de Reportes */}
      <Card title="Historial de Reportes Generados" className="shadow-xl rounded-xl">
        {reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No hay reportes</h3>
            <p className="mt-1 text-sm">
              Usa el formulario de arriba para crear tu primer reporte.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Reporte
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Parámetros
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Estado
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((report) => {
                  const params = typeof report.parameters === 'string' 
                    ? JSON.parse(report.parameters as any)
                    : report.parameters;
                  const tankName = params.tankId ? tankMap[params.tankId] || 'Tanque Desconocido' : 'N/A';
                  const reportSensorCount = Array.isArray(params.sensorIds) ? params.sensorIds.length : 0;
                  
                  // 💡 CORRECCIÓN: Usar parseISO para manejar correctamente los formatos de fecha ISO o YYYY-MM-DD.
                  const parsedStartDate = parseISO(params.startDate);
                  const parsedEndDate = parseISO(params.endDate);

                  // Identificar reportes por lote para aplicar el formato con hora.
                  const isBatchReport = params.isAutomatic && params.automaticType === 'batch';
                  const displayFormat = isBatchReport ? 'dd/MM/yy HH:mm' : 'dd-MM-yy';

                  return (
                    <tr 
                      key={report.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150"
                    >
                      <td className="px-4 py-4 max-w-[200px] overflow-hidden">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {report.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Creado: {format(parseISO(report.createdAt), 'dd/MM/yy HH:mm', { locale: es })}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-xs space-y-1 text-gray-700 dark:text-gray-300">
                        <p><strong>Tanque:</strong> {tankName}</p>
                        <p>
                          <strong>Fechas:</strong>{' '}
                          {/* USO DE parseISO Y FORMATO CONDICIONAL */}
                          {format(parsedStartDate, displayFormat, { locale: es })}{' '}
                          al{' '}
                          {format(parsedEndDate, displayFormat, { locale: es })}
                        </p>
                        <p>
                          <strong>Parámetros:</strong>{' '}
                          {reportSensorCount === 1 
                            ? '1 Seleccionado' 
                            : `${reportSensorCount} Seleccionados`}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusChip(report.status)}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {report.status === 'COMPLETED' ? (
                          <div className="flex justify-end space-x-3 flex-shrink-0">
                            <button 
                              onClick={() => handleDownload(report.id, 'pdf')} 
                              disabled={isDownloading[`${report.id}-pdf`]} 
                              className="btn-secondary px-4 py-2 text-xs flex items-center rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDownloading[`${report.id}-pdf`] ? (
                                <Loader className="w-3.5 h-3.5 animate-spin"/>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5 mr-1.5"/>
                                  PDF
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => handleDownload(report.id, 'xlsx')} 
                              disabled={isDownloading[`${report.id}-xlsx`]} 
                              className="btn-primary bg-sena-green px-4 py-2 text-xs flex items-center rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDownloading[`${report.id}-xlsx`] ? (
                                <Loader className="w-3.5 h-3.5 animate-spin"/>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5 mr-1.5"/>
                                  Excel
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic flex items-center justify-end flex-shrink-0">
                            {report.status === 'FAILED' ? (
                              <AlertCircle className="w-4 h-4 mr-2 text-red-500"/>
                            ) : (
                              <Clock className="w-4 h-4 mr-2"/>
                            )}
                            <span>{statusTranslations[report.status]}...</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
