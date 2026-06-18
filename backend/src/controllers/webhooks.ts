import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logEvent } from '../services/logger';
import { emitToUser } from '../services/socket';
import { processPurchaseApproval } from '../services/purchaseService';

// Token secreto para proteger el endpoint (solo el iPhone lo sabrá)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'VectorBoxSecret123!';

export const handleSMSWebhook = async (req: Request, res: Response) => {
  try {
    const { token, message } = req.body;

    if (token !== WEBHOOK_SECRET) {
      logEvent('SYSTEM_ALERT', 'Intento de webhook SMS no autorizado', `Token usado: ${token}`);
      return res.status(401).json({ status: 'fail', message: 'No autorizado' });
    }

    if (!message) {
      return res.status(400).json({ status: 'fail', message: 'Falta el campo message' });
    }

    logEvent('SYSTEM_ALERT', 'SMS Webhook recibido', message);

    // Intentar extraer la referencia: Busca "Ref", "Ref:", "Referencia", seguido de números
    const refMatch = message.match(/(?:ref(?:erencia)?[:\s\.\-]*)(\d+)/i);
    let reference = refMatch ? refMatch[1] : null;

    if (!reference) {
      // Fallback: Si el banco no escribe "Ref", tomar el último número largo (de al menos 4 dígitos)
      const numberMatch = message.match(/\b(\d{4,15})\b/g);
      if (numberMatch && numberMatch.length > 0) {
         reference = numberMatch[numberMatch.length - 1];
      }
    }

    if (!reference) {
       logEvent('SYSTEM_ALERT', 'Fallo al extraer referencia de SMS', message);
       return res.status(400).json({ status: 'fail', message: 'No se pudo extraer la referencia del SMS' });
    }

    // Buscar si existe alguna compra PENDIENTE cuya referencia insertada por el cliente 
    // termine igual que la referencia extraída del SMS
    const purchase = await prisma.purchase.findFirst({
      where: {
        status: 'PENDIENTE',
        paymentReference: {
          endsWith: reference,
        }
      },
      include: {
        user: true,
        items: {
          include: { product: true }
        }
      }
    });

    if (!purchase) {
       return res.status(404).json({ status: 'fail', message: `No hay compras pendientes con referencia terminada en ${reference}` });
    }

    // Aprobar la compra automáticamente, generar PDF y enviar correo
    try {
      await processPurchaseApproval(purchase.id);
      logEvent('DATABASE_EVENT', 'Compra conciliada AUTOMATICAMENTE vía SMS', `Compra ID: ${purchase.id} | Ref extraída: ${reference}`);
    } catch (e) {
      console.error('Error aprobando la compra vía SMS:', e);
      return res.status(500).json({ status: 'error', message: 'Error aprobando compra' });
    }

    // Notificar al cliente en tiempo real para que su pantalla se actualice sola
    emitToUser(purchase.userId, 'purchase-approved', { purchaseId: purchase.id });

    return res.status(200).json({ status: 'success', message: 'Compra aprobada automáticamente', purchaseId: purchase.id });

  } catch (error: any) {
    console.error('Error en SMS Webhook:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};
