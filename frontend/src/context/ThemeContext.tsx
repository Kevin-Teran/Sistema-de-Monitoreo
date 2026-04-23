/**
 * @file ThemeContext.tsx
 * @route frontend/src/context
 * @description Proveedor de contexto para gestionar el tema de la aplicación.
 * Inicia con el tema del sistema. Una vez que el usuario elige un tema (claro/oscuro),
 * su preferencia se guarda en localStorage y persiste en futuras visitas.
 * @author Kevin Mariano
 * @version 4.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

/**
 * Hook personalizado para acceder al contexto del tema de forma segura.
 * @throws {Error} Si se usa fuera de un ThemeProvider.
 * @returns El contexto del tema.
 */
export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider');
  }
  return context;
};

/**
 * Función auxiliar para obtener el tema inicial.
 * Se ejecuta solo en el lado del cliente para evitar errores de hidratación.
 * @returns {Theme} El tema guardado o el del sistema como fallback.
 */
const getInitialTheme = (): Theme => {
  // Este código solo se ejecuta en el navegador
  if (typeof window !== 'undefined') {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    // Si el usuario ya eligió un tema, respétalo.
    if (storedTheme) {
      return storedTheme;
    }
    // Si no, usa el tema del sistema como valor inicial.
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  // Valor por defecto para el renderizado en servidor (no se verá en la UI final).
  return 'light';
};


/**
 * Proveedor que envuelve la aplicación y gestiona el estado del tema.
 * @param {object} props - Propiedades del componente.
 * @param {ReactNode} props.children - Los componentes hijos que consumirán el contexto.
 * @returns {JSX.Element}
 */
export const ThemeProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  /**
   * Efecto que se aplica cada vez que el estado del tema cambia.
   * Su única responsabilidad es actualizar la clase en el elemento <html>.
   */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  /**
   * Función para alternar el tema entre 'light' y 'dark'.
   * Cada vez que se llama, guarda la nueva preferencia en localStorage.
   */
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      // Guardar la elección del usuario inmediatamente.
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};