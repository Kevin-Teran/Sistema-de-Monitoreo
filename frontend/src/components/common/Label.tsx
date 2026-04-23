/**
 * @file Label.tsx
 * @route frontend/src/components/common/
 * @description Componente reutilizable para etiquetas de formulario.
 * @author kevin mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import React from 'react';

// Se utiliza React.ComponentProps para heredar todas las propiedades estándar de una etiqueta HTML <label>
interface LabelProps extends React.ComponentPropsWithoutRef<'label'> {
  // Puedes añadir propiedades específicas si las necesitas, por ahora solo pasamos el children
  children: React.ReactNode;
}

/**
 * @function Label
 * @description Componente de etiqueta de formulario con estilos básicos de Tailwind.
 */
export const Label: React.FC<LabelProps> = ({ children, className, ...props }) => {
  return (
    <label
      className={`block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 ${className || ''}`}
      {...props}
    >
      {children}
    </label>
  );
};