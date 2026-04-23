/**
 * @file AiAnalysisPanel.tsx
 * @route frontend/src/components/analytics/
 * @description Componente para mostrar el resumen y análisis generado por el AI Assistant.
 * @author kevin mariano
 * @version 1.0.2
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import React from 'react';
import { Card } from '@/components/common/Card';
import { Skeleton } from '@/components/common/Skeleton';
import { Leaf, MessageSquare } from 'lucide-react';

// Exportamos la interfaz con la capitalización sugerida por el compilador
export interface AIAnalysisPanelProps {
  analysis: string | null;
  loading: boolean;
  prompt: string; // The prompt generated for the AI (optional)
}

// Exportamos el componente con la capitalización sugerida por el compilador
export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ analysis, loading, prompt }) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Recomendaciones para el cultivo</h2>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </Card>
    );
  }

  if (analysis && analysis !== 'Lo siento, no pude obtener una respuesta de la IA.' && analysis !== 'No se pudo generar un análisis automático. Intenta más tarde.' && analysis !== 'Error de comunicación con el asistente de IA.') {
    return (
      <Card className="p-6 border-l-4 border-green-500 bg-green-50 dark:bg-slate-700/50 dark:border-green-400">
        <div className="flex items-center space-x-3 mb-4">
          <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h2 className="text-xl font-semibold text-green-700 dark:text-green-300">Recomendaciones para el cultivo</h2>
        </div>
        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
          {analysis}
        </p>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-4">
        <MessageSquare className="w-6 h-6 text-gray-400" />
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Recomendaciones para el cultivo</h2>
      </div>
      <p className="text-slate-500 dark:text-slate-400">
        No fue posible generar recomendaciones para los filtros seleccionados en este momento.
      </p>
    </Card>
  );
};
