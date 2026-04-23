/**
 * @file ai-assistant.controller.ts
 * @route backend/src/ai-assistant
 * @description 
 * @author kevin mariano & Deiner
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { CreateQueryDto } from './dto/create-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // Importar decorador
import { User, Role } from '@prisma/client'; // Importar tipos

@Controller('asistente') 
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post() 
  async createQuery(
    @Body(new ValidationPipe()) createQueryDto: CreateQueryDto,
    @CurrentUser() user: Pick<User, 'id' | 'role'>, // Inyectar el usuario autenticado
  ) {
    const respuesta = await this.aiAssistantService.getAIResponse(
      createQueryDto.pregunta,
      user,
    );
    return { respuesta };
  }
}