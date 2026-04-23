/**
 * @file jwt-refresh.strategy.ts
 * @route backend/src/auth/strategies
 * @description Extrae el refresh token de la cookie 'refresh_token'.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * @function refreshTokenCookieExtractor
 * @description Extrae el refresh token de la cookie 'refresh_token'.
 */
const refreshTokenCookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['refresh_token'] || null;
  }
  return null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: refreshTokenCookieExtractor, 
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}