/**
 * @file settings.module.ts
 * @route backend/src/settings
 * @description Módulo para la gestión de configuraciones.
 * @author Kevin Mariano
 * @version 1.0.1
 *@copyright Sistema de Monitoreo  2025
 */
 import { Module } from '@nestjs/common';
 import { SettingsService } from './settings.service';
 import { SettingsController } from './settings.controller';
 import { PrismaModule } from '../prisma/prisma.module';
 
 @Module({
   imports: [PrismaModule],
   controllers: [SettingsController],
   providers: [SettingsService],
   exports: [SettingsService],
 })
 export class SettingsModule {}