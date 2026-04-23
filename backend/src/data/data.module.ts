/**
 * @file data.module.ts
 * @route /backend/src/data
 * @description Módulo para la gestión de datos con integración de reportes
 * @author Kevin Mariano
 * @version 1.1.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Module, forwardRef } from '@nestjs/common';
import { DataService } from './data.service';
import { MqttModule } from '../mqtt/mqtt.module';
import { DataController } from './data.controller';
import { AlertsModule } from '../alerts/alerts.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { ReportModule } from '../reports/reports.module'; 

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    forwardRef(() => MqttModule),
    forwardRef(() => ReportModule), 
    AlertsModule,
  ],
  controllers: [DataController],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}