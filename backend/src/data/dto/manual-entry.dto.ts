/**
 * @file manual-entry.dto.ts
 * @route /backend/src/data/dto
 * @description DTO para el registro manual de datos de un sensor.
 * @author Kevin Mariano
 * @version 2.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * @class ManualEntryDto
 * @description Define la estructura para una única entrada de datos manual.
 * El endpoint de la API esperará un array de este tipo: ManualEntryDto[]
 */
export class ManualEntryDto {
  @ApiProperty({ 
    description: 'ID del sensor al que pertenece el dato', 
    example: 'clwz3q0x40000_fake_id_12345' 
  })
  @IsString()
  @IsNotEmpty()
  sensorId: string;

  @ApiProperty({ 
    description: 'Valor numérico de la lectura del sensor', 
    example: 25.5 
  })
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty({ 
    description: 'Fecha y hora de la lectura (opcional, si no se provee se usa la actual)', 
    example: '2025-08-28T10:00:00.000Z', 
    required: false 
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  timestamp?: Date;
}