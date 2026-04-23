/**
 * @file ThresholdGauge.tsx
 * @route frontend/src/components/predictions
 * @description Componente visual para mostrar un valor en relación a sus umbrales.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Tooltip } from '@nextui-org/react';

interface Thresholds {
  minCritical: number;
  minWarning: number;
  maxWarning: number;
  maxCritical: number;
}

interface Props {
  value: number;
  thresholds: Thresholds;
  unit: string;
}

/**
 * @description Calcula la posición porcentual de un valor dentro de un rango.
 */
const getValuePosition = (value: number, min: number, max: number): number => {
  if (max === min) return 50;
  const position = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, position)); // Asegura que esté entre 0 y 100
};

export const ThresholdGauge = ({ value, thresholds, unit }: Props) => {
  const { minCritical, minWarning, maxWarning, maxCritical } = thresholds;
  const position = getValuePosition(value, minCritical, maxCritical);

  const range = maxCritical - minCritical;
  const warningWidth = ((maxWarning - minWarning) / range) * 100;
  const minWarningPos = ((minWarning - minCritical) / range) * 100;

  return (
    <div className="w-full">
      <div className="relative h-2.5 w-full rounded-full bg-default-200 dark:bg-default-300/50">
        {/* Sección de advertencia (amarillo) */}
        <div
          className="absolute h-full rounded-full bg-warning-400"
          style={{ left: `${minWarningPos}%`, width: `${warningWidth}%` }}
        />
        {/* Sección segura (verde), superpuesta */}
        <div
          className="absolute h-full rounded-full bg-success-400"
          style={{ left: `${minWarningPos}%`, width: `${warningWidth}%` }}
        />

        {/* Indicador del valor actual */}
        <Tooltip content={`${value.toFixed(2)} ${unit}`} placement="top">
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-md"
            style={{ left: `${position}%` }}
          />
        </Tooltip>
      </div>

      {/* Etiquetas de Mínimo y Máximo */}
      <div className="mt-2 flex justify-between text-xs text-default-500">
        <span>{minCritical} {unit}</span>
        <span>{maxCritical} {unit}</span>
      </div>
    </div>
  );
};