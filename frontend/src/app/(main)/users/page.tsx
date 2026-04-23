/**
 * @file page.tsx
 * @route /frontend/src/app/(main)/users
 * @description Versión final y pulida de la gestión de usuarios. Incluye modales de diseño profesional,
 * campos de filtro mejorados y toda la lógica de negocio y seguridad implementada.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { withAuth } from '@/hoc/withAuth';
// @ts-ignore
import { Role, UserFromApi, users_status } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  PlusCircle,
  Edit,
  Trash2,
  Search,
  Users,
  Shield,
  Clock,
  FileText,
  Container,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Swal from 'sweetalert2';
import { useUsers } from '@/hooks/useUsers';
import { UserModal } from '@/components/users/UserModal'; 
import { UserDetailsModal } from '@/components/users/UserDetailsModal'; 

const UsersManagementPage = () => {
  const { user: currentUser } = useAuth();
  const { users, loading, error, deleteUser, addUser, editUser } = useUsers();
  const [modal, setModal] = useState<{ isOpen: boolean; type: 'create' | 'edit' | 'details' | null; data?: UserFromApi | null }>({ isOpen: false, type: null, data: null });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | users_status>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const term = searchTerm.toLowerCase().trim();
      const nameMatch = user.name.toLowerCase().includes(term);
      const emailMatch = user.email.toLowerCase().includes(term);
      const statusMatch = statusFilter === 'all' || user.status === statusFilter;
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      return (nameMatch || emailMatch) && statusMatch && roleMatch;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  const userStats = useMemo(() => {
    return users.reduce((acc, user) => {
        acc.total++;
        if (user.role === Role.ADMIN) acc.admins++;
        if (user.status === 'ACTIVE') acc.activeUsers++;
        return acc;
    }, { total: 0, admins: 0, activeUsers: 0 });
  }, [users]);

  const handleFormSubmit = async (formData: any) => {
    try {
      if (modal.type === 'create') {
        await addUser(formData);
        Swal.fire({ title: 'Usuario Creado', icon: 'success', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-xl' } });
      } else if (modal.type === 'edit' && modal.data) {
        await editUser(modal.data.id, formData);
        Swal.fire({ title: 'Usuario Actualizado', icon: 'success', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-xl' } });
      }
      setModal({ isOpen: false, type: null });
    } catch (err: any) {
      Swal.fire({ title: 'Error', text: err.message || 'Ocurrió un error.', icon: 'error', customClass: { popup: 'rounded-xl' } });
    }
  };
  
  const handleDeleteUser = useCallback(async (user: UserFromApi) => {
    if (currentUser?.id === user.id) {
        Swal.fire({ title: 'Acción No Permitida', text: 'No puedes eliminar tu propia cuenta.', icon: 'error', customClass: { popup: 'rounded-xl' } });
        return;
      }
    Swal.fire({
      title: `¿Eliminar a ${user.name}?`, text: "Esta acción es irreversible.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
      customClass: { popup: 'rounded-xl' }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteUser(user.id);
          Swal.fire({ title: 'Eliminado', text: `${user.name} ha sido eliminado.`, icon: 'success', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-xl' } });
        } catch (err: any) {
          Swal.fire({ title: 'Error', text: err.message || 'No se pudo eliminar el usuario.', icon: 'error', customClass: { popup: 'rounded-xl' } });
        }
      }
    });
  }, [deleteUser, currentUser]);

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
       <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center"><Users className="h-8 w-8 text-blue-500" /><div className="ml-4"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Usuarios</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.total}</p></div></div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center"><Shield className="h-8 w-8 text-purple-500" /><div className="ml-4"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Administradores</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.admins}</p></div></div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex items-center"><Clock className="h-8 w-8 text-green-500" /><div className="ml-4"><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuarios Activos</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.activeUsers}</p></div></div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input type="text" placeholder="Buscar por nombre o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900]"/>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900]">
            <option value="all">Todos los estados</option><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="SUSPENDED">Suspendido</option>
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)} className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-[#39A900] focus:border-[#39A900]">
            <option value="all">Todos los roles</option><option value={Role.ADMIN}>Administrador</option><option value={Role.USER}>Usuario</option>
        </select>
      </div>
    </div>
  );
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
        <button onClick={() => setModal({ isOpen: true, type: 'create' })} className="flex items-center px-4 py-2 bg-[#39A900] text-white rounded-xl hover:bg-[#2F8B00] transition-colors shadow-md">
          <PlusCircle className="h-5 w-5 mr-2" /> Añadir Usuario
        </button>
      </div>
      
      {renderStats()}
      {renderFilters()}
      
      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-xl mt-6">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
           <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuario</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rol</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th><th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tanques Asignados</th><th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acciones</th></tr></thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="h-10 w-10 rounded-full bg-[#39A900] flex items-center justify-center text-white font-bold">{user.name.charAt(0).toUpperCase()}</div><div className="ml-4"><div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div><div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div></div></div></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ user.role === Role.ADMIN ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' }`}>{user.role}</span></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ user.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' }`}>{user.status}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-center"><div className="flex items-center justify-center space-x-2"><Container className="h-5 w-5 text-gray-400 dark:text-gray-500" /><span className="font-bold text-gray-800 dark:text-gray-200">{user._count?.tanks ?? 0}</span></div></td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex items-center justify-center space-x-4">
                    <button onClick={() => setModal({ isOpen: true, type: 'details', data: user })} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" title="Ver Detalles"><FileText className="h-5 w-5"/></button>
                    <button onClick={() => setModal({ isOpen: true, type: 'edit', data: user })} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors" title="Editar"><Edit className="h-5 w-5"/></button>
                    <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors" title="Eliminar"><Trash2 className="h-5 w-5"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        {(modal.type === 'create' || modal.type === 'edit') && (
            <UserModal
                isOpen={modal.isOpen}
                isEditing={modal.type === 'edit'}
                // @ts-ignore
                user={modal.data}
                // @ts-ignore
                currentUser={currentUser}
                onSubmit={handleFormSubmit}
                onClose={() => setModal({ isOpen: false, type: null })}
            />
        )}
        
        {modal.type === 'details' && modal.data && (
            <UserDetailsModal
                isOpen={modal.isOpen}
                user={modal.data}
                onClose={() => setModal({ isOpen: false, type: null })}
            />
        )}
    </div>
  );
};

export default withAuth(UsersManagementPage, [Role.ADMIN]);