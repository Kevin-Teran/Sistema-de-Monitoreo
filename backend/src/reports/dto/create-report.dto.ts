/**
 * @file create-report.dto.ts
 * @route backend/src/reports/dto
 * @description 
 * @author Kevin Mariano 
 * @version 1.0.0 
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';
import { ReportType } from '@prisma/client';

export class CreateReportDto {
  @IsString({ message: 'El título del reporte debe ser un texto.' })
  @IsNotEmpty({ message: 'El título del reporte es obligatorio.' })
  title: string;

  @IsEnum(ReportType, { message: 'El tipo de reporte seleccionado no es válido.' })
  @IsNotEmpty({ message: 'El tipo de reporte es obligatorio.' })
  type: ReportType;
  
  @IsString()
  @IsNotEmpty({ message: 'El ID del tanque es obligatorio.' })
  tankId: string;
  
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  sensorIds?: string[];

  @IsString()
  @IsOptional()
  startDate?: string;
  
  @IsString()
  @IsOptional()
  endDate?: string;
}