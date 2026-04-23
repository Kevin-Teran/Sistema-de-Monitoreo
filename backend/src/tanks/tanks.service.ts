/**
 * @file tanks.service.ts
 * @route backend/src/tanks
 * @description Lógica de negocio para la gestión de tanques con validación de nombres únicos por usuario.
 * @author Kevin Mariano 
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

 import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTankDto } from './dto/create-tank.dto';
import { UpdateTankDto } from './dto/update-tank.dto';
import { User, Role } from '@prisma/client';

@Injectable()
export class TanksService {
  constructor(private prisma: PrismaService) {}

  async create(createTankDto: CreateTankDto, user: User) {
    const targetUserId =
      user.role === Role.ADMIN && createTankDto.userId
        ? createTankDto.userId
        : user.id;

    const existingTank = await this.prisma.tank.findFirst({
      where: {
        name: createTankDto.name.trim(),
        userId: targetUserId,
      },
    });

    if (existingTank) {
      throw new ConflictException(
        `Ya existe un tanque con el nombre "${createTankDto.name}" para este usuario.`,
      );
    }

    return this.prisma.tank.create({
      data: {
        name: createTankDto.name.trim(),
        location: createTankDto.location.trim(),
        status: createTankDto.status || 'ACTIVE',
        userId: targetUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            sensors: true,
          },
        },
      },
    });
  }

  async findAllForUser(currentUser: User, targetUserId?: string) {
    const whereClause: any = {};

    if (currentUser.role === Role.ADMIN) {
      if (targetUserId) {
        whereClause.userId = targetUserId;
      }
    } else {
      whereClause.userId = currentUser.id;
    }

    return this.prisma.tank.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            sensors: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, user: User) {
    const tank = await this.prisma.tank.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sensors: {
          include: {
            _count: {
              select: {
                sensorData: true,
              },
            },
          },
          orderBy: {
            type: 'asc',
          },
        },
        _count: {
          select: {
            sensors: true,
          },
        },
      },
    });

    if (!tank) {
      throw new NotFoundException(`Tanque con ID "${id}" no encontrado.`);
    }

    if (user.role !== Role.ADMIN && tank.userId !== user.id) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este tanque.',
      );
    }

    return tank;
  }

  async update(id: string, updateTankDto: UpdateTankDto, user: User) {
    const tankToUpdate = await this.findOne(id, user);

    if (updateTankDto.name) {
      const trimmedName = updateTankDto.name.trim();
      if (trimmedName !== tankToUpdate.name) {
        const existingTank = await this.prisma.tank.findFirst({
          where: {
            name: trimmedName,
            userId: tankToUpdate.userId,
            id: { not: id },
          },
        });

        if (existingTank) {
          throw new ConflictException(
            `Ya existe un tanque con el nombre "${trimmedName}" para este usuario.`,
          );
        }
      }
    }

    const dataToUpdate = {
      ...updateTankDto,
      name: updateTankDto.name?.trim(),
      location: updateTankDto.location?.trim(),
    };

    return this.prisma.tank.update({
      where: { id },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            sensors: true,
          },
        },
      },
    });
  }

  async remove(id: string, user: User) {
    const tank = await this.findOne(id, user);

    const sensorCount = await this.prisma.sensor.count({
      where: {
        tankId: id,
      },
    });

    if (sensorCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el tanque porque tiene ${sensorCount} sensor(es) asociado(s).`,
      );
    }

    return this.prisma.tank.delete({
      where: { id: tank.id },
    });
  }
}