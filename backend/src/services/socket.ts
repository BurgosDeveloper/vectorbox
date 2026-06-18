import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logEvent, setLogCallback } from './logger';

let io: Server | null = null;
let activeUsersCount = 0;

export interface SocketUser {
  userId: string;
  role: 'DEV' | 'MAFER' | 'CLIENTE';
}

function parseCookies(cookieString: string | undefined): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieString) return list;
  cookieString.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
}

export function initSocket(server: HttpServer): Server {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean) as string[];

  const isDevelopment = process.env.NODE_ENV !== 'production';

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || isDevelopment || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Bloqueado por CORS en Socket.io'));
        }
      },
      credentials: true,
    },
  });

  setLogCallback((logEntry) => {
    io?.to('DEV').emit('system-log-entry', logEntry);
  });

  io.on('connection', (socket: Socket) => {
    // Extract token from cookies, auth block, or query parameters
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token =
      cookies.token ||
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.query?.token as string);

    let userPayload: SocketUser | null = null;

    if (token) {
      try {
        const secret =
          process.env.JWT_SECRET ||
          'acriestilo_development_web_secure_jwt_secret_key_2026';
        const decoded = jwt.verify(token, secret) as any;
        userPayload = {
          userId: decoded.userId,
          role: decoded.role,
        };
      } catch (err) {
        // Invalid token
      }
    }

    activeUsersCount++;

    // Join room based on role or userId
    if (userPayload) {
      socket.data.user = userPayload;
      
      // Join general user room
      socket.join(`user_${userPayload.userId}`);
      
      // Join role rooms
      if (userPayload.role === 'DEV') {
        socket.join('DEV');
      } else if (userPayload.role === 'MAFER') {
        socket.join('MAFER');
      }

      logEvent(
        'SOCKET_EVENT',
        'Cliente conectado (Autenticado)',
        `ID Socket: ${socket.id} | User: ${userPayload.userId} | Rol: ${userPayload.role} | En línea: ${activeUsersCount}`
      );
    } else {
      logEvent(
        'SOCKET_EVENT',
        'Cliente conectado (Anónimo)',
        `ID Socket: ${socket.id} | En línea: ${activeUsersCount}`
      );
    }

    // Emit live user updates to DEV room
    io?.to('DEV').emit('active-users-update', { count: activeUsersCount });

    socket.on('disconnect', () => {
      activeUsersCount = Math.max(0, activeUsersCount - 1);
      
      if (userPayload) {
        logEvent(
          'SOCKET_EVENT',
          'Cliente desconectado (Autenticado)',
          `ID Socket: ${socket.id} | User: ${userPayload.userId} | En línea: ${activeUsersCount}`
        );
      } else {
        logEvent(
          'SOCKET_EVENT',
          'Cliente desconectado (Anónimo)',
          `ID Socket: ${socket.id} | En línea: ${activeUsersCount}`
        );
      }

      // Emit live updates to DEV room
      io?.to('DEV').emit('active-users-update', { count: activeUsersCount });
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado aún.');
  }
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
    logEvent(
      'SOCKET_EVENT',
      `Emitido a usuario ${userId}`,
      `Evento: ${event}`
    );
  }
}

export function emitToRoom(room: string, event: string, data: any) {
  if (io) {
    io.to(room).emit(event, data);
    logEvent(
      'SOCKET_EVENT',
      `Emitido a sala ${room}`,
      `Evento: ${event}`
    );
  }
}

export function getActiveUsersCount(): number {
  return activeUsersCount;
}
