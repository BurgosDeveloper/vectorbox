import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { getActiveUsersCount } from '../services/socket';
import { getRecentLogs, logEvent } from '../services/logger';

/**
 * Obtener métricas en tiempo real
 * GET /api/dev/metrics
 */
export const getMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const registeredUsers = await prisma.user.count({
      where: { role: 'CLIENTE' },
    });
    const activeUsers = getActiveUsersCount();

    // Calculate average session duration
    const logs = await prisma.sessionLog.findMany({
      where: { logoutTime: { not: null } },
    });

    let averageSessionTime = 8.5; // fallback
    if (logs.length > 0) {
      const totalDuration = logs.reduce((sum, log) => {
        return sum + (log.logoutTime!.getTime() - log.loginTime.getTime());
      }, 0);
      // convert to minutes with one decimal place
      averageSessionTime = parseFloat(
        (totalDuration / logs.length / (1000 * 60)).toFixed(1)
      );
    }

    // Calculate total revenue
    const billing = await prisma.purchase.aggregate({
      where: { status: 'APROBADO' },
      _sum: { total: true },
    });
    const revenue = billing._sum.total || 0;

    return res.status(200).json({
      status: 'success',
      data: {
        registeredUsers,
        activeUsers,
        averageSessionTime,
        revenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener lista de clientes para CRUD
 * GET /api/dev/users
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'CLIENTE' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        purchases: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Editar perfil de cliente
 * PUT /api/dev/users/:id
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        status: 'fail',
        message: 'El nombre y correo electrónico son requeridos',
      });
    }

    // Verify if email is already taken by someone else
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        id: { not: id },
      },
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'El correo electrónico ya está en uso por otro cliente',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email: email.toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    logEvent('DATABASE_EVENT', 'Perfil de usuario editado por DEV', `ID: ${id}`);

    return res.status(200).json({
      status: 'success',
      message: 'Cliente actualizado con éxito',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar un cliente
 * DELETE /api/dev/users/:id
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Cliente no encontrado',
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    logEvent('DATABASE_EVENT', 'Usuario eliminado por DEV', `ID: ${id}`);

    return res.status(200).json({
      status: 'success',
      message: 'Cliente eliminado correctamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener logs en tiempo real
 * GET /api/dev/logs
 */
export const getLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const logs = getRecentLogs();
    return res.status(200).json({
      status: 'success',
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
