/**
 * @file settings.controller.ts
 * @route backend/src/settings
 * @description Controlador para gestionar las rutas de la API relacionadas con la configuración del usuario.
 * Protegido por autenticación JWT. Permite a los usuarios gestionar su propia configuración y a los
 * administradores consultar la configuración de otros usuarios.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Controller, Get, Put, Body, UseGuards, Req, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  /**
   * @public
   * @constructor
   * @param {SettingsService} settingsService - Inyección de dependencia del servicio de configuración.
   */
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * @method getSettings
   * @description Obtiene la configuración del usuario. Si el solicitante es ADMIN, puede especificar un `userId`
   * en los parámetros de la consulta para obtener la configuración de otro usuario. De lo contrario,
   * devuelve la configuración del usuario autenticado.
   * @public
   * @param {any} req - El objeto de la solicitud, que contiene la información del usuario autenticado.
   * @param {string} [userId] - (Opcional, solo para ADMINs) El ID del usuario a consultar.
   * @returns {Promise<any>} Un objeto con la configuración del usuario.
   * @throws {NotFoundException} Si el usuario objetivo no se encuentra.
   * @example
   * // Petición de un usuario normal a GET /api/settings
   * // Petición de un ADMIN a GET /api/settings?userId=some-other-user-id
   */
  @Get()
  @ApiOperation({ summary: 'Obtener la configuración de un usuario' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID del usuario a consultar (solo para Admins).' })
  @ApiResponse({ status: 200, description: 'Configuración obtenida exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  getSettings(@Req() req: any, @Query('userId') userId?: string) {
    const currentUser = req.user as User;
    
    // Lógica de autorización: si el usuario es ADMIN y proporciona un userId, se usa ese ID.
    // De lo contrario, siempre se usa el ID del propio usuario que hace la petición.
    const targetUserId = currentUser.role === 'ADMIN' && userId ? userId : currentUser.id;
    
    return this.settingsService.getSettings(targetUserId);
  }

  /**
   * @method updateSettings
   * @description Actualiza la configuración del usuario que realiza la petición.
   * Los datos enviados se fusionan con la configuración existente.
   * @public
   * @param {any} req - El objeto de la solicitud para identificar al usuario autenticado.
   * @param {any} settings - El cuerpo de la petición con las nuevas configuraciones.
   * @returns {Promise<any>} Las configuraciones actualizadas.
   * @throws {NotFoundException} Si el usuario no se encuentra.
   * @example
   * // Petición PUT a /api/settings con body: { "notifications": { "email": false } }
   * // Respuesta: { "settings": { "thresholds": { ... }, "notifications": { "email": false } } }
   */
  @Put()
  @ApiOperation({ summary: 'Actualizar la configuración del usuario actual' })
  @ApiResponse({ status: 200, description: 'Configuración actualizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  updateSettings(@Req() req: any, @Body() settings: any) {
    return this.settingsService.updateSettings(req.user.id, settings);
  }
}