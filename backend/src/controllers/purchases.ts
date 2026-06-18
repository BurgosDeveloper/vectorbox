import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { checkoutSchema, submitPaymentSchema } from '../utils/validators';
import { emitToRoom } from '../services/socket';
import { getBinanceRate } from '../services/exchangeRateService';

/**
 * Checkout del Carrito de Compras
 * POST /api/purchases/checkout
 */
export const checkout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validar el cuerpo de la petición con Zod
    const validatedData = checkoutSchema.parse(req.body);
    const { 
      productIds, 
      paymentMethod,
      paymentReference,
      paymentHolder,
      paymentPhone,
      frontendExchangeRate,
      cedula, 
      billingAddress, 
      billingPhone 
    } = validatedData;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        status: 'fail',
        message: 'No autorizado: Sesión de usuario faltante',
      });
    }

    // Filtro Antifraude INICIAL: verificar si la referencia bancaria ya ha sido utilizada
    const cleanRef = paymentReference.trim();
    const duplicatePayment = await prisma.purchase.findFirst({
      where: {
        paymentReference: cleanRef,
      },
    });

    if (duplicatePayment) {
      return res.status(400).json({
        status: 'fail',
        message: 'La referencia bancaria ingresada ya ha sido utilizada o está repetida.',
      });
    }

    // Obtener IDs únicos para evitar duplicados en la consulta
    const uniqueIds = Array.from(new Set(productIds));

    // Buscar los productos correspondientes en base de datos
    const products = await prisma.product.findMany({
      where: {
        id: { in: uniqueIds },
      },
    });

    // Validar que todos los productos existan
    const foundIds = products.map((p) => p.id);
    const missingIds = uniqueIds.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Los siguientes productos no son válidos: ${missingIds.join(', ')}`,
      });
    }

    // Calcular el monto total
    const total = products.reduce((sum, product) => sum + product.price, 0);

    // Obtener la tasa de cambio actual desde Binance P2P
    const currentRate = await getBinanceRate();
    let rateToApply = currentRate;
    
    // Si el frontend envió una tasa y la diferencia es menor al 3%, respetamos la del frontend
    if (frontendExchangeRate && frontendExchangeRate > 0) {
       const diff = Math.abs(currentRate - frontendExchangeRate) / currentRate;
       if (diff < 0.03) {
         rateToApply = frontendExchangeRate;
       }
    }
    
    const totalVES = total * rateToApply;

    // Registrar la compra y sus ítems usando una transacción
    const purchase = await prisma.$transaction(async (tx) => {
      return tx.purchase.create({
        data: {
          userId,
          total,
          status: 'PENDIENTE',
          paymentMethod,
          paymentReference: cleanRef,
          paymentHolder: paymentMethod === 'ZELLE' ? paymentHolder?.trim() || null : null,
          paymentPhone: paymentMethod === 'PROVINCIAL' ? paymentPhone?.trim() || null : null,
          cedula,
          billingAddress,
          billingPhone,
          exchangeRate: rateToApply,
          totalVES,
          items: {
            create: products.map((p) => ({
              productId: p.id,
              priceAtPurchase: p.price,
            })),
          },
        },
        include: {
          user: {
            select: {
              id: true,
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
                  imageUrl: true,
                },
              },
            },
          },
        },
      });
    });

    // Notificar a MAFER sobre el nuevo checkout en tiempo real
    emitToRoom('MAFER', 'new-payment', purchase);

    return res.status(201).json({
      status: 'success',
      message: 'Compra registrada con éxito, pendiente por reporte de pago',
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registro de Datos de Pago
 * POST /api/purchases/submit-payment
 */
export const submitPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validar la entrada del pago
    const validatedData = submitPaymentSchema.parse(req.body);
    const {
      purchaseId,
      paymentMethod,
      paymentReference,
      paymentHolder,
      paymentPhone,
      cedula,
      billingAddress,
      billingPhone,
    } = validatedData;

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        status: 'fail',
        message: 'No autorizado: Sesión de usuario faltante',
      });
    }

    // Buscar la compra y verificar su existencia
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      return res.status(404).json({
        status: 'fail',
        message: 'Compra no encontrada',
      });
    }

    // Verificar pertenencia al usuario autenticado
    if (purchase.userId !== userId) {
      return res.status(403).json({
        status: 'fail',
        message: 'No tienes permiso para reportar pago sobre esta compra',
      });
    }

    // Si la compra ya está aprobada, impedir re-envío de pago
    if (purchase.status === 'APROBADO') {
      return res.status(400).json({
        status: 'fail',
        message: 'Esta compra ya ha sido aprobada y procesada',
      });
    }

    // Filtro Antifraude: verificar si la referencia bancaria ya ha sido utilizada en otra compra
    const duplicatePayment = await prisma.purchase.findFirst({
      where: {
        paymentReference: paymentReference.trim(),
        id: { not: purchaseId }, // Excluir esta misma compra en caso de que estén reintentando o corrigiendo
      },
    });

    if (duplicatePayment) {
      return res.status(400).json({
        status: 'fail',
        message: 'La referencia bancaria ingresada ya ha sido utilizada',
      });
    }

    // Actualizar la compra con los detalles del reporte de pago y mantener/poner en PENDIENTE
    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'PENDIENTE',
        paymentMethod,
        paymentReference: paymentReference.trim(),
        paymentHolder: paymentMethod === 'ZELLE' ? paymentHolder?.trim() || null : null,
        paymentPhone: paymentMethod === 'PROVINCIAL' ? paymentPhone?.trim() || null : null,
        cedula,
        billingAddress,
        billingPhone,
      },
      include: {
        user: {
          select: {
            id: true,
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

    // Notificar a MAFER sobre el reporte de pago en tiempo real
    emitToRoom('MAFER', 'new-payment', updatedPurchase);

    return res.status(200).json({
      status: 'success',
      message: 'Detalles del pago registrados y pendientes por conciliación',
      data: updatedPurchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener compras del usuario autenticado
 * GET /api/purchases
 */
export const getMyPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        status: 'fail',
        message: 'No autorizado: Sesión de usuario faltante',
      });
    }

    const purchases = await prisma.purchase.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                imageUrl: true,
                googleDriveFileId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      status: 'success',
      data: purchases,
    });
  } catch (error) {
    next(error);
  }
};

