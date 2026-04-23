/**
 * @file login.dto.ts
 * @route backend/src/auth/dto
 * @description
 * Define la estructura de datos y las reglas de validación para el cuerpo (body)
 * de la solicitud de inicio de sesión. Incluye las credenciales del usuario y
 * una opción para mantener la sesión activa.
 * @author kevin mariano
 * @version 1.0.9
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsEmail, IsNotEmpty, IsString, MinLength, IsBoolean, IsOptional } from 'class-validator';

/**
 * @class LoginDto
 * @description
 * Objeto de Transferencia de Datos (DTO) que encapsula la información necesaria para
 * que un usuario inicie sesión en el sistema.
 */
export class LoginDto {
  /**
   * La dirección de correo electrónico del usuario. Debe ser un email válido.
   * @type {string}
   * @public
   * @example 'usuario@example.com'
   */
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo electrónico no puede estar vacío.' })
  email: string;

  /**
   * La contraseña del usuario. Debe tener al menos 6 caracteres.
   * @type {string}
   * @public
   * @example 'PasswordSegura123'
   */
  @IsString()
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  /**
   * Campo opcional para indicar si el usuario desea que su sesión persista
   * después de cerrar el navegador.
   * @type {boolean | undefined}
   * @public
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}