/**
 * @file roles.guard.ts
 * @route backend/src/auth/guards
 * @description Un guard que protege rutas, permitiendo el acceso solo a usuarios
 * con los roles especificados en el decorador `@Roles`. Es fundamental para la
 * autorización basada en roles (RBAC).
 * @author kevin mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * @guard RolesGuard
 * @description Un guard que protege rutas, permitiendo el acceso solo a usuarios
 * con los roles especificados en el decorador `@Roles`. Es fundamental para la
 * autorización basada en roles (RBAC).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * @constructor
   * @param {Reflector} reflector - El servicio de NestJS para leer metadatos de los decoradores.
   */
  constructor(private reflector: Reflector) {}

  /**
   * @method canActivate
   * @description Este método determina si el usuario actual tiene permiso para acceder
   * a la ruta solicitada.
   * @param {ExecutionContext} context - El contexto de la ejecución de la petición.
   * @returns {boolean} `true` si el usuario tiene el rol requerido, de lo contrario lanza una excepción.
   * @throws {ForbiddenException} Si el usuario no tiene rol o no cumple con los roles requeridos.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso.',
      );
    }

    const hasRequiredRole = requiredRoles.some((role) => user.role === role);
    if (!hasRequiredRole) {
      throw new ForbiddenException(
        'No tienes los permisos necesarios para realizar esta acción.',
      );
    }

    return true;
  }
}