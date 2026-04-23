'use client';

import React, { useState, useEffect } from 'react';
import { Save, Edit, X, Loader } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

export default function ProfileSettings() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', newPassword: '', confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      Swal.fire('Error de Validación', 'Las nuevas contraseñas no coinciden.', 'error');
      return;
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      Swal.fire('Contraseña Insegura', 'La nueva contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToUpdate: { name: string; email: string; password?: string } = { name: formData.name.trim(), email: formData.email.trim() };
      if (formData.newPassword) dataToUpdate.password = formData.newPassword;
      
      await updateProfile(dataToUpdate);
      
      Swal.fire({ icon: 'success', title: '¡Perfil Actualizado!', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      setIsEditing(false);
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (error: any) {
      Swal.fire('Error al Actualizar', error.response?.data?.message || 'No se pudo actualizar el perfil.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Información del Perfil</h2>
        <button onClick={() => setIsEditing(!isEditing)} className={ `btn-${isEditing ? 'secondary' : 'primary'} text-sm`}>
          {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          <span>{isEditing ? 'Cancelar' : 'Editar'}</span>
        </button>
      </div>

      {!isEditing ? (
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name.charAt(0).toUpperCase()}
          </div>
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
          <div className="border-t pt-4 dark:border-gray-700">
            <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Cambiar Contraseña</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className="label">Nueva Contraseña</label><input type="password" value={formData.newPassword} onChange={e => setFormData({ ...formData, newPassword: e.target.value })} className="form-input" placeholder="Dejar en blanco para no cambiar" /></div>
              <div><label className="label">Confirmar Contraseña</label><input type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="form-input" /></div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /><span>Guardar Cambios</span></>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}