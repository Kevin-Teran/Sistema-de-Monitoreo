/**
 * @file dashboard.service.ts
 * @route backend/src/dashboard/
 * @description Servicio corregido y optimizado para el dashboard con datos reales y estructurados
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TankStatus, SensorStatus, sensors_type as SensorTypePrisma } from '@prisma/client';
import { subDays, endOfDay, startOfDay, parseISO, isValid } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly TIME_ZONE = 'America/Bogota';

  constructor(private prisma: PrismaService) {}

  /**
   * @method getSummaryStats
   * @description Obtiene estadísticas de resumen estructuradas correctamente
   */
  async getSummaryStats(userId: string) {
    try {
      this.logger.log(`📊 Obteniendo resumen para usuario: ${userId}`);

      const [activeTanks, activeSensors, totalAlerts, pendingAlerts, totalDataPoints] = await Promise.all([
        this.prisma.tank.count({
          where: { userId, status: TankStatus.ACTIVE },
        }),
        this.prisma.sensor.count({
          where: { tank: { userId }, status: SensorStatus.ACTIVE },
        }),
        this.prisma.alert.count({
          where: { userId },
        }),
        this.prisma.alert.count({
          where: { userId, resolved: false },
        }),
        this.prisma.sensorData.count({
          where: { sensor: { tank: { userId } } },
        }),
      ]);

      const summary = {
        tanksCount: activeTanks,
        sensorsCount: activeSensors,
        recentAlerts: pendingAlerts,
        totalAlerts,
        totalDataPoints,
      };

      this.logger.log(`✅ Resumen obtenido: ${JSON.stringify(summary)}`);
      return summary;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo resumen: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * @method getRealtimeData
   * @description Obtiene datos en tiempo real agrupados por tipo de sensor
   */
  async getRealtimeData(tankId: string) {
    try {
      this.logger.log(`⚡ Obteniendo datos en tiempo real para tanque: ${tankId}`);

      if (!tankId) {
        throw new NotFoundException('Se requiere tankId para obtener datos en tiempo real');
      }

      const tank = await this.prisma.tank.findUnique({
        where: { id: tankId },
        select: { id: true, name: true, userId: true },
      });

      if (!tank) {
        throw new NotFoundException(`Tanque con ID ${tankId} no encontrado`);
      }

      const sensors = await this.prisma.sensor.findMany({
        where: {
          tankId,
          status: SensorStatus.ACTIVE,
        },
        include: {
          tank: {
            select: {
              id: true,
              name: true,
              userId: true,
            },
          },
        },
      });

      if (sensors.length === 0) {
        this.logger.warn(`⚠️ No hay sensores activos para el tanque ${tankId}`);
        return {
          TEMPERATURE: [],
          PH: [],
          OXYGEN: [],
        };
      }

      const realtimeData = await Promise.all(
        sensors.map(async (sensor) => {
          const latestData = await this.prisma.sensorData.findFirst({
            where: { sensorId: sensor.id },
            orderBy: { timestamp: 'desc' },
            select: {
              value: true,
              timestamp: true,
            },
          });

          if (!latestData) return null;

          return {
            sensorId: sensor.id,
            sensorName: sensor.name,
            tankName: sensor.tank.name,
            value: latestData.value,
            timestamp: latestData.timestamp.toISOString(),
            hardwareId: sensor.hardwareId,
            type: sensor.type,
          };
        }),
      );

      const validData = realtimeData.filter((d) => d !== null);

      const groupedData = {
        TEMPERATURE: validData.filter((d) => d.type === 'TEMPERATURE'),
        PH: validData.filter((d) => d.type === 'PH'),
        OXYGEN: validData.filter((d) => d.type === 'OXYGEN'),
      };

      this.logger.log(
        `✅ Datos en tiempo real obtenidos: ${validData.length} lecturas de ${sensors.length} sensores`,
      );

      return groupedData;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo datos en tiempo real: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * @method getChartData
   * @description Obtiene datos históricos formateados para gráficos
   */
  async getChartData(
    tankId: string,
    sensorType: SensorTypePrisma,
    range: string,
    startDate?: string,
    endDate?: string,
  ) {
    try {
      this.logger.log(`📈 Obteniendo datos históricos: tanque=${tankId}, tipo=${sensorType}, rango=${range}`);

      if (!tankId) {
        throw new NotFoundException('Se requiere tankId para obtener datos históricos');
      }

      const dateFilter = this.getDateFilter(range, startDate, endDate);

      const whereClause: any = {
        tankId,
        timestamp: dateFilter,
        sensor: {
          status: SensorStatus.ACTIVE,
        },
      };

      if (sensorType) {
        whereClause.sensor.type = sensorType;
      }

      const data = await this.prisma.sensorData.findMany({
        where: whereClause,
        orderBy: { timestamp: 'asc' },
        select: {
          timestamp: true,
          value: true,
          type: true,
        },
        take: 5000, 
      });

      const groupedData: Record<string, Array<{ time: string; value: number }>> = {
        TEMPERATURE: [],
        PH: [],
        OXYGEN: [],
      };

      data.forEach((d) => {
        const sensorTypeKey = d.type.toString();
        if (groupedData[sensorTypeKey]) {
          groupedData[sensorTypeKey].push({
            time: d.timestamp.toISOString(),
            value: d.value,
          });
        }
      });

      this.logger.log(
        `✅ Datos históricos obtenidos: TEMP=${groupedData.TEMPERATURE.length}, PH=${groupedData.PH.length}, O2=${groupedData.OXYGEN.length}`,
      );

      return groupedData;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo datos históricos: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * @method getDateFilter
   * @description Genera filtro de fechas con validación robusta
   */
  private getDateFilter(
    range?: string,
    startDate?: string,
    endDate?: string,
  ): { gte: Date; lte: Date } {
    if (startDate && endDate) {
      const start = this.parseDateBoundary(startDate, 'start');
      const end = this.parseDateBoundary(endDate, 'end');

      if (isValid(start) && isValid(end)) {
        this.logger.log(`📅 Usando rango de fechas personalizado: ${startDate} - ${endDate}`);
        return { gte: start, lte: end };
      }
    }

    const now = new Date();
    let filter: { gte: Date; lte: Date };

    switch (range) {
      case 'day':
        filter = { gte: startOfDay(now), lte: endOfDay(now) };
        break;
      case 'month':
        filter = { gte: subDays(now, 30), lte: now };
        break;
      case 'year':
        filter = { gte: subDays(now, 365), lte: now };
        break;
      case 'week':
      default:
        filter = { gte: subDays(now, 7), lte: now };
        break;
    }

    this.logger.log(`📅 Usando rango predefinido: ${range || 'week'}`);
    return filter;
  }

  private parseDateBoundary(value: string, boundary: 'start' | 'end'): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const time = boundary === 'start' ? '00:00:00.000' : '23:59:59.999';
      return fromZonedTime(`${value}T${time}`, this.TIME_ZONE);
    }

    const parsed = parseISO(value);
    return boundary === 'start' ? startOfDay(parsed) : endOfDay(parsed);
  }
}
