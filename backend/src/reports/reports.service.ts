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

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import { Report, ReportStatus, SensorData, ReportType } from '@prisma/client'; 
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EmailService } from '../email/email.service'; // <--- NUEVA IMPORTACIÓN

interface ReportFilePaths {
  pdfPath: string;
  excelPath: string;
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

interface ReportParameters {
  tankId: string;
  tankName: string;
  sensorIds: string[];
  sensorNames: string[];
  startDate: string;
  endDate: string;
  dataCount?: number;
  isAutomatic?: boolean;
  automaticType?: 'batch' | 'daily';
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly reportsDir = path.join(process.cwd(), 'reports');
  private readonly assetsDir = path.join(process.cwd(), 'src', 'assets'); 
  private dataCounters = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private emailService: EmailService, 
  ) {
    this.ensureReportsDirectory();
    this.initializeDataCounters();
  }

  // ---------------------- Métodos Auxiliares ----------------------

  /**
   * Asegura que el directorio de reportes existe
   */
  private async ensureReportsDirectory() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      this.logger.log(`📁 Directorio de reportes: ${this.reportsDir}`);
    } catch (error) {
      this.logger.error('Error creando directorio de reportes:', error);
    }
  }

  /**
   * Inicializa los contadores de datos por tanque
   */
  private async initializeDataCounters() {
    try {
      const tanks = await this.prisma.tank.findMany({ select: { id: true } });
      for (const tank of tanks) {
        this.dataCounters.set(tank.id, 0);
      }
      this.logger.log(`✅ Contadores de datos inicializados para ${tanks.length} tanques`);
    } catch (error) {
      this.logger.error('Error inicializando contadores:', error);
    }
  }

  /**
   * Obtiene y parsea las rutas de archivos guardadas como JSON en report.filePath
   */
  private getReportPaths(report: Report): ReportFilePaths | null {
    if (!report.filePath) return null;
    try {
        const paths = JSON.parse(report.filePath as string);
        if (paths.pdfPath && paths.excelPath) {
            return paths as ReportFilePaths;
        }
        return null;
    } catch (e) {
        this.logger.error(`Error al parsear el campo filePath del reporte ${report.id}:`, e);
        return null;
    }
  }

  /**
   * Calcula estadísticas de los sensores para el PDF/Excel (Añadido para estructura)
  */
  private aggregateStats(data: any[]): any[] {
      const sensorGroups = data.reduce((acc, item) => {
          const sensorName = item.sensor.name;
          if (!acc[sensorName]) {
            acc[sensorName] = { values: [], count: 0, sensorName };
          }
          acc[sensorName].values.push(item.value);
          acc[sensorName].count++;
          return acc;
      }, {});

      return Object.values(sensorGroups).map((group: any) => ({
          sensorName: group.sensorName,
          count: group.count,
          avg: (group.values.reduce((a, b) => a + b, 0) / group.values.length).toFixed(2),
          min: Math.min(...group.values).toFixed(2),
          max: Math.max(...group.values).toFixed(2),
      }));
  }

  // ---------------------- Métodos de reportes automáticos ----------------------

  /**
   * Incrementa el contador de datos y genera reporte automático si es necesario
   */
  async incrementDataCounter(tankId: string, userId: string) {
    const currentCount = this.dataCounters.get(tankId) || 0;
    const newCount = currentCount + 1;
    this.dataCounters.set(tankId, newCount);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true }
    });

    const settings = user?.settings ? JSON.parse(user.settings as string) : {};
    const reportsEnabled = settings.notifications?.reports === true; 

    if (!reportsEnabled) {
      return;
    }

    if (newCount % 200 === 0) {
      this.logger.log(`🔔 Generando reporte automático por LOTE para tanque ${tankId} (${newCount} datos)`);
      await this.generateAutomaticBatchReport(tankId, userId);
    }
  }

  /**
   * Genera un reporte automático cada 200 datos (LOTE/BATCH)
   */
  private async generateAutomaticBatchReport(tankId: string, userId: string) {
    try {
      const tank = await this.prisma.tank.findUnique({
        where: { id: tankId },
        include: { sensors: true }
      });

      if (!tank) {
        this.logger.error(`Tanque ${tankId} no encontrado para reporte automático`);
        return;
      }
      
      const batchData = await this.prisma.sensorData.findMany({
          where: { sensor: { tankId } },
          orderBy: { timestamp: 'desc' }, 
          select: { timestamp: true },
          take: 200, 
      });

      if (batchData.length === 0) {
        this.logger.warn(`No hay datos para reporte por lote del tanque ${tankId}`);
        return;
      }

      const newestDataTimestamp = batchData[0].timestamp;
      const oldestDataTimestamp = batchData[batchData.length - 1].timestamp;

      const dataCount = batchData.length;

      const startTitle = format(oldestDataTimestamp, 'dd/MM/yyyy HH:mm:ss');
      const endTitle = format(newestDataTimestamp, 'dd/MM/yyyy HH:mm:ss');

      const reportDto: CreateReportDto = {
        reportName: `Reporte por Lote - ${tank.name} (${dataCount} datos del ${startTitle} al ${endTitle})`,
        userId,
        tankId,
        sensorIds: tank.sensors.map(s => s.id),
        startDate: oldestDataTimestamp.toISOString(),
        endDate: newestDataTimestamp.toISOString(),
        isAutomatic: true,
      };

      await this.createReport(reportDto);
    } catch (error) {
      this.logger.error('Error generando reporte automático por lote:', error);
    }
  }

  /**
   * Cron job: Genera reportes diarios a las 23:55
   */
  @Cron('55 23 * * *', {
    name: 'daily-reports',
    timeZone: 'America/Bogota',
  })
  async generateDailyReports() {
    this.logger.log('🕐 Iniciando generación de reportes diarios automáticos...');

    try {
      const users = await this.prisma.user.findMany({
        select: { id: true, name: true, settings: true },
      });

      for (const user of users) {
        const settings = user.settings ? JSON.parse(user.settings as string) : {};
        const reportsEnabled = settings.notifications?.reports === true; // <--- VERIFICACIÓN DE reports: true

        if (!reportsEnabled) {
          continue;
        }

        const tanks = await this.prisma.tank.findMany({
          where: { userId: user.id },
          include: { sensors: true }
        });

        for (const tank of tanks) {
          const today = new Date();
          const dataCount = await this.prisma.sensorData.count({
            where: {
              sensor: { tankId: tank.id },
              timestamp: {
                gte: startOfDay(today),
                lte: endOfDay(today),
              },
            },
          });

          if (dataCount === 0) {
            this.logger.log(`⚠️ No hay datos de hoy para el tanque ${tank.name}, saltando reporte diario`);
            continue;
          }

          const reportDto: CreateReportDto = {
            reportName: `Reporte Diario - ${tank.name} - ${format(today, 'dd/MM/yyyy')}`,
            userId: user.id,
            tankId: tank.id,
            sensorIds: tank.sensors.map(s => s.id),
            startDate: format(startOfDay(today), 'yyyy-MM-dd'),
            endDate: format(endOfDay(today), 'yyyy-MM-dd'),
            isAutomatic: true,
          };

          await this.createReport(reportDto);
          this.logger.log(`✅ Reporte diario generado para ${user.name} - ${tank.name}`);
        }
      }
    } catch (error) {
      this.logger.error('❌ Error generando reportes diarios:', error);
    }
  }

  // ---------------------- Creación y procesamiento principal ----------------------

  /**
   * Crea un nuevo reporte (manual o automático)
   */
   async createReport(dto: CreateReportDto): Promise<Report> {
    this.logger.log(`📝 Creando reporte: ${dto.reportName}`);

    if (!dto.tankId || !dto.sensorIds || dto.sensorIds.length === 0) {
      throw new BadRequestException('Debe especificar un tanque y al menos un sensor');
    }

    const tank = await this.prisma.tank.findUnique({
      where: { id: dto.tankId },
      include: { sensors: true }
    });

    if (!tank) {
      throw new NotFoundException(`Tanque ${dto.tankId} no encontrado`);
    }

    const selectedSensors = tank.sensors.filter(s => dto.sensorIds.includes(s.id));

    if (selectedSensors.length === 0) {
      throw new BadRequestException('No se encontraron sensores válidos');
    }

    let automaticType: ReportParameters['automaticType'] = undefined;
    if (dto.isAutomatic) {
        if (dto.reportName.includes('Lote')) {
            automaticType = 'batch';
        } else if (dto.reportName.includes('Diario')) {
            automaticType = 'daily';
        }
    }
    
    const parameters: ReportParameters = {
      tankId: dto.tankId,
      tankName: tank.name,
      sensorIds: dto.sensorIds,
      sensorNames: selectedSensors.map(s => s.name),
      startDate: dto.startDate,
      endDate: dto.endDate,
      isAutomatic: dto.isAutomatic || false,
      automaticType: automaticType,
    };
    
    let reportType: ReportType;
    if (parameters.isAutomatic && parameters.automaticType === 'daily') {
        reportType = ReportType.DAILY;
    } else {
        reportType = ReportType.CUSTOM; 
    }

    const report = await this.prisma.report.create({
      data: {
        title: dto.reportName,
        user: { 
          connect: { id: dto.userId },
        },
        status: 'PENDING',
        parameters: JSON.stringify(parameters),
        type: reportType, 
      },
    }); 

    this.logger.log(`✅ Reporte ${report.id} creado con estado PENDING`);

    this.processReport(report.id).catch(error => {
      this.logger.error(`Error procesando reporte ${report.id}:`, error);
    });

    return report;
  }
  
  /**
   * Procesa y genera los archivos del reporte
   */
  private async processReport(reportId: string) {
    this.logger.log(`⚙️ Procesando reporte ${reportId}...`);

    try {
      await this.updateReportStatus(reportId, 'PROCESSING');

      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
        include: { user: true } 
      });

      if (!report) {
        throw new NotFoundException('Reporte no encontrado');
      }

      const params: ReportParameters = JSON.parse(report.parameters as string);
      
      let gteDate: Date;
      let lteDate: Date;

      const isBatchReport = params.isAutomatic && params.automaticType === 'batch';
      
      if (isBatchReport) {
        // 1. Reporte por Lote (Batch): Usar marcas de tiempo exactas (incluye hora, minuto, segundo).
        gteDate = new Date(params.startDate);
        lteDate = new Date(params.endDate);
        this.logger.log(`🔍 [Filtro] Usando filtro preciso para Lote/Batch: ${params.startDate} - ${params.endDate}`);
      } else {
        // 2. Reporte Diario y Reporte Manual/Custom: Usar el rango de día completo.
        gteDate = new Date(params.startDate + 'T00:00:00Z');
        lteDate = new Date(params.endDate + 'T23:59:59Z');
        this.logger.log(`🔍 [Filtro] Usando filtro de día completo: ${params.startDate} - ${params.endDate}`);
      }


      const sensorData = await this.prisma.sensorData.findMany({
        where: {
          sensorId: { in: params.sensorIds },
          timestamp: {
            gte: gteDate,
            lte: lteDate,
          },
        },
        orderBy: { timestamp: 'asc' },
        include: {
          sensor: {
            select: {
              name: true,
              type: true,
              hardwareId: true,
            },
          },
        },
      });

      if (sensorData.length === 0) {
        throw new Error('No hay datos disponibles para el rango de fechas especificado');
      }

      this.logger.log(`📊 Datos obtenidos: ${sensorData.length} registros`);

      const pdfPath = await this.generatePDF(report, params, sensorData);
      const excelPath = await this.generateExcel(report, params, sensorData);
      
      const filePaths = { pdfPath, excelPath };
      const filePathsJson = JSON.stringify(filePaths);

      const updatedReport = await this.prisma.report.update({
        where: { id: reportId },
        data: {
          status: 'COMPLETED',
          filePath: filePathsJson, 
        },
        include: { user: true }
      });

      this.logger.log(`✅ Reporte ${reportId} completado exitosamente`);

      this.eventsGateway.broadcastReportUpdate({
        ...updatedReport,
        status: 'COMPLETED',
        filePath: filePathsJson,
        userId: updatedReport.userId,
      });

      const userSettings = updatedReport.user.settings ? JSON.parse(updatedReport.user.settings as string) : {};
      const emailReportsEnabled = userSettings.notifications?.reports === true && userSettings.notifications?.email === true;
      
      if (emailReportsEnabled) {
          const bufferPDF = await fs.readFile(path.join(this.reportsDir, pdfPath));
          const bufferExcel = await fs.readFile(path.join(this.reportsDir, excelPath));

          const attachments = [
              { filename: pdfPath, content: bufferPDF, contentType: 'application/pdf' },
              { filename: excelPath, content: bufferExcel, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          ];

          const emailSubject = `✅ Reporte Generado: ${updatedReport.title}`;
          const emailBody = `
            <p>Estimado/a ${updatedReport.user.name},</p>
            <p>Adjunto encontrará el reporte de monitoreo solicitado o generado automáticamente.</p>
            <p><strong>Título:</strong> ${updatedReport.title}</p>
            <p><strong>Período:</strong> ${format(parseISO(params.startDate), 'dd/MM/yyyy')} al ${format(parseISO(params.endDate), 'dd/MM/yyyy')}</p>
            <p>Gracias por usar el Sistema de Monitoreo. </p>
          `;
          
          await this.emailService.sendReportEmail(updatedReport.user.email, emailSubject, emailBody, attachments);
      }

    } catch (error) {
      this.logger.error(`❌ Error procesando reporte ${reportId}:`, error);

      await this.updateReportStatus(reportId, 'FAILED', error.message);
    }
  }

  /**
   * Genera archivo PDF del reporte (Ajustado para el formato solicitado)
   */
  private async generatePDF(
    report: Report,
    params: ReportParameters,
    data: any[]
  ): Promise<string> {

    const paramsObj: ReportParameters = JSON.parse(report.parameters as string);
    const isBatchReport = paramsObj.isAutomatic && paramsObj.automaticType === 'batch';
    
    const startDatePart = paramsObj.startDate.split('T')[0];
    const endDatePart = paramsObj.endDate.split('T')[0];
    
    const start = format(parseISO(startDatePart), 'dd_MM_yyyy');
    const end = format(parseISO(endDatePart), 'dd_MM_yyyy');
    const tankName = paramsObj.tankName.replace(/ /g, '_');
    const filename = `Reporte_Monitoreo_${tankName}_${start}_a_${end}.pdf`;

    const filepath = path.join(this.reportsDir, filename);

    const LOGO_PATH = path.join(this.assetsDir, 'logo-sena.png');
    const VERDE_SENA = '#39B54A';
    const NARANJA_CONSTRASTE = '#FF5733'; 
    const itemHeight = 25;
    const LOGO_WIDTH = 50;
    const LOGO_MARGIN = 60; 

    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = require('fs').createWriteStream(filepath);

      stream.on('error', (err) => {
          this.logger.error(`Error de Stream en PDF: ${err.message}`);
          reject(new Error(`Error al crear archivo PDF: ${err.message}`));
      });
      
      doc.pipe(stream);
      
      const startX = 50;
      const colWidth = 100;
      let currentY = 50;

      // -----------------------------------------------------
      // 1. ENCABEZADO y TÍTULO (Ajuste de alineación)
      // -----------------------------------------------------
      
      try {
        await fs.stat(LOGO_PATH); 
        doc.image(LOGO_PATH, startX, currentY, { width: LOGO_WIDTH }); 
      } catch {
        doc.fillColor(VERDE_SENA).fontSize(24).text('SENA', startX, currentY);
      }
      
      const titleX = startX + LOGO_MARGIN;
      const titleWidth = 550 - LOGO_MARGIN;
      
      doc.fillColor('#000000')
         .fontSize(18)
         .text('Reporte de Monitoreo Acuático', titleX, currentY + 5, { 
             width: titleWidth, 
             align: 'center',
             stroke: false
         });
      
      doc.fontSize(10)
         .text('Servicio Nacional de Aprendizaje - SENA', titleX, currentY + 30, { 
             width: titleWidth, 
             align: 'center',
             stroke: false
         });
      
      doc.y = currentY + 60; 
      
      // -----------------------------------------------------
      // 2. METADATOS DEL REPORTE
      // -----------------------------------------------------
      doc.fontSize(12).text('Título: ', startX, doc.y, { continued: true })
         .font('Helvetica-Bold')
         .text(report.title);
      
      const periodText = isBatchReport 
        ? report.title.match(/\(([^)]+)\)/)?.[1] || 'Período no especificado'
        : `${format(parseISO(startDatePart), 'dd/MM/yyyy', { locale: es })} al ${format(parseISO(endDatePart), 'dd/MM/yyyy', { locale: es })}`;

      doc.fontSize(12).text('Período: ', startX, doc.y, { continued: true })
         .font('Helvetica')
         .text(periodText);

      doc.moveDown(0.5);
      
      // -----------------------------------------------------
      // 3. TABLA DE ESTADÍSTICAS (Resumen)
      // -----------------------------------------------------
      const stats = this.aggregateStats(data);
      
      const tableTop = doc.y + 10;
      currentY = tableTop;

      doc.rect(startX, currentY, 500, itemHeight).fill(VERDE_SENA);
      doc.fillColor('#FFFFFF').fontSize(10);
      doc.text('Tipo de Sensor', startX + 5, currentY + 8, { width: colWidth });
      doc.text('Nº Registros', startX + colWidth + 5, currentY + 8, { width: colWidth, align: 'center' });
      doc.text('Promedio', startX + colWidth * 2 + 5, currentY + 8, { width: colWidth, align: 'center' });
      doc.text('Mínimo', startX + colWidth * 3 + 5, currentY + 8, { width: colWidth, align: 'center' });
      doc.text('Máximo', startX + colWidth * 4 + 5, currentY + 8, { width: colWidth, align: 'center' });

      currentY += itemHeight;

      stats.forEach((stat, index) => {
          const isEven = index % 2 === 0;
          doc.fillColor(isEven ? '#FFFFFF' : '#F0F0F0').rect(startX, currentY, 500, itemHeight).fill();
          
          doc.fillColor('#000000').fontSize(10);
          doc.text(stat.sensorName, startX + 5, currentY + 8, { width: colWidth });
          doc.text(stat.count.toString(), startX + colWidth + 5, currentY + 8, { width: colWidth, align: 'center' });
          doc.text(stat.avg, startX + colWidth * 2 + 5, currentY + 8, { width: colWidth, align: 'center' });
          doc.text(stat.min, startX + colWidth * 3 + 5, currentY + 8, { width: colWidth, align: 'center' });
          doc.text(stat.max, startX + colWidth * 4 + 5, currentY + 8, { width: colWidth, align: 'center' });
          
          currentY += itemHeight;
      });
      
      doc.y = currentY + 20; 
      
      // -----------------------------------------------------
      // 4. TABLA DE DATOS DETALLADOS
      // -----------------------------------------------------
      
      const dataTableTop = doc.y;
      const dataItemHeight = 20;
      const dataColWidths = [120, 100, 80, 200]; 
      
      doc.rect(startX, dataTableTop, 500, dataItemHeight).fill(NARANJA_CONSTRASTE); 
      doc.fillColor('#FFFFFF').fontSize(10);
      
      let currentX = startX;
      doc.text('Fecha/Hora', currentX + 5, dataTableTop + 6, { width: dataColWidths[0] });
      currentX += dataColWidths[0];
      doc.text('Tipo', currentX + 5, dataTableTop + 6, { width: dataColWidths[1] });
      currentX += dataColWidths[1];
      doc.text('Valor', currentX + 5, dataTableTop + 6, { width: dataColWidths[2] });
      currentX += dataColWidths[2];
      doc.text('Sensor', currentX + 5, dataTableTop + 6, { width: dataColWidths[3] });
      
      let currentDataY = dataTableTop + dataItemHeight;
      let globalRowIndex = 0;

      data.slice(0, 500).forEach((item) => { 
          
          if (currentDataY > 750) { 
            doc.addPage();
            currentDataY = 50;
            currentX = startX;
            doc.rect(startX, currentDataY, 500, dataItemHeight).fill(NARANJA_CONSTRASTE); 
            doc.fillColor('#FFFFFF').fontSize(10);
            doc.text('Fecha/Hora', currentX + 5, currentDataY + 6, { width: dataColWidths[0] });
            currentX += dataColWidths[0];
            doc.text('Tipo', currentX + 5, currentDataY + 6, { width: dataColWidths[1] });
            currentX += dataColWidths[1];
            doc.text('Valor', currentX + 5, currentDataY + 6, { width: dataColWidths[2] });
            currentX += dataColWidths[2];
            doc.text('Sensor', currentX + 5, currentDataY + 6, { width: dataColWidths[3] });
            currentDataY += dataItemHeight;
          }
          
          currentX = startX;
          const rowColor = (globalRowIndex % 2 === 0) ? '#FFFFFF' : '#F7F7F7'; 
          doc.fillColor(rowColor).rect(startX, currentDataY, 500, dataItemHeight).fill(rowColor); 

          doc.fillColor('#000000').fontSize(9);
          doc.text(format(item.timestamp, 'dd/MM/yy HH:mm', { locale: es }), currentX + 5, currentDataY + 6, { width: dataColWidths[0] });
          currentX += dataColWidths[0];
          doc.text(item.sensor.type, currentX + 5, currentDataY + 6, { width: dataColWidths[1] });
          currentX += dataColWidths[1];
          doc.text(item.value.toFixed(2), currentX + 5, currentDataY + 6, { width: dataColWidths[2] });
          currentX += dataColWidths[2];
          doc.text(item.sensor.name, currentX + 5, currentDataY + 6, { width: dataColWidths[3] });

          currentDataY += dataItemHeight;
          globalRowIndex++; 
      });

      doc.end();

      stream.on('finish', () => {
        this.logger.log(`📄 PDF generado: ${filename}`);
        resolve(filename);
      });

      stream.on('error', reject);
    });
  }

  /**
   * Genera archivo Excel del reporte con filtros y formato profesional
   */
   private async generateExcel(
    report: Report,
    params: ReportParameters,
    data: any[]
  ): Promise<string> {
    
    const paramsObj: ReportParameters = JSON.parse(report.parameters as string);
    
    const startDatePart = paramsObj.startDate.split('T')[0];
    const endDatePart = paramsObj.endDate.split('T')[0];
    
    const start = format(parseISO(startDatePart), 'dd_MM_yyyy');
    const end = format(parseISO(endDatePart), 'dd_MM_yyyy');
    const tankName = paramsObj.tankName.replace(/ /g, '_');
    
    const filename = `Reporte_Monitoreo_${tankName}_${start}_a_${end}.xlsx`;

    const filepath = path.join(this.reportsDir, filename);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Monitoreo';
    workbook.created = new Date();

    const dataSheet = workbook.addWorksheet('Datos Completos', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }] 
    });
    const statsSheet = workbook.addWorksheet('Resumen');
    
    const VERDE_SENA_ARGB = 'FF39B54A';
    const NARANJA_CONSTRASTE_ARGB = 'FFDD5733'; 
    const GRIS_CLARO_ARGB = 'FFF5F5F5';
    const stats = this.aggregateStats(data); 
    const COLUMNAS_ESTADISTICAS = 5;

    // -----------------------------------------------------
    // HOJA DE RESUMEN/ESTADÍSTICAS
    // -----------------------------------------------------
    
    statsSheet.mergeCells('A1:E1');
    statsSheet.getCell('A1').value = 'Reporte de Monitoreo Acuático';
    statsSheet.getCell('A1').font = { size: 18, bold: true };
    statsSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    statsSheet.getRow(1).height = 30; 
    
    statsSheet.mergeCells('A2:E2');
    statsSheet.getCell('A2').value = 'Servicio Nacional de Aprendizaje - SENA';
    statsSheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    statsSheet.getRow(2).height = 20; 

    statsSheet.getCell('A4').value = 'Título:';
    statsSheet.getCell('B4').value = report.title;
    statsSheet.getCell('A5').value = 'Período:';
    statsSheet.getCell('B5').value = `${format(parseISO(startDatePart), 'dd/MM/yyyy')} al ${format(parseISO(endDatePart), 'dd/MM/yyyy')}`;
    
    statsSheet.getCell('A7').value = 'Total de Registros Monitoreados:'; 
    statsSheet.getCell('A7').font = { bold: true };
    const lastStatRow = 9 + stats.length - 1;
    statsSheet.getCell('B7').value = { formula: `SUM(B9:B${lastStatRow})` };
    statsSheet.getCell('B7').fill = { 
        type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' }
    };
    statsSheet.getCell('B7').alignment = { vertical: 'middle', horizontal: 'center' };
    statsSheet.getRow(7).height = 20; 

    statsSheet.getRow(8).values = ['Tipo de Sensor', 'Nº Registros', 'Promedio', 'Mínimo', 'Máximo'];
    statsSheet.getRow(8).height = 25;

    statsSheet.getRow(8).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    statsSheet.getRow(8).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: VERDE_SENA_ARGB }
    };
    statsSheet.getRow(8).alignment = { vertical: 'middle', horizontal: 'center' };

    let row = 9;
    stats.forEach((stat) => {
        statsSheet.getRow(row).values = [
            stat.sensorName,
            stat.count,
            stat.avg,
            stat.min,
            stat.max
        ];
        
        if (row % 2 === 0) {
          statsSheet.getRow(row).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: GRIS_CLARO_ARGB }
          };
        }
        statsSheet.getRow(row).alignment = { vertical: 'middle', horizontal: 'center' };
        statsSheet.getRow(row).getCell(1).alignment = { horizontal: 'left' };
        row++;
    });
    
    statsSheet.columns = [
        { width: 25 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 18 }
    ];
    
    for (let i = 7; i < row; i++) { 
        for (let j = 1; j <= COLUMNAS_ESTADISTICAS; j++) {
            statsSheet.getRow(i).getCell(j).border = {
                top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        }
    }
    
    // -----------------------------------------------------
    // HOJA DE DATOS COMPLETOS (Detallada)
    // -----------------------------------------------------
    
    dataSheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 }, 
      { header: 'Hora', key: 'time', width: 15 }, 
      { header: 'Tipo', key: 'sensorType', width: 15 },
      { 
        header: 'Valor', 
        key: 'value', 
        width: 12,
        style: { numFmt: '0.00' }
      },
      { header: 'Sensor', key: 'sensorName', width: 25 }, 
      { header: 'Hardware ID', key: 'hardwareId', width: 15 },
    ];
    
    const COLUMNAS_DATOS = dataSheet.columns.length; 

    dataSheet.getRow(1).height = 25;
    dataSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    dataSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: NARANJA_CONSTRASTE_ARGB }
    };
    dataSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    data.forEach(item => {
        const datePart = format(item.timestamp, 'dd/MM/yyyy', { locale: es });
        const timePart = format(item.timestamp, 'HH:mm:ss', { locale: es });

      dataSheet.addRow({
        date: datePart, 
        time: timePart, 
        sensorType: item.sensor.type,
        value: item.value,
        sensorName: item.sensor.name, 
        hardwareId: item.sensor.hardwareId,
      });
    });

    const lastDataRow = dataSheet.rowCount;
    for (let i = 1; i <= lastDataRow; i++) {
      for (let j = 1; j <= COLUMNAS_DATOS; j++) { 
        const cell = dataSheet.getRow(i).getCell(j);
        
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
        };
        
        if (i > 1 && i % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: GRIS_CLARO_ARGB }
          };
        }
      }
    }

    dataSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: COLUMNAS_DATOS }
    };

    await workbook.xlsx.writeFile(filepath);
    this.logger.log(`📊 Excel generado: ${filename}`);

    return filename;
  }

  /**
   * Actualiza el estado de un reporte
   */
  private async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    errorMessage?: string
  ) {
    const updateData: any = {
        status,
    };
    
    if (errorMessage) {
        updateData.errorMessage = errorMessage;
    }

    const report = await this.prisma.report.update({
      where: { id: reportId },
      data: updateData,
    });

    this.eventsGateway.broadcastReportUpdate({
      ...report,
      userId: report.userId,
    });
  }

  /**
   * Obtiene todos los reportes de un usuario
   */
  async getReports(userId: string): Promise<Report[]> {
    return this.prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Descarga un reporte generado
   */
  async downloadReport(reportId: string, fileFormat: 'pdf' | 'xlsx'): Promise<{ buffer: Buffer, filename: string }> { // <--- CAMBIO DE RETORNO
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { user: true }
    });

    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (report.status !== 'COMPLETED') {
      throw new BadRequestException('El reporte aún no está disponible');
    }

    const paths = this.getReportPaths(report);
    if (!paths) {
        throw new NotFoundException(`Archivos no disponibles en el reporte`);
    }

    const paramsObj: ReportParameters = JSON.parse(report.parameters as string);
    
    const startDatePart = paramsObj.startDate.split('T')[0];
    const endDatePart = paramsObj.endDate.split('T')[0];
    
    const start = format(parseISO(startDatePart), 'dd_MM_yyyy');
    const end = format(parseISO(endDatePart), 'dd_MM_yyyy');
    const tankName = paramsObj.tankName.replace(/ /g, '_'); 
    
    const baseName = `Reporte_Monitoreo_${tankName}_${start}_a_${end}`;
    
    const extension = fileFormat === 'pdf' ? 'pdf' : 'xlsx';
    const filename = `${baseName}.${extension}`; 
    
    const fileToDownload = fileFormat === 'pdf' ? paths.pdfPath : paths.excelPath;
    
    if (!fileToDownload) {
      throw new NotFoundException(`Archivo ${fileFormat.toUpperCase()} no disponible`);
    }

    const filepath = path.join(this.reportsDir, fileToDownload);

    try {
      const buffer = await fs.readFile(filepath);
      
      return { buffer, filename }; 
    } catch (error) {
      this.logger.error(`Error leyendo archivo ${filepath}:`, error);
      throw new NotFoundException('Archivo no encontrado en el servidor');
    }
  }

  /**
   * Elimina un reporte y sus archivos
   */
  async deleteReport(reportId: string, userId: string): Promise<void> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (report.userId !== userId) {
      throw new BadRequestException('No tienes permiso para eliminar este reporte');
    }

    const paths = this.getReportPaths(report);

    if (paths) {
        if (paths.pdfPath) { 
          try {
            await fs.unlink(path.join(this.reportsDir, paths.pdfPath));
          } catch (error) {
            this.logger.warn(`No se pudo eliminar PDF: ${paths.pdfPath}`);
          }
        }

        if (paths.excelPath) { 
          try {
            await fs.unlink(path.join(this.reportsDir, paths.excelPath));
          } catch (error) {
            this.logger.warn(`No se pudo eliminar Excel: ${paths.excelPath}`);
          }
        }
    }

    await this.prisma.report.delete({
      where: { id: reportId },
    });

    this.logger.log(`🗑️ Reporte ${reportId} eliminado`);
  }
}