/**
 * @file DataCard.tsx
 * @route frontend/src/components/common
 * @description Un componente contenedor que gestiona su propio estado de carga.
 * Esta versión simplificada elimina las dependencias de sub-componentes para
 * evitar errores de importación.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

 'use client';

 import React from 'react';
 import { Card } from '@/components/common/Card'; // Solo importa el componente principal 'Card'
 import { Skeleton } from '@/components/common/Skeleton';
 import { cn } from '@/utils/cn';
 
 interface DataCardProps {
   title: string;
   isLoading: boolean;
   children: React.ReactNode;
   className?: string;
   skeletonClassName?: string;
 }
 
 /**
  * @component DataCard
  * @description Envuelve contenido del dashboard, mostrando un esqueleto mientras
  * `isLoading` es verdadero.
  */
 export const DataCard: React.FC<DataCardProps> = ({ 
   title, 
   isLoading, 
   children, 
   className, 
   skeletonClassName = "h-48 w-full" 
 }) => {
   return (
     // Se utiliza el componente Card como contenedor principal
     <Card className={cn("flex flex-col", className)}>
       {/* Se recrea la estructura del Header con elementos nativos */}
       <div className="border-b border-gray-200 dark:border-gray-700 p-4">
         <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
       </div>
       
       {/* El contenido se renderiza aquí */}
       <div className="p-4 flex-grow">
         {isLoading ? (
           <Skeleton className={skeletonClassName} />
         ) : (
           children
         )}
       </div>
     </Card>
   );
 };
 