/**
 * @file data.service.ts
 * @route /backend/src/data
 * @description Servicio de datos con integración de reportes automáticos
 * @author Kevin Mariano 
 * @version 1.0.2
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { MqttService } from '../mqtt/mqtt.service';
import { ManualEntryDto } from './dto/manual-entry.dto';
import { EventsGateway } from '../events/events.gateway';
import { AlertsService } from '../alerts/alerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportService } from '../reports/reports.service';
import { GetLatestDataDto } from './dto/get-latest-data.dto';
import { SensorData, sensors_type as SensorTypePrisma, User, Role, Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

type SimulationState = 'STABLE' | 'RISING' | 'FALLING';

interface ActiveEmitter {
  intervalId: NodeJS.Timeout;
  sensorId: string;
  hardwareId: string;
  sensorName: string;
  type: SensorTypePrisma;
  tankId: string;
  tankName: string;
  userName: string;
  userId: string;
  thresholds: { min: number; max: number };
  currentValue: number;
  state: SimulationState;
  startTime: Date;
  messagesCount: number;
  isPersistent: boolean;
}

interface PersistentSimulationState {
  sensorId: string;
  userId: string;
}

const DEFAULT_THRESHOLDS = {
  TEMPERATURE: { min: 22, max: 28 },
  PH: { min: 6.8, max: 7.6 },
  OXYGEN: { min: 6, max: 10 },
};

@Injectable()
export class DataService implements OnModuleInit, OnModuleDestroy {
  private readonly activeEmitters = new Map<string, ActiveEmitter>();
  private readonly logger = new Logger(DataService.name);
  private readonly serviceStartTime = new Date();
  private readonly cacheFilePath = path.join(__dirname, '..', '..', 'simulation-cache.json');

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    @Inject(forwardRef(() => MqttService))
    private mqttService: MqttService,
    @Inject(forwardRef(() => ReportService))
    private reportService: ReportService,
    private readonly alertsService: AlertsService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 [INIT] Inicializando servicio de datos...');
    await this.restoreSimulations();
    this.logger.log('✅ [INIT] Servicio de datos inicializado correctamente.');
  }

  async onModuleDestroy() {
    this.logger.log('🛑 [SHUTDOWN] Deteniendo simulaciones y guardando estado...');
    await this.persistSimulations();
    this.activeEmitters.forEach(emitter => clearInterval(emitter.intervalId));
    this.logger.log('✅ [SHUTDOWN] Simulaciones detenidas y estado guardado.');
  }

  private async persistSimulations(): Promise<void> {
    try {
      const simulationsToSave: PersistentSimulationState[] = Array.from(this.activeEmitters.values())
        .map(({ sensorId, userId }) => ({ sensorId, userId }));
      await fs.writeFile(this.cacheFilePath, JSON.stringify(simulationsToSave, null, 2));
    } catch (error) {
      this.logger.error('❌ [CACHE] Error al guardar el estado:', error);
    }
  }

  private async restoreSimulations(): Promise<void> {
    try {
      const data = await fs.readFile(this.cacheFilePath, 'utf-8');
      const savedSimulations = JSON.parse(data) as PersistentSimulationState[];
      if (savedSimulations.length > 0) {
        const userIds = [...new Set(savedSimulations.map(s => s.userId))];
        const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } });
        const userMap = new Map(users.map(u => [u.id, u]));
        for (const sim of savedSimulations) {
            const user = userMap.get(sim.userId);
            if(user) await this.startEmitters([sim.sensorId], user, true);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') this.logger.error('❌ [CACHE] Error al restaurar:', error);
    }
  }

  async createFromMqtt(hardwareId: string, data: { value: number; timestamp?: string }): Promise<SensorData> {
    const sensor = await this.prisma.sensor.findUnique({
      where: { hardwareId },
      include: { 
        tank: { 
          include: { 
            user: true 
          } 
        } 
      },
    });
  
    if (!sensor) {
      this.logger.error(`❌ [DataService] Sensor no encontrado para hardwareId: "${hardwareId}"`);
      
      const availableSensors = await this.prisma.sensor.findMany({
        select: { hardwareId: true, name: true, type: true }
      });
      this.logger.log(`🔍 [DataService] Sensores disponibles: ${availableSensors.map(s => s.hardwareId).join(', ')}`);
      
      throw new NotFoundException(`Sensor con hardwareId "${hardwareId}" no fue encontrado.`);
    }
    try {
      await this.alertsService.checkThresholds(sensor, data.value);
    } catch (alertError) {
      this.logger.error('Error al procesar checkThresholds:', alertError);
    }
  
    this.logger.log(`✅ [DataService] Sensor encontrado: ${sensor.name} (${sensor.type}) del tanque ${sensor.tank.name}`);
  
    const activeEmitter = this.activeEmitters.get(sensor.id);
    if (activeEmitter) {
      activeEmitter.currentValue = data.value;
      activeEmitter.messagesCount++;
    }

    try {
      await this.reportService.incrementDataCounter(sensor.tankId, sensor.tank.userId);
    } catch (error) {
      this.logger.error('Error incrementando contador de reportes:', error);
    }
  
    return this.createAndBroadcastEntry({
      sensorId: sensor.id,
      tankId: sensor.tankId,
      type: sensor.type,
      value: data.value,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      userId: sensor.tank.userId,
      sensorInfo: {
        id: sensor.id,
        name: sensor.name,
        type: sensor.type,
        hardwareId: sensor.hardwareId,
        tank: {
          id: sensor.tank.id,
          name: sensor.tank.name,
          userId: sensor.tank.userId,
        }
      }
    });
  }

  async submitManualEntry(entries: ManualEntryDto[]): Promise<SensorData[]> {
    const createdData: SensorData[] = [];
    for (const entry of entries) {
      const sensor = await this.prisma.sensor.findUnique({
        where: { id: entry.sensorId },
        include: { 
          tank: { 
            include: { 
              user: true 
            } 
          } 
        },
      });
      
      if (sensor) {
        try {
          await this.alertsService.checkThresholds(sensor, entry.value);
        } catch (alertError) {
          this.logger.error('Error al procesar checkThresholds (manual):', alertError);
        }
        try {
          await this.reportService.incrementDataCounter(sensor.tankId, sensor.tank.userId);
        } catch (error) {
          this.logger.error('Error incrementando contador de reportes (manual):', error);
        }

        const data = await this.createAndBroadcastEntry({
          sensorId: entry.sensorId,
          tankId: sensor.tankId,
          type: sensor.type,
          value: entry.value,
          timestamp: entry.timestamp || new Date(),
          userId: sensor.tank.userId,
          sensorInfo: {
            id: sensor.id,
            name: sensor.name,
            type: sensor.type,
            hardwareId: sensor.hardwareId,
            tank: {
              id: sensor.tank.id,
              name: sensor.tank.name,
              userId: sensor.tank.userId,
            }
          }
        });
        createdData.push(data);
      }
    }
    return createdData;
  }
  
  async startEmitters(sensorIds: string[], user: User, isFromRestore = false): Promise<any> {
    const results = { started: [] as string[], skipped: [] as string[], errors: [] as string[] };
    for (const sensorId of sensorIds) {
      try {
        if (this.activeEmitters.has(sensorId)) {
          results.skipped.push(sensorId);
          continue;
        }
        const sensor = await this.prisma.sensor.findUnique({ where: { id: sensorId }, include: { tank: { include: { user: true } } } });
        if (!sensor || (user.role !== 'ADMIN' && sensor.tank.userId !== user.id)) {
          results.errors.push(`Sensor ${sensorId} no encontrado o sin permisos.`);
          continue;
        }
        
        let userSettingsJson: any = {};
        if (sensor.tank.user.settings) {
          try {
            userSettingsJson = JSON.parse(sensor.tank.user.settings); 
          } catch (e) {
            this.logger.warn(`Error parseando settings (sim) del usuario ${sensor.tank.user.id}`);
          }
        }
        const userSettings = userSettingsJson.thresholds || {}; 
        const sensorTypeKey = sensor.type as keyof typeof DEFAULT_THRESHOLDS;
        const sensorTypeKeyLower = sensor.type.toLowerCase() as keyof typeof userSettings; 
        const thresholds = { 
          min: userSettings[sensorTypeKeyLower]?.min ?? DEFAULT_THRESHOLDS[sensorTypeKey]?.min ?? 0, 
          max: userSettings[sensorTypeKeyLower]?.max ?? DEFAULT_THRESHOLDS[sensorTypeKey]?.max ?? 100,
        };

        const emitterState: ActiveEmitter = { 
          intervalId: setInterval(() => {
            const emitter = this.activeEmitters.get(sensorId);
            if (!emitter) return;
            const { currentValue } = this.generateRealisticValue(emitter);
            this.mqttService.publishMessage(sensor.hardwareId, String(currentValue));
          }, 5000 + Math.random() * 1000),
          sensorId, 
          hardwareId: sensor.hardwareId,
          sensorName: sensor.name, 
          type: sensor.type, 
          tankId: sensor.tankId,
          tankName: sensor.tank.name, 
          userName: sensor.tank.user.name,
          userId: sensor.tank.user.id, 
          thresholds, 
          currentValue: sensor.lastReading || (thresholds.min + thresholds.max) / 2, 
          state: 'STABLE', 
          startTime: new Date(),
          messagesCount: 0,
          isPersistent: true,
        };
        this.activeEmitters.set(sensorId, emitterState);
        results.started.push(sensorId);
      } catch (error) {
        results.errors.push(`Error en sensor ${sensorId}: ${error.message}`);
      }
    }
    if (results.started.length > 0 && !isFromRestore) await this.persistSimulations();
    return results;
  }

  async stopEmitter(sensorId: string, user: User): Promise<void> {
    const emitter = this.activeEmitters.get(sensorId);
    if (!emitter) return;
    if (user.role !== 'ADMIN' && emitter.userId !== user.id) throw new ForbiddenException('No tienes permiso.');
    clearInterval(emitter.intervalId); 
    this.activeEmitters.delete(sensorId); 
    await this.persistSimulations();
  }

  async stopMultipleEmitters(sensorIds: string[], user: User): Promise<any> {
    let stoppedCount = 0;
    for (const sensorId of sensorIds) {
      const emitter = this.activeEmitters.get(sensorId);
      if (emitter && (user.role === 'ADMIN' || emitter.userId === user.id)) {
        clearInterval(emitter.intervalId);
        this.activeEmitters.delete(sensorId);
        stoppedCount++;
      }
    }
    if (stoppedCount > 0) await this.persistSimulations();
    return { stopped: stoppedCount };
  }
  
  async restartEmitters(sensorIds: string[], user: User): Promise<any> {
    await this.stopMultipleEmitters(sensorIds, user);
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.startEmitters(sensorIds, user);
  }

  async getLatest(query: GetLatestDataDto, user: User): Promise<SensorData[]> {
    const { tankId, type } = query;
    if (!tankId) throw new BadRequestException('El parámetro tankId es requerido.');
    if (user.role !== 'ADMIN') {
      const tank = await this.prisma.tank.findFirst({ where: { id: tankId, userId: user.id } });
      if (!tank) throw new ForbiddenException('No tienes permiso para acceder a este tanque.');
    }
    const sensors = await this.prisma.sensor.findMany({ where: { tankId, ...(type && { type: type as SensorTypePrisma }) }, select: { id: true } });
    if (sensors.length === 0) return [];
    
    return this.prisma.sensorData.findMany({
      where: { sensorId: { in: sensors.map(s => s.id) } },
      orderBy: { timestamp: 'desc' },
      distinct: ['sensorId'],
      include: { sensor: { select: { id: true, name: true, type: true, hardwareId: true } } }
    });
  }

  async getHistoricalData(user: User, tankId: string, startDate: string, endDate: string): Promise<SensorData[]> {
    if (!tankId || !startDate || !endDate) throw new BadRequestException('Parámetros requeridos: tankId, startDate y endDate.');
    if (user.role !== 'ADMIN') {
      const tank = await this.prisma.tank.findFirst({ where: { id: tankId, userId: user.id } });
      if (!tank) throw new ForbiddenException('No tienes permiso para acceder a los datos de este tanque.');
    }
    return this.prisma.sensorData.findMany({
      where: { 
        sensor: { tankId }, 
        timestamp: { gte: new Date(startDate), lte: new Date(endDate) } 
      },
      orderBy: { timestamp: 'asc' },
      include: { sensor: { select: { name: true, type: true } } }
    });
  }

  getEmitterStatus(user: User): any[] {
    return Array.from(this.activeEmitters.values())
      .filter(emitter => user.role === 'ADMIN' || emitter.userId === user.id)
      .map(({ intervalId, ...rest }) => ({
        ...rest,
        uptime: Math.floor((Date.now() - rest.startTime.getTime()) / 1000),
      }));
  }

  getSimulationMetrics(user: User): any {
    const userSimulations = Array.from(this.activeEmitters.values())
      .filter(emitter => user.role === 'ADMIN' || emitter.userId === user.id);
    return {
      totalActiveSimulations: userSimulations.length,
      totalMessagesSent: userSimulations.reduce((sum, sim) => sum + sim.messagesCount, 0),
      averageUptime: userSimulations.length > 0 ? Math.floor(userSimulations.reduce((sum, sim) => sum + (Date.now() - sim.startTime.getTime()), 0) / userSimulations.length / 1000) : 0,
      simulationsByType: userSimulations.reduce((acc, sim) => { acc[sim.type] = (acc[sim.type] || 0) + 1; return acc; }, {} as Record<SensorTypePrisma, number>),
      systemUptime: Math.floor((Date.now() - this.serviceStartTime.getTime()) / 1000)
    };
  }

  private async createAndBroadcastEntry(data: { 
    sensorId: string; 
    tankId: string; 
    type: SensorTypePrisma; 
    value: number; 
    timestamp: Date; 
    userId: string;
    sensorInfo?: any;
  }): Promise<SensorData> {
    const { userId, sensorInfo, ...createData } = data;
    
    const createdData = await this.prisma.sensorData.create({
      data: createData,
      include: { 
        sensor: { 
          select: { 
            id: true, 
            name: true, 
            type: true, 
            hardwareId: true,
            tank: {
              select: {
                id: true,
                name: true,
                userId: true
              }
            }
          } 
        } 
      },
    });
  
    await this.prisma.sensor.update({ 
      where: { id: data.sensorId }, 
      data: { lastReading: data.value, lastUpdate: data.timestamp } 
    });
  
    const dataForWebSocket = {
      id: createdData.id,
      value: createdData.value,
      timestamp: createdData.timestamp,
      type: createdData.type,
      userId: userId,
      sensor: sensorInfo || {
        id: createdData.sensor.id,
        name: createdData.sensor.name,
        type: createdData.sensor.type,
        hardwareId: createdData.sensor.hardwareId,
        tank: {
          id: createdData.sensor.tank.id,
          name: createdData.sensor.tank.name,
          userId: createdData.sensor.tank.userId,
        }
      }
    };
  
    this.logger.log(`💾 [DataService] Datos guardados | ID: ${createdData.id}, Valor: ${data.value}, Tipo: ${data.type}`);
    
    this.eventsGateway.broadcastNewData(dataForWebSocket);
    this.logger.log(`📡 [DataService] Datos enviados via WebSocket a usuario ${userId}`);
  
    return createdData;
  }
  
  private generateRealisticValue(emitter: ActiveEmitter): { currentValue: number; state: SimulationState } {
    let { currentValue, state, thresholds, type } = emitter;
    const { min, max } = thresholds;
    const range = max - min;
    if (state === 'STABLE' && Math.random() < 0.03) state = Math.random() < 0.5 ? 'RISING' : 'FALLING';
    else if (state !== 'STABLE' && Math.random() < 0.2) state = 'STABLE';
    let target = (min + max) / 2;
    if (state === 'RISING') target = max * 1.05;
    if (state === 'FALLING') target = min * 0.95;
    const pull = (target - currentValue) * 0.3;
    const randomStep = (Math.random() - 0.5) * (range * 0.1);
    let nextValue = currentValue + pull + randomStep;
    nextValue = Math.max(min * 0.9, Math.min(nextValue, max * 1.1));
    const precision = (type === 'PH') ? 2 : 1;
    return { currentValue: parseFloat(nextValue.toFixed(precision)), state };
  }
}