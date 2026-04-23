/**
 * @file dashboard-filters.dto.ts
 * @route /backend/src/dashboard/dto
 * @description DTO para filtros del dashboard.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFiltersDto {
  @ApiPropertyOptional({ description: 'ID del usuario para filtrar los datos (generalmente para administradores).' })
  @IsOptional()
  @IsString()
  userId?: string; // <- CORRECCIÓN: Se agrega userId para aceptar el filtro enviado por el frontend.

  @ApiPropertyOptional({ description: 'ID del tanque para filtrar los datos.' })
  @IsOptional()
  @IsString()
  tankId?: string;

  @ApiPropertyOptional({ description: 'Tipo de sensor para filtrar los datos.', enum: ['TEMPERATURE', 'PH', 'OXYGEN'] })
  @IsOptional()
  @IsString()
  sensorType?: 'TEMPERATURE' | 'PH' | 'OXYGEN';

  @ApiPropertyOptional({ description: 'Rango de tiempo para los datos (ej. day, week, month).', enum: ['day', 'week', 'month', 'year'] })
  @IsOptional()
  @IsString()
  range?: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio del rango personalizado.', format: 'date-time' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin del rango personalizado.', format: 'date-time' })
  @IsOptional()
  @IsString()
  endDate?: string;
}