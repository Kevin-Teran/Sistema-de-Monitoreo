/**
 * @file predictions.service.ts
 * @route backend/src/predictions
 * @description Servicio de predicciones CORREGIDO para manejar umbrales correctamente
 * @author Kevin Mariano
 * @version 1.1.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

 import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeneratePredictionDto } from './dto/generate-prediction.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SensorData, sensors_type as SensorType } from '@prisma/client';

type PredictionHistoryPoint = Pick<SensorData, 'timestamp' | 'value' | 'type'>;

export interface ThresholdValues {
  minCritical: number;
  minWarning: number;
  maxWarning: number;
  maxCritical: number;
}

@Injectable()
export class PredictionsService {
  private readonly weatherApiKey: string;
  private readonly logger = new Logger(PredictionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.weatherApiKey = this.configService.get<string>(
      'OPENWEATHERMAP_API_KEY',
    );
  }

  async generatePrediction(generatePredictionDto: GeneratePredictionDto) {
    const { tankId, type, horizon, weatherLocation } = generatePredictionDto;

    // Obtener tanque y usuario
    const tank = await this.prisma.tank.findUnique({
      where: { id: tankId },
      include: { user: true },
    });

    if (!tank) {
      throw new NotFoundException(`Tanque con ID "${tankId}" no encontrado.`);
    }

    if (!tank.userId) {
      throw new BadRequestException('El tanque no está asociado a un usuario.');
    }

    // Verificar que el tanque tiene un sensor del tipo especificado
    const hasSensor = await this.prisma.sensor.findFirst({ 
      where: { tankId, type: type as SensorType }
    });

    if (!hasSensor) {
      throw new BadRequestException(`El tanque no tiene un sensor del tipo ${type}.`);
    }

    // Obtener datos históricos
    const historicalDataDesc = await this.prisma.sensorData.findMany({
      where: { sensorId: hasSensor.id },
      orderBy: { timestamp: 'desc' },
      take: 1000,
      select: {
        id: true,
        value: true,
        type: true,
        timestamp: true,
      },
    });
    const historicalData = historicalDataDesc.reverse();

    if (historicalData.length < 2) {
      return {
        message: `No hay suficientes datos históricos (se requieren al menos 2).`,
        predicted: [],
        historical: historicalData,
        thresholds: null,
      };
    }

    // ✅ CORREGIDO: Obtener umbrales desde user.settings
    const thresholds = this.parseThresholdsFromSettings(tank.user.settings, type);

    if (!thresholds) {
      this.logger.warn(`No se encontraron umbrales para ${type}, usando valores por defecto`);
    }

    // Generar predicción
    let predictionResult = [];
    
    if (
      type === SensorType.TEMPERATURE &&
      this.weatherApiKey &&
      (weatherLocation || tank.location) &&
      /^-?\d+\.\d+,-?\d+\.\d+$/.test(weatherLocation || tank.location)
    ) {
      try {
        const locationToUse = weatherLocation || tank.location;
        const weatherForecast = await this.getWeatherForecast(
          locationToUse,
          horizon,
        );
        predictionResult = this.createWeatherPrediction(
          historicalData,
          weatherForecast,
        );
      } catch (error) {
        this.logger.warn(`Fallo en API de clima, usando predicción estadística: ${error.message}`);
        predictionResult = this.createStatisticalPrediction(historicalData, horizon);
      }
    } else {
      predictionResult = this.createStatisticalPrediction(historicalData, horizon);
    }

    return {
      historical: historicalData,
      predicted: predictionResult,
      message: 'Predicción generada exitosamente.',
      thresholds,
    };
  }

  /**
   * ✅ NUEVA FUNCIÓN: Parsear umbrales desde user.settings
   * Formato esperado en settings:
   * {
   *   "thresholds": {
   *     "temperature": { "min": 19, "max": 30 },
   *     "ph": { "min": 6.5, "max": 7 },
   *     "oxygen": { "min": 5, "max": 7 }
   *   }
   * }
   */
  private parseThresholdsFromSettings(
    settings: any,
    sensorType: SensorType
  ): ThresholdValues | null {
    try {
      // Si settings es string, parsearlo
      let parsedSettings = settings;
      if (typeof settings === 'string') {
        parsedSettings = JSON.parse(settings);
      }

      if (!parsedSettings?.thresholds) {
        return null;
      }

      // Mapear tipo de sensor a key en settings (minúsculas)
      const sensorKey = sensorType.toLowerCase();
      const thresholdData = parsedSettings.thresholds[sensorKey];

      if (!thresholdData || typeof thresholdData.min !== 'number' || typeof thresholdData.max !== 'number') {
        return null;
      }

      // Expandir min/max a estructura completa con zonas
      return this.expandThresholds(thresholdData.min, thresholdData.max);
      
    } catch (error) {
      this.logger.error('Error parseando umbrales:', error);
      return null;
    }
  }

  /**
   * ✅ NUEVA FUNCIÓN: Expandir umbrales simples a estructura completa
   * Agrega zonas de warning y critical automáticamente
   */
  private expandThresholds(min: number, max: number): ThresholdValues {
    const range = max - min;
    const criticalMargin = range * 0.2; // 20% de margen para crítico
    const warningMargin = range * 0.1;  // 10% de margen para warning

    return {
      minCritical: parseFloat((min - criticalMargin).toFixed(2)),
      minWarning: parseFloat((min - warningMargin).toFixed(2)),
      maxWarning: parseFloat((max + warningMargin).toFixed(2)),
      maxCritical: parseFloat((max + criticalMargin).toFixed(2)),
    };
  }

  private async getWeatherForecast(location: string, days: number) {
    const [lat, lon] = location.split(',');
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&appid=${this.weatherApiKey}&units=metric`;
    
    const response = await firstValueFrom(this.httpService.get(url));
    
    if (!response.data?.daily) {
      throw new Error('Respuesta inválida de la API de OpenWeatherMap.');
    }
    
    return response.data.daily.slice(1, days + 1).map((day: any) => ({
      date: new Date(day.dt * 1000),
      temp_max: day.temp.max,
    }));
  }

  private createWeatherPrediction(
    historicalData: PredictionHistoryPoint[],
    weatherForecast: any[],
  ) {
    const { trend, valueAtToday } = this.calculateTrend(historicalData);
    const predictedData = [{ 
      timestamp: new Date(), 
      value: parseFloat(valueAtToday.toFixed(2)) 
    }];
    
    let lastPredictedValue = valueAtToday;
    
    weatherForecast.forEach((day, i) => {
      const newTimestamp = new Date(new Date().getTime() + 86400000 * (i + 1));
      const weatherInfluence = day.temp_max;
      const predictedValue = lastPredictedValue * 0.4 + weatherInfluence * 0.5 + (trend * 86400000 * 0.1);
      
      predictedData.push({
        timestamp: newTimestamp,
        value: parseFloat(predictedValue.toFixed(2)),
      });
      
      lastPredictedValue = predictedValue;
    });
    
    return predictedData;
  }

  private createStatisticalPrediction(
    historicalData: PredictionHistoryPoint[],
    horizonDays: number,
  ) {
    const { valueAtToday, trend } = this.calculateTrend(historicalData);
    const predictedData = [{ 
      timestamp: new Date(), 
      value: parseFloat(valueAtToday.toFixed(2)) 
    }];
    
    let lastPredictedValue = valueAtToday;
    
    for (let i = 1; i <= horizonDays; i++) {
      const newTimestamp = new Date(new Date().getTime() + 86400000 * i);
      const predictedValue = lastPredictedValue + trend * 86400000;
      const noiseFactor = historicalData[historicalData.length-1].type === SensorType.PH ? 0.005 : 0.02;
      const noise = (Math.random() - 0.5) * (lastPredictedValue * noiseFactor);
      const finalValue = parseFloat((predictedValue + noise).toFixed(2));
      
      predictedData.push({ timestamp: newTimestamp, value: finalValue });
      lastPredictedValue = finalValue;
    }
    
    return predictedData;
  }

  private calculateTrend(historicalData: PredictionHistoryPoint[]) {
    const lastPoint = historicalData[historicalData.length - 1];
    const firstPoint = historicalData[0];
    const timeDiff = lastPoint.timestamp.getTime() - firstPoint.timestamp.getTime();
    const valueDiff = lastPoint.value - firstPoint.value;
    const trend = timeDiff > 0 ? valueDiff / timeDiff : 0;
    const timeSinceLastPoint = new Date().getTime() - lastPoint.timestamp.getTime();
    const valueAtToday = lastPoint.value + trend * timeSinceLastPoint;
    
    return { trend, valueAtToday };
  }
}
