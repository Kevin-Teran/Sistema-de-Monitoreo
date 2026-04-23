/**
 * @file page.tsx
 * @route /frontend/src/app/(main)/settings
 * @description Página de configuración "todo en uno" donde el usuario puede modificar
 * sus preferencias de perfil, umbrales de alerta y notificaciones.
 * Utiliza un sistema de pestañas para organizar el contenido y se comunica con
 * el backend para la persistencia de datos.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useState, useEffect } from 'react';
import { User as UserIcon, Bell, Gauge, Save, Edit, X, Loader } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import * as settingsService from '@/services/settingsService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card } from '@/components/common/Card';
import Swal from 'sweetalert2';
import { clsx } from 'clsx';

/**
 * @component ProfileSettingsTab
 * @description Gestiona la visualización y edición de la información del perfil del usuario,
 * incluyendo el cambio de nombre, email y contraseña.
 * @returns {JSX.Element}
 */
const ProfileSettingsTab = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', newPassword: '', confirmPassword: '' });

  /**
   * @effect
   * @description Sincroniza el estado del formulario con los datos del usuario del contexto de autenticación
   * cada vez que el objeto 'user' cambia.
   */
  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
    }
  }, [user]);

  /**
   * @function handleSubmit
   * @description Maneja el envío del formulario de perfil. Realiza validaciones
   * y llama al servicio `updateProfile` del contexto de autenticación.
   * @param {React.FormEvent} e - El evento del formulario.
   */
  // @ts-ignore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      return Swal.fire('Error', 'Las nuevas contraseñas no coinciden.', 'error');
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      return Swal.fire('Advertencia', 'La nueva contraseña debe tener al menos 6 caracteres.', 'warning');
    }

    setIsSubmitting(true);
    try {
      const dataToUpdate: { name: string; email: string; password?: string } = { name: formData.name.trim(), email: formData.email.trim() };
      if (formData.newPassword) {
        dataToUpdate.password = formData.newPassword;
      }
      await updateProfile(dataToUpdate);
      Swal.fire({ icon: 'success', title: '¡Perfil Actualizado!', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      setIsEditing(false);
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar el perfil.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Información del Perfil</h2>
        <button onClick={() => setIsEditing(!isEditing)} className={clsx('btn-sm', isEditing ? 'btn-secondary' : 'btn-primary')}>
          {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          <span>{isEditing ? 'Cancelar' : 'Editar'}</span>
        </button>
      </div>
      {!isEditing ? (
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">{user?.name.charAt(0).toUpperCase()}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.name}</h3>
            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">{user?.role === 'ADMIN' ? 'Administrador' : 'Usuario'}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="label">Nombre Completo</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="form-input" required /></div>
            <div><label className="label">Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="form-input" required /></div>
          </div>
          <div className="border-t pt-4 dark:border-gray-700"><h4 className="font-medium mb-3 text-gray-900 dark:text-white">Cambiar Contraseña</h4><div className="grid md:grid-cols-2 gap-4"><div><label className="label">Nueva Contraseña</label><input type="password" value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} className="form-input" placeholder="Dejar en blanco para no cambiar" /></div><div><label className="label">Confirmar Contraseña</label><input type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="form-input" /></div></div></div>
          <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /><span>Guardar Cambios</span></>}</button></div>
        </form>
      )}
    </Card>
  );
};

/**
 * @component ThresholdSettingsTab
 * @description Permite al usuario configurar los umbrales mínimos y máximos para las métricas
 * (temperatura, pH, oxígeno) que dispararán las alertas del sistema.
 * @returns {JSX.Element}
 */
const ThresholdSettingsTab = () => {
  const { user } = useAuth();
  const [thresholds, setThresholds] = useState({ temperature: { min: 20, max: 28 }, ph: { min: 6.8, max: 7.6 }, oxygen: { min: 6, max: 10 } });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { if (user) settingsService.getSettings(user.id).then(s => setThresholds(s.thresholds || thresholds)).finally(() => setIsLoading(false)); }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await settingsService.updateSettings({ thresholds }, user.id);
      Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'Tus umbrales se han guardado.', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
    } catch (error) { Swal.fire('Error', 'No se pudieron guardar los umbrales.', 'error'); } 
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return <Card className="p-6"><LoadingSpinner message="Cargando umbrales..." /></Card>;

  return (
    <Card><form onSubmit={handleSave} className="space-y-6 p-6"><h2 className="text-xl font-semibold">Rangos Aceptables</h2>{Object.entries(thresholds).map(([key, values]: [string, any]) => (<div key={key} className="border dark:border-gray-700 rounded-lg p-4 space-y-4"><h3 className="text-lg font-medium capitalize">{key === 'ph' ? 'Nivel de pH' : key}</h3><p className="text-xs text-gray-500">Define los valores mínimos y máximos para generar alertas.</p><div className="flex items-center gap-4"><label className="label w-20">Mínimo:</label><input type="number" step="0.1" value={values.min} onChange={(e) => setThresholds({ ...thresholds, [key]: { ...values, min: parseFloat(e.target.value) || 0 } })} className="form-input" /><label className="label w-20">Máximo:</label><input type="number" step="0.1" value={values.max} onChange={(e) => setThresholds({ ...thresholds, [key]: { ...values, max: parseFloat(e.target.value) || 0 } })} className="form-input" /></div></div>))}<div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="btn-primary min-w-[180px]">{isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /><span>Guardar Umbrales</span></>}</button></div></form></Card>
  );
};

/**
 * @component NotificationSettingsTab
 * @description Permite al usuario activar o desactivar diferentes canales y tipos de notificaciones.
 * @returns {JSX.Element}
 */
const NotificationSettingsTab = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState({ email: true, critical: true, reports: false });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { if (user) settingsService.getSettings(user.id).then(s => setNotifications(s.notifications || notifications)).finally(() => setIsLoading(false)); }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await settingsService.updateSettings({ notifications }, user.id);
            Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'Tus preferencias se han guardado.', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        } catch (error) { Swal.fire('Error', 'No se pudieron guardar las preferencias.', 'error'); } 
        finally { setIsSubmitting(false); }
    };
    
    if (isLoading) return <Card className="p-6"><LoadingSpinner message="Cargando notificaciones..." /></Card>;
    
    const SettingRow = ({ title, desc, children }: {title: string, desc: string, children: React.ReactNode}) => (<div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"><div><h3 className="font-medium">{title}</h3><p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p></div><div>{children}</div></div>);

    return (
        <Card className="p-6"><div className="space-y-6"><h2 className="text-xl font-semibold">Configuración de Notificaciones</h2><div className="space-y-4"><SettingRow title="Notificaciones por Email" desc="Recibir alertas y reportes por correo."><input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({...notifications, email: e.target.checked})} className="toggle-checkbox" /></SettingRow><SettingRow title="Alertas Críticas" desc="Recibir notificaciones para valores críticos."><input type="checkbox" checked={notifications.critical} onChange={(e) => setNotifications({...notifications, critical: e.target.checked})} className="toggle-checkbox" /></SettingRow><SettingRow title="Reportes Automáticos" desc="Envío automático de reportes semanales."><input type="checkbox" checked={notifications.reports} onChange={(e) => setNotifications({...notifications, reports: e.target.checked})} className="toggle-checkbox" /></SettingRow></div><div className="flex justify-end mt-6"><button onClick={handleSave} disabled={isSubmitting} className="btn-primary min-w-[220px]">{isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /><span>Guardar Notificaciones</span></>}</button></div></div></Card>
    );
};

/**
 * @page SettingsPage
 * @description Componente principal que renderiza la estructura de la página de configuración,
 * incluyendo el encabezado, el navegador de pestañas y el contenido de la pestaña activa.
 * @returns {JSX.Element | null}
 */
export default function SettingsPage() {
  const { loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: UserIcon },
    { id: 'thresholds', label: 'Umbrales de Alerta', icon: Gauge },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
  ];

  if (authLoading) {
    return <LoadingSpinner fullScreen message="Cargando configuraciones..." />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSettingsTab />;
      case 'thresholds': return <ThresholdSettingsTab />;
      case 'notifications': return <NotificationSettingsTab />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Personaliza tu perfil y las preferencias del sistema.</p>
      </div>
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx('flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors', activeTab === tab.id ? 'border-b-2 border-green-500 text-green-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300')}>
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>
      <div>{renderContent()}</div>
    </div>
  );
}