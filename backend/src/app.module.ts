/**
 * @file app.module.ts
 * @route backend/src
 * @description Módulo raíz de la aplicación NestJS.
 * @author kevin mariano
 * @version 1.1.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from './data/data.module';
import { MqttModule } from './mqtt/mqtt.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule'; 
import { EmailModule } from './email/email.module';
import { TanksModule } from './tanks/tanks.module';
import { UsersModule } from './users/users.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AlertsModule } from './alerts/alerts.module';
import { EventsModule } from './events/events.module';
import { PrismaModule } from './prisma/prisma.module';
import { SensorsModule } from './sensors/sensors.module';
import { ReportModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PredictionsModule } from './predictions/predictions.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }), 
    CacheModule.register({
      isGlobal: true,
    }),
    AuthModule,
    DataModule,
    MqttModule,
    UsersModule,
    EmailModule, 
    TanksModule,
    PrismaModule,
    PrismaModule,
    EventsModule,
    AlertsModule, 
    SensorsModule,
    ReportModule,
    SettingsModule,
    DashboardModule, 
    AnalyticsModule,
    PredictionsModule,
    AiAssistantModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}