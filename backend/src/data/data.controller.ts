/**
 * @file data.controller.ts
 * @route /backend/src/data
 * @description Controlador para endpoints de datos de sensores.
 * @author Kevin Mariano 
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */
import { Controller, Get, Post, Body, Query, UseGuards, Req, Param } from '@nestjs/common';
import { DataService } from './data.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ManualEntryDto } from './dto/manual-entry.dto';
import { GetLatestDataDto } from './dto/get-latest-data.dto';
import { EmitterControlDto } from './dto/emitter.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('latest')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Obtener los últimos datos de un tanque' })
  getLatest(@Query() query: GetLatestDataDto, @Req() req) {
    return this.dataService.getLatest(query, req.user);
  }

  @Get('historical')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Obtener datos históricos de un tanque' })
  getHistoricalData(
    @Req() req,
    @Query('tankId') tankId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dataService.getHistoricalData(req.user, tankId, startDate, endDate);
  }

  @Post('manual')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Enviar una o más entradas de datos manuales' })
  @ApiBody({ type: [ManualEntryDto] })
  submitManualEntry(@Body() entries: ManualEntryDto[]) {
    return this.dataService.submitManualEntry(entries);
  }

  @Post('emitter/start')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Iniciar simuladores de sensores' })
  startEmitters(@Body() emitterControlDto: EmitterControlDto, @Req() req) {
    return this.dataService.startEmitters(emitterControlDto.sensorIds, req.user);
  }

  @Post('emitter/stop')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Detener un simulador de sensor' })
  stopEmitter(@Body() body: { sensorId: string }, @Req() req) {
    this.dataService.stopEmitter(body.sensorId, req.user);
    return { message: `Simulador del sensor ${body.sensorId} detenido.` };
  }

  @Post('emitter/stop-multiple')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Detener múltiples simuladores de sensores' })
  stopMultipleEmitters(@Body() body: { sensorIds: string[] }, @Req() req) {
    return this.dataService.stopMultipleEmitters(body.sensorIds, req.user);
  }

  @Get('emitter/status')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Obtener el estado de los simuladores activos' })
  getEmitterStatus(@Req() req) {
    return this.dataService.getEmitterStatus(req.user);
  }

  @Get('emitter/metrics')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Obtener métricas detalladas de simulación' })
  async getSimulationMetrics(@Req() req): Promise<any> {
    return this.dataService.getSimulationMetrics(req.user);
  }

  @Post('emitter/restart')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Reiniciar simuladores específicos' })
  restartEmitters(@Body() body: { sensorIds: string[] }, @Req() req) {
    return this.dataService.restartEmitters(body.sensorIds, req.user);
  }
}