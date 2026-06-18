import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error capturado en el middleware global:', err);
  }

  // Si es un error de Zod, responder con 400 y formato de errores para tooltips
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      errors: err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Para otros errores del sistema, responder con 500 y mensaje seguro
  return res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
  });
};
