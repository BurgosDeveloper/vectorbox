import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando siembra de datos...\n');

  console.log('🧹 Limpiando base de datos...');
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sessionLog.deleteMany();
  await prisma.user.deleteMany({
    where: {
      role: {
        notIn: [Role.DEV, Role.MAFER]
      }
    }
  });
  console.log('✅ Base de datos limpia.\n');

  const SALT_ROUNDS = 12;

  // ─── Usuario DEV ────────────────────────────────────────────────────────────
  const devPassword = await bcrypt.hash('Devsubliacrilico', SALT_ROUNDS);
  const devUser = await prisma.user.upsert({
    where: { email: 'dev@subliacrilico.com' },
    update: {},
    create: {
      email: 'dev@subliacrilico.com',
      password: devPassword,
      name: 'Desarrollador',
      role: Role.DEV,
    },
  });
  console.log(`  ✅ Usuario DEV creado: ${devUser.email} (id: ${devUser.id})`);

  // ─── Usuario MAFER ──────────────────────────────────────────────────────────
  const maferPassword = await bcrypt.hash('MaferAdmin', SALT_ROUNDS);
  const maferUser = await prisma.user.upsert({
    where: { email: 'mafer@subliacrilico.com' },
    update: {},
    create: {
      email: 'mafer@subliacrilico.com',
      password: maferPassword,
      name: 'Mafer',
      role: Role.MAFER,
    },
  });
  console.log(`  ✅ Usuario MAFER creado: ${maferUser.email} (id: ${maferUser.id})`);

  console.log('\n🎉 Siembra completada exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la siembra:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
