/**
 * @file predictions.module.ts
 * @route backend/src/predictions
 * @description Módulo para gestionar la generación de predicciones del sistema.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PredictionsService } from './predictions.service';
import { PredictionsController } from './predictions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
  ],
  controllers: [PredictionsController],
  providers: [PredictionsService],
})
export class PredictionsModule {}