/**
 * @file report.controller.ts
 * @route /backend/src/reports
 * @description Controlador para endpoints de reportes
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

 import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  Req,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

// Define una interfaz simple para el DTO de creación de reporte
interface CreateReportDto {
  reportName: string;
  tankId: string;
  sensorIds: string[];
  startDate: string;
  endDate: string;
}

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * Obtiene todos los reportes del usuario
   * Permite a los administradores obtener reportes de otros usuarios usando 'userId'.
   */
  @Get()
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Obtener lista de reportes' })
  @ApiQuery({ name: 'userId', required: false, description: 'ID del usuario (opcional, solo para ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de reportes obtenida exitosamente' })
  async getReports(@Req() req: any, @Query('userId') userId?: string) {
    // Si el usuario es ADMIN y proporciona un userId, usa ese ID.
    // De lo contrario, usa el ID del usuario autenticado.
    const targetUserId = req.user.role === Role.ADMIN && userId ? userId : req.user.id;
    
    return this.reportService.getReports(targetUserId);
  }

  // --------------------------------------------------------------------------
  
  /**
   * Crea un nuevo reporte (manual)
   */
  @Post()
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Crear un nuevo reporte manual' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Reporte creado y puesto en cola para procesamiento' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos o falta de parámetros' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Recurso (Tanque/Sensor) no encontrado' })
  async createReport(@Body() createReportDto: CreateReportDto, @Req() req: any) {
    // Inyecta el userId del usuario autenticado en el DTO
    return this.reportService.createReport({
      ...createReportDto,
      userId: req.user.id,
      // isAutomatic: false por defecto para reportes POST (manuales)
    });
  }
  
  // --------------------------------------------------------------------------

  /**
   * Descarga un reporte en formato PDF o Excel
   */
  @Get(':id/download')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Descargar un reporte generado' })
  @ApiParam({ name: 'id', description: 'ID del reporte' })
  @ApiQuery({ name: 'format', enum: ['pdf', 'xlsx'], description: 'Formato del archivo' })
  @ApiResponse({ status: 200, description: 'Archivo descargado exitosamente' })
  @ApiResponse({ status: 404, description: 'Reporte o archivo no encontrado' })
  @ApiResponse({ status: 400, description: 'El reporte no ha terminado de procesarse' })
  async downloadReport(
    @Param('id') id: string,
    @Query('format') format: 'pdf' | 'xlsx',
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename } = await this.reportService.downloadReport(id, format); // <--- OBTENER FILENAME LIMPIO
    
    // Definición de tipos MIME
    const mimeTypes = {
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    // Configura las cabeceras de respuesta para la descarga
    res.set({
      'Content-Type': mimeTypes[format],
      'Content-Disposition': `attachment; filename="${filename}"`, // <--- USAR FILENAME LIMPIO
      'Content-Length': buffer.length,
    });

    // Envía el buffer como un archivo descargable
    return new StreamableFile(buffer);
  }
  
  // --------------------------------------------------------------------------

  /**
   * Elimina un reporte y sus archivos asociados
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Eliminar un reporte' })
  @ApiParam({ name: 'id', description: 'ID del reporte' })
  @ApiResponse({ status: 200, description: 'Reporte eliminado exitosamente' })
  @ApiResponse({ status: 400, description: 'El usuario no tiene permiso para eliminar el reporte' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  async deleteReport(@Param('id') id: string, @Req() req: any) {
    // El servicio maneja la lógica de verificación de propiedad/permisos
    await this.reportService.deleteReport(id, req.user.id);
    
    return { 
      statusCode: HttpStatus.OK,
      message: 'Reporte eliminado exitosamente' 
    };
  }
}