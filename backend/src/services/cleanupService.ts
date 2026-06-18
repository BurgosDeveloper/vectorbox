import prisma from '../config/prisma';

/**
 * Limpieza de Pedidos Fantasma (abandonados sin reporte de pago por más de 20 minutos)
 */
export const cleanupGhostPurchases = async () => {
  try {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    // Buscar y eliminar las compras que están PENDIENTES, sin referencia de pago y que tengan más de 20 minutos creadas
    const deleteResult = await prisma.purchase.deleteMany({
      where: {
        status: 'PENDIENTE',
        paymentReference: null,
        createdAt: {
          lt: twentyMinutesAgo,
        },
      },
    });

    if (deleteResult.count > 0) {
      console.log(`[CLEANUP] 🧹 Pedidos Fantasma eliminados: ${deleteResult.count}`);
    }
  } catch (error) {
    console.error('[CLEANUP] ❌ Error al limpiar pedidos fantasma:', error);
  }
};

/**
 * Inicializar los trabajos de limpieza automáticos
 */
export const initCleanupJobs = () => {
  console.log('⏳ Inicializando servicio de limpieza de Pedidos Fantasma (intervalo: 5 minutos)...');
  
  // Ejecutar una primera vez al levantar el servidor
  cleanupGhostPurchases();

  // Programar ejecución periódica cada 5 minutos (300000 ms)
  setInterval(cleanupGhostPurchases, 5 * 60 * 1000);
};
