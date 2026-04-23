/**
 * @file analytics.controller.ts
 * @route backend/src/analytics/
 * @description Controlador optimizado con validación mejorada
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Controller, Get, Query, UseGuards, Logger, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, Role, sensors_type as SensorType } from '@prisma/client';
import { AnalyticsFiltersDto, CorrelationFiltersDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * @route GET /analytics/data-range
   * @description Obtiene el rango de fechas de los datos de un usuario
   */
  @Get('data-range')
  async getDataDateRange(
    @CurrentUser() user: User, 
    @Query('userId') userId?: string
  ) {
    try {
      const targetUserId = user.role === Role.ADMIN && userId ? userId : user.id;
      this.logger.log(`📅 [Analytics] Obteniendo rango de datos para usuario: ${targetUserId}`);
      
      return await this.analyticsService.getDataDateRange(targetUserId);
    } catch (error) {
      this.logger.error('❌ [Analytics] Error en getDataDateRange:', error);
      throw new BadRequestException('Error al obtener el rango de fechas de los datos');
    }
  }

  /**
   * @route GET /analytics/kpis
   * @description Obtiene métricas KPI
   */
  @Get('kpis')
  async getKpis(
    @Query() filters: AnalyticsFiltersDto, 
    @CurrentUser() user: User
  ) {
    try {
      this.logger.log(`📊 [Analytics] Usuario ${user.id} solicitando KPIs:`, JSON.stringify(filters));
      
      this.validateBasicFilters(filters);

      return await this.analyticsService.getKpis(filters, user);
    } catch (error) {
      this.logger.error('❌ [Analytics] Error en getKpis:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al obtener las métricas KPI');
    }
  }

  /**
   * @route GET /analytics/time-series
   * @description Obtiene datos de series temporales CON MUESTREO
   */
  @Get('time-series')
  async getTimeSeries(
    @Query() filters: AnalyticsFiltersDto, 
    @CurrentUser() user: User
  ) {
    try {
      this.logger.log(`📈 [Analytics] Usuario ${user.id} solicitando series temporales:`, JSON.stringify(filters));
      
      this.validateBasicFilters(filters);

      const result = await this.analyticsService.getTimeSeries(filters, user);
      
      // Log de metadata útil
      if (result.metadata) {
        this.logger.log(
          `✅ [Analytics] Serie temporal generada: ${result.metadata.returnedPoints} pts (${result.metadata.compressionRatio} del total)`
        );
      }
      
      return result;
    } catch (error) {
      this.logger.error('❌ [Analytics] Error en getTimeSeries:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al obtener los datos de series temporales');
    }
  }

  /**
   * @route GET /analytics/alerts-summary
   * @description Obtiene resumen de alertas
   */
  @Get('alerts-summary')
  async getAlertsSummary(
    @Query() filters: AnalyticsFiltersDto, 
    @CurrentUser() user: User
  ) {
    try {
      this.logger.log(`🚨 [Analytics] Usuario ${user.id} solicitando resumen de alertas:`, JSON.stringify(filters));
      
      this.validateBasicFilters(filters);

      return await this.analyticsService.getAlertsSummary(filters, user);
    } catch (error) {
      this.logger.error('❌ [Analytics] Error en getAlertsSummary:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al obtener el resumen de alertas');
    }
  }

  /**
   * @route GET /analytics/correlations
   * @description Obtiene correlaciones entre sensores
   */
  @Get('correlations')
  async getCorrelations(
    @Query() rawFilters: any, 
    @CurrentUser() user: User
  ) {
    try {
      this.logger.log(`🔗 [Analytics] Usuario ${user.id} solicitando correlaciones RAW:`, JSON.stringify(rawFilters));
      
      const filters: CorrelationFiltersDto = {
        userId: rawFilters.userId || undefined,
        tankId: rawFilters.tankId || undefined,
        sensorId: rawFilters.sensorId || undefined,
        range: rawFilters.range || 'week',
        startDate: rawFilters.startDate || undefined,
        endDate: rawFilters.endDate || undefined,
        sensorTypeX: rawFilters.sensorTypeX || SensorType.TEMPERATURE,
        sensorTypeY: rawFilters.sensorTypeY || SensorType.PH,
      };

      this.logger.log(`🧹 [Analytics] Filtros procesados:`, JSON.stringify(filters));
      
      this.validateCorrelationFiltersManual(filters);

      return await this.analyticsService.getCorrelations(filters, user);
    } catch (error) {
      this.logger.error('❌ [Analytics] Error en getCorrelations:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al obtener los datos de correlación');
    }
  }

  /**
   * @method validateBasicFilters
   * @description Valida filtros básicos de analíticas
   */
  private validateBasicFilters(filters: AnalyticsFiltersDto): void {
    if (filters.sensorType && !Object.values(SensorType).includes(filters.sensorType as SensorType)) {
      throw new BadRequestException(`Tipo de sensor inválido: ${filters.sensorType}`);
    }

    if (filters.range && !['hour', 'day', 'week', 'month', 'year'].includes(filters.range)) {
      throw new BadRequestException(`Rango de tiempo inválido: ${filters.range}`);
    }

    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Las fechas proporcionadas no son válidas');
      }

      if (startDate > endDate) {
        throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }
  }

  /**
   * @method validateCorrelationFiltersManual
   * @description Valida filtros específicos para correlaciones
   */
  private validateCorrelationFiltersManual(filters: CorrelationFiltersDto): void {
    this.validateBasicFilters(filters);

    if (!Object.values(SensorType).includes(filters.sensorTypeX as SensorType)) {
      this.logger.error(`❌ [Analytics] Tipo de sensor X inválido: ${filters.sensorTypeX}`);
      throw new BadRequestException(`Tipo de sensor X inválido: ${filters.sensorTypeX}. Valores válidos: ${Object.values(SensorType).join(', ')}`);
    }

    if (!Object.values(SensorType).includes(filters.sensorTypeY as SensorType)) {
      this.logger.error(`❌ [Analytics] Tipo de sensor Y inválido: ${filters.sensorTypeY}`);
      throw new BadRequestException(`Tipo de sensor Y inválido: ${filters.sensorTypeY}. Valores válidos: ${Object.values(SensorType).join(', ')}`);
    }

    if (filters.sensorTypeX === filters.sensorTypeY) {
      this.logger.error(`❌ [Analytics] Tipos de sensor iguales: X=${filters.sensorTypeX}, Y=${filters.sensorTypeY}`);
      throw new BadRequestException('Los tipos de sensor X e Y deben ser diferentes para realizar una correlación');
    }

    this.logger.log(`✅ [Analytics] Validación de correlación exitosa: X=${filters.sensorTypeX}, Y=${filters.sensorTypeY}`);
  }
}
