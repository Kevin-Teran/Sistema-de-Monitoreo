/**
 * @file AlertsPanel.tsx
 * @route frontend/src/components/common
 * @description Panel de alertas CORREGIDO con renderizado robusto y filtrado por usuario
 * @author Kevin Mariano
 * @version 2.0.0 (VERSIÓN FINAL CORREGIDA)
 * @since 1.0.0
 */

import React from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { Alert, AlertSeverity } from '@/types'; 
import { cn } from '@/utils/cn';
import { X, Check, Bell, AlertCircle, AlertTriangle, Info as InfoIcon } from 'lucide-react'; 

const BellIcon = Bell;
const XIcon = X;
const CheckIcon = Check;

interface AlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isOtherPanelOpen: boolean;
}

/**
 * 🔥 CORRECCIÓN: Función mejorada para determinar estilos según severidad
 */
const getSeverityClasses = (severity: AlertSeverity) => {
  switch (severity) {
    case AlertSeverity.CRITICAL: 
    case AlertSeverity.ERROR: 
      return { 
        bg: 'bg-red-50 dark:bg-red-900/20', 
        border: 'border-red-500', 
        text: 'text-red-800 dark:text-red-300',
        icon: <AlertCircle className="w-5 h-5" />,
        badge: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
      };
    case AlertSeverity.WARNING: 
      return { 
        bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
        border: 'border-yellow-500', 
        text: 'text-yellow-800 dark:text-yellow-300',
        icon: <AlertTriangle className="w-5 h-5" />,
        badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
      };
    case AlertSeverity.INFO: 
    default:
      return { 
        bg: 'bg-blue-50 dark:bg-blue-900/20', 
        border: 'border-blue-500', 
        text: 'text-blue-800 dark:text-blue-300',
        icon: <InfoIcon className="w-5 h-5" />,
        badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
      };
  }
};

/**
 * 🔥 CORRECCIÓN: Componente de alerta individual con renderizado robusto
 */
const AlertItem: React.FC<{ alert: Alert; onResolve: (id: string) => void }> = ({ alert, onResolve }) => {
  const { bg, border, text, icon, badge } = getSeverityClasses(alert.severity);
  
  // Mapeo de tipo de alerta a texto legible
  const alertTypeDisplay = alert.type
    ?.replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase()) || 'Alerta';
  
  // Formatear fecha de forma segura
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleString('es-CO', { 
        timeZone: 'America/Bogota',
        dateStyle: 'short',
        timeStyle: 'short'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div className={cn(
      'p-4 border-l-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md',
      bg, border, 
      'flex justify-between items-start gap-3'
    )}>
      <div className="flex gap-3 flex-1">
        {/* Icono de severidad */}
        <div className={cn('flex-shrink-0 mt-1', text)}>
          {icon}
        </div>
        
        {/* Contenido de la alerta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className={cn('font-bold text-sm', text)}>
              {alertTypeDisplay}
            </p>
            <span className={cn(
              'px-2 py-0.5 text-xs font-semibold rounded-full',
              badge
            )}>
              {alert.severity}
            </span>
          </div>
          
          <p className={cn('text-sm mb-2 break-words', text)}>
            {alert.message}
          </p>
          
          {/* Información adicional (metadata) */}
          {alert.metadata && (
            <div className="text-xs space-y-1 mt-2 p-2 bg-white/50 dark:bg-black/20 rounded">
              {alert.metadata.tankName && (
                <p><strong>Tanque:</strong> {alert.metadata.tankName}</p>
              )}
              {alert.metadata.sensorName && (
                <p><strong>Sensor:</strong> {alert.metadata.sensorName}</p>
              )}
              {alert.metadata.value !== undefined && (
                <p><strong>Valor:</strong> {alert.metadata.value}</p>
              )}
              {alert.metadata.threshold !== undefined && (
                <p><strong>Umbral:</strong> {alert.metadata.threshold}</p>
              )}
            </div>
          )}
          
          <p className={cn('text-xs mt-2 opacity-75', text)}>
            {formatDate(alert.createdAt)}
          </p>
        </div>
      </div>
      
      {/* Botón de resolución */}
      <button
        onClick={() => onResolve(alert.id)}
        className={cn(
          'flex-shrink-0 p-2 rounded-full transition-all',
          'bg-white/70 hover:bg-white dark:bg-gray-700/70 dark:hover:bg-gray-700',
          'shadow-sm hover:shadow-md',
          text,
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
        )}
        title="Marcar como resuelta"
        aria-label="Marcar como resuelta"
      >
        <CheckIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

/**
 * 🔥 COMPONENTE PRINCIPAL: Panel de Alertas
 */
export const AlertsPanel: React.FC<AlertPanelProps> = ({ isOpen, onClose, isOtherPanelOpen }) => {
  const { alerts, unresolvedCount, loading, error, markAsResolved } = useAlerts();

  console.log('🎨 [AlertsPanel] Renderizando:', { 
    isOpen, 
    alertsCount: alerts.length, 
    loading, 
    error 
  });

  return (
    <>
      {/* 1. Botón Flotante para Alertas */}
      <button
        onClick={onClose}
        aria-label="Mostrar Alertas del Sistema"
        className={cn(
          "fixed top-6 right-6 z-50 p-4 rounded-full shadow-xl transition-all duration-300",
          "bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800",
          "flex items-center justify-center transform hover:scale-105",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
          { 'hidden': isOtherPanelOpen && !isOpen } 
        )}
      >
        <BellIcon className="w-6 h-6" />
        {unresolvedCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1 py-0.5 text-xs font-bold leading-none text-gray-900 transform translate-x-1/2 -translate-y-1/2 bg-yellow-400 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse">
            {unresolvedCount > 99 ? '99+' : unresolvedCount}
          </span>
        )}
      </button>

      {/* 2. Overlay de fondo */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose} 
          aria-hidden="true"
        ></div>
      )}

      {/* 3. Panel Deslizable */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-80 sm:w-96 shadow-2xl z-50 transition-transform duration-300',
          'bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alerts-panel-title"
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <div>
              <h2 id="alerts-panel-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Alertas del Sistema
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {unresolvedCount} sin resolver
              </p>
            </div>
            <button 
              onClick={onClose} 
              aria-label="Cerrar Panel de Alertas"
              className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Contenido del Panel */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {/* Estado: Cargando */}
            {loading && (
              <div className="text-center py-10">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-3">Cargando alertas...</p>
              </div>
            )}
            
            {/* Estado: Error */}
            {error && !loading && (
              <div className="text-center py-10 px-4">
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
                <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error al cargar alertas</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
              </div>
            )}
            
            {/* Estado: Sin alertas */}
            {!loading && !error && alerts.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ¡Todo está en orden!
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay alertas sin resolver en este momento.
                </p>
              </div>
            )}
            
            {/* Lista de Alertas */}
            {!loading && !error && alerts.length > 0 && alerts.map(alert => (
              <AlertItem key={alert.id} alert={alert} onResolve={markAsResolved} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};