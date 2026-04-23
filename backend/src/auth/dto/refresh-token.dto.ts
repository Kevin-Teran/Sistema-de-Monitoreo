/**
 * @file refresh-token.dto.ts
 * @route backend/src/auth/dto
 * @description  
 * @author Kevin Mariano
 * @version 1.0.9
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { IsNotEmpty, IsString } from 'class-validator';

/**
 * @class RefreshTokenDto
 * @description DTO para validar el cuerpo de la solicitud de refresco de token.
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}