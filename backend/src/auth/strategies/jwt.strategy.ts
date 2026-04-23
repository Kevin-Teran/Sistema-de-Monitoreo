/**
 * @file jwt.strategy.ts
 * @route backend/src/auth/strategies
 * @description Estrategia de Passport.js para validar tokens de acceso JWT.
 * Se encarga de extraer el token tanto de la cabecera de autorización como de cookies,
 * verificar su firma y extraer el payload del usuario para adjuntarlo a la petición.
 * @author kevin mariano
 * @version 1.0.0 
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User } from '@prisma/client';
import { Request } from 'express';

/**
 * @function cookieExtractor
 * @description Función personalizada para extraer el JWT de cookies.
 * @param {Request} req - Objeto de solicitud de Express
 * @returns {string | null} El token extraído o null si no existe
 */
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['access_token'] || null;
  }
  return null;
};

/**
 * @function combinedExtractor
 * @description Extractor combinado que busca el token primero en cookies, 
 * luego en el header Authorization.
 * @param {Request} req - Objeto de solicitud de Express
 * @returns {string | null} El token extraído o null si no existe
 */
const combinedExtractor = (req: Request): string | null => {
  // Primero intenta extraer de cookies
  const fromCookie = cookieExtractor(req);
  if (fromCookie) {
    return fromCookie;
  }
  
  // Si no hay cookie, intenta extraer del header Authorization
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

/**
 * @class JwtStrategy
 * @description Implementa la lógica de validación de tokens JWT para proteger rutas.
 * @extends {PassportStrategy(Strategy)}
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * @constructor
   * @param {ConfigService} configService - Servicio para acceder a variables de entorno.
   * @param {UsersService} usersService - Servicio para interactuar con la base de datos de usuarios.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: combinedExtractor, // ✅ Usar el extractor combinado
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * @function validate
   * @description Método que se ejecuta después de que el token es decodificado y verificado con éxito.
   * @param {any} payload - El payload decodificado del JWT (generalmente { sub: userId, email: userEmail }).
   * @returns {Promise<User>} El objeto de usuario completo que se adjuntará a `request.user`.
   * @throws {UnauthorizedException} Si el usuario extraído del payload ya no existe.
   */
  async validate(payload: any): Promise<User> {
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Token inválido: el usuario no fue encontrado.');
    }

    return user;
  }
}