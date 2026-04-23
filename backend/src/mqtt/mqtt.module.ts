/**
 * @file mqtt.module.ts
 * @route /backend/src/mqtt
 * @description Módulo para la gestión de MQTT.
 * @author Kevin Mariano 
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */
import { Module, forwardRef } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from '../data/data.module'; 

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => DataModule),
  ],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}