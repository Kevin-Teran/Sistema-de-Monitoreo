/**
 * @file prisma.module.ts
 * @route backend/src/prisma
 * @description Módulo que provee el Prisma.
 * @author Kevin Mariano 
 * @version 1.0.0 
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * @module PrismaModule
 * @description Módulo que provee el PrismaService de forma global para toda la aplicación.
 * El decorador @Global() hace que no necesites importar este módulo en otros módulos.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}