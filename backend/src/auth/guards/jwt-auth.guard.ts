/**
 * @file jwt-auth.guard.ts
 * @route backend/src/auth/guards
 * @description Guardián de autenticación que protege las rutas de la aplicación.
 * @author kevin mariano
 * @version 1.0.9
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determina si la ruta actual puede ser activada.
   * Primero, comprueba si la ruta está marcada como pública con el decorador @Public.
   * Si es pública, permite el acceso. De lo contrario, procede con la validación JWT de Passport.
   *
   * @param {ExecutionContext} context - El contexto de la ejecución de la petición.
   * @returns {boolean | Promise<boolean> | Observable<boolean>}
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; 
    }

    return super.canActivate(context);
  }
}