import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRouter from './routes/auth';
import downloadsRouter from './routes/downloads';
import productsRouter from './routes/products';
import purchasesRouter from './routes/purchases';
import paymentsRouter from './routes/payments';
import adminRouter from './routes/admin';
import devRouter from './routes/dev';
import { apiLoggerMiddleware } from './services/logger';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// ─── Seguridad y Cabeceras ────────────────────────────────────────────────────
app.use(helmet());

// ─── Limitador de Peticiones (Rate Limiting) ──────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Límite de 500 peticiones por IP cada 15 min
  message: {
    status: 'fail',
    message: 'Demasiadas peticiones desde esta IP. Por favor intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar el limitador a todas las rutas que comiencen con /api
app.use('/api/', apiLimiter);

// ─── Configuración de CORS ───────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean) as string[];

const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(
  cors({
    origin: (origin, callback) => {
      // En desarrollo, permitir peticiones desde cualquier host (ideal para pruebas LAN en red local)
      if (!origin || isDevelopment || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por CORS'));
      }
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  })
);


// ─── Middlewares globales ─────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '50mb' })); // Permitir payloads grandes para subida de imágenes en base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(apiLoggerMiddleware);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Rutas de la API ──────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/downloads', downloadsRouter);
app.use('/api/products', productsRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dev', devRouter);

// ─── Manejador de Errores Global ──────────────────────────────────────────────
app.use(errorHandler);

export default app;

