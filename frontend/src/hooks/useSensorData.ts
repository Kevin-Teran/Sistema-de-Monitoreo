/**
 * @file useSensorData.ts
 * @route frontend/src/hooks/
 * @description
 * Hook personalizado de React para encapsular la lógica de obtención y manejo
 * de los datos históricos de los sensores. Provee el estado de carga, los datos,
 * posibles errores y una función para volver a cargar la información.
 * @author kevin mariano
 * @version 1.1.0
 * @since 1.0.0
 */
import { useState, useEffect, useCallback } from 'react';
import { getHistoricalData } from '@/services/dashboardService';
import { HistoricalData } from '@/types/dashboard';
import { SensorData, HistoricalDataParams, SensorType } from '@/types';


/**
 * @typedef {object} UseSensorDataResult
 * @property {SensorData[]} data - El array de datos del sensor obtenidos de la API.
 * @property {boolean} loading - Un booleano que es `true` mientras los datos se están cargando.
 * @property {string | null} error - Un string con el mensaje de error si la carga falla, o `null`.
 * @property {(params: HistoricalDataParams) => Promise<void>} refetch - Una función para volver
 * a ejecutar la carga de datos con nuevos parámetros.
 */

/**
 * Un hook de React para obtener datos históricos de los sensores.
 *
 * @param {HistoricalDataParams} initialParams - Los parámetros iniciales para la primera
 * carga de datos al montar el componente.
 * @returns {UseSensorDataResult} Un objeto con el estado de la carga de datos y la
 * función para recargar.
 * @example
 * const initialParams = {
 * startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
 * endDate: new Date().toISOString(),
 * tankId: 'some-tank-id'
 * };
 * const { data, loading, error } = useSensorData(initialParams);
 *
 * if (loading) return <p>Cargando...</p>;
 * if (error) return <p>Error: {error}</p>;
 * return <MyChart sensorData={data} />;
 */
export const useSensorData = (initialParams: HistoricalDataParams) => {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (params: HistoricalDataParams) => {
    setLoading(true);
    setError(null);
    try {
      const result: HistoricalData = await getHistoricalData(params);

      const flattenedData: SensorData[] = Object.entries(result).flatMap(([sensorType, entries]) =>
        entries.map(entry => ({
          sensorId: (params.sensorId || 'unknown'),
          value: entry.value,
          timestamp: entry.time,
          ph: sensorType === 'PH' ? entry.value : undefined,
          temperature: sensorType === 'TEMPERATURE' ? entry.value : undefined,
          oxygen: sensorType === 'OXYGEN' ? entry.value : undefined,
        }))
      );
      
      setData(flattenedData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de los sensores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(initialParams);
  }, [fetchData, initialParams]);

  return { data, loading, error, refetch: fetchData };
};