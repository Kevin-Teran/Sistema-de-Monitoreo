/**
 * @file layout.tsx
 * @route frontend/src/app/(main)
 * @description Layout principal para las rutas protegidas de la aplicación.
 * Fix para el slider horizontal y la desaparición de la Sidebar en móvil.
 * @author Kevin Mariano
 * @version 1.1.9 
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar/Sidebar';
import { modules } from '@/components/layout/sidebar/constants';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import LoadingScreen from './loading'; 
// Componentes de Botones Flotantes Importados
import { AlertsPanel } from '@/components/common/AlertsPanel';
import { AiAssistantButton } from '@/components/common/AiAssistantButton'; 
import { clsx } from 'clsx';
import { Menu, X } from 'lucide-react'; // Iconos para el botón de móvil

// Componente para el botón de abrir/cerrar sidebar en móvil
const MobileMenuButton: React.FC<{ isOpen: boolean, onClick: () => void }> = ({ isOpen, onClick }) => {
    const Icon = isOpen ? X : Menu;
    return (
        <button
            onClick={onClick}
            className={clsx(
                'md:hidden fixed top-4 left-4 z-50 p-2 rounded-full shadow-lg transition-colors duration-200',
                'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
            aria-label={isOpen ? "Cerrar menú lateral" : "Abrir menú lateral"}
        >
            <Icon size={24} />
        </button>
    );
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarClosed, setIsSidebarClosed] = useState(true); 
  const [isNavigating, setIsNavigating] = useState(false);

  // ESTADOS CENTRALES DE APERTURA DE PANELES
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);


  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);
  
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const getModuleIdFromPath = (path: string): string => {
    if (path.startsWith('/settings')) return 'settings';
    const activeModule = modules.find(m => path.startsWith(m.href));
    return activeModule?.id || 'dashboard';
  };

  const [currentModuleId, setCurrentModuleId] = useState(getModuleIdFromPath(pathname));
  useEffect(() => {
    setCurrentModuleId(getModuleIdFromPath(pathname));
  }, [pathname]);

  const onToggleCollapse = useCallback(() => setIsSidebarClosed(prev => !prev), []);
  
  const handleModuleChange = useCallback((module: { id: string; href: string; }) => {
    if (pathname === module.href) return;
    
    setIsNavigating(true);
    setIsSidebarClosed(true); 
    setCurrentModuleId(module.id);
    router.push(module.href);
  }, [router, pathname]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);
  
  const toggleAlertsPanel = useCallback(() => {
    if (!isAlertsOpen) setIsAiOpen(false);
    setIsAlertsOpen(prev => !prev);
  }, [isAlertsOpen]);


  if (authLoading) {
    return <LoadingSpinner fullScreen message="Verificando sesión..." />;
  }

  if (!user) {
    return null; 
  }
  
  const showMobileOverlay = !isSidebarClosed; 

  return (
    // Aplicamos overflow-x-hidden al contenedor principal.
    <div className={`flex h-screen overflow-x-hidden bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300 ${theme}`}>
      
      {/* Botón de Menú Móvil */}
      <MobileMenuButton isOpen={!isSidebarClosed} onClick={onToggleCollapse} />

      {/* Overlay Móvil */}
      {showMobileOverlay && (
          <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
              onClick={() => setIsSidebarClosed(true)} // Cierra la sidebar al hacer clic fuera
              aria-hidden="true"
          />
      )}

      <Sidebar
        user={user}
        onLogout={logout}
        collapsed={isSidebarClosed} 
        onToggleCollapse={onToggleCollapse}
        currentModuleId={currentModuleId}
        onModuleChange={handleModuleChange}
      />
      
      <main 
          className={clsx(
              // Aseguramos min-w-0 para que el contenido principal no fuerce el overflow
              "flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-300",
              
          )}
      >
        {isNavigating ? <LoadingScreen /> : children}
      </main>

      {/* ======================= Botones Flotantes (IA y Alertas) ======================= */}
      
      <AiAssistantButton 
        isOpen={isAiOpen}
        setIsOpen={(open) => {
            if (open) setIsAlertsOpen(false);
            setIsAiOpen(open);
        }}
        isOtherPanelOpen={isAlertsOpen} 
      /> 
      
      <AlertsPanel 
        isOpen={isAlertsOpen} 
        onClose={toggleAlertsPanel} 
        isOtherPanelOpen={isAiOpen} 
      />
    </div>
  );
}