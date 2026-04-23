/**
 * @file alerts.module.ts
 * @route backend/src/alerts
 * @description 
 * @author kevin mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { AlertsController } from './alerts.controller';
import { EventsModule } from '../events/events.module';


@Module({
  imports: [PrismaModule, EmailModule, EventsModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}