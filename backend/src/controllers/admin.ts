import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import cloudinary from '../config/cloudinary';
import { emitToUser } from '../services/socket';
import { logEvent } from '../services/logger';

/**
 * Crear un producto
 * POST /api/admin/products
 */
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, price, image, googleDriveFileId, categoryId } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({
        status: 'fail',
        message: 'El título y el precio son obligatorios',
      });
    }

    let imageUrl = '';
    let imagePublicId = '';

    if (image) {
      try {
        logEvent('SYSTEM_ALERT', 'Subiendo imagen a Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: 'vectorbox/products',
        });
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
        logEvent('SYSTEM_ALERT', 'Subida a Cloudinary exitosa', `Public ID: ${imagePublicId}`);
      } catch (uploadError) {
        logEvent('SYSTEM_ALERT', 'Error al subir a Cloudinary', uploadError instanceof Error ? uploadError.message : 'Error desconocido');
        return res.status(500).json({
          status: 'error',
          message: 'Error al subir la imagen a la plataforma en la nube',
        });
      }
    }

    const product = await prisma.product.create({
      data: {
        title,
        description: description || '',
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        imagePublicId: imagePublicId || null,
        googleDriveFileId: googleDriveFileId || null,
        categoryId: categoryId || null,
      },
    });

    logEvent('DATABASE_EVENT', 'Producto creado', `ID: ${product.id} | Título: ${product.title}`);

    return res.status(201).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear una categoría
 * POST /api/admin/categories
 */
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ status: 'fail', message: 'El nombre es obligatorio' });
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    });

    logEvent('DATABASE_EVENT', 'Categoría creada', `ID: ${category.id} | Nombre: ${category.name}`);

    return res.status(201).json({ status: 'success', data: category });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ status: 'fail', message: 'La categoría ya existe' });
    }
    next(error);
  }
};

/**
 * Eliminar una categoría
 * DELETE /api/admin/categories/:id
 */
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    await prisma.category.delete({ where: { id } });
    logEvent('DATABASE_EVENT', 'Categoría eliminada', `ID: ${id}`);
    return res.status(200).json({ status: 'success', message: 'Categoría eliminada' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todas las compras registradas
 * GET /api/admin/purchases
 */
export const getAllPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const purchases = await prisma.purchase.findMany({
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

/**
 * Aprobar una compra manualmente
 * POST /api/admin/purchases/:id/approve
 */
export const approvePurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return res.status(404).json({
        status: 'fail',
        message: 'Compra no encontrada',
      });
    }

    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: { status: 'APROBADO' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    logEvent('DATABASE_EVENT', 'Compra aprobada manualmente', `ID: ${id}`);
    
    // Emit to client
    emitToUser(updatedPurchase.userId, 'payment-approved', updatedPurchase);

    return res.status(200).json({
      status: 'success',
      message: 'Compra aprobada con éxito',
      data: updatedPurchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rechazar una compra manualmente
 * POST /api/admin/purchases/:id/reject
 */
export const rejectPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return res.status(404).json({
        status: 'fail',
        message: 'Compra no encontrada',
      });
    }

    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: { status: 'RECHAZADO' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    logEvent('DATABASE_EVENT', 'Compra rechazada manualmente', `ID: ${id}`);
    
    // Emit to client
    emitToUser(updatedPurchase.userId, 'payment-rejected', updatedPurchase);

    return res.status(200).json({
      status: 'success',
      message: 'Compra rechazada con éxito',
      data: updatedPurchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Conciliación masiva de estados de cuenta CSV
 * POST /api/admin/reconcile-csv
 */
export const reconcileCSV = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { csvText } = req.body;

    if (!csvText) {
      return res.status(400).json({
        status: 'fail',
        message: 'El texto del CSV es requerido',
      });
    }

    // Get pending purchases with references
    const pendingPurchases = await prisma.purchase.findMany({
      where: {
        status: 'PENDIENTE',
        paymentReference: { not: null },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const reconciled: any[] = [];
    const lines = csvText.split(/\r?\n/);

    for (const purchase of pendingPurchases) {
      const ref = purchase.paymentReference!.trim();
      const totalStr = purchase.total.toFixed(2);
      const totalStrComma = purchase.total.toString().replace('.', ',');
      const totalInt = Math.round(purchase.total).toString();

      // Look for a line containing both reference and amount
      const matchedLine = lines.find((line: string) => {
        const hasRef = line.includes(ref);
        const hasAmount =
          line.includes(totalStr) ||
          line.includes(totalStrComma) ||
          line.includes(totalInt);
        return hasRef && hasAmount;
      });

      if (matchedLine) {
        const approved = await prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: 'APROBADO' },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        reconciled.push(approved);
        logEvent('DATABASE_EVENT', 'Compra conciliada automáticamente', `ID: ${purchase.id} | Ref: ${ref}`);

        // Emit WebSocket notification
        emitToUser(purchase.userId, 'payment-approved', approved);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Conciliación finalizada. Se procesaron ${reconciled.length} pagos exitosamente.`,
      data: reconciled,
    });
  } catch (error) {
    next(error);
  }
};
