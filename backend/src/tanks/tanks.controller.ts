/**
 * @file tanks.controller.ts
 * @route backend/src/tanks
 * @description Endpoints para la gestión de tanques.
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
  Query,
  Req,
} from '@nestjs/common';
import { TanksService } from './tanks.service';
import { CreateTankDto } from './dto/create-tank.dto';
import { UpdateTankDto } from './dto/update-tank.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Tanks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tanks')
export class TanksController {
  constructor(private readonly tanksService: TanksService) {}

  @Post()
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Crear un nuevo tanque' })
  @ApiResponse({
    status: 201,
    description: 'El tanque ha sido creado exitosamente.',
  })
  @ApiResponse({ status: 409, description: 'Conflicto, el nombre del tanque ya existe.' })
  create(@Body() createTankDto: CreateTankDto, @Req() req) {
    return this.tanksService.create(createTankDto, req.user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Obtener una lista de tanques' })
  @ApiResponse({ status: 200, description: 'Lista de tanques obtenida.' })
  findAll(@Req() req, @Query('userId') userId?: string) {
    return this.tanksService.findAllForUser(req.user, userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Obtener un tanque por su ID' })
  @ApiResponse({ status: 200, description: 'Tanque encontrado.' })
  @ApiResponse({ status: 404, description: 'Tanque no encontrado.' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.tanksService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Actualizar un tanque' })
  @ApiResponse({ status: 200, description: 'Tanque actualizado.' })
  @ApiResponse({ status: 404, description: 'Tanque no encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateTankDto: UpdateTankDto,
    @Req() req,
  ) {
    return this.tanksService.update(id, updateTankDto, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Eliminar un tanque' })
  @ApiResponse({ status: 200, description: 'Tanque eliminado.' })
  @ApiResponse({ status: 404, description: 'Tanque no encontrado.' })
  @ApiResponse({ status: 409, description: 'El tanque tiene sensores asociados.' })
  remove(@Param('id') id: string, @Req() req) {
    return this.tanksService.remove(id, req.user);
  }
}