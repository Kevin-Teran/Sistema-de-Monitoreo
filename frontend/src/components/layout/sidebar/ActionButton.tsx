/**
 * @file ActionButton.tsx
 * @route frontend/src/components/layout/sidebar
 * @description 
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
*/

import React from 'react';
import { clsx } from 'clsx';

interface ActionButtonProps {
    onClick: () => void;
    title: string;
    'aria-label': string;
    isActive?: boolean;
    isCollapsed: boolean;
    children: React.ReactNode;
    className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ onClick, title, 'aria-label': ariaLabel, isActive, isCollapsed, children, className }) => (
    <button
        onClick={onClick}
        title={title}
        aria-label={ariaLabel}
        className={clsx(
            'w-full flex items-center px-3 py-2.5 text-left rounded-md transition-colors',
            isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
            isCollapsed && 'justify-center',
            className
        )}
    >
        {children}
    </button>
);
ActionButton.displayName = 'ActionButton';