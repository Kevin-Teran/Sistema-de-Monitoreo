/**
 * @file analytics.module.ts
 * @route backend/src/analytics/
 * @description Módulo para el análisis avanzado de datos históricos.
 * @author kevin mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], 
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}