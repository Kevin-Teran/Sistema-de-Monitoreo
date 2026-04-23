/**
 * @file create-sensor.dto.ts
 * @route backend/src/sensors/dto
 * @description Define la estructura y validaciones para crear un nuevo sensor.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsString, IsNotEmpty, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { sensors_type } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @class CreateSensorDto
 * @description Define la estructura y validaciones para crear un nuevo sensor.
 */
export class CreateSensorDto {
  /**
   * @property {string} name - Nombre descriptivo del sensor.
   * @example "Sensor de pH Piscina Tilapias"
   */
  @ApiProperty({ description: 'Nombre descriptivo del sensor.', example: 'Sensor de pH Piscina Tilapias' })
  @IsString({ message: 'El nombre debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre del sensor es obligatorio.' })
  name: string;

  /**
   * @property {string} hardwareId - Identificador único del hardware físico del sensor.
   * @example "ph-sensor-xyz-123"
   */
  @ApiProperty({ description: 'Identificador único del hardware del sensor.', example: 'ph-sensor-xyz-123' })
  @IsString({ message: 'El ID de hardware debe ser un texto.' })
  @IsNotEmpty({ message: 'El ID de hardware es obligatorio.' })
  hardwareId: string;

  /**
   * @property {sensors_type} type - El tipo de medición que realiza el sensor.
   * @enum sensors_type
   * @example "PH"
   */
  @ApiProperty({ enum: sensors_type, description: 'Tipo de sensor.', example: 'PH' })
  @IsEnum(sensors_type, { message: 'El tipo de sensor no es válido.' })
  type: sensors_type;

  /**
   * @property {string} tankId - ID del tanque al que está asociado el sensor.
   * @example "clp7a8q9w0000dc08z1z1z1z1"
   */
  @ApiProperty({ description: 'ID del tanque al que está asociado el sensor.', example: 'clp7a8q9w0000dc08z1z1z1z1' })
  @IsString()
  @IsNotEmpty({ message: 'Debe seleccionar un tanque para el sensor.' })
  tankId: string;

  /**
   * @property {string} calibrationDate - Fecha de la última calibración en formato ISO 8601.
   * @example "2025-08-25T10:00:00.000Z"
   */
  @ApiProperty({ description: 'Fecha de la última calibración.', example: '2025-08-25T10:00:00.000Z', required: false })
  @IsDateString({}, { message: 'La fecha de calibración debe ser una fecha válida.' })
  @IsOptional() 
  calibrationDate: string;
}