/**
 * @file ThresholdSettings.tsx
 * @description Componente para que los usuarios (o administradores para otros usuarios) configuren
 * los umbrales de alerta para los diferentes tipos de sensores.
 * @technical_requirements Carga y guarda las configuraciones a través del `settingsService`.
 * Recibe un `userId` para saber de qué usuario cargar y a quién guardar las configuraciones.
 */
 'use client';

 import React, { useState, useEffect, useCallback } from 'react';
 import { Save, Loader } from 'lucide-react';
 import * as settingsService from '@/services/settingsService';
 import Swal from 'sweetalert2';
 import { LoadingSpinner } from '@/components/common/LoadingSpinner';
 
 const defaultThresholds = {
     temperature: { min: 20, max: 28 },
     ph: { min: 6.8, max: 7.6 },
     oxygen: { min: 6, max: 10 }
 };
 
 interface ThresholdSettingsProps {
   userId: string;
 }
 
 /**
  * @component ThresholdSettings
  * @description Permite la visualización y edición de los rangos aceptables (mínimo y máximo)
  * para los sensores de temperatura, pH y oxígeno.
  * @param {ThresholdSettingsProps} props - Las propiedades del componente.
  * @returns {React.ReactElement}
  */
 export default function ThresholdSettings({ userId }: ThresholdSettingsProps) {
   const [thresholds, setThresholds] = useState<any>(defaultThresholds);
   const [isLoading, setIsLoading] = useState(true);
   const [isSubmitting, setIsSubmitting] = useState(false);
 
   const loadSettings = useCallback(async () => {
     if (!userId) return;
     setIsLoading(true);
     try {
       const settings = await settingsService.getSettings(userId);
       // Fusiona los valores por defecto con los guardados para evitar errores si falta alguna clave
       setThresholds({
           temperature: { ...defaultThresholds.temperature, ...settings.thresholds?.temperature },
           ph: { ...defaultThresholds.ph, ...settings.thresholds?.ph },
           oxygen: { ...defaultThresholds.oxygen, ...settings.thresholds?.oxygen },
       });
     } catch (error) {
       console.error(`Error al cargar umbrales para el usuario ${userId}:`, error);
       setThresholds(defaultThresholds); // Vuelve a los valores por defecto en caso de error
     } finally {
       setIsLoading(false);
     }
   }, [userId]);
 
   useEffect(() => {
     loadSettings();
   }, [loadSettings]);
 
   const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSubmitting(true);
     try {
         // Se utiliza el servicio actualizado que requiere el ID del usuario
         await settingsService.updateSettings({ thresholds }, userId);
         Swal.fire({
             icon: 'success',
             title: '¡Guardado!',
             text: 'Tus umbrales de alerta se han guardado correctamente.',
             toast: true,
             position: 'top-end',
             showConfirmButton: false,
             timer: 2000
         });
     } catch (error) {
         Swal.fire('Error', 'No se pudieron guardar los umbrales. Inténtalo de nuevo.', 'error');
     } finally {
         setIsSubmitting(false);
     }
   };
   
   if (isLoading) {
     return (
       <div className="p-8 flex items-center justify-center min-h-[300px]">
         <LoadingSpinner message="Cargando umbrales..." />
       </div>
     );
   }
 
   return (
     <form onSubmit={handleSave} className="space-y-6 p-6">
       <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rangos Aceptables</h2>
       {Object.entries(thresholds).map(([key, values]: [string, any]) => (
         <div key={key} className="border dark:border-gray-700 rounded-lg p-4 space-y-4">
           <h3 className="text-lg font-medium text-gray-900 dark:text-white capitalize">
             {key === 'ph' ? 'Nivel de pH' : key === 'oxygen' ? 'Oxígeno Disuelto' : 'Temperatura'}
           </h3>
           <div>
             <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
               Define los valores mínimos y máximos. Una lectura fuera de este rango generará una alerta.
             </p>
             <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
               <label className="label sm:w-20">Mínimo:</label>
               <input
                 type="number"
                 step="0.1"
                 value={values.min}
                 onChange={(e) => setThresholds({ ...thresholds, [key]: { ...values, min: parseFloat(e.target.value) || 0 } })}
                 className="w-full form-input"
               />
               <label className="label sm:w-20 mt-2 sm:mt-0">Máximo:</label>
               <input
                 type="number"
                 step="0.1"
                 value={values.max}
                 onChange={(e) => setThresholds({ ...thresholds, [key]: { ...values, max: parseFloat(e.target.value) || 0 } })}
                 className="w-full form-input"
               />
             </div>
           </div>
         </div>
       ))}
       <div className="flex justify-end mt-6">
         <button type="submit" disabled={isSubmitting} className="btn-primary min-w-[180px]">
           {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /><span>Guardar Umbrales</span></>}
         </button>
       </div>
     </form>
   );
 }