/**
 * @file update-sensor.dto.ts
 * @route backend/src/sensors/dto
 * @description Data Transfer Object (DTO) para la actualización parcial de un sensor.
 * Define la estructura y las validaciones para los datos que se pueden modificar.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { SensorStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @class UpdateSensorDto
 * @description Define el cuerpo de la solicitud para actualizar un sensor existente.
 * Todas las propiedades son opcionales, permitiendo actualizaciones parciales.
 */
export class UpdateSensorDto {
  /**
   * @property name
   * @description El nuevo nombre del sensor. Debe ser una cadena de texto.
   */
  @ApiProperty({
    description: 'El nuevo nombre del sensor.',
    example: 'Sensor de pH Piscina Principal',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * @property status
   * @description El nuevo estado del sensor.
   */
  @ApiProperty({
    description: 'El nuevo estado del sensor.',
    enum: SensorStatus,
    example: SensorStatus.MAINTENANCE,
    required: false,
  })
  @IsEnum(SensorStatus)
  @IsOptional()
  status?: SensorStatus;

  /**
   * @property calibrationDate
   * @description La nueva fecha de la última calibración del sensor.
   */
  @ApiProperty({
    description: 'La nueva fecha de la última calibración (formato ISO 8601).',
    example: '2025-08-27T10:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  calibrationDate?: string; 

  /**
   * @property tankId
   * @description El ID del nuevo tanque al que se asignará el sensor.
   */
  @ApiProperty({
    description: 'El ID del nuevo tanque al que se reasignará el sensor.',
    example: 'cly3s7o4p0000_fake_id_12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  tankId?: string;
}