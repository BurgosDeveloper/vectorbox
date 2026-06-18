import { Request, Response, NextFunction } from 'express';

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'API_REQUEST' | 'SOCKET_EVENT' | 'DATABASE_EVENT' | 'SYSTEM_ALERT';
  method?: string;
  path?: string;
  status?: number;
  event: string;
  details: string;
}

const logs: SystemLog[] = [];
const MAX_LOGS = 100;

type LogCallback = (logEntry: SystemLog) => void;
let logCallback: LogCallback | null = null;

export function setLogCallback(cb: LogCallback) {
  logCallback = cb;
}

export function logEvent(
  type: SystemLog['type'],
  event: string,
  details: string = '',
  method?: string,
  path?: string,
  status?: number
) {
  const logEntry: SystemLog = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    type,
    method,
    path,
    status,
    event,
    details,
  };

  // Add to start of array (newest first)
  logs.unshift(logEntry);

  // Keep size capped
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }

  // Trigger callback if registered
  if (logCallback) {
    try {
      logCallback(logEntry);
    } catch (err) {
      // Ignore callback errors
    }
  }


  // Print in terminal for developers
  const color = 
    type === 'API_REQUEST' ? '\x1b[36m' : // Cyan
    type === 'SOCKET_EVENT' ? '\x1b[35m' : // Magenta
    type === 'DATABASE_EVENT' ? '\x1b[32m' : // Green
    '\x1b[33m'; // Yellow
  
  const reset = '\x1b[0m';
  console.log(`${color}[${type}]${reset} ${event} ${details ? `(${details})` : ''}`);
}

export function getRecentLogs(): SystemLog[] {
  return logs;
}

/**
 * Express Middleware to log API requests
 */
export function apiLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // Listen to response finish event to record status code
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // Ignore health check and log requests to prevent logs recursion
    if (originalUrl === '/api/health' || originalUrl === '/api/dev/logs') {
      return;
    }

    const event = `${method} ${originalUrl} -> Status ${statusCode}`;
    const details = `IP: ${ip} | Duration: ${duration}ms`;

    logEvent('API_REQUEST', event, details, method, originalUrl, statusCode);
  });

  next();
}
