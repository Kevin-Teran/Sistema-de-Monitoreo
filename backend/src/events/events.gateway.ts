/**
 * @file events.gateway.ts
 * @route /backend/src/events
 * @description Gateway de WebSockets completo y corregido con tipos apropiados y CORS dinámico.
 * @author Kevin Mariano
 * @version 1.0.4
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

 import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SensorData, Report, User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

interface SensorDataPayload {
  id: string;
  value: number;
  timestamp: string | Date;
  userId: string;
  sensor: {
    id: string;
    name: string;
    type: string;
    hardwareId: string;
    tank: {
      id: string;
      name: string;
      userId: string;
    };
  };
}

interface ReportWithUser extends Report {
  userId: string;
}

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  'https://tecnoparqueatlantico.com'
].filter((origin): origin is string => !!origin);

@WebSocketGateway({
  path: '/acuaponiaapi/socket.io',
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private connectedClients = new Map<string, { userId: string; userName: string }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * @method handleConnection
   * @description Maneja la conexión de un nuevo cliente con autenticación JWT.
   */
  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromHandshake(client);
      
      if (!token) {
        this.logger.warn(`Intento de conexión sin token desde ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new Error('El usuario del token no fue encontrado.');
      }

      client.data.user = user;

      this.connectedClients.set(client.id, {
        userId: user.id,
        userName: user.name,
      });

      this.logger.log(`🔗 Cliente conectado y autenticado: ${user.name} (${client.id})`);
      
      client.join(user.id);
      this.logger.log(`🚪 Cliente ${client.id} se unió a la sala: ${user.id}`);

      if (user.role === 'ADMIN') {
        client.join('admin_room');
        this.logger.log(`👑 Admin ${user.name} unido a la sala de administradores`);
      }

      client.emit('connection_established', {
        message: 'Conectado exitosamente',
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`📊 Total de clientes conectados: ${this.connectedClients.size}`);

    } catch (error) {
      this.logger.error(`❌ Falló la autenticación del socket: ${error.message}`);
      client.emit('connection_error', { 
        error: 'Error de autenticación',
        message: error.message 
      });
      client.disconnect(true);
    }
  }

  /**
   * @method handleDisconnect
   * @description Maneja la desconexión de un cliente.
   */
  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    
    if (clientInfo) {
      this.logger.log(`🔌 Cliente desconectado: ${clientInfo.userName} (${client.id})`);
      this.connectedClients.delete(client.id);
    }
  }

  /**
   * @method extractTokenFromHandshake
   * @description Extrae el token JWT del handshake del socket.
   */
  private extractTokenFromHandshake(client: Socket): string | undefined {
    const auth = client.handshake.auth?.token || client.handshake.headers?.authorization;
    
    if (!auth) return undefined;

    const parts = auth.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
    }
    
    return auth;
  }

  /**
   * @method broadcastNewData
   * @description Alias para mantener compatibilidad con el código existente
   */
  public broadcastNewData(data: any) {
    this.broadcastNewSensorData(data);
  }

  /**
   * @method broadcastNewSensorData
   * @description Emite nuevos datos de sensores a usuarios específicos.
   */
  public broadcastNewSensorData(sensorData: SensorDataPayload | any) {
    const userId = sensorData.userId || sensorData.sensor?.tank?.userId;
    
    if (!userId) {
      this.logger.warn('❌ No se puede emitir datos de sensor: falta userId');
      return;
    }

    const formattedData = {
      id: sensorData.id,
      value: sensorData.value,
      timestamp: sensorData.timestamp instanceof Date 
        ? sensorData.timestamp.toISOString() 
        : sensorData.timestamp,
      sensor: {
        id: sensorData.sensor.id,
        name: sensorData.sensor.name,
        type: sensorData.sensor.type,
        hardwareId: sensorData.sensor.hardwareId,
        tank: {
          id: sensorData.sensor.tank.id,
          name: sensorData.sensor.tank.name,
        }
      },
    };
    
    this.server.to(userId).emit('new_sensor_data', formattedData);

    this.server.to('admin_room').emit('new_sensor_data', {
      ...formattedData,
      userId: userId, 
    });
  }

  /**
   * @method broadcastReportUpdate
   * @description Emite actualizaciones de reportes.
   */
  public broadcastReportUpdate(report: ReportWithUser) {
    if (!report.userId) {
      this.logger.warn('❌ No se puede emitir actualización de reporte: falta userId');
      return;
    }

    this.logger.log(`📋 Enviando actualización de reporte a usuario ${report.userId}`);
    this.server.to(report.userId).emit('report_status_update', report);
    this.server.to('admin_room').emit('report_status_update', report);
  }

  /**
   * @method broadcastNewAlertToAdmins
   * @description Emite una nueva alerta a los administradores.
   */
  public broadcastNewAlertToAdmins(adminIds: string[], alertPayload: any) {
    this.server.to('admin_room').emit('new-alert', alertPayload);

    if (adminIds && adminIds.length > 0) {
      adminIds.forEach(adminId => {
        this.server.to(adminId).emit('new-alert', alertPayload);
      });
    }
  }

  /**
   * @method broadcastToAll
   * @description Emite un mensaje a todos los clientes conectados.
   */
  public broadcastToAll(event: string, data: any) {
    this.logger.log(`📢 Transmitiendo '${event}' a todos los clientes conectados`);
    this.server.emit(event, data);
  }

  /**
   * @SubscribeMessage test_broadcast
   * @description Método de prueba.
   */
  @SubscribeMessage('test_broadcast')
  handleTestBroadcast(client: Socket, data: any) {
    const user = client.data.user;
    if (!user) return { error: 'Usuario no autenticado' };

    const testSensorData = {
      id: 'test-' + Date.now(),
      value: Math.round((Math.random() * 30 + 20) * 100) / 100, 
      timestamp: new Date().toISOString(),
      userId: user.id,
      sensor: {
        id: 'test-sensor-' + Math.floor(Math.random() * 3 + 1),
        name: 'Sensor de Prueba',
        type: ['TEMPERATURE', 'PH', 'OXYGEN'][Math.floor(Math.random() * 3)],
        hardwareId: 'TEST' + String(Math.floor(Math.random() * 999)).padStart(3, '0'),
        tank: {
          id: 'test-tank-1',
          name: 'Tanque de Prueba',
          userId: user.id,
        }
      }
    };

    this.broadcastNewSensorData(testSensorData);

    return { 
      success: true, 
      message: 'Datos de prueba enviados',
      data: testSensorData
    };
  }

  /**
   * @SubscribeMessage get_connection_info
   */
  @SubscribeMessage('get_connection_info')
  handleGetConnectionInfo(client: Socket) {
    const user = client.data.user;
    const clientInfo = this.connectedClients.get(client.id);

    return {
      socketId: client.id,
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      connectedAt: clientInfo ? 'Connected' : 'Unknown',
      totalConnections: this.connectedClients.size,
      rooms: Array.from(client.rooms),
    };
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  public getConnectedUsers(): Array<{ userId: string; userName: string; socketId: string }> {
    const users: Array<{ userId: string; userName: string; socketId: string }> = [];
    this.connectedClients.forEach((clientInfo, socketId) => {
      users.push({
        userId: clientInfo.userId,
        userName: clientInfo.userName,
        socketId: socketId,
      });
    });
    return users;
  }

  public isUserConnected(userId: string): boolean {
    for (const [, clientInfo] of this.connectedClients) {
      if (clientInfo.userId === userId) return true;
    }
    return false;
  }

  public broadcastNewAlertToUser(userId: string, alertPayload: any) {
    if (!userId) {
      this.logger.warn('❌ No se puede emitir alerta: userId no proporcionado');
      return;
    }
    this.logger.log(`🚨 Transmitiendo alerta a usuario: ${userId}`);
    this.server.to(userId).emit('new-alert', alertPayload);
  }
}