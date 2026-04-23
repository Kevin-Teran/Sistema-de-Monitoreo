/**
 * @file withAuth.tsx
 * @description HOC para proteger rutas basado en roles de usuario.
 * Ahora incluye redirección automática si el usuario no tiene los permisos necesarios.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const withAuth = (
  WrappedComponent: React.ComponentType<any>,
  allowedRoles: Role[]
) => {
  const AuthComponent = (props: any) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
        return;
      }

      if (!loading && user && !allowedRoles.includes(user.role)) {
        router.push('/dashboard');
      }
    }, [user, loading, router, allowedRoles]);

    if (loading || !user) {
      return (
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner message="Verificando acceso..." />
        </div>
      );
    }

    if (allowedRoles.includes(user.role)) {
      return <WrappedComponent {...props} />;
    }

    return (
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner message="Redirigiendo..." />
        </div>
    );
  };

  return AuthComponent;
};