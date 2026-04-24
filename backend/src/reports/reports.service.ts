/**
 * @file report.service.ts
 * @route /backend/src/reports
 * @description Servicio completo para generación de reportes con soporte para:
 * - Reportes manuales bajo demanda
 * - Reportes automáticos cada 200 datos (SOLO el lote de 200)
 * - Reportes diarios automáticos (TODO el día)
 * - Exportación a PDF y Excel con filtros
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */


import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { Report, ReportStatus, ReportType } from '@prisma/client';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EmailService } from '../email/email.service';
 
// ─── Constantes de Configuración ──────────────────────────────────────────────
 
/** Directorio donde se guardan los reportes generados */
const REPORTS_DIR = path.join(process.cwd(), 'reports');
 
/** Tiempo máximo (ms) para procesar un reporte antes de marcarlo como FAILED */
const REPORT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos
 
/** Número máximo de reintentos para un reporte fallido */
const MAX_RETRIES = 3;
 
/** Tiempo base de espera entre reintentos (ms), se multiplica exponencialmente */
const RETRY_BASE_DELAY_MS = 10_000; // 10 segundos
 
/** Máximo de reportes procesándose al mismo tiempo */
const MAX_CONCURRENT_WORKERS = 2;
 
/** Lotes de datos máximos a incluir en el detalle del PDF/Excel */
const MAX_DATA_ROWS_PDF = 500;
 
// ─── Interfaces (I - Segregación de Interfaces) ────────────────────────────────
 
interface ReportFilePaths {
  pdfPath: string;
  excelPath: string;
}
 
interface ReportParameters {
  tankId: string;
  tankName: string;
  sensorIds: string[];
  sensorNames: string[];
  startDate: string;
  endDate: string;
  isAutomatic?: boolean;
  automaticType?: 'batch' | 'daily';
  retryCount?: number;
}
 
interface CreateReportDto {
  reportName: string;
  userId: string;
  tankId: string;
  sensorIds: string[];
  startDate: string;
  endDate: string;
  isAutomatic?: boolean;
}
 
interface AggregatedStat {
  sensorName: string;
  count: number;
  avg: string;
  min: string;
  max: string;
}
 
// ─── Clase Principal ───────────────────────────────────────────────────────────
 
@Injectable()
export class ReportService implements OnModuleInit {
  private readonly logger = new Logger(ReportService.name);
 
  /** Contador de datos recibidos por tanque (para reportes automáticos por lote) */
  private dataCounters = new Map<string, number>();
 
  /** Cola de trabajos pendientes (IDs de reportes) */
  private readonly jobQueue: string[] = [];
 
  /** Conjunto de reportes actualmente en procesamiento */
  private readonly activeWorkers = new Set<string>();
 
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly emailService: EmailService,
  ) {}
 
  // ─── Ciclo de Vida del Módulo ────────────────────────────────────────────────
 
  async onModuleInit(): Promise<void> {
    await this.ensureReportsDirectory();
    await this.initializeDataCounters();
    await this.recoverStuckReports();
    this.logger.log('✅ ReportService inicializado correctamente');
  }
 
  /** Asegura que el directorio de reportes exista */
  private async ensureReportsDirectory(): Promise<void> {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    this.logger.log(`📁 Directorio de reportes: ${REPORTS_DIR}`);
  }
 
  /** Inicializa contadores de datos por tanque */
  private async initializeDataCounters(): Promise<void> {
    const tanks = await this.prisma.tank.findMany({ select: { id: true } });
    tanks.forEach((tank) => this.dataCounters.set(tank.id, 0));
    this.logger.log(`📊 Contadores inicializados para ${tanks.length} tanques`);
  }
 
  /**
   * Al iniciar, los reportes que quedaron en PENDING/PROCESSING del ciclo anterior
   * (por reinicio del servidor, crash, etc.) se reactivan o se marcan como FAILED.
   */
  private async recoverStuckReports(): Promise<void> {
    const cutoff = new Date(Date.now() - REPORT_TIMEOUT_MS);
 
    // Reportes PROCESSING más viejos que el timeout → FAILED
    const stuckProcessing = await this.prisma.report.updateMany({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: cutoff },
      },
      data: { status: 'FAILED' },
    });
 
    // Reportes PENDING más viejos que el timeout → volver a encolar
    const stuckPending = await this.prisma.report.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    });
 
    if (stuckProcessing.count > 0) {
      this.logger.warn(
        `⚠️ ${stuckProcessing.count} reportes marcados como FAILED (timeout)`,
      );
    }
 
    if (stuckPending.length > 0) {
      this.logger.warn(
        `⚠️ ${stuckPending.length} reportes PENDING re-encolados al inicio`,
      );
      stuckPending.forEach((r) => this.enqueueJob(r.id));
    }
  }
 
  // ─── Cola de Procesamiento (evita bloquear el servidor) ─────────────────────
 
  /**
   * Agrega un reporte a la cola y dispara un worker si hay capacidad.
   */
  private enqueueJob(reportId: string): void {
    if (!this.jobQueue.includes(reportId)) {
      this.jobQueue.push(reportId);
    }
    this.drainQueue();
  }
 
  /**
   * Procesa reportes de la cola respetando MAX_CONCURRENT_WORKERS.
   */
  private drainQueue(): void {
    while (
      this.jobQueue.length > 0 &&
      this.activeWorkers.size < MAX_CONCURRENT_WORKERS
    ) {
      const reportId = this.jobQueue.shift()!;
      if (!this.activeWorkers.has(reportId)) {
        this.activeWorkers.add(reportId);
        this.runWorker(reportId).finally(() => {
          this.activeWorkers.delete(reportId);
          this.drainQueue(); // Procesar siguiente en cola
        });
      }
    }
  }
 
  /**
   * Ejecuta el procesamiento del reporte con timeout y manejo de errores.
   */
  private async runWorker(reportId: string): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('TIMEOUT: procesamiento excedió el límite')),
        REPORT_TIMEOUT_MS,
      ),
    );
 
    try {
      await Promise.race([this.processReport(reportId), timeoutPromise]);
    } catch (err: any) {
      this.logger.error(`❌ Worker falló para reporte ${reportId}: ${err.message}`);
      await this.handleReportFailure(reportId, err.message);
    }
  }
 
  /**
   * Gestiona el fallo de un reporte con reintentos automáticos.
   */
  private async handleReportFailure(
    reportId: string,
    errorMessage: string,
  ): Promise<void> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) return;
 
    let params: ReportParameters = JSON.parse(report.parameters as string);
    const retryCount = (params.retryCount ?? 0) + 1;
 
    if (retryCount <= MAX_RETRIES) {
      // Backoff exponencial: 10s, 20s, 40s
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, retryCount - 1);
      this.logger.warn(
        `🔄 Reintento ${retryCount}/${MAX_RETRIES} para reporte ${reportId} en ${delay / 1000}s`,
      );
 
      params.retryCount = retryCount;
 
      await this.prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'PENDING',
          parameters: JSON.stringify(params),
        },
      });
 
      setTimeout(() => this.enqueueJob(reportId), delay);
    } else {
      this.logger.error(
        `💀 Reporte ${reportId} superó ${MAX_RETRIES} reintentos → FAILED`,
      );
      await this.updateReportStatus(reportId, 'FAILED', errorMessage);
    }
  }
 
  // ─── Cron Jobs ───────────────────────────────────────────────────────────────
 
  /** Genera reportes diarios a las 23:55 para usuarios con reportes habilitados */
  @Cron('55 23 * * *', { name: 'daily-reports', timeZone: 'America/Bogota' })
  async generateDailyReports(): Promise<void> {
    this.logger.log('🕐 Iniciando reportes diarios automáticos...');
    const users = await this.prisma.user.findMany({
      select: { id: true, name: true, settings: true },
    });
 
    for (const user of users) {
      const settings = this.parseUserSettings(user.settings);
      if (!settings.notifications?.reports) continue;
 
      const tanks = await this.prisma.tank.findMany({
        where: { userId: user.id },
        include: { sensors: { select: { id: true } } },
      });
 
      for (const tank of tanks) {
        const today = new Date();
        const dataCount = await this.prisma.sensorData.count({
          where: {
            sensor: { tankId: tank.id },
            timestamp: { gte: startOfDay(today), lte: endOfDay(today) },
          },
        });
 
        if (dataCount === 0) continue;
 
        await this.createReport({
          reportName: `Reporte Diario - ${tank.name} - ${format(today, 'dd/MM/yyyy')}`,
          userId: user.id,
          tankId: tank.id,
          sensorIds: tank.sensors.map((s) => s.id),
          startDate: format(startOfDay(today), 'yyyy-MM-dd'),
          endDate: format(endOfDay(today), 'yyyy-MM-dd'),
          isAutomatic: true,
        });
      }
    }
  }
 
  /** Limpia reportes FAILED/COMPLETED antiguos (>30 días) para liberar disco */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldReports(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldReports = await this.prisma.report.findMany({
      where: {
        status: { in: ['FAILED', 'COMPLETED'] },
        createdAt: { lt: cutoff },
      },
    });
 
    let deleted = 0;
    for (const report of oldReports) {
      try {
        await this.deleteReportFiles(report);
        await this.prisma.report.delete({ where: { id: report.id } });
        deleted++;
      } catch (_) {
        // ignorar errores individuales
      }
    }
 
    if (deleted > 0) {
      this.logger.log(`🧹 Limpieza: ${deleted} reportes antiguos eliminados`);
    }
  }
 
  // ─── API Pública ─────────────────────────────────────────────────────────────
 
  /** Incrementa el contador de datos y genera reporte automático si alcanza 200 */
  async incrementDataCounter(tankId: string, userId: string): Promise<void> {
    const count = (this.dataCounters.get(tankId) ?? 0) + 1;
    this.dataCounters.set(tankId, count);
 
    if (count % 200 !== 0) return;
 
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });
    const settings = this.parseUserSettings(user?.settings);
    if (!settings.notifications?.reports) return;
 
    this.logger.log(
      `🔔 Reporte automático por lote para tanque ${tankId} (${count} datos)`,
    );
    await this.generateAutomaticBatchReport(tankId, userId);
  }
 
  /** Crea un nuevo reporte y lo encola para procesamiento asíncrono */
  async createReport(dto: CreateReportDto): Promise<Report> {
    if (!dto.tankId || !dto.sensorIds?.length) {
      throw new BadRequestException('Debe especificar un tanque y al menos un sensor');
    }
 
    const tank = await this.prisma.tank.findUnique({
      where: { id: dto.tankId },
      include: { sensors: { select: { id: true, name: true } } },
    });
    if (!tank) throw new NotFoundException(`Tanque ${dto.tankId} no encontrado`);
 
    const selectedSensors = tank.sensors.filter((s) =>
      dto.sensorIds.includes(s.id),
    );
    if (!selectedSensors.length) {
      throw new BadRequestException('No se encontraron sensores válidos');
    }
 
    const isAutomatic = dto.isAutomatic ?? false;
    const automaticType = isAutomatic
      ? dto.reportName.includes('Lote')
        ? 'batch'
        : 'daily'
      : undefined;
 
    const parameters: ReportParameters = {
      tankId: dto.tankId,
      tankName: tank.name,
      sensorIds: dto.sensorIds,
      sensorNames: selectedSensors.map((s) => s.name),
      startDate: dto.startDate,
      endDate: dto.endDate,
      isAutomatic,
      automaticType,
      retryCount: 0,
    };
 
    const reportType: ReportType =
      isAutomatic && automaticType === 'daily'
        ? ReportType.DAILY
        : ReportType.CUSTOM;
 
    const report = await this.prisma.report.create({
      data: {
        title: dto.reportName,
        user: { connect: { id: dto.userId } },
        status: 'PENDING',
        parameters: JSON.stringify(parameters),
        type: reportType,
      },
    });
 
    this.logger.log(`📝 Reporte ${report.id} creado → encolando`);
    this.enqueueJob(report.id);
 
    return report;
  }
 
  /** Obtiene todos los reportes de un usuario ordenados por fecha */
  async getReports(userId: string): Promise<Report[]> {
    return this.prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limitar a los 100 más recientes
    });
  }
 
  /** Descarga un reporte completado */
  async downloadReport(
    reportId: string,
    fileFormat: 'pdf' | 'xlsx',
  ): Promise<{ buffer: Buffer; filename: string }> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Reporte no encontrado');
 
    if (report.status === 'PENDING' || report.status === 'PROCESSING') {
      throw new BadRequestException(
        `El reporte aún se está procesando (estado: ${report.status})`,
      );
    }
 
    if (report.status === 'FAILED') {
      const params: ReportParameters = JSON.parse(report.parameters as string);
      const retries = params.retryCount ?? 0;
      throw new BadRequestException(
        `El reporte falló después de ${retries} intentos. Cree un nuevo reporte.`,
      );
    }
 
    const paths = this.getReportPaths(report);
    if (!paths) throw new NotFoundException('Archivos del reporte no disponibles');
 
    const filePath =
      fileFormat === 'pdf' ? paths.pdfPath : paths.excelPath;
    if (!filePath) {
      throw new NotFoundException(
        `Archivo ${fileFormat.toUpperCase()} no disponible`,
      );
    }
 
    const params: ReportParameters = JSON.parse(report.parameters as string);
    const start = format(parseISO(params.startDate.split('T')[0]), 'dd_MM_yyyy');
    const end = format(parseISO(params.endDate.split('T')[0]), 'dd_MM_yyyy');
    const tankName = params.tankName.replace(/\s+/g, '_');
    const filename = `Reporte_${tankName}_${start}_a_${end}.${fileFormat}`;
 
    try {
      const buffer = await fs.readFile(path.join(REPORTS_DIR, filePath));
      return { buffer, filename };
    } catch {
      throw new NotFoundException('Archivo no encontrado en el servidor');
    }
  }
 
  /** Elimina un reporte y sus archivos asociados */
  async deleteReport(reportId: string, userId: string): Promise<void> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    if (report.userId !== userId) {
      throw new BadRequestException('No tienes permiso para eliminar este reporte');
    }
 
    await this.deleteReportFiles(report);
    await this.prisma.report.delete({ where: { id: reportId } });
    this.logger.log(`🗑️ Reporte ${reportId} eliminado`);
  }
 
  /**
   * Reintenta manualmente un reporte fallido.
   * Útil cuando el usuario lo solicita desde la UI.
   */
  async retryReport(reportId: string, userId: string): Promise<Report> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    if (report.userId !== userId) {
      throw new BadRequestException('No tienes permiso para reintentar este reporte');
    }
    if (report.status !== 'FAILED') {
      throw new BadRequestException(
        `Solo se pueden reintentar reportes fallidos (estado actual: ${report.status})`,
      );
    }
 
    // Resetear contador de reintentos
    const params: ReportParameters = JSON.parse(report.parameters as string);
    params.retryCount = 0;
 
    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'PENDING',
        parameters: JSON.stringify(params),
        filePath: null,
      },
    });
 
    this.enqueueJob(reportId);
    this.logger.log(`🔄 Reintento manual solicitado para reporte ${reportId}`);
    return updated;
  }
 
  // ─── Procesamiento Interno ───────────────────────────────────────────────────
 
  /** Orquesta el procesamiento completo de un reporte */
  private async processReport(reportId: string): Promise<void> {
    this.logger.log(`⚙️ Procesando reporte ${reportId}...`);
    await this.updateReportStatus(reportId, 'PROCESSING');
 
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { user: true },
    });
    if (!report) throw new NotFoundException('Reporte no encontrado durante procesamiento');
 
    const params: ReportParameters = JSON.parse(report.parameters as string);
    const { gteDate, lteDate } = this.buildDateRange(params);
 
    // Consulta optimizada: solo los campos necesarios
    const sensorData = await this.prisma.sensorData.findMany({
      where: {
        sensorId: { in: params.sensorIds },
        timestamp: { gte: gteDate, lte: lteDate },
      },
      orderBy: { timestamp: 'asc' },
      select: {
        timestamp: true,
        value: true,
        type: true,
        sensor: {
          select: { name: true, type: true, hardwareId: true },
        },
      },
    });
 
    if (sensorData.length === 0) {
      throw new Error(
        `No hay datos entre ${gteDate.toISOString()} y ${lteDate.toISOString()}`,
      );
    }
 
    this.logger.log(
      `📊 Reporte ${reportId}: ${sensorData.length} registros encontrados`,
    );
 
    // Generar archivos en paralelo
    const [pdfPath, excelPath] = await Promise.all([
      this.generatePDF(report, params, sensorData),
      this.generateExcel(report, params, sensorData),
    ]);
 
    const filePaths: ReportFilePaths = { pdfPath, excelPath };
    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'COMPLETED',
        filePath: JSON.stringify(filePaths),
      },
      include: { user: true },
    });
 
    this.logger.log(`✅ Reporte ${reportId} completado`);
 
    // Notificar via WebSocket
    this.eventsGateway.broadcastReportUpdate({
      ...updatedReport,
      userId: updatedReport.userId,
    });
 
    // Enviar email si está configurado
    await this.sendReportEmailIfEnabled(updatedReport, params, pdfPath, excelPath);
  }
 
  // ─── Generación de Archivos ──────────────────────────────────────────────────
 
  private async generatePDF(
    report: any,
    params: ReportParameters,
    data: any[],
  ): Promise<string> {
    const startPart = params.startDate.split('T')[0];
    const endPart = params.endDate.split('T')[0];
    const start = format(parseISO(startPart), 'dd_MM_yyyy');
    const end = format(parseISO(endPart), 'dd_MM_yyyy');
    const tankName = params.tankName.replace(/\s+/g, '_');
    const filename = `Reporte_Monitoreo_${tankName}_${start}_a_${end}.pdf`;
    const filepath = path.join(REPORTS_DIR, filename);
 
    const VERDE_SENA = '#39B54A';
    const NARANJA = '#FF5733';
    const itemHeight = 25;
    const colWidth = 100;
 
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = require('fs').createWriteStream(filepath);
      stream.on('error', reject);
      doc.pipe(stream);
 
      const startX = 50;
      let currentY = 50;
 
      // Cabecera
      doc
        .fillColor('#000000')
        .fontSize(18)
        .text('Reporte de Monitoreo Acuático', startX, currentY + 5, {
          width: 500,
          align: 'center',
        });
      doc
        .fontSize(10)
        .text('Servicio Nacional de Aprendizaje - SENA', startX, currentY + 30, {
          width: 500,
          align: 'center',
        });
      doc.y = currentY + 60;
 
      // Metadatos
      doc
        .fontSize(12)
        .text('Título: ', startX, doc.y, { continued: true })
        .font('Helvetica-Bold')
        .text(report.title);
      const isBatch = params.isAutomatic && params.automaticType === 'batch';
      const periodText = isBatch
        ? 'Reporte por lote automático'
        : `${format(parseISO(startPart), 'dd/MM/yyyy', { locale: es })} al ${format(parseISO(endPart), 'dd/MM/yyyy', { locale: es })}`;
      doc
        .fontSize(12)
        .font('Helvetica')
        .text('Período: ', startX, doc.y, { continued: true })
        .text(periodText);
      doc.moveDown(0.5);
 
      // Tabla de estadísticas
      const stats = this.aggregateStats(data);
      currentY = doc.y + 10;
      doc.rect(startX, currentY, 500, itemHeight).fill(VERDE_SENA);
      doc.fillColor('#FFFFFF').fontSize(10);
      doc.text('Tipo de Sensor', startX + 5, currentY + 8, { width: colWidth });
      doc.text('Registros', startX + colWidth + 5, currentY + 8, { width: colWidth, align: 'center' });
      doc.text('Promedio', startX + colWidth * 2 + 5, currentY + 8, { width: colWidth, align: 'center' });
      doc.text('Mínimo', startX + colWidth * 3 + 5, currentY + 8, { width: colWidth, align: 'center' });
      doc.text('Máximo', startX + colWidth * 4 + 5, currentY + 8, { width: colWidth, align: 'center' });
      currentY += itemHeight;
 
      stats.forEach((stat, i) => {
        const isEven = i % 2 === 0;
        doc.fillColor(isEven ? '#FFFFFF' : '#F0F0F0').rect(startX, currentY, 500, itemHeight).fill();
        doc.fillColor('#000000').fontSize(10);
        doc.text(stat.sensorName, startX + 5, currentY + 8, { width: colWidth });
        doc.text(String(stat.count), startX + colWidth + 5, currentY + 8, { width: colWidth, align: 'center' });
        doc.text(stat.avg, startX + colWidth * 2 + 5, currentY + 8, { width: colWidth, align: 'center' });
        doc.text(stat.min, startX + colWidth * 3 + 5, currentY + 8, { width: colWidth, align: 'center' });
        doc.text(stat.max, startX + colWidth * 4 + 5, currentY + 8, { width: colWidth, align: 'center' });
        currentY += itemHeight;
      });
 
      doc.y = currentY + 20;
 
      // Tabla de datos detallados (limitada a MAX_DATA_ROWS_PDF)
      const dataColWidths = [120, 100, 80, 200];
      const dataItemH = 20;
      let dataY = doc.y;
 
      const renderDataHeader = () => {
        doc.rect(startX, dataY, 500, dataItemH).fill(NARANJA);
        doc.fillColor('#FFFFFF').fontSize(10);
        let cx = startX;
        doc.text('Fecha/Hora', cx + 5, dataY + 6, { width: dataColWidths[0] }); cx += dataColWidths[0];
        doc.text('Tipo', cx + 5, dataY + 6, { width: dataColWidths[1] }); cx += dataColWidths[1];
        doc.text('Valor', cx + 5, dataY + 6, { width: dataColWidths[2] }); cx += dataColWidths[2];
        doc.text('Sensor', cx + 5, dataY + 6, { width: dataColWidths[3] });
        dataY += dataItemH;
      };
      renderDataHeader();
 
      const limited = data.slice(0, MAX_DATA_ROWS_PDF);
      limited.forEach((item, idx) => {
        if (dataY > 750) {
          doc.addPage();
          dataY = 50;
          renderDataHeader();
        }
        const rowColor = idx % 2 === 0 ? '#FFFFFF' : '#F7F7F7';
        doc.fillColor(rowColor).rect(startX, dataY, 500, dataItemH).fill(rowColor);
        doc.fillColor('#000000').fontSize(9);
        let cx = startX;
        doc.text(format(item.timestamp, 'dd/MM/yy HH:mm', { locale: es }), cx + 5, dataY + 6, { width: dataColWidths[0] }); cx += dataColWidths[0];
        doc.text(item.sensor.type, cx + 5, dataY + 6, { width: dataColWidths[1] }); cx += dataColWidths[1];
        doc.text((item.value as number).toFixed(2), cx + 5, dataY + 6, { width: dataColWidths[2] }); cx += dataColWidths[2];
        doc.text(item.sensor.name, cx + 5, dataY + 6, { width: dataColWidths[3] });
        dataY += dataItemH;
      });
 
      if (data.length > MAX_DATA_ROWS_PDF) {
        doc.y = dataY + 10;
        doc.fontSize(9).fillColor('#999999').text(
          `* Se muestran ${MAX_DATA_ROWS_PDF} de ${data.length} registros en el PDF. El archivo Excel contiene todos los datos.`,
          startX,
        );
      }
 
      doc.end();
      stream.on('finish', () => {
        this.logger.log(`📄 PDF generado: ${filename}`);
        resolve(filename);
      });
    });
  }
 
  private async generateExcel(
    report: any,
    params: ReportParameters,
    data: any[],
  ): Promise<string> {
    const startPart = params.startDate.split('T')[0];
    const endPart = params.endDate.split('T')[0];
    const start = format(parseISO(startPart), 'dd_MM_yyyy');
    const end = format(parseISO(endPart), 'dd_MM_yyyy');
    const tankName = params.tankName.replace(/\s+/g, '_');
    const filename = `Reporte_Monitoreo_${tankName}_${start}_a_${end}.xlsx`;
    const filepath = path.join(REPORTS_DIR, filename);
 
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Monitoreo';
 
    const VERDE_ARGB = 'FF39B54A';
    const NARANJA_ARGB = 'FFDD5733';
    const GRIS_ARGB = 'FFF5F5F5';
 
    // ── Hoja Resumen ────
    const statsSheet = workbook.addWorksheet('Resumen');
    statsSheet.mergeCells('A1:E1');
    statsSheet.getCell('A1').value = 'Reporte de Monitoreo Acuático';
    statsSheet.getCell('A1').font = { size: 18, bold: true };
    statsSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    statsSheet.getRow(1).height = 30;
 
    statsSheet.getCell('A4').value = 'Título:';
    statsSheet.getCell('B4').value = report.title;
    statsSheet.getCell('A5').value = 'Período:';
    statsSheet.getCell('B5').value = `${format(parseISO(startPart), 'dd/MM/yyyy')} al ${format(parseISO(endPart), 'dd/MM/yyyy')}`;
    statsSheet.getCell('A7').value = 'Total Registros:';
    statsSheet.getCell('A7').font = { bold: true };
    statsSheet.getCell('B7').value = data.length;
 
    statsSheet.getRow(9).values = ['Tipo de Sensor', 'Registros', 'Promedio', 'Mínimo', 'Máximo'];
    statsSheet.getRow(9).height = 25;
    statsSheet.getRow(9).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    statsSheet.getRow(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_ARGB } };
    statsSheet.getRow(9).alignment = { vertical: 'middle', horizontal: 'center' };
 
    const stats = this.aggregateStats(data);
    stats.forEach((stat, i) => {
      const row = statsSheet.getRow(10 + i);
      row.values = [stat.sensorName, stat.count, stat.avg, stat.min, stat.max];
      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_ARGB } };
      }
      row.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    statsSheet.columns = [{ width: 25 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 18 }];
 
    // ── Hoja Datos ───────
    const dataSheet = workbook.addWorksheet('Datos Completos', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });
    dataSheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Hora', key: 'time', width: 12 },
      { header: 'Tipo', key: 'sensorType', width: 15 },
      { header: 'Valor', key: 'value', width: 12, style: { numFmt: '0.00' } },
      { header: 'Sensor', key: 'sensorName', width: 25 },
      { header: 'Hardware ID', key: 'hardwareId', width: 18 },
    ];
 
    dataSheet.getRow(1).height = 25;
    dataSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    dataSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NARANJA_ARGB } };
    dataSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
 
    // Insertar todas las filas usando addRows para eficiencia en lotes grandes
    const rows = data.map((item) => ({
      date: format(item.timestamp, 'dd/MM/yyyy', { locale: es }),
      time: format(item.timestamp, 'HH:mm:ss', { locale: es }),
      sensorType: item.sensor.type,
      value: item.value,
      sensorName: item.sensor.name,
      hardwareId: item.sensor.hardwareId,
    }));
    dataSheet.addRows(rows);
 
    // Alternar colores filas
    for (let i = 2; i <= dataSheet.rowCount; i++) {
      if (i % 2 === 0) {
        dataSheet.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS_ARGB } };
      }
    }
 
    dataSheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 6 } };
 
    await workbook.xlsx.writeFile(filepath);
    this.logger.log(`📊 Excel generado: ${filename}`);
    return filename;
  }
 
  // ─── Reporte por Lote Automático ─────────────────────────────────────────────
 
  private async generateAutomaticBatchReport(
    tankId: string,
    userId: string,
  ): Promise<void> {
    const tank = await this.prisma.tank.findUnique({
      where: { id: tankId },
      include: { sensors: { select: { id: true } } },
    });
    if (!tank) return;
 
    const batchData = await this.prisma.sensorData.findMany({
      where: { sensor: { tankId } },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
      take: 200,
    });
    if (!batchData.length) return;
 
    const newest = batchData[0].timestamp;
    const oldest = batchData[batchData.length - 1].timestamp;
    const startTitle = format(oldest, 'dd/MM/yyyy HH:mm:ss');
    const endTitle = format(newest, 'dd/MM/yyyy HH:mm:ss');
 
    await this.createReport({
      reportName: `Reporte por Lote - ${tank.name} (200 datos del ${startTitle} al ${endTitle})`,
      userId,
      tankId,
      sensorIds: tank.sensors.map((s) => s.id),
      startDate: oldest.toISOString(),
      endDate: newest.toISOString(),
      isAutomatic: true,
    });
  }
 
  // ─── Helpers Internos ────────────────────────────────────────────────────────
 
  private buildDateRange(
    params: ReportParameters,
  ): { gteDate: Date; lteDate: Date } {
    const isBatch = params.isAutomatic && params.automaticType === 'batch';
    if (isBatch) {
      return { gteDate: new Date(params.startDate), lteDate: new Date(params.endDate) };
    }
    return {
      gteDate: new Date(params.startDate + 'T00:00:00Z'),
      lteDate: new Date(params.endDate + 'T23:59:59Z'),
    };
  }
 
  private aggregateStats(data: any[]): AggregatedStat[] {
    const groups = data.reduce<Record<string, { values: number[]; name: string }>>(
      (acc, item) => {
        const key = item.sensor.name;
        if (!acc[key]) acc[key] = { values: [], name: key };
        acc[key].values.push(item.value as number);
        return acc;
      },
      {},
    );
 
    return Object.values(groups).map((g) => {
      const sum = g.values.reduce((a, b) => a + b, 0);
      return {
        sensorName: g.name,
        count: g.values.length,
        avg: (sum / g.values.length).toFixed(2),
        min: Math.min(...g.values).toFixed(2),
        max: Math.max(...g.values).toFixed(2),
      };
    });
  }
 
  private getReportPaths(report: Report): ReportFilePaths | null {
    if (!report.filePath) return null;
    try {
      const parsed = JSON.parse(report.filePath as string);
      if (parsed.pdfPath && parsed.excelPath) return parsed as ReportFilePaths;
      return null;
    } catch {
      return null;
    }
  }
 
  private async deleteReportFiles(report: Report): Promise<void> {
    const paths = this.getReportPaths(report);
    if (!paths) return;
    for (const filePath of [paths.pdfPath, paths.excelPath]) {
      if (!filePath) continue;
      try {
        await fs.unlink(path.join(REPORTS_DIR, filePath));
      } catch {
        // El archivo puede no existir ya
      }
    }
  }
 
  private async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    errorMessage?: string,
  ): Promise<void> {
    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: { status },
    });
    this.eventsGateway.broadcastReportUpdate({
      ...report,
      userId: report.userId,
    });
 
    if (status === 'FAILED') {
      this.logger.error(
        `💀 Reporte ${reportId} FAILED: ${errorMessage ?? 'sin detalles'}`,
      );
    }
  }
 
  private async sendReportEmailIfEnabled(
    report: any,
    params: ReportParameters,
    pdfPath: string,
    excelPath: string,
  ): Promise<void> {
    const settings = this.parseUserSettings(report.user?.settings);
    if (!settings.notifications?.reports || !settings.notifications?.email) return;
 
    try {
      const [bufPDF, bufExcel] = await Promise.all([
        fs.readFile(path.join(REPORTS_DIR, pdfPath)),
        fs.readFile(path.join(REPORTS_DIR, excelPath)),
      ]);
 
      const attachments = [
        { filename: pdfPath, content: bufPDF, contentType: 'application/pdf' },
        {
          filename: excelPath,
          content: bufExcel,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ];
 
      const body = `
        <p>Estimado/a ${report.user.name},</p>
        <p>Su reporte de monitoreo ha sido generado exitosamente.</p>
        <p><strong>Título:</strong> ${report.title}</p>
        <p><strong>Período:</strong> ${params.startDate} al ${params.endDate}</p>
        <p>Gracias por usar el Sistema de Monitoreo.</p>
      `;
 
      await this.emailService.sendReportEmail(
        report.user.email,
        `✅ Reporte Generado: ${report.title}`,
        body,
        attachments,
      );
    } catch (err: any) {
      this.logger.error(`Error enviando email de reporte: ${err.message}`);
    }
  }
 
  private parseUserSettings(settings: any): any {
    if (!settings) return {};
    if (typeof settings === 'string') {
      try {
        return JSON.parse(settings);
      } catch {
        return {};
      }
    }
    return settings;
  }
}