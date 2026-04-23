/**
 * @file alerts.controller.ts
 * @route backend/src/alerts
 * @description 
 * @author kevin mariano
 * @version 1.0.1 
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Controller, Get, Param, Patch, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, User } from '@prisma/client'; 
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiBearerAuth()
@ApiTags('alerts')
@Controller('alerts')
// Asumo que JwtAuthGuard, RolesGuard, Roles y CurrentUser ya están definidos y funcionales
@UseGuards(JwtAuthGuard, RolesGuard) 
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('unresolved')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Obtener alertas no resueltas para el usuario actual' })
  @ApiResponse({ status: 200, description: 'Lista de alertas no resueltas.' })
  async getUnresolvedAlerts(@CurrentUser() user: User) {
    return this.alertsService.getUnresolvedAlerts(user.id);
  }

  @Patch(':id/resolve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Marcar una alerta como resuelta' })
  @ApiResponse({ status: 204, description: 'Alerta resuelta exitosamente.' })
  async resolveAlert(
    @Param('id') id: string,
    @CurrentUser() user: User // Se usa para logging/auditoría
  ) {
    await this.alertsService.resolveAlert(id, user.id);
  }
}