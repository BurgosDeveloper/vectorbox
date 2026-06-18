import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  role: Role;
  sessionLogId?: string;
}

// Extender la interfaz Request de Express
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // Extraer token de las cookies
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'No autorizado: Token de sesión faltante',
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'acriestilo_development_web_secure_jwt_secret_key_2026';
    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'fail',
      message: 'No autorizado: Token inválido o expirado',
    });
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'No autorizado: Sesión de usuario no válida',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Acceso denegado: No tienes permisos para realizar esta acción',
      });
    }

    next();
  };
};
