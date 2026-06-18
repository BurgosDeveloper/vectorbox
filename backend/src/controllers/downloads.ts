import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { downloadFileStream } from '../services/googleDriveService';

/**
 * Controlador para descargar de forma segura un producto de una compra aprobada
 * GET /api/downloads/:purchaseId?productId=xxxx
 */
export const downloadProductFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const purchaseId = req.params.purchaseId as string;
    const productId = req.query.productId as string | undefined;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        status: 'fail',
        message: 'No autorizado: Sesión de usuario faltante',
      });
    }

    // Buscar la compra y verificar que pertenezca al usuario y que esté aprobada
    const purchase = await prisma.purchase.findFirst({
      where: {
        id: purchaseId,
        userId: userId,
        status: 'APROBADO',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Si la compra no existe, no pertenece al usuario o no está APROBADA, se retorna 403 Forbidden
    if (!purchase) {
      return res.status(403).json({
        status: 'fail',
        message: 'Acceso denegado: No tienes una compra aprobada para este producto',
      });
    }

    // Determinar qué ítem se desea descargar
    let targetItem;
    if (productId) {
      targetItem = purchase.items.find((item) => item.productId === productId);
    } else {
      // Si no se especifica productId y hay ítems, usar el primero por defecto
      targetItem = purchase.items[0];
    }

    if (!targetItem) {
      return res.status(400).json({
        status: 'fail',
        message: 'El producto especificado no forma parte de esta compra',
      });
    }

    const { product } = targetItem;

    if (!product.googleDriveFileId) {
      return res.status(404).json({
        status: 'fail',
        message: 'El producto seleccionado no posee un archivo de descarga digital asociado',
      });
    }

    console.log(`🌐 Iniciando descarga proxy para el producto: ${product.title} (ID: ${product.id})`);

    // Iniciar flujo binario desde Google Drive
    const { stream, contentType, contentDisposition } = await downloadFileStream(product.googleDriveFileId);

    // Intentar extraer el nombre del archivo original enviado por Google Drive
    let filename = '';
    const matches = /filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i.exec(contentDisposition);
    if (matches && matches[1]) {
      try {
        filename = decodeURIComponent(matches[1]);
      } catch (e) {
        filename = matches[1];
      }
    }

    if (!filename) {
      // Fallback si no viene en las cabeceras o falla
      const safeTitle = product.title
        ? product.title
            .trim()
            .replace(/[^a-zA-Z0-9_\u00C0-\u017F\s.-]/g, '')
            .replace(/\s+/g, '_')
        : 'diseno';

      const mimeToExt: Record<string, string> = {
        'application/pdf': '.pdf',
        'image/svg+xml': '.svg',
        'application/postscript': '.eps',
        'application/illustrator': '.ai',
        'application/x-cdr': '.cdr',
        'application/cdr': '.cdr',
        'image/x-cdr': '.cdr',
        'application/coreldraw': '.cdr',
      };

      let ext = '';
      for (const [mime, extension] of Object.entries(mimeToExt)) {
        if (contentType.toLowerCase().includes(mime)) {
          ext = extension;
          break;
        }
      }

      if (!ext) {
        if (contentType.includes('pdf')) ext = '.pdf';
        else if (contentType.includes('svg')) ext = '.svg';
        else if (contentType.includes('cdr')) ext = '.cdr';
        else if (contentType.includes('illustrator')) ext = '.ai';
        else if (contentType.includes('postscript')) ext = '.eps';
      }

      const hasExtension = /\.(pdf|svg|ai|eps|cdr)$/i.test(safeTitle);
      filename = hasExtension ? safeTitle : `${safeTitle}${ext || '.cdr'}`;
    }

    // Establecer cabeceras HTTP para forzar la descarga en el navegador cliente
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);

    // Manejar posibles errores durante la transmisión del flujo
    stream.on('error', (streamError) => {
      console.error('❌ Error en el flujo de descarga de Google Drive Proxy:', streamError);
      // Si la respuesta ya comenzó a escribirse, no podemos cambiar el código de estado HTTP
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'Error al transmitir el archivo desde el almacenamiento',
        });
      }
    });

    // Enviar el flujo directamente al cliente (Proxy)
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};
