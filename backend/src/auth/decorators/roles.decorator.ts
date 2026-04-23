/**
 * @file dashboard-filters.dto.ts
 * @route backend/src/auth/decorators
 * @description  Asigna los roles permitidos a un endpoint específico. Se usa junto con el RolesGuard para proteger rutas.
 * @author Kevin Mariano
 * @version 1.0.9
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
/**
 * @decorator Roles
 * @description Asigna los roles permitidos a un endpoint específico.
 * Se usa junto con el RolesGuard para proteger rutas.
 * @param {...Role[]} roles - Una lista de roles permitidos (ej. 'ADMIN', 'USER').
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);