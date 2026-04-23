/**
 * @file settings.service.ts
 * @route backend/src/settings
 * @description Servicio que encapsula la lógica de negocio para la gestión de la configuración de usuarios.
 * Utiliza Prisma para interactuar con la base de datos y manejar un campo JSON 'settings' en el modelo de Usuario.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { Prisma } from '@prisma/client';

@Injectable()
export class SettingsService {
  /**
   * @public
   * @constructor
   * @param {PrismaService} prisma - Inyección de dependencia del servicio de Prisma para la comunicación con la BD.
   */
  constructor(private prisma: PrismaService) {}

  /**
   * @method getSettings
   * @description Obtiene las configuraciones de un usuario específico a partir de su ID.
   * Busca en el campo 'settings' del modelo User.
   * @public
   * @param {string} userId - El ID del usuario del cual se quiere obtener la configuración.
   * @returns {Promise<any>} Un objeto con las configuraciones. Devuelve un objeto vacío si no hay configuraciones guardadas para evitar errores en el frontend.
   * @throws {NotFoundException} Si el usuario con el ID proporcionado no existe.
   */
  async getSettings(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    
    return user.settings ? JSON.parse(user.settings) : {};
  }

  /**
   * @method updateSettings
   * @description Actualiza las configuraciones de un usuario. Este método realiza una fusión (merge)
   * de los ajustes existentes con los nuevos, en lugar de un reemplazo completo. Esto es ideal para
   * actualizar solo una parte de la configuración (ej. solo las notificaciones) sin afectar el resto (ej. los umbrales).
   * @public
   * @param {string} userId - El ID del usuario a actualizar.
   * @param {any} settings - El objeto con las nuevas configuraciones a guardar.
   * @returns {Promise<{settings: any}>} Un objeto que contiene las configuraciones actualizadas.
   * @throws {NotFoundException} Si el usuario no es encontrado.
   */
  async updateSettings(userId: string, settings: any): Promise<{ settings: any }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { settings: true } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const currentSettings = user.settings ? JSON.parse(user.settings) : {};
    const newSettings = { ...currentSettings, ...settings };

    return this.prisma.user.update({
      where: { id: userId },
      data: { 
        settings: JSON.stringify(newSettings) 
      },
      select: { settings: true } 
    });
  }
}