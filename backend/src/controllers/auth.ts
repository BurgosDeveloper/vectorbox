import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { registerSchema, loginSchema } from '../utils/validators';
import { Role } from '@prisma/client';

const SALT_ROUNDS = 12;

// Generar configuración de la cookie
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    maxAge: 24 * 60 * 60 * 1000, // 1 día
  };
};

/**
 * Registro de un nuevo cliente
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar datos de entrada con Zod
    const validatedData = registerSchema.parse(req.body);

    // Verificar si el correo ya está registrado
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'El correo electrónico ya se encuentra registrado',
      });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

    // Crear el usuario CLIENTE en base de datos
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        name: validatedData.name,
        role: Role.CLIENTE,
        cedula: validatedData.cedula,
        billingAddress: validatedData.billingAddress,
        billingPhone: validatedData.billingPhone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        cedula: true,
        billingAddress: true,
        billingPhone: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Usuario registrado exitosamente',
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Inicio de sesión (DEV, MAFER, CLIENTES)
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar datos de entrada con Zod
    const validatedData = loginSchema.parse(req.body);

    // Buscar usuario por correo electrónico
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Credenciales inválidas',
      });
    }

    // Comparar la contraseña encriptada
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'fail',
        message: 'Credenciales inválidas',
      });
    }

    // Capturar metadatos para el SessionLog
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    const deviceType = req.headers['user-agent'] || null;

    // Crear registro de sesión
    const sessionLog = await prisma.sessionLog.create({
      data: {
        userId: user.id,
        ipAddress,
        deviceType,
      },
    });

    // Firmar token JWT
    const secret = process.env.JWT_SECRET || 'acriestilo_development_web_secure_jwt_secret_key_2026';
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        sessionLogId: sessionLog.id,
      },
      secret,
      { expiresIn: '24h' }
    );

    // Enviar cookie HTTP-Only al navegador
    res.cookie('token', token, getCookieOptions());

    return res.status(200).json({
      status: 'success',
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cierre de sesión
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userPayload = req.user;

    // Si tenemos la información de la sesión en el JWT, cerramos la sesión en DB
    if (userPayload?.sessionLogId) {
      await prisma.sessionLog.update({
        where: { id: userPayload.sessionLogId },
        data: {
          logoutTime: new Date(),
        },
      });
    }

    // Limpiar cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return res.status(200).json({
      status: 'success',
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener datos del perfil del usuario autenticado
 */
export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'No autorizado: Sesión inválida',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        cedula: true,
        billingAddress: true,
        billingPhone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Usuario no encontrado',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};
