/**
 * @file SummaryCards.tsx
 * @route frontend/src/components/dashboard
 * @description
 * Componente de React encargado de renderizar una serie de tarjetas de resumen (Stat Cards)
 * que muestran métricas clave del sistema. Es altamente dinámico y se adapta a dos
 * situaciones principales:
 * 1.  **Estado de Carga:** Muestra esqueletos (skeletons) para indicar que los datos
 * se están cargando, proporcionando una mejor experiencia de usuario.
 * 2.  **Rol de Usuario:** Renderiza un conjunto de tarjetas base para todos los usuarios
 * y añade tarjetas adicionales si el usuario tiene rol de Administrador.
 *
 * @author Kevin Mariano
 * @version 1.1.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Container, Cpu, AlertTriangle, Database, LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/common/Skeleton';
import { Role } from '@/types';

/**
 * @interface SummaryData
 * @description Define la estructura del objeto de datos que contiene las métricas para las tarjetas.
 */
interface SummaryData {
  tanksCount: number;
  sensorsCount: number;
  recentAlerts: number;
  totalDataPoints: number;
}

/**
 * @interface SummaryCardsProps
 * @description Define las propiedades que el componente principal `SummaryCards` espera recibir.
 */
interface SummaryCardsProps {
  /**
   * @property {SummaryData | null} data - El objeto con los datos a mostrar. Es `null` si aún no se han cargado.
   */
  data: SummaryData | null;
  /**
   * @property {boolean} loading - Booleano que indica si los datos están en proceso de carga.
   */
  loading: boolean;
  /**
   * @property {Role} currentUserRole - El rol del usuario actual para determinar qué tarjetas mostrar.
   */
  currentUserRole: Role;
}

/**
 * @interface StatCardProps
 * @description Define las propiedades para el subcomponente `StatCard`, mejorando la seguridad de tipos.
 */
interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number | undefined;
  iconBgColor: string;
  iconColor: string;
  borderColor: string;
  index: number;
  subtitle?: string;
}


/**
 * @function StatCard
 * @description Componente reutilizable que renderiza una única tarjeta de estadística con un ícono,
 * título, valor y estilos personalizables.
 * @param {StatCardProps} props - Las propiedades para configurar la tarjeta.
 * @returns {React.ReactElement} Un elemento `motion.div` que representa la tarjeta.
 */
const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, iconBgColor, iconColor, borderColor, index, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 ${borderColor} p-6 border border-gray-200/50 dark:border-gray-700/50`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          {/* Manejo robusto del valor: muestra 0 si el valor es nulo o indefinido */}
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {(value ?? 0).toLocaleString()}
          </p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${iconBgColor} rounded-xl p-3 shadow-lg`}>
          <Icon className={`h-7 w-7 ${iconColor}`} />
        </div>
      </div>
    </motion.div>
);

/**
 * @function SummaryCards
 * @description Componente principal que gestiona y muestra la cuadrícula de tarjetas de resumen.
 * @param {SummaryCardsProps} props - Propiedades para configurar el componente.
 * @returns {React.ReactElement} La cuadrícula de tarjetas o los esqueletos de carga.
 */
export const SummaryCards: React.FC<SummaryCardsProps> = ({ data, loading, currentUserRole }) => {
  const isAdmin = currentUserRole === Role.ADMIN;

  if (loading || !data) {
    const skeletonCount = isAdmin ? 4 : 3;
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${skeletonCount} gap-6 mb-8`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const baseCards = [
    { icon: Container, title: 'Tanques Activos', value: data.tanksCount, iconBgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-l-blue-500 dark:border-l-blue-400' },
    { icon: Cpu, title: 'Sensores en Línea', value: data.sensorsCount, iconBgColor: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400', borderColor: 'border-l-green-500 dark:border-l-green-400' },
    { icon: AlertTriangle, title: 'Alertas Recientes', value: data.recentAlerts, iconBgColor: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400', borderColor: 'border-l-red-500 dark:border-l-red-400', subtitle: 'Últimas 24 horas' },
  ];

  const adminCard = {
    icon: Database,
    title: 'Datos Almacenados',
    value: data.totalDataPoints,
    iconBgColor: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-l-purple-500 dark:border-l-purple-400',
  };

  const cardsToDisplay = isAdmin ? [...baseCards, adminCard] : baseCards;

  const gridCols = `lg:grid-cols-${cardsToDisplay.length}`;

  return (
    <div className="mb-8">
      <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-6`}>
        {cardsToDisplay.map((card, index) => (
          <StatCard key={card.title} {...card} index={index} />
        ))}
      </div>
    </div>
  );
};