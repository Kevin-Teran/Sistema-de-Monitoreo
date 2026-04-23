/**
 * @file page.tsx
 * @route frontend/src/app/(main)/predictions
 * @description Página de predicciones integrada con datos REALES de la API.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardBody, Select, SelectItem, Button, Skeleton, Input } from '@nextui-org/react';
import type { Selection } from '@nextui-org/react';
import { toast } from 'react-hot-toast';
import { RefreshCw, Download, MapPin, BarChart3, CloudRain, Calendar, ChevronDown } from 'lucide-react'; 
import { useAuth } from '@/context/AuthContext';
import { getTanks, getTankById } from '@/services/tankService';
import { generatePrediction } from '@/services/predictionService';
import { getWeatherForecast } from '@/services/weatherService';
import { Sensor, Tank, SensorType } from '@/types';
import { PredictionCard } from '@/components/predictions/PredictionCard';
import { PredictionSummary } from '@/components/predictions/PredictionSummary';

// 1. FIX DE TIPO: Extensión local de la interfaz Tank para incluir sensores
interface TankWithSensors extends Tank {
  sensors?: Sensor[];
}

// 2. FIX DE TIPO: Definición explícita para los datos del clima
interface WeatherDataPoint {
  date: string; 
  temp_max: number;
}

const horizonOptions = [
  { label: '7 Días', value: '7' },
  { label: '15 Días', value: '15' }
];

interface PredictionResults {
  [sensorId: string]: any;
}

export default function PredictionsPage() {
  const { user } = useAuth();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTankId, setSelectedTankId] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<string>('7');
  const [resultsBySensor, setResultsBySensor] = useState<PredictionResults>({});
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherDataPoint[]>([]); 
  const [selectedTank, setSelectedTank] = useState<TankWithSensors | null>(null);
  const [weatherLocation, setWeatherLocation] = useState('');
  const predictionRequestIdRef = useRef(0);

  // Lógica de carga y manejo de datos (se mantiene igual)
  useEffect(() => {
    if (!user) return;
    
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const userTanks = await getTanks(user.id);
        setTanks(userTanks);
        
        if (userTanks.length > 0 && !selectedTankId) {
          setSelectedTankId(userTanks[0].id);
        }
      } catch (error) {
        toast.error('No se pudieron cargar los tanques.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [user]);

  const selectedTankForUi = useMemo(() => {
    return selectedTank || (tanks.find(tank => tank.id === selectedTankId) as TankWithSensors | undefined) || null;
  }, [selectedTank, tanks, selectedTankId]);

  const generatePredictions = useCallback(async () => {
    if (!selectedTankId || !horizon) return;
    const requestId = predictionRequestIdRef.current + 1;
    predictionRequestIdRef.current = requestId;
    
    setIsGenerating(true);
    setResultsBySensor({});
    setWeatherData([]);
    try {
      const tankDetails = await getTankById(selectedTankId);
      const tankDetailsWithSensors = tankDetails as TankWithSensors;

      if (requestId !== predictionRequestIdRef.current) return;

      setSelectedTank(tankDetailsWithSensors);
      setSensors(tankDetailsWithSensors.sensors || []); 

      let weather: WeatherDataPoint[] = []; 
      const weatherLocationToUse = (weatherLocation.trim() || tankDetailsWithSensors.location || '').trim();
      if (weatherLocationToUse) {
        try {
          // **CORRECCIÓN FINAL DE UBICACIÓN:** Usando coordenadas de Barranquilla (10.9685,-74.7813).
          const locationToUse = 
            weatherLocationToUse.toUpperCase() === 'SENA TIC' 
              ? "10.9685,-74.7813" // Coordenadas de Barranquilla
              : weatherLocationToUse;

          weather = await getWeatherForecast(locationToUse, parseInt(horizon));
          if (requestId !== predictionRequestIdRef.current) return;
          setWeatherData(weather);
        } catch (error) {
          console.warn('No se pudo obtener el pronóstico del clima:', error);
          setWeatherData([]);
        }
      }

      const newResults: PredictionResults = {};
      
      if (tankDetailsWithSensors.sensors && tankDetailsWithSensors.sensors.length > 0) {
        await Promise.all(
          tankDetailsWithSensors.sensors.map(async (sensor: Sensor) => {
            try {
              const prediction = await generatePrediction({
                tankId: selectedTankId,
                type: sensor.type as SensorType,
                horizon: parseInt(horizon, 10),
                weatherLocation: weatherLocationToUse,
              });

              newResults[sensor.id] = {
                ...prediction,
                sensorId: sensor.id,
                sensorName: sensor.name,
                sensorType: sensor.type,
                weatherData: sensor.type === SensorType.TEMPERATURE ? weather : null,
              };
            } catch (error) {
              console.error(`Error generando predicción para sensor ${sensor.name}:`, error);
              toast.error(`Error en predicción de ${sensor.name}`);
            }
          })
        );
      }

      if (requestId !== predictionRequestIdRef.current) return;
      setResultsBySensor(newResults);
      toast.success('Predicciones generadas exitosamente');
      
    } catch (error) {
      if (requestId !== predictionRequestIdRef.current) return;
      console.error('Error al generar predicciones:', error);
      toast.error('Error al generar predicciones');
      setResultsBySensor({});
      setSensors([]);
    } finally {
      if (requestId === predictionRequestIdRef.current) {
        setIsGenerating(false);
      }
    }
  }, [selectedTankId, horizon, weatherLocation]);

  const generatePredictionsRef = useRef(generatePredictions);

  useEffect(() => {
    generatePredictionsRef.current = generatePredictions;
  }, [generatePredictions]);

  useEffect(() => {
    if (!selectedTankId || !horizon) return;
    
    if (!isLoading) {
        generatePredictionsRef.current();
    }
  }, [selectedTankId, horizon, isLoading]);


  const handleExportAll = async () => {
    toast.error('Función de exportación en desarrollo');
  };

  const handleTankSelectionChange = (keys: Selection) => {
    const rawValue = Array.from(keys).at(0) as string | undefined;
    setSelectedTankId(rawValue || null);
  };
  
  const handleHorizonSelectionChange = (keys: Selection) => {
    const value = Array.from(keys).at(0) as string | undefined;
    if (value) setHorizon(value);
  };

  const selectedTankKeys = useMemo(
    (): Set<string> => selectedTankId ? new Set([selectedTankId]) : new Set(), 
    [selectedTankId]
  );

  const selectedHorizonKeys = useMemo(
    (): Set<string> => new Set([horizon]),
    [horizon]
  );
  
  const renderContent = () => {
    if (isGenerating) {
      return Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className='w-full h-[600px] rounded-xl' />
      ));
    }

    if (!selectedTankId || sensors.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-default-500 text-lg">
            {selectedTankId && selectedTankForUi && !selectedTank 
              ? `Preparando predicciones para "${selectedTankForUi.name}"...`
              : selectedTankForUi 
                ? `El tanque "${selectedTankForUi.name}" no tiene sensores registrados.` 
                : 'Por favor, selecciona un tanque para generar predicciones.'}
          </p>
          <p className="text-default-400 mt-2 text-sm">
            Se requiere al menos un sensor para el análisis predictivo.
          </p>
        </div>
      );
    }

    return sensors.map(sensor => {
      const result = resultsBySensor[sensor.id];
      return result ? (
        <PredictionCard 
          key={sensor.id} 
          result={result}
          tankName={selectedTank?.name || ''}
        />
      ) : (
        <Skeleton key={sensor.id} className='w-full h-[600px] rounded-xl' />
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header (Se mantiene igual) */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análisis Predictivo</h1>
          <p className='text-default-500'>
            Proyecciones inteligentes basadas en datos históricos y condiciones climáticas
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Selector de Tanque */}
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                <Select 
                    placeholder={isLoading ? "Cargando Tanques..." : "Selecciona un tanque"}
                    items={tanks} 
                    selectedKeys={selectedTankKeys} 
                    onSelectionChange={handleTankSelectionChange} 
                    isDisabled={tanks.length === 0 || isLoading || isGenerating}
                    aria-label="Selector de Tanque"
                    classNames={{
                        trigger: "h-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus-within:ring-1 focus-within:ring-[#39A900] focus-within:border-[#39A900] transition-colors pl-10",
                        value: "text-default-700 dark:text-default-200 pl-2", 
                        mainWrapper: "rounded-xl",
                        popoverContent: "rounded-xl bg-gray-800 border border-blue-600 shadow-xl p-0",
                    }}
                    selectorIcon={<ChevronDown className="w-4 h-4 text-gray-400" />}
                >
                    {(tank) => (
                        <SelectItem key={tank.id} value={tank.id} classNames={{
                            selectedIcon: "text-blue-400",
                            base: "text-white hover:bg-gray-700/50 data-[selected=true]:bg-gray-700 data-[selected=true]:text-white",
                        }}>
                            {tank.name}
                        </SelectItem>
                    )}
                </Select>
            </div>

            {/* Selector de Horizonte */}
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                <Select 
                    placeholder="Horizonte de Predicción"
                    selectedKeys={selectedHorizonKeys} 
                    onSelectionChange={handleHorizonSelectionChange}
                    isDisabled={!selectedTankId || isGenerating || tanks.length === 0}
                    aria-label="Selector de Horizonte de Predicción"
                    classNames={{
                        trigger: "h-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus-within:ring-1 focus-within:ring-[#39A900] focus-within:border-[#39A900] transition-colors pl-10",
                        value: "text-default-700 dark:text-default-200 pl-2",
                        mainWrapper: "rounded-xl",
                        popoverContent: "rounded-xl bg-gray-800 border border-blue-600 shadow-xl p-0", // Fondo oscuro y borde azul
                    }}
                    selectorIcon={<ChevronDown className="w-4 h-4 text-gray-400" />}
                >
                    {horizonOptions.map((option) => (
                        <SelectItem key={option.value} classNames={{
                            selectedIcon: "text-blue-400",
                            base: "text-white hover:bg-gray-700/50 data-[selected=true]:bg-gray-700 data-[selected=true]:text-white",
                        }}>
                            {option.label}
                        </SelectItem>
                    ))}
                </Select>
            </div>

            {/* Botón de Actualizar / Generar */}
            <div className="relative">
                <CloudRain className="absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transform text-gray-400 pointer-events-none" />
                <Input
                    value={weatherLocation}
                    onValueChange={setWeatherLocation}
                    placeholder={selectedTankForUi?.location || 'Ciudad o lat,lon'}
                    isDisabled={!selectedTankId || isGenerating || tanks.length === 0}
                    aria-label="Ubicacion para analisis climatico"
                    classNames={{
                        inputWrapper: "h-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus-within:ring-1 focus-within:ring-[#39A900] focus-within:border-[#39A900] transition-colors pl-10",
                        input: "text-default-700 dark:text-default-200",
                    }}
                />
            </div>

            <div className="md:w-auto"> 
                <Button
                    color="success"
                    size="lg"
                    className="w-full h-12 font-semibold rounded-xl text-white bg-[#39A900] hover:bg-[#2F8B00]" 
                    startContent={
                        <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                    }
                    onPress={generatePredictions}
                    isDisabled={!selectedTankId || isGenerating || tanks.length === 0}
                    isLoading={isGenerating}
                >
                    {isGenerating ? 'Generando Predicciones' : 'Generar Predicciones'}
                </Button>
            </div>
        </div>
      </div>
      
      {/* Información de estado y Resumen (Se mantienen iguales) */}
      {selectedTankForUi && (
        <div className="mt-2 pt-2 text-sm text-default-500 flex flex-wrap gap-4 items-center">
            <p className="inline-flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-primary" />
                Tanque: <strong className="text-default-700 dark:text-default-300 ml-1">{selectedTankForUi.name}</strong>
            </p>
            <p className="inline-flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-default-400" />
                Ubicación: <strong className="text-default-700 dark:text-default-300 ml-1">{selectedTankForUi.location || 'N/A'}</strong>
            </p>
            <p className="inline-flex items-center">
                <BarChart3 className="w-4 h-4 mr-1 text-default-400" />
                Sensores a predecir: <strong className="text-default-700 dark:text-default-300 ml-1">{sensors.length}</strong>
            </p>
            {weatherData.length > 0 && (
                <p className="inline-flex items-center text-blue-500 font-medium">
                    <CloudRain className="w-4 h-4 mr-1" />
                    Clima integrado ({horizon} días)
                </p>
            )}
        </div>
      )}

      {/* Resumen General */}
      {Object.keys(resultsBySensor).length > 0 && (
        <PredictionSummary 
          results={resultsBySensor} 
          horizon={horizon}
          weatherData={weatherData}
        />
      )}
      
      {/* Tarjetas de Predicción */}
      <div className="flex flex-col gap-6">
        {renderContent()}
      </div>
    </div>
  );
}
