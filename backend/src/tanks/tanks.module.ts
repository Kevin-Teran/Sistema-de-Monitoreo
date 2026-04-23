/**
 * @file tanks.module.ts
 * @route backend/src/tanks
 * @description 
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Module } from '@nestjs/common';
import { TanksService } from './tanks.service';
import { TanksController } from './tanks.controller';

@Module({
  controllers: [TanksController],
  providers: [TanksService],
})
export class TanksModule {}