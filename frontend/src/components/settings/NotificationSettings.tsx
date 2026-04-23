'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader } from 'lucide-react';
import * as settingsService from '@/services/settingsService';
import Swal from 'sweetalert2';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

const SettingRow = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <div className="mb-2 sm:mb-0 sm:mr-4 flex-grow">
            <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <div className="flex-shrink-0">{children}</div>
    </div>
);

const defaultNotifications = { email: true, critical: true, reports: false };

export default function NotificationSettings() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any>(defaultNotifications);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
          if (!user) return;
          try {
            const settings = await settingsService.getSettings(user.id);
            setNotifications(settings.notifications || defaultNotifications);
          } catch (error) {
            console.error("Error al cargar notificaciones:", error);
          } finally {
            setIsLoading(false);
          }
        };
        loadData();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await settingsService.updateSettings({ notifications }, user.id);
            Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'Tus preferencias de notificación se han guardado.', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        } catch (error) {
            Swal.fire('Error', 'No se pudieron guardar las preferencias.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
      return (
        <div className="p-8 flex items-center justify-center min-h-[300px]">
          <LoadingSpinner message="Cargando notificaciones..." />
        </div>
      );
    }

    return (
        <div className="space-y-6 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configuración de Notificaciones</h2>
            <div className="space-y-4">
                <SettingRow title="Notificaciones por Email" description="Recibir alertas y reportes por correo electrónico.">
                    <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({...notifications, email: e.target.checked})} className="toggle-checkbox" />
                </SettingRow>
                <SettingRow title="Alertas Críticas" description="Recibir notificaciones inmediatas para valores críticos.">
                    <input type="checkbox" checked={notifications.critical} onChange={(e) => setNotifications({...notifications, critical: e.target.checked})} className="toggle-checkbox" />
                </SettingRow>
                <SettingRow title="Reportes Automáticos" description="Envío automático de reportes semanales.">
                    <input type="checkbox" checked={notifications.reports} onChange={(e) => setNotifications({...notifications, reports: e.target.checked})} className="toggle-checkbox" />
                </SettingRow>
            </div>
            <div className="flex justify-end mt-6">
                <button onClick={handleSave} disabled={isSubmitting} className="btn-primary min-w-[220px]">
                    {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /><span>Guardar Notificaciones</span></>}
                </button>
            </div>
        </div>
    );
}