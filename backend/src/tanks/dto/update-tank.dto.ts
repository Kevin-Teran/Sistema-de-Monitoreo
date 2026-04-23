/**
 * @file update-tank.dto.ts
 * @route backend/src/tanks/dto
 * @description 
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TankStatus } from '@prisma/client';

export class UpdateTankDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(TankStatus)
  @IsOptional()
  status?: TankStatus;
}