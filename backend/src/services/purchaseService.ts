import prisma from '../config/prisma';
import { generateInvoicePDF } from './pdfService';
import { sendInvoiceEmail } from './emailService';

/**
 * Procesa la aprobación de una compra:
 * 1. Actualiza el estado a APROBADO.
 * 2. Genera la factura en PDF con el diseño premium.
 * 3. Envía un correo electrónico al cliente con el PDF adjunto.
 */
export const processPurchaseApproval = async (purchaseId: string) => {
  // 1. Obtener la compra con la información de usuario y de ítems/productos
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!purchase) {
    throw new Error(`No se encontró la compra con ID: ${purchaseId}`);
  }

  // Si ya está aprobada, retornarla directamente para evitar duplicar el proceso
  if (purchase.status === 'APROBADO') {
    return purchase;
  }

  // 2. Actualizar el estatus de la compra en la base de datos
  const approvedPurchase = await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      status: 'APROBADO',
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
      },
    },
  });

  console.log(`[PURCHASE-SERVICE] 💳 Compra ${purchaseId} aprobada en base de datos.`);

  // 3. Generar el PDF de la factura
  const exchangeRate = parseFloat(process.env.EXCHANGE_RATE || '40.0');
  const pdfBuffer = await generateInvoicePDF(approvedPurchase, exchangeRate);

  // 4. Enviar el correo electrónico con el archivo adjunto
  try {
    await sendInvoiceEmail(
      approvedPurchase.user.email,
      approvedPurchase.user.name,
      approvedPurchase.id,
      pdfBuffer
    );
  } catch (emailError) {
    // Registramos el error de correo pero no detenemos la respuesta de aprobación
    console.error(`[PURCHASE-SERVICE] ⚠️ Compra aprobada pero falló el envío de correo para ${purchaseId}:`, emailError);
  }

  return approvedPurchase;
};
