/**
 * @file Modal.tsx
 * @description Componente de modal genérico, accesible y reutilizable.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

 import React, { useEffect } from 'react';
 import { X } from 'lucide-react';
 import { clsx } from 'clsx';
 
 interface ModalProps {
   isOpen: boolean;
   onClose: () => void;
   title: string;
   children: React.ReactNode;
   footer?: React.ReactNode;
 }
 
 export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
   useEffect(() => {
     const handleEsc = (event: KeyboardEvent) => {
       if (event.key === 'Escape') {
         onClose();
       }
     };
     if (isOpen) {
       document.addEventListener('keydown', handleEsc);
     }
     return () => {
       document.removeEventListener('keydown', handleEsc);
     };
   }, [isOpen, onClose]);
 
   if (!isOpen) {
     return null;
   }
 
   return (
     <div
       className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
       onClick={onClose}
       aria-modal="true"
       role="dialog"
     >
       <div
         className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4 animate-in zoom-in-95 duration-300"
         onClick={(e) => e.stopPropagation()}
       >
         <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
           <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
           <button
             onClick={onClose}
             className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
             aria-label="Cerrar modal"
           >
             <X className="w-6 h-6" />
           </button>
         </div>
 
         <div className="p-6">{children}</div>
 
         {footer && (
           <div className="flex items-center justify-end p-4 space-x-2 border-t border-gray-200 dark:border-gray-700">
             {footer}
           </div>
         )}
       </div>
     </div>
   );
 };