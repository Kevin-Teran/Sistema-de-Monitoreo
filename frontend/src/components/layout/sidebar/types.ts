/**
 * @file types.tsx
 * @route frontend/src/components/layout/sidebar
 * @description 
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
*/

import { User } from '@/types';

/**
 * @typedef {Object} Module
 * @description Define la estructura de un módulo de navegación.
 */
export interface Module {
  id: string;
  name: string;
  icon: React.ElementType;
  href: string;
  adminOnly?: boolean;
}

/**
 * @interface SidebarProps
 * @description Propiedades para el componente principal de la barra lateral.
 */
export interface SidebarProps {
  user: User | null;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentModuleId: string;
  onModuleChange: (module: Pick<Module, 'id' | 'href'>) => void;
}