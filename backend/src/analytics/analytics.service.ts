/**
 * @file analytics.service.ts
 * @route backend/src/analytics/
 * @description Servicio de analíticas OPTIMIZADO con muestreo inteligente
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsFiltersDto } from './dto/analytics-filters.dto';
import { User, Role, Prisma, sensors_type as SensorTypePrisma } from '@prisma/client';
import { CorrelationFiltersDto } from './dto/correlation-filters.dto';
import { subDays, subHours, startOfDay, endOfDay, subMonths, subYears, parseISO, isValid } from 'date-fns';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly MAX_POINTS = 500; // Máximo de puntos a retornar

  constructor(private prisma: PrismaService) {}

  /**
   * @method getDataDateRange
   * @description Obtiene el rango de fechas de los datos para un usuario específico.
   */
  async getDataDateRange(userId: string) {
    try {
      const aggregations = await this.prisma.sensorData.aggregate({
        where: { sensor: { tank: { userId } } },
        _min: { timestamp: true },
        _max: { timestamp: true },
      });

      return {
        firstDataPoint: aggregations._min.timestamp,
        lastDataPoint: aggregations._max.timestamp,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo rango de fechas para usuario ${userId}:`, error);
      return {
        firstDataPoint: null,
        lastDataPoint: null,
      };
    }
  }

  /**
   * @method calculateOptimalSampling
   * @description Calcula el factor de muestreo óptimo basado en la cantidad de datos
   */
  private calculateOptimalSampling(totalPoints: number, maxPoints: number = this.MAX_POINTS): number {
    if (totalPoints <= maxPoints) return 1;
    return Math.ceil(totalPoints / maxPoints);
  }

  /**
   * @method applySampling
   * @description Aplica muestreo uniforme a los datos
   */
  private applySampling<T>(data: T[], samplingFactor: number): T[] {
    if (samplingFactor <= 1 || data.length === 0) return data;
    
    // Muestreo uniforme: toma cada N-ésimo elemento
    const sampled = data.filter((_, index) => index % samplingFactor === 0);
    
    // Siempre incluir el último punto para continuidad visual
    if (data.length > 0 && !sampled.includes(data[data.length - 1])) {
      sampled.push(data[data.length - 1]);
    }
    
    return sampled;
  }

  /**
   * @method getKpis
   * @description Obtiene las métricas KPI con validación mejorada
   */
  async getKpis(filters: AnalyticsFiltersDto, user: User) {
    try {
      const where = this.buildWhereClause(filters, user);
      
      const aggregations = await this.prisma.sensorData.aggregate({
        where,
        _avg: { value: true },
        _max: { value: true },
        _min: { value: true },
        _count: { value: true },
      });

      if (!aggregations._count.value) {
        return {
          average: null,
          max: null,
          min: null,
          count: 0,
          stdDev: null,
        };
      }

      const variance = await this.calculateVariance(where);

      return {
        average: aggregations._avg.value,
        max: aggregations._max.value,
        min: aggregations._min.value,
        count: aggregations._count.value,
        stdDev: variance > 0 ? Math.sqrt(variance) : 0,
      };
    } catch (error) {
      this.logger.error('Error obteniendo KPIs:', error);
      throw new BadRequestException('Error al obtener las métricas KPI');
    }
  }

  /**
   * @method getTimeSeries
   * @description Obtiene datos de series temporales CON MUESTREO INTELIGENTE
   */
  async getTimeSeries(filters: AnalyticsFiltersDto, user: User) {
    try {
      const where = this.buildWhereClause(filters, user);
      
      // 1️⃣ Contar total de puntos
      const totalCount = await this.prisma.sensorData.count({ where });
      
      // 2️⃣ Calcular muestreo óptimo
      const samplingFactor = this.calculateOptimalSampling(totalCount);
      
      this.logger.log(
        `📊 [TimeSeries] Total: ${totalCount} pts | Muestreo: 1:${samplingFactor} | Retorno: ~${Math.ceil(totalCount / samplingFactor)} pts`
      );
      
      // 3️⃣ Obtener TODOS los datos (necesario para muestreo uniforme)
      const allData = await this.prisma.sensorData.findMany({
        where,
        orderBy: { timestamp: 'asc' },
        select: { 
          timestamp: true, 
          value: true, 
          type: true,
          sensor: { 
            select: { 
              name: true, 
              type: true,
              hardwareId: true,
            } 
          } 
        },
      });

      // 4️⃣ Aplicar muestreo
      const sampledData = this.applySampling(allData, samplingFactor);
      
      this.logger.log(`✅ [TimeSeries] Retornando: ${sampledData.length} puntos`);
      
      // 5️⃣ Retornar con metadata
      return {
        data: sampledData,
        metadata: {
          totalPoints: totalCount,
          returnedPoints: sampledData.length,
          samplingFactor,
          compressionRatio: totalCount > 0 ? (sampledData.length / totalCount * 100).toFixed(1) + '%' : '100%',
        }
      };
    } catch (error) {
      this.logger.error('Error obteniendo series temporales:', error);
      throw new BadRequestException('Error al obtener los datos de series temporales');
    }
  }

  /**
   * @method getAlertsSummary
   * @description Obtiene un resumen de alertas agrupadas por tipo y severidad.
   */
  async getAlertsSummary(filters: AnalyticsFiltersDto, user: User) {
    try {
      const targetUserId = this.resolveTargetUserId(filters.userId, user);
      const dateFilter = this.getDateFilter(filters.range, filters.startDate, filters.endDate);

      const alerts = await this.prisma.alert.findMany({
        where: {
          sensor: { tank: { userId: targetUserId } },
          createdAt: dateFilter,
        },
        select: {
          type: true,
          severity: true,
        },
      });

      const alertsByType = Object.values(
        alerts.reduce((acc, alert) => {
          acc[alert.type] = acc[alert.type] || { type: alert.type, _count: { type: 0 } };
          acc[alert.type]._count.type += 1;
          return acc;
        }, {} as Record<string, { type: string; _count: { type: number } }>)
      );

      const alertsBySeverity = Object.values(
        alerts.reduce((acc, alert) => {
          acc[alert.severity] = acc[alert.severity] || { severity: alert.severity, _count: { severity: 0 } };
          acc[alert.severity]._count.severity += 1;
          return acc;
        }, {} as Record<string, { severity: string; _count: { severity: number } }>)
      );

      return { alertsByType, alertsBySeverity };
    } catch (error) {
      this.logger.error('Error obteniendo resumen de alertas:', error);
      return { alertsByType: [], alertsBySeverity: [] };
    }
  }

  /**
   * @method getCorrelations
   * @description Obtiene datos de correlación entre dos tipos de sensores CON MUESTREO
   */
  async getCorrelations(filters: CorrelationFiltersDto, user: User) {
    try {
      this.logger.log('🔗 [Correlations] Procesando con filtros:', JSON.stringify(filters));

      const sensorTypeX = filters.sensorTypeX || SensorTypePrisma.TEMPERATURE;
      const sensorTypeY = filters.sensorTypeY || SensorTypePrisma.PH;

      if (!Object.values(SensorTypePrisma).includes(sensorTypeX as any)) {
        throw new BadRequestException(`Tipo de sensor X inválido: ${sensorTypeX}`);
      }

      if (!Object.values(SensorTypePrisma).includes(sensorTypeY as any)) {
        throw new BadRequestException(`Tipo de sensor Y inválido: ${sensorTypeY}`);
      }

      if (sensorTypeX === sensorTypeY) {
        throw new BadRequestException('Los tipos de sensor X e Y deben ser diferentes para la correlación');
      }

      const targetUserId = this.resolveTargetUserId(filters.userId, user);
      const dateFilter = this.getDateFilter(filters.range, filters.startDate, filters.endDate);
      const { tankId, sensorId } = filters;

      const baseWhere: Prisma.SensorDataWhereInput = {
        timestamp: dateFilter,
        sensor: {
          tank: {
            userId: targetUserId,
            ...(tankId && tankId !== 'ALL' && { id: tankId }),
          },
          ...(sensorId && sensorId !== 'ALL' && { id: sensorId }),
        },
      };

      const whereX: Prisma.SensorDataWhereInput = {
        ...baseWhere,
        sensor: {
          ...(baseWhere.sensor as Prisma.SensorWhereInput),
          type: sensorTypeX,
        },
      };

      const whereY: Prisma.SensorDataWhereInput = {
        ...baseWhere,
        sensor: {
          ...(baseWhere.sensor as Prisma.SensorWhereInput),
          type: sensorTypeY,
        },
      };

      // Obtener datos con límite razonable
      const [dataX, dataY] = await Promise.all([
        this.prisma.sensorData.findMany({
          where: whereX,
          orderBy: { timestamp: 'asc' },
          select: { value: true, timestamp: true },
          take: 1000, // Límite para correlación
        }),
        this.prisma.sensorData.findMany({
          where: whereY,
          orderBy: { timestamp: 'asc' },
          select: { value: true, timestamp: true },
          take: 1000,
        })
      ]);

      this.logger.log(`📊 [Correlations] Datos obtenidos - X: ${dataX.length}, Y: ${dataY.length}`);

      if (dataX.length === 0 || dataY.length === 0) {
        this.logger.warn('⚠️ [Correlations] No se encontraron datos suficientes');
        return [];
      }

      // Crear mapa de valores Y por timestamp normalizado
      const yMap = new Map(dataY.map((d) => [this.normalizeTimestamp(d.timestamp), d.value]));
      
      // Generar puntos de correlación
      const correlationData = dataX
        .map((dx) => {
          const normalizedTime = this.normalizeTimestamp(dx.timestamp);
          const yValue = yMap.get(normalizedTime);
          return yValue !== undefined ? { x: dx.value, y: yValue } : null;
        })
        .filter((item): item is { x: number; y: number } => item !== null);

      // Aplicar muestreo si hay muchos puntos
      const samplingFactor = this.calculateOptimalSampling(correlationData.length);
      const sampledCorrelation = this.applySampling(correlationData, samplingFactor);

      this.logger.log(
        `✅ [Correlations] Retornando: ${sampledCorrelation.length} puntos (muestreo: 1:${samplingFactor})`
      );

      return sampledCorrelation;

    } catch (error) {
      this.logger.error('❌ [Correlations] Error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al obtener los datos de correlación');
    }
  }

  /**
   * @method buildWhereClause
   * @description Construye la cláusula WHERE con validación mejorada
   */
  private buildWhereClause(
    filters: AnalyticsFiltersDto,
    user: User,
  ): Prisma.SensorDataWhereInput {
    const targetUserId = this.resolveTargetUserId(filters.userId, user);
    const dateFilter = this.getDateFilter(filters.range, filters.startDate, filters.endDate);

    const whereClause: Prisma.SensorDataWhereInput = {
      timestamp: dateFilter,
      sensor: {
        tank: {
          userId: targetUserId,
          ...(filters.tankId && filters.tankId !== 'ALL' && { id: filters.tankId }),
        },
        ...(filters.sensorId && filters.sensorId !== 'ALL' && { id: filters.sensorId }),
        ...(filters.sensorType && { type: filters.sensorType as SensorTypePrisma }),
      },
    };
    
    return whereClause;
  }

  /**
   * @method getDateFilter
   * @description Genera el filtro de fechas basado en el rango especificado
   */
  private getDateFilter(range?: string, startDate?: string, endDate?: string): { gte: Date; lte: Date } {
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      if (isValid(start) && isValid(end)) {
        return { gte: start, lte: end };
      }
    }

    const now = new Date();
    switch (range) {
      case 'hour': return { gte: subHours(now, 1), lte: now };
      case 'day': return { gte: startOfDay(now), lte: endOfDay(now) };
      case 'month': return { gte: subMonths(now, 1), lte: now };
      case 'year': return { gte: subYears(now, 1), lte: now };
      case 'week': 
      default: return { gte: subDays(now, 7), lte: now };
    }
  }

  /**
   * @method resolveTargetUserId
   * @description Resuelve el ID del usuario objetivo basado en permisos
   */
  private resolveTargetUserId(requestedUserId: string | undefined, currentUser: User): string {
    if (currentUser.role === Role.ADMIN && requestedUserId) {
      return requestedUserId;
    }
    return currentUser.id;
  }

  /**
   * @method calculateVariance
   * @description Calcula la varianza de los datos
   */
  private async calculateVariance(where: Prisma.SensorDataWhereInput): Promise<number> {
    try {
      const data = await this.prisma.sensorData.findMany({ 
        where,
        select: { value: true },
        take: 1000, // Límite para cálculo de varianza
      });

      if (data.length < 2) return 0;
      
      const values = data.map(d => d.value);
      const mean = values.reduce((acc, curr) => acc + curr, 0) / values.length;
      const variance = values.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / (values.length - 1);
      
      return variance;
    } catch (error) {
      this.logger.error('Error calculando varianza:', error);
      return 0;
    }
  }

  /**
   * @method normalizeTimestamp
   * @description Normaliza timestamps para permitir correlación con tolerancia de tiempo
   */
  private normalizeTimestamp(timestamp: Date): string {
    const normalized = new Date(timestamp);
    normalized.setSeconds(0, 0); 
    return normalized.toISOString();
  }
}
