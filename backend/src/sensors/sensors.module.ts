/**
 * @file sensors.module
 * @route backend/src/sensors
 * @description 
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Module } from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { SensorsController } from './sensors.controller';

@Module({
  controllers: [SensorsController],
  providers: [SensorsService],
})
export class SensorsModule {}