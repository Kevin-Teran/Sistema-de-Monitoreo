/**
 * @file jwt-refresh.guard
 * @route backend/src/auth/guards
 * @description Un guard que protege la ruta de refresco de token, utilizando la estrategia 'jwt-refresh'.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * @guard JwtRefreshGuard
 * @description Un guard que protege la ruta de refresco de token, utilizando la estrategia 'jwt-refresh'.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}