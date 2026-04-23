/**
 * @file useSidebar.ts
 * @route frontend/src/hooks
 * @description 
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export const useSidebar = (defaultModule = 'dashboard') => {
  const [collapsed, setCollapsed] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentModule, setCurrentModule] = useState(defaultModule);
  const router = useRouter();

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

    if (savedCollapsed) {
      setCollapsed(JSON.parse(savedCollapsed));
    }
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const handleModuleChange = useCallback((module: { id: string; href: string }) => {
    setCurrentModule(module.id);
    router.push(module.href);
  }, [router]);

  return {
    collapsed,
    theme,
    currentModule,
    handleToggleCollapse,
    handleToggleTheme,
    handleModuleChange,
  };
};