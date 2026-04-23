/**
 * @file ws-jwt.guard.ts
 * @description Guardia de autenticación JWT para WebSockets.
 * @author Kevin Mariano
 * @version 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger(WsJwtGuard.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient<Socket>();
        const token = this.extractTokenFromHandshake(client);

        if (!token) {
            this.logger.warn(
                `Cliente ${client.id} rechazado: No se proporcionó token.`,
            );
            throw new WsException('No se proporcionó token de autenticación.');
        }

        try {
            // 1. Verificar que el token sea válido y no haya expirado
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
            });

            // 2. Buscar al usuario en la base de datos para asegurar que existe
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user) {
                throw new WsException('El usuario perteneciente a este token ya no existe.');
            }

            // 3. Adjuntar el objeto de usuario completo al socket para uso posterior
            client.data.user = user;
        } catch (e) {
            this.logger.error(
                `Error de autenticación para ${client.id}: ${e.message}`,
            );
            throw new WsException('Token inválido o expirado.');
        }

        return true;
    }

    private extractTokenFromHandshake(client: Socket): string | undefined {
        const authHeader =
            client.handshake.headers.authorization || client.handshake.auth.token;

        if (typeof authHeader === 'string') {
            const [type, token] = authHeader.split(' ') ?? [];
            return type === 'Bearer' ? token : undefined;
        }

        return undefined;
    }
}