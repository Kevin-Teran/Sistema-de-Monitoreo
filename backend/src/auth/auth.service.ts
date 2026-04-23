/**
 * @file auth.service.ts
 * @route backend/src/auth/
 * @description Lógica de negocio para la autenticación, con seguridad mejorada para restablecimiento de contraseña.
 * Implementa un límite de frecuencia (rate limit) de 5 minutos usando el Cache Manager.
 * @author kevin mariano
 * @version 1.0.3 
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Injectable, UnauthorizedException, BadRequestException, Logger, NotFoundException, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role, User } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager'; 
import { Cache } from 'cache-manager'; 

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private emailService: EmailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, // Inyección del gestor de caché
  ) {}

  /**
   * Valida las credenciales del usuario y genera los tokens si son correctas.
   * @param {LoginDto} loginDto - Objeto con email y contraseña.
   * @returns {Promise<{user: Omit<User, 'password'>, accessToken: string, refreshToken: string}>}
   * @throws {UnauthorizedException} Si las credenciales son incorrectas o el usuario está inactivo.
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    this.logger.log(`Iniciando proceso de login para: ${email}`);
    
    const user = await this.usersService.findByEmail(email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      this.logger.warn(`Login fallido para ${email}: Credenciales incorrectas.`);
      throw new UnauthorizedException('Credenciales incorrectas.');
    }
    
    if (user.status !== 'ACTIVE') {
      this.logger.warn(`Login fallido para ${email}: Cuenta inactiva o suspendida.`);
      throw new UnauthorizedException('Tu cuenta está inactiva o suspendida.');
    }

    this.logger.log(`Usuario ${email} verificado. Generando tokens...`);
    const tokens = await this.getTokens(user.id, user.email, user.role);

    // Actualizar última fecha de login
    // @ts-ignore
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userPayload } = user;

    const responsePayload = {
      user: userPayload,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
    
    this.logger.log(`Login exitoso. Enviando payload al cliente: ${JSON.stringify(responsePayload, null, 2)}`);

    return responsePayload;
  }

  private async getTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Genera un token JWT (válido por 1 hora) para restablecer la contraseña y envía el correo.
   * Implementa un límite de frecuencia de 5 minutos usando el Cache Manager (memoria o Redis).
   */
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    const cacheKey = `reset_limit_${email}`;
    const RATE_LIMIT_DURATION_SECONDS = 5 * 60; // 5 minutos en segundos

    // **LÓGICA DE SEGURIDAD 1: LÍMITE DE FRECUENCIA CON CACHÉ**
    const isLimited = await this.cacheManager.get(cacheKey);

    if (isLimited) {
        this.logger.warn(`Solicitud de reseteo denegada para ${email}: Límite de frecuencia activo.`);
        // Respuesta ambigua por seguridad
        return { message: 'Si tu correo electrónico está en nuestros registros, recibirás un enlace para restablecer tu contraseña.' };
    }

    if (!user) {
      this.logger.warn(`Intento de restablecimiento de contraseña para correo no registrado: ${email}`);
      return { message: 'Si tu correo electrónico está en nuestros registros, recibirás un enlace para restablecer tu contraseña.' };
    }
  
    // Genera un JWT para el restablecimiento de contraseña
    const resetToken = this.jwtService.sign(
      { sub: user.id, purpose: 'password-reset' },
      {
        secret: this.configService.get<string>('JWT_RESET_SECRET') || this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h', // Token válido por 1 hora
      },
    );
  
    // Obtener la URL base y garantizar la ruta de la aplicación.
    let clientUrl = this.configService.get<string>('FRONTEND_URL');
    // Limpiar la URL base (eliminar la barra diagonal al final)
    clientUrl = clientUrl.replace(/\/$/, ''); 

    // Añadir el subdirectorio /acuaponia y el token
    const resetUrl = `${clientUrl}/acuaponia/recover-password/${resetToken}`;
    
    await this.emailService.sendResetPasswordEmail(user.email, resetUrl);
    
    // **LÍMITE DE FRECUENCIA 2:** Establecer el límite en la caché
    // CORRECCIÓN: Pasar el TTL (número) directamente como el tercer argumento.
    await this.cacheManager.set(cacheKey, true, RATE_LIMIT_DURATION_SECONDS);

    this.logger.log(`URL de reseteo (enviada al correo): ${resetUrl}`);
  
    return { message: 'Si tu correo electrónico está en nuestros registros, recibirás un enlace para restablecer tu contraseña.' };
  }

  /**
   * Valida el JWT y actualiza la contraseña del usuario.
   * Este método confía únicamente en la expiración de 1 hora del JWT.
   */
  async resetPassword(token: string, newPassword: string) {
    try {
      // 1. Verificar y decodificar el token JWT
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_RESET_SECRET') || this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.purpose !== 'password-reset') {
        throw new BadRequestException('Token inválido.');
      }
      
      // 2. Obtener usuario (usando sub del payload)
      const targetUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!targetUser) {
        throw new BadRequestException('Usuario asociado al token no encontrado.');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // 3. Actualizar contraseña
      await this.prisma.user.update({
        where: { id: targetUser.id },
        data: { password: hashedPassword },
      });
      
      return { message: 'Contraseña actualizada correctamente.' };
    } catch (error) {
      // Este error captura tokens expirados, inválidos o malformados.
      throw new BadRequestException('El token es inválido o ha expirado.');
    }
  }
}