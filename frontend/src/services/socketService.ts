/**
 * @file socketService.ts
 * @route frontend/src/services
 * @description Servicio CORREGIDO para gestionar Socket.IO
 * @author Kevin Mariano
 * @version 2.0.2 - FIXED PATH
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { Logger } from '@/utils/logger';

class SocketManager {
    public socket: Socket<any, any> | null = null;
    private logger = new Logger('SocketManager');
    private static instance: SocketManager;
    private connectionAttempts = 0;
    private readonly MAX_ATTEMPTS = 10;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    private constructor() {
        this.logger.log('Inicializando SocketManager...');
    }

    public static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    public getSocket(): Socket | null {
        return this.socket;
    }

    public connect(token: string | null): void {
        this.logger.log('Iniciando conexión de socket...');
        if (!token) {
            this.logger.error('❌ No se puede conectar: token no disponible');
            return;
        }
        
        // Verificar si ya está conectado
        if (this.socket && this.socket.connected) {
             const currentAuth = this.socket.auth as { token: string };
             
             if (currentAuth.token === `Bearer ${token}`) {
                 this.logger.log('✅ Socket ya conectado con el token correcto');
                 return; 
             }
             
             this.logger.warn('⚠️ Reconectando con nuevo token...');
             this.socket.disconnect();
        }

        // 🔥 CORRECCIÓN: Construir URL base limpia (http://host:port)
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        let baseUrl;
        try {
            const urlObj = new URL(apiBaseUrl);
            baseUrl = urlObj.origin; // Esto nos da "http://localhost:5001" sin subrutas
        } catch (e) {
            this.logger.error('❌ URL de API inválida, usando fallback local');
            baseUrl = 'http://localhost:5001';
        }
        
        const options: Partial<ManagerOptions & SocketOptions> = {
            // 🔥 CORRECCIÓN CRÍTICA: Path SIN barra al final para coincidir con el backend
            path: '/acuaponiaapi/socket.io',
            
            // Headers y Auth
            extraHeaders: { 
                Authorization: `Bearer ${token}` 
            },
            auth: {
                token: `Bearer ${token}`,
            },

            // Transportes y Reconexión
            transports: ['websocket', 'polling'],
            reconnectionAttempts: this.MAX_ATTEMPTS,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            forceNew: true,
        };

        this.logger.log(`🔗 Conectando a: ${baseUrl}${options.path}`);
        
        this.socket = io(baseUrl, options);
        this.registerEventListeners();
    }
  
    public close(): void {
        this.logger.log('Cerrando conexión de socket...');
        if (this.socket) { 
            this.socket.disconnect();
            this.socket = null; 
        }
    }

    private registerEventListeners(): void {
        if (!this.socket) return;
        
        this.socket.on('connect', () => {
            this.logger.log('✅ Socket conectado exitosamente');
            this.logger.log(`📍 Socket ID: ${this.socket?.id}`);
            this.connectionAttempts = 0; 
        });
        
        this.socket.on('connect_error', (error: Error) => {
            // Filtrar logs de polling para no ensuciar la consola
            if(error.message !== 'xhr poll error') {
                this.logger.error('❌ Error de conexión:', error.message);
            }
            
            if (error.message.includes('Invalid token')) {
                this.logger.error('🔒 Token inválido - cerrando conexión');
                this.close(); 
            }
        });

        this.socket.on('disconnect', (reason: string) => {
            this.logger.warn(`🔴 Desconectado: ${reason}`);
            
            if (reason === 'io server disconnect') {
                this.logger.warn('⚠️ Servidor cerró la conexión');
                // Intentar reconectar automáticamente si no fue manual
                // this.startReconnectionProcess(); 
            }
        });

        this.socket.on('connection_established', (data: any) => {
            this.logger.log('✅ Conexión establecida:', data);
        });

        this.socket.on('connection_error', (data: any) => {
            this.logger.error('❌ Error en handshake:', data);
        });
    }

    private startReconnectionProcess(): void {
        if (this.reconnectTimeout) return;
        
        const attempt = this.connectionAttempts + 1;
        if (attempt > this.MAX_ATTEMPTS) {
            this.logger.error(`❌ Reconexión fallida (${this.MAX_ATTEMPTS} intentos)`);
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        this.logger.warn(`🔄 Reconectando en ${delay / 1000}s (intento ${attempt}/${this.MAX_ATTEMPTS})`);
        
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            
            const token = typeof window !== 'undefined' 
                ? localStorage.getItem('accessToken') 
                : null;
            
            if (token) {
                this.connect(token);
                this.connectionAttempts++;
            } else {
                this.logger.error('❌ Token no disponible para reconexión');
                this.socket?.disconnect();
            }
        }, delay);
    }

    public reconnect(): void {
        this.logger.log('Iniciando reconexión manual...');
        this.connectionAttempts = 0;
        this.startReconnectionProcess();
    }
    
    public on(event: string, callback: (...args: any[]) => void): void {
        this.socket?.on(event, callback);
    }

    public off(event: string, callback: (...args: any[]) => void): void {
        this.socket?.off(event, callback);
    }
}

export const socketManager = SocketManager.getInstance();
export const socketService = socketManager as any; 
export const socket = socketManager ? socketManager.getSocket() : null;