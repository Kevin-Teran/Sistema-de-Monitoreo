/**
 * @file update-setting.dto.ts
 * @route backend/src/settings/dto
 * @description Data Transfer Object (DTO) para la actualización de la configuración de un usuario.
 * Utiliza class-validator para garantizar la integridad y el formato de los datos de entrada.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsString, IsBoolean, IsOptional, IsIn, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  /**
   * @public
   * @type {string}
   * @description El nombre completo del usuario. Debe tener al menos 3 caracteres.
   */
  @ApiProperty({ example: 'Juan Roman', description: 'Nombre completo del usuario', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  nombreCompleto?: string;

  /**
   * @public
   * @type {'light' | 'dark'}
   * @description El tema de la aplicación elegido por el usuario.
   */
  @ApiProperty({ example: 'dark', enum: ['light', 'dark'], description: 'Tema visual de la app', required: false })
  @IsOptional()
  @IsIn(['light', 'dark'])
  tema?: 'light' | 'dark';

  /**
   * @public
   * @type {boolean}
   * @description Preferencia para recibir notificaciones por correo electrónico.
   */
  @ApiProperty({ example: true, description: 'Habilitar/deshabilitar notificaciones por email', required: false })
  @IsOptional()
  @IsBoolean()
  notificacionesEmail?: boolean;

  /**
   * @public
   * @type {boolean}
   * @description Preferencia para recibir notificaciones push en la aplicación.
   */
  @ApiProperty({ example: false, description: 'Habilitar/deshabilitar notificaciones push', required: false })
  @IsOptional()
  @IsBoolean()
  notificacionesPush?: boolean;
}