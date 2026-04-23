/**
 * @file users.service.ts
 * @route backend/src/users
 * @description Servicio para la gestión de usuarios.
 * Este archivo contiene la lógica de negocio para interactuar con la entidad de usuarios en la base de datos.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  excludePassword<T extends User | User[]>(
    userOrUsers: T,
  ): T extends User ? UserWithoutPassword : UserWithoutPassword[] {
    if (Array.isArray(userOrUsers)) {
      return userOrUsers.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }) as any;
    }
    const { password, ...userWithoutPassword } = userOrUsers;
    return userWithoutPassword as any;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Attempting to create user with email: ${createUserDto.email}`);
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    try {
      return await this.prisma.user.create({
        data: { ...createUserDto, password: hashedPassword },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('El correo electrónico ya está registrado.');
      }
      throw new InternalServerErrorException('No se pudo crear el usuario.');
    }
  }

  /**
   * @method findAll
   * @description Obtiene todos los usuarios, incluyendo sus tanques y un conteo de los mismos.
   */
  async findAll(): Promise<any[]> {
    this.logger.log('Fetching all users with tank counts');
    try {
      return await this.prisma.user.findMany({
        include: {
          tanks: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { tanks: true },
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to fetch all users', error.stack);
      throw new InternalServerErrorException('Error al obtener la lista de usuarios.');
    }
  }

  /**
   * @method findOne
   * @description Obtiene un usuario por ID, incluyendo sus tanques.
   */
  async findOne(id: string): Promise<any> {
    this.logger.log(`Fetching user with ID: ${id}`);
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tanks: true,
      },
    });

    if (!user) {
      this.logger.warn(`User with ID "${id}" not found`);
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);
    const data = { ...updateUserDto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
      }
      throw new InternalServerErrorException('No se pudo actualizar el usuario.');
    }
  }

  async remove(id: string): Promise<User> {
    this.logger.log(`Attempting to remove user with ID: ${id}`);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
    
    const tanksCount = await this.prisma.tank.count({ where: { userId: id } });
    const reportsCount = await this.prisma.report.count({ where: { userId: id } });
    const alertsCount = await this.prisma.alert.count({ where: { userId: id } });

    if (tanksCount > 0 || reportsCount > 0 || alertsCount > 0) {
      throw new ConflictException('Este usuario no puede ser eliminado porque tiene tanques, reportes o alertas asociadas.');
    }

    try {
      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException('No se pudo eliminar el usuario.');
    }
  }
}