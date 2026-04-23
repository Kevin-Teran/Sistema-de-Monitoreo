/**
 * @file forgot-password.dto.ts
 * @route backend/src/auth/dto
 * @description  
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Por favor, introduce una dirección de correo electrónico válida.' })
  @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío.' })
  email: string;
}