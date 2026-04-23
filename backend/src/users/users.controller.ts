/**
 * @file users.controller.ts
 * @route backend/src/users
 * @description Controlador para gestionar las peticiones HTTP relacionadas con los usuarios.
 * Expone los endpoints para las operaciones CRUD de usuarios.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

 import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * @class UsersController
 * @description Define los endpoints de la API para el módulo de usuarios.
 * Protegido por autenticación y roles.
 * @decorator @ApiBearerAuth()
 * @decorator @ApiTags('users')
 * @decorator @Controller('users')
 * @decorator @UseGuards(RolesGuard)
 */
@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  /**
   * @constructor
   * @param {UsersService} usersService - Inyección del servicio de usuarios.
   */
  constructor(private readonly usersService: UsersService) {}

  /**
   * @method create
   * @description Endpoint para crear un nuevo usuario.
   * **Importante:** La contraseña se elimina antes de enviar la respuesta.
   */
  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'El usuario fue creado exitosamente.' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return this.usersService.excludePassword(user);
  }

  /**
   * @method findAll
   * @description Endpoint para obtener todos los usuarios.
   * **Importante:** La contraseña se elimina de cada usuario antes de enviar la respuesta.
   */
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  async findAll() {
    const users = await this.usersService.findAll();
    return this.usersService.excludePassword(users);
  }

  /**
   * @method findOne
   * @description Endpoint para obtener un usuario por su ID.
   * **Importante:** La contraseña se elimina antes de enviar la respuesta.
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return this.usersService.excludePassword(user);
  }

  /**
   * @method update
   * @description Endpoint para actualizar un usuario.
   * **Importante:** La contraseña se elimina antes de enviar la respuesta.
   */
  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un usuario' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    return this.usersService.excludePassword(updatedUser);
  }

  /**
   * @method remove
   * @description Endpoint para eliminar un usuario.
   * **Importante:** La contraseña se elimina antes de enviar la respuesta.
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un usuario' })
  async remove(@Param('id') id: string) {
    const removedUser = await this.usersService.remove(id);
    return this.usersService.excludePassword(removedUser);
  }
}