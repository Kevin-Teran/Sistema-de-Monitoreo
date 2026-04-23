/**
 * @file loading.tsx
 * @route frontend/src/app/(main)
 * @description Pantalla de carga para las transiciones de página dentro del layout principal.
 * Se muestra automáticamente gracias a la convención de archivos de Next.js
 * al navegar entre rutas que comparten este layout.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * @component Loading
 * @description Componente que renderiza un spinner centrado.
 * Next.js lo envuelve en un <Suspense> y lo muestra como fallback
 * mientras el contenido de la nueva página se carga en el servidor.
 * @returns {React.ReactElement} Un spinner de carga centrado.
 */
export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100/50 dark:bg-gray-900/50">
      <LoadingSpinner message="Cargando..." size="lg" />
    </div>
  );
}