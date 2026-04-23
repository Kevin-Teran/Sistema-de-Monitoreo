/**
 * @file reset-password.dto.ts
 * @route backend/src/auth/dto
 * @description  
 * @author Kevin Mariano
 * @version 1.0.9
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'El token es requerido.' })
  token: string;

  @IsNotEmpty({ message: 'La nueva contraseña no puede estar vacía.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número o símbolo.',
  })
  password: string;
}