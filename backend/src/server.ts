import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import prisma from './config/prisma';
import { validateCloudinaryConfig } from './config/cloudinary';
import { initSocket } from './services/socket';
import { initCleanupJobs } from './services/cleanupService';

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║         VectorBox — Backend Server               ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('🔍 Verificando conexiones...\n');

  // ─── Neon Postgres Test ───────────────────────────────────────────────────
  try {
    const userCount = await prisma.user.count();
    console.log(`  ✅ Neon Postgres: Conexión exitosa (${userCount} usuarios registrados)`);
  } catch (error) {
    console.error('  ❌ Neon Postgres: Error de conexión');
    console.error('    ', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // ─── Cloudinary Test ──────────────────────────────────────────────────────
  validateCloudinaryConfig();

  // ─── Iniciar servicio de limpieza ─────────────────────────────────────────
  initCleanupJobs();

  // ─── Iniciar servidor ─────────────────────────────────────────────────────
  console.log('');
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`   http://localhost:${PORT}/api/health`);
    console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer();

