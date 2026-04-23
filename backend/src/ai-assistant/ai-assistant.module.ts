/**
 * @file ai-assistant.module.ts
 * @route backend/src/ai-assistant
 * @description 
 * @author kevin mariano & Deiner
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Module } from '@nestjs/common';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [PrismaModule], 
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
})

export class AiAssistantModule {}