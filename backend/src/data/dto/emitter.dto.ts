/**
 * @file emitter.dto.ts
 * @route /backend/src/data/dto
 * @description DTO para validar el cuerpo de la petición al iniciar o detener simuladores.
 * Debe contener un array de IDs de sensores.
 * @author Kevin Mariano
 * @version 1.2.0 
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsArray, IsString, IsNotEmpty } from 'class-validator';

/**
 * @class EmitterControlDto
 * @description DTO para validar el cuerpo de la petición al iniciar o detener simuladores.
 * Debe contener un array de IDs de sensores.
 */
export class EmitterControlDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  sensorIds: string[];
}