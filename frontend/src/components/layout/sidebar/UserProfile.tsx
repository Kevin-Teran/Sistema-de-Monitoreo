/**
 * @file UserProfile.tsx
 * @route frontend/src/components/layout/sidebar
 * @description 
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
*/

import React from 'react';
import { clsx } from 'clsx';
import { User } from '@/types';

interface UserProfileProps {
  user: User | null;
  collapsed: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = React.memo(({ user, collapsed }) => (
  <div className={clsx("flex items-center w-full p-2 rounded-lg mb-1", collapsed ? 'justify-center' : 'space-x-3')}>
    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
      <span className="text-green-600 dark:text-green-400 font-semibold">
        {user?.name?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
    {!collapsed && (
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={user?.name ?? 'Usuario'}>
          {user?.name ?? 'Usuario'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {user?.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
        </p>
      </div>
    )}
  </div>
));
UserProfile.displayName = 'UserProfile';