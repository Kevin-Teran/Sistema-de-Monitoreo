/**
 * @file NavItem.tsx
 * @route frontend/src/components/layout/sidebar
 * @description 
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
*/

import React from 'react';
import { clsx } from 'clsx';
import { Module } from './types';

interface NavItemProps {
  module: Module;
  isActive: boolean;
  collapsed: boolean;
  onClick: (module: Module) => void;
}

export const NavItem: React.FC<NavItemProps> = React.memo(({ module, isActive, collapsed, onClick }) => {
  const { name, href, icon: Icon } = module;
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick(module);
  };

  return (
    <li className="relative group">
      <a
        href={href}
        onClick={handleClick}
        className={clsx(
          'w-full flex items-center px-3 py-2.5 text-left rounded-md transition-colors',
          isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 font-semibold'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          collapsed && 'justify-center'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* @ts-ignore */}
        <Icon className={clsx('w-5 h-5 flex-shrink-0', !collapsed && 'mr-3')} />
        {!collapsed && <span className="text-sm font-medium">{name}</span>}
      </a>
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          {name}
        </div>
      )}
    </li>
  );
});
NavItem.displayName = 'NavItem';