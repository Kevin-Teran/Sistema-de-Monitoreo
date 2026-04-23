/**
 * @file AdminStatCards.tsx
 * @route frontend/src/components/dashboard
 * @description Componente de React diseñado para mostrar un conjunto de tarjetas con estadísticas
 * clave, visibles únicamente para los usuarios con rol de Administrador.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React from 'react';

/**
 * @interface AdminStatCardsProps
 * @description Define las propiedades (props) que espera el componente `AdminStatCards`.
 * Estas se mantienen para garantizar la compatibilidad con los componentes
 * que lo utilizan, aunque actualmente no se usen para renderizar.
 */
interface AdminStatCardsProps {
  /**
   * @property {object | null} stats
   * @description
   * Un objeto que contiene las métricas numéricas a mostrar.
   * Puede ser `null` si los datos aún no están disponibles.
   * @property {number} [stats.totalUsers] - El número total de usuarios registrados.
   * @property {number} [stats.totalTanks] - El número total de tanques en el sistema.
   * @property {number} [stats.totalSensors] - El número total de sensores activos.
   */
  stats: {
    totalUsers?: number;
    totalTanks?: number;
    totalSensors?: number;
  } | null;

  /**
   * @property {boolean} loading
   * @description
   * Un indicador booleano que es `true` cuando los datos de las estadísticas
   * están en proceso de carga.
   */
  loading: boolean;
}

/**
 * @function AdminStatCards
 * @description
 * Componente funcional de React que, en su estado original, renderizaba una serie de
 * tarjetas con estadísticas para el administrador.
 * * En su versión actual, el componente está "desactivado" y no produce ninguna salida visual.
 * * @param {AdminStatCardsProps} props - Las propiedades del componente. No se utilizan
 * directamente en esta versión, pero se reciben
 * para mantener la consistencia de la API del componente.
 * @returns {null} - Devuelve `null` para indicar a React que no debe renderizar nada en el DOM.
 * * @example
 * ```tsx
 * // En la página del dashboard:
 * {isAdmin && <AdminStatCards stats={dashboardData?.adminStats} loading={loading.summary} />}
 * // A pesar de ser llamado, este componente no mostrará nada en la pantalla.
 * ```
 */
export const AdminStatCards: React.FC<AdminStatCardsProps> = () => {
  return null;
};