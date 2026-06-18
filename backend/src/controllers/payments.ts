import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { provincialWebhookSchema, simulateBankTransactionSchema } from '../utils/validators';
import { processPurchaseApproval } from '../services/purchaseService';
import { getBinanceRate } from '../services/exchangeRateService';

/**
 * Helper para extraer referencia bancaria, monto y cédula a partir de un texto de SMS.
 * Soporta formatos como:
 * - "Provincial: Recibio Pago Movil de CI 12345678 por Bs. 150,00. Ref: 987654"
 * - "Provincial: Pago Movil Recibido. Ref: 987654 Monto: 150.00 de CI 12345678"
 */
export const parseSMS = (text: string) => {
  // Extraer referencia: busca "Ref:" o similar y captura la cadena alfanumérica subsiguiente
  const refRegex = /Ref:?\s*([a-zA-Z0-9]+)/i;
  const refMatch = text.match(refRegex);
  const reference = refMatch ? refMatch[1].trim() : null;

  // Extraer monto: busca "Bs." o "Bs" o "Monto:" seguido de un número con posibles comas y puntos
  const amountRegex = /(?:Bs\.?|Monto:?)\s*([\d,.]+)/i;
  const amountMatch = text.match(amountRegex);
  let amount: number | null = null;

  if (amountMatch) {
    let rawAmount = amountMatch[1].trim();
    // Reemplazar coma por punto para el parseo de punto flotante en JS si se detecta formato decimal con coma (ej. 150,00)
    if (rawAmount.includes(',') && !rawAmount.includes('.')) {
      rawAmount = rawAmount.replace(',', '.');
    } else if (rawAmount.includes('.') && rawAmount.includes(',')) {
      // Formato con punto de miles y coma de decimales (ej. 1.500,00 -> 1500.00)
      rawAmount = rawAmount.replace(/\./g, '').replace(',', '.');
    }
    amount = parseFloat(rawAmount);
  }

  // Extraer cédula: busca CI, V, E, J, G o números después de "de" o "CI"
  let cedula: string | null = null;
  const ciRegex = /(?:CI|V|E|J|G)\s*[-:]?\s*(\d+)/i;
  const ciMatch = text.match(ciRegex);
  if (ciMatch) {
    cedula = ciMatch[1].trim();
  } else {
    const deRegex = /de\s+(\d+)/i;
    const deMatch = text.match(deRegex);
    if (deMatch) {
      cedula = deMatch[1].trim();
    }
  }

  return { reference, amount, cedula };
};

/**
 * Webhook para Pago Móvil (Simulador de Pasarela Provincial)
 * POST /api/payments/provincial-webhook
 */
export const provincialWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validar el cuerpo de la petición con Zod
    const validatedData = provincialWebhookSchema.parse(req.body);
    const { message } = validatedData;

    // Extraer datos del SMS simulador
    const { reference, amount, cedula } = parseSMS(message);

    if (!reference || amount === null || isNaN(amount) || !cedula) {
      return res.status(400).json({
        status: 'fail',
        message: 'No se pudo extraer la referencia, el monto o la cédula del mensaje de SMS',
        parsed: { reference, amount, cedula },
      });
    }

    // Buscar una compra pendiente de Provincial con esa misma referencia
    const purchase = await prisma.purchase.findFirst({
      where: {
        status: 'PENDIENTE',
        paymentMethod: 'PROVINCIAL',
        paymentReference: reference,
      },
    });

    if (!purchase) {
      return res.status(404).json({
        status: 'fail',
        message: 'No se encontró ninguna compra pendiente de Provincial con la referencia especificada',
      });
    }

    // Determinar el total esperado en bolívares (VES)
    const expectedVES = purchase.totalVES || (purchase.total * purchase.exchangeRate);

    // Validar que el monto sea igual o mayor (con una tolerancia de centavos de 0.05)
    if (amount < (expectedVES - 0.05)) {
      return res.status(400).json({
        status: 'fail',
        message: `El monto del pago móvil (${amount} Bs) es menor al total de la compra (${expectedVES.toFixed(2)} Bs)`,
      });
    }

    // Validar que la cédula coincida (ignorando caracteres no numéricos)
    const cleanDigits = (str: string) => str.replace(/\D/g, '');
    if (!purchase.cedula || cleanDigits(purchase.cedula) !== cleanDigits(cedula)) {
      return res.status(400).json({
        status: 'fail',
        message: `La cédula del emisor extraída del SMS (${cedula}) no coincide con la registrada en la compra (${purchase.cedula || 'N/A'})`,
      });
    }

    // Conciliación: Aprobación unificada, generación de factura PDF y envío de correo
    const approvedPurchase = await processPurchaseApproval(purchase.id);

    console.log(`✅ Pago conciliado automáticamente por webhook. Compra ${purchase.id} APROBADA.`);

    return res.status(200).json({
      status: 'success',
      message: 'Compra conciliada y aprobada automáticamente',
      data: approvedPurchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Simulador de Transacciones Bancarias (Para Pruebas)
 * POST /api/payments/simulate-bank-transaction
 */
export const simulateBankTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validar datos de entrada con Zod
    const validatedData = simulateBankTransactionSchema.parse(req.body);
    const { method, reference, amount, email, phone } = validatedData;

    // Buscar una compra con estatus PENDIENTE que coincida con método y referencia
    const purchase = await prisma.purchase.findFirst({
      where: {
        status: 'PENDIENTE',
        paymentMethod: method,
        paymentReference: reference,
      },
    });

    if (!purchase) {
      return res.status(404).json({
        status: 'fail',
        message: 'No se encontró ninguna compra pendiente con la referencia y el método especificados',
      });
    }

    // Validar monto (Provincial en bolívares, Zelle en dólares)
    let expectedAmount = purchase.total;
    let currency = 'USD';
    let tolerance = 0.01;

    if (method === 'PROVINCIAL') {
      expectedAmount = purchase.totalVES || (purchase.total * purchase.exchangeRate);
      currency = 'Bs';
      tolerance = 0.05;
    }

    // Permitimos que el cliente pague de más, pero no de menos (con la tolerancia dada)
    if (amount < (expectedAmount - tolerance)) {
      return res.status(400).json({
        status: 'fail',
        message: `El monto de la transacción simulada (${amount} ${currency}) es menor al total de la compra (${expectedAmount.toFixed(2)} ${currency}). No se puede procesar pago incompleto.`,
      });
    }

    // Validar datos adicionales del pagador
    if (method === 'ZELLE') {
      if (purchase.paymentHolder !== email) {
        return res.status(400).json({
          status: 'fail',
          message: `El titular reportado (${purchase.paymentHolder}) no coincide con el correo de la transacción Zelle (${email})`,
        });
      }
    } else if (method === 'PROVINCIAL') {
      if (purchase.paymentPhone !== phone) {
        return res.status(400).json({
          status: 'fail',
          message: `El teléfono emisor reportado (${purchase.paymentPhone}) no coincide con el de la transacción Provincial (${phone})`,
        });
      }
    }

    // Aprobar compra, generar factura PDF y enviar correo
    const approvedPurchase = await processPurchaseApproval(purchase.id);

    console.log(`✅ [SIMULADOR] Pago Zelle/Provincial conciliado de forma exitosa. Compra ${purchase.id} APROBADA.`);

    return res.status(200).json({
      status: 'success',
      message: 'Simulación bancaria exitosa. Pago verificado y compra aprobada.',
      data: approvedPurchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener la tasa de cambio actual de Binance P2P
 * GET /api/payments/exchange-rate
 */
export const getExchangeRate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rate = await getBinanceRate();
    return res.status(200).json({
      status: 'success',
      data: {
        rate,
      },
    });
  } catch (error) {
    next(error);
  }
};


