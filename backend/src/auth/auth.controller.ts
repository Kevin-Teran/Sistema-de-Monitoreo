/**
 * @file auth.controller.ts
 * @route backend/src/auth/
 * @description
 * Controlador de NestJS que gestiona las rutas de autenticación. Expone los
 * endpoints para el inicio de sesión, cierre de sesión, obtención del perfil
 * del usuario y el flujo de recuperación de contraseña.
 * @author kevin mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Controller, Post, Body, HttpCode, HttpStatus, Res, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { Response, Request } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  /**
   * @constructor
   * @param {AuthService} authService - Inyección del servicio de autenticación.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * @method login
   * @description
   * Maneja la solicitud POST a /api/auth/login. Valida las credenciales del usuario
   * y, si son correctas, establece una cookie HTTP-Only con el token de acceso.
   * La duración de la cookie depende del campo `rememberMe`.
   * CORREGIDO: Ahora retorna tanto el usuario como los tokens al frontend.
   * @param {LoginDto} loginDto - El cuerpo de la solicitud con email, password y rememberMe.
   * @param {Response} response - El objeto de respuesta de Express, para manipular cookies.
   * @returns {Promise<{ user: any, accessToken: string, refreshToken: string }>} El objeto completo de respuesta.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const data = await this.authService.login(loginDto);
    
    const cookieOptions: any = { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    };

    if (loginDto.rememberMe) {
      cookieOptions.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 
    }

    // Establecer la cookie con el token de acceso
    response.cookie('access_token', data.accessToken, cookieOptions);
    
    // ✅ CORRECCIÓN: Retornar la respuesta completa con tokens
    return {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    };
  }
  
  /**
   * @method getProfile
   * @description
   * Ruta protegida GET a /api/auth/me. Devuelve los datos del usuario autenticado
   * actualmente, extraídos del token JWT por el `JwtAuthGuard`.
   * @param {Request} req - El objeto de solicitud de Express, que contiene `req.user`.
   * @returns {Promise<any>} El objeto del usuario autenticado.
   */
  @Get('me')
  async getProfile(@Req() req: Request) {
    return req.user;
  }

  /**
   * @method logout
   * @description
   * Maneja la solicitud POST a /api/auth/logout. Limpia la cookie de `access_token`
   * del navegador para cerrar la sesión del usuario.
   * @param {Response} response - El objeto de respuesta de Express.
   * @returns {Promise<{ message: string }>} Un mensaje de confirmación.
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    return { message: 'Logout exitoso' };
  }

  /**
   * @method forgotPassword
   * @description
   * Maneja la solicitud POST a /api/auth/forgot-password. Inicia el proceso de
   * recuperación de contraseña para el email proporcionado.
   * @param {ForgotPasswordDto} forgotPasswordDto - DTO con el email del usuario.
   * @returns {Promise<{ message: string }>} Un mensaje genérico por seguridad.
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * @method resetPassword
   * @description
   * Maneja la solicitud POST a /api/auth/reset-password. Finaliza el proceso de
   * recuperación estableciendo una nueva contraseña.
   * @param {ResetPasswordDto} resetPasswordDto - DTO con el token y la nueva contraseña.
   * @returns {Promise<{ message: string }>} Un mensaje de confirmación.
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
  }
}