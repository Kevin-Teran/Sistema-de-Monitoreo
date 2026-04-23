/**
 * @file LoadingSpinner.tsx
 * @route frontend/src/components/common
 * @description Componente de carga altamente reutilizable y personalizable con una animación visual del logo del SENA.
 * Optimizado para ofrecer una experiencia de usuario fluida con animaciones de entrada.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullScreen = false,
  className = '',
}) => {
  // Se comentan las rutas del logo para mayor independencia del sistema
  /* const config = getConfig() || {};
  const basePath = config.publicRuntimeConfig?.basePath || ''; 
  const finalBasePath = basePath || '/acuaponia'; 
  const imageSrc = `${finalBasePath}/logo-sena.png`;
  */

  const sizeClasses = {
    sm: { container: 'w-12 h-12', circle: 'border-2', text: 'text-sm' },
    md: { container: 'w-16 h-16', circle: 'border-4', text: 'text-base' },
    lg: { container: 'w-20 h-20', circle: 'border-4', text: 'text-lg' },
  };

  const accentColor = '#22c55e'; // Un verde esmeralda más universal (Green-500)

  const spinnerContent = (
    <div className={clsx('flex flex-col items-center justify-center p-8', className)}>
      <div className={clsx('relative mb-6', sizeClasses[size].container)}>
        
        {/* Spinner Universal Circular */}
        <div className={clsx(
          "absolute inset-0 rounded-full border-gray-200 dark:border-gray-700", 
          sizeClasses[size].circle
        )}></div>
        
        <div 
          className={clsx(
            "absolute inset-0 rounded-full animate-spin border-t-transparent", 
            sizeClasses[size].circle
          )}
          style={{ borderColor: `${accentColor} transparent transparent transparent` }}
        ></div>

        {/* Logo original comentado para independencia
        <img src={imageSrc} className="filter grayscale opacity-25 w-full h-full object-contain" />
        */}
      </div>

      {message && (
        <p className={clsx(
            'text-gray-700 dark:text-gray-200 font-medium text-center max-w-xs mb-4',
            sizeClasses[size].text
          )}
        >
          {message}
        </p>
      )}

      {/* Indicador de actividad (puntos) */}
      <div className="flex space-x-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ 
              backgroundColor: accentColor, 
              animationDelay: `${i * 0.15}s` 
            }}
          />
        ))}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="animate-in fade-in zoom-in-95 duration-300 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return <div className="animate-in fade-in duration-300">{spinnerContent}</div>;
};