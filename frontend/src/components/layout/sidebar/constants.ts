/**
 * @file constants.ts
 * @description Configuración centralizada de los módulos de navegación.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

 import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  FileText,
  Cpu,
  Database,
  BotMessageSquare,
  Users,
} from 'lucide-react';
import { Module } from './types'; 

/**
 * @const {Module[]} modules
 * @description Configuración centralizada de los módulos de navegación, utilizada por el layout.
 * La propiedad `adminOnly` controla la visibilidad para roles no administradores.
 */
export const modules: Module[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    adminOnly: false,
  },
  {
    id: 'analytics',
    name: 'Analíticas',
    icon: BarChart3,
    href: '/analytics',
    adminOnly: false,
  },
  {
    id: 'predictions',
    name: 'Predicciones',
    icon: TrendingUp,
    href: '/predictions',
    adminOnly: false,
  },
  {
    id: 'reports',
    name: 'Reportes',
    icon: FileText,
    href: '/reports',
    adminOnly: false,
  },
  {
    id: 'tanks-and-sensors',
    name: 'Tanques y Sensores',
    icon: Cpu,
    href: '/tanks-and-sensors',
    adminOnly: false,
  },
  {
    id: 'data-entry',
    name: 'Recolección',
    icon: Database,
    href: '/data-entry',
    adminOnly: true, 
  },
  {
    id: 'users',
    name: 'Usuarios',
    icon: Users,
    href: '/users',
    adminOnly: true, 
  },
];