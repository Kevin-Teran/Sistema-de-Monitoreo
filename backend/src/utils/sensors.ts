/**
 * @file sensors.ts
 * @route backend/src/utils
 * @description 
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

export type NormalizedType = 'TEMPERATURE' | 'PH' | 'OXYGEN' | null;

export function normalizeSensorType(type?: string): NormalizedType {
  const t = type?.toUpperCase().trim();
  if (!t) return null;

  if (t === 'TEMPERATURE' || t === 'TEMPERATURA') return 'TEMPERATURE';
  if (t === 'PH') return 'PH';
  if (
    t === 'OXYGEN' ||
    t === 'OXIGENO' ||
    t === 'OXIGENO_DISUELTO' ||
    t === 'OXIGENO_DISUELTO' || 
    t === 'OXIGENO_DISUELTO'
  ) return 'OXYGEN';
  
  return null;
}
