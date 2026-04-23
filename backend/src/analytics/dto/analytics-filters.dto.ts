/**
 * @file analytics-filters.dto.ts
 * @route backend/src/analytics/dto/
 * @description DTO para los filtros de las consultas de analíticas.
 * @author kevin mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsOptional, IsString, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { sensors_type } from '@prisma/client';

export class AnalyticsFiltersDto {
  /**
   * @description ID del usuario (opcional, solo para administradores).
   * @example 'clx...'
   */
  @IsOptional()
  @IsString()
  userId?: string;

  /**
   * @description ID del tanque (opcional).
   * @example 'clx...'
   */
  @IsOptional()
  @IsString()
  tankId?: string;

  /**
   * @description ID del sensor específico (opcional).
   * @example 'clx...'
   */
  @IsOptional()
  @IsString()
  sensorId?: string;

  /**
   * @description Tipo de sensor (opcional).
   * @enum {sensors_type}
   * @example sensors_type.TEMPERATURE
   */
  @IsOptional()
  @IsEnum(sensors_type)
  sensorType?: sensors_type;

  /**
   * @description Rango de tiempo para la consulta (día, semana, mes, año).
   * @example 'week'
   */
  @IsOptional()
  @IsString()
  range?: string;

  /**
   * @description Fecha de inicio para el rango de la consulta.
   * @example '2025-01-01T00:00:00.000Z'
   */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /**
   * @description Fecha de fin para el rango de la consulta.
   * @example '2025-01-31T23:59:59.999Z'
   */
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * @description Factor de muestreo progresivo (N: tomar 1 de N).
   * @example 5
   */
  @IsOptional()
  @IsNumber()
  samplingFactor?: number;
}