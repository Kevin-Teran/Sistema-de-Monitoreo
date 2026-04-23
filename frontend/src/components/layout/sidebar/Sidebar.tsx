/**
 * @file Sidebar.tsx
 * @route frontend/src/components/layout/sidebar
 * @description Componente principal de la barra lateral. Fix definitivo para la retracción total en móvil.
 * @author Kevin Mariano
 * @version 1.0.8
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useCallback } from 'react';
import { clsx } from 'clsx';
import { LogOut, Settings, Sun, Moon } from 'lucide-react';
import { SidebarProps } from './types'; 
import { SidebarHeader } from './SidebarHeader'; 
import { SidebarNav } from './SidebarNav'; 
import { UserProfile } from './UserProfile'; 
import { ActionButton } from './ActionButton'; 
import { useTheme } from '@/context/ThemeContext';

export const Sidebar: React.FC<Omit<SidebarProps, 'theme' | 'onToggleTheme'>> = ({
  user,
  onLogout,
  collapsed,
  onToggleCollapse,
  currentModuleId,
  onModuleChange,
}) => {
  const { theme, toggleTheme } = useTheme();

  const handleSettingsClick = useCallback(() => {
    onModuleChange({ id: 'settings', href: '/settings' });
  }, [onModuleChange]);
  
  const themeText = theme === 'light' ? 'Tema Oscuro' : 'Tema Claro';

  // Ancho fijo para el estado colapsado (w-20 = 80px)
  const sidebarWidth = collapsed ? 'w-20' : 'w-64';
  const sidebarTransform = collapsed ? 'transform -translate-x-full' : 'translate-x-0';


  return (
    <aside
      className={clsx(
        // Mobile: Fija (fixed), alto completo, z-40. Usamos el translate y el ancho de forma explícita.
        'flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800',
        'fixed inset-y-0 left-0 z-40', 
        
        // Aplicamos la lógica de ancho y transformación siempre.
        sidebarWidth, 
        sidebarTransform,

        // Comportamiento en Desktop (md:): Relativa, anula 'fixed' y 'transform'.
        // Mantenemos la lógica de ancho en desktop.
        'md:relative md:transform-none md:flex', 
        collapsed ? 'md:w-20' : 'md:w-64' 
      )}
      aria-label="Barra lateral de navegación principal"
    >
        <SidebarHeader collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
        <SidebarNav
            // @ts-ignore
            userRole={user?.role}
            currentModuleId={currentModuleId}
            collapsed={collapsed}
            onModuleChange={onModuleChange}
        />
        <div className="mt-auto flex-shrink-0 border-t border-gray-200 p-2 dark:border-gray-700">
            <UserProfile user={user} collapsed={collapsed} />
            <ActionButton
                onClick={handleSettingsClick}
                title="Configuración"
                aria-label="Abrir configuración"
                isActive={currentModuleId === 'settings'}
                isCollapsed={collapsed}
            >
                <Settings className={clsx('h-5 w-5', !collapsed && 'mr-3')} />
                {!collapsed && <span className="text-sm">Configuración</span>}
            </ActionButton>
            <ActionButton
                onClick={toggleTheme}
                title={`Cambiar a ${themeText}`}
                aria-label={`Cambiar a ${themeText}`}
                isCollapsed={collapsed}
            >
                {theme === 'light'
                  ? <Moon className={clsx('h-5 w-5', !collapsed && 'mr-3')} />
                  : <Sun className={clsx('h-5 w-5', !collapsed && 'mr-3')} />
                }
                {!collapsed && <span className="text-sm">{themeText}</span>}
            </ActionButton>
            <ActionButton
                onClick={onLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                isCollapsed={collapsed}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
                <LogOut className={clsx('h-5 w-5', !collapsed && 'mr-3')} />
                {!collapsed && <span className="text-sm">Cerrar Sesión</span>}
            </ActionButton>
        </div>
    </aside>
  );
};

Sidebar.displayName = 'Sidebar';