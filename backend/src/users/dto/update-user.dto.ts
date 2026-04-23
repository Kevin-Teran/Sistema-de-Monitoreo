/**
 * @file update-user.dto.ts
 * @route backend/src/users/dto
 * @description DTO para validar los datos al actualizar un usuario. Todos los campos son opcionales.
 * @author Kevin Mariano 
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsEmail, IsString, IsOptional, MinLength, IsEnum } from 'class-validator';
import { Role, users_status } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @class UpdateUserDto
 * @description DTO para validar los datos al actualizar un usuario. Todos los campos son opcionales.
 */
export class UpdateUserDto {
  @ApiProperty({ description: 'El nombre completo del usuario.', example: 'Johnathan Doe', required: false })
  @IsString({ message: 'El nombre debe ser un texto.' })
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'La dirección de correo electrónico del usuario.', example: 'john.doe@new-email.com', required: false })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido.' })
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'La nueva contraseña del usuario (mínimo 6 caracteres).', example: 'newStrongPassword456', required: false })
  @IsString({ message: 'La contraseña debe ser un texto.' })
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' })
  @IsOptional()
  password?: string;

  @ApiProperty({ description: 'El rol del usuario en el sistema.', enum: Role, required: false })
  @IsEnum(Role, { message: 'El rol seleccionado no es válido.' })
  @IsOptional()
  role?: Role;

  @ApiProperty({ description: 'El estado del usuario (activo o inactivo).', enum: users_status, required: false })
  @IsEnum(users_status, { message: 'El estado seleccionado no es válido.' })
  @IsOptional()
  status?: users_status;
}