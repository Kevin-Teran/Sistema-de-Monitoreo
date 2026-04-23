/**
 * @file page.tsx
 * @route frontend/src/app
 * @description Página de entrada principal de la aplicación.
 * Actúa como un enrutador del lado del cliente que redirige a los usuarios
 * a la página de login si no están autenticados, o al dashboard si ya
 * tienen una sesión activa.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 
/**
 * @page HomePage
 * @description Renderiza un estado de carga mientras verifica la sesión
 * y redirige al usuario a la ruta apropiada.
 * @returns {React.ReactElement} Un componente de carga a pantalla completa.
**/
export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
 
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, router]);
 
  return <LoadingSpinner fullScreen message="Cargando..." />;
}