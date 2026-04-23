/**
 * @file SidebarHeader.tsx
 * @route frontend/src/components/layout/sidebar
 * @description Componente del encabezado de la barra lateral, corrigiendo la carga del logo con basePath.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
*/

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import getConfig from 'next/config'; 

const getInitialBasePath = (): string => {
    try {
        const config = getConfig() || {};
        const path = config.publicRuntimeConfig?.basePath || '';
        return (path === '' || path === '/') ? '/acuaponia' : path;
    } catch (e) {
        return '/acuaponia';
    }
};

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = React.memo(({ collapsed, onToggleCollapse }) => {
  
  const [basePath] = useState(getInitialBasePath);
  const logoPath = `${basePath}/logo-sena.png`; 
  
  return (
    <div className="flex items-center p-4 h-16 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      {!collapsed && (
        <div className={clsx("flex items-center space-x-3")}>
          <div className="relative w-9 h-9 flex-shrink-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">Sistema de <span className="text-green-600 dark:text-green-500">Monitoreo</span></h1>
          </div>
        </div>
      )}
      <button
        onClick={onToggleCollapse}
        className={clsx(
          "p-1 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
          "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
          collapsed ? "mx-auto" : "ml-auto"
        )}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        title={collapsed ? 'Expandir' : 'Colapsar'}
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>
    </div>
  );
});

SidebarHeader.displayName = 'SidebarHeader';