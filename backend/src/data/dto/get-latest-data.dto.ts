/**
 * @file get-latest-data.dto.ts
 * @route /backend/src/data/dto
 * @description
 * @author Kevin Mariano
 * @version 1.2.0 
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsOptional, IsString, IsEnum } from 'class-validator';
import { sensors_type } from '@prisma/client';

export class GetLatestDataDto {
  @IsOptional()
  @IsString()
  tankId?: string;

  @IsOptional()
  @IsEnum(sensors_type)
  type?: sensors_type;
}