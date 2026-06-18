import PDFDocument from 'pdfkit';

interface PurchaseWithDetails {
  id: string;
  total: number;
  paymentMethod: string;
  paymentReference: string | null;
  paymentHolder: string | null;
  paymentPhone: string | null;
  cedula: string | null;
  billingAddress: string | null;
  billingPhone: string | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
  items: Array<{
    priceAtPurchase: number;
    product: {
      title: string;
    };
  }>;
}

/**
 * Genera un PDF de factura digital en memoria a partir de los datos de la compra
 */
export const generateInvoicePDF = (purchase: PurchaseWithDetails, exchangeRate: number): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', (err) => reject(err));

      // Paleta de colores premium (Navy Blue & Steel Blue)
      const primaryColor = '#1A365D'; // Azul Marino Oscuro
      const secondaryColor = '#2B6CB0'; // Azul Acero
      const textColor = '#2D3748'; // Gris Carbón
      const borderColor = '#E2E8F0'; // Gris Claro

      // ─── Encabezado / Membrete de Factura ──────────────────────────────────
      doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);

      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(24)
         .text('VECTORBOX', 50, 40)
         .fontSize(10)
         .font('Helvetica')
         .text('DISEÑOS VECTORIALES PREMIUM COREL DRAW', 50, 70);

      doc.fillColor('#FFFFFF')
         .font('Helvetica-Bold')
         .fontSize(14)
         .text('FACTURA DIGITAL', 400, 35, { align: 'right' })
         .fontSize(10)
         .font('Helvetica')
         .text(`Factura #: ${purchase.id}`, 400, 55, { align: 'right' })
         .text(`Fecha: ${purchase.createdAt.toLocaleDateString()}`, 400, 70, { align: 'right' })
         .text(`Estatus: APROBADO`, 400, 85, { align: 'right' });

      // ─── Datos del Cliente y Pago Side-by-Side ────────────────────────────
      
      // Datos Fiscales del Cliente
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('DATOS DE FACTURACIÓN', 50, 150);
      doc.strokeColor(borderColor).lineWidth(1).moveTo(50, 165).lineTo(260, 165).stroke();

      doc.fillColor(textColor)
         .font('Helvetica-Bold').fontSize(9).text('Cliente: ', 50, 175)
         .font('Helvetica').text(purchase.user.name, 100, 175)
         .font('Helvetica-Bold').text('Email: ', 50, 190)
         .font('Helvetica').text(purchase.user.email, 100, 190)
         .font('Helvetica-Bold').text('Cédula/RIF: ', 50, 205)
         .font('Helvetica').text(purchase.cedula || 'N/A', 115, 205)
         .font('Helvetica-Bold').text('Teléfono: ', 50, 220)
         .font('Helvetica').text(purchase.billingPhone || 'N/A', 100, 220)
         .font('Helvetica-Bold').text('Dirección: ', 50, 235)
         .font('Helvetica').text(purchase.billingAddress || 'N/A', 100, 235, { width: 160 });

      // Datos de la Transacción / Pago
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('DETALLES DE PAGO', 330, 150);
      doc.strokeColor(borderColor).lineWidth(1).moveTo(330, 165).lineTo(545, 165).stroke();

      doc.fillColor(textColor)
         .font('Helvetica-Bold').fontSize(9).text('Método: ', 330, 175)
         .font('Helvetica').text(purchase.paymentMethod, 395, 175)
         .font('Helvetica-Bold').text('Referencia: ', 330, 190)
         .font('Helvetica').text(purchase.paymentReference || 'N/A', 395, 190);

      if (purchase.paymentMethod === 'ZELLE') {
        doc.font('Helvetica-Bold').text('Titular Zelle: ', 330, 205)
           .font('Helvetica').text(purchase.paymentHolder || 'N/A', 400, 205);
      } else if (purchase.paymentMethod === 'PROVINCIAL') {
        doc.font('Helvetica-Bold').text('Teléfono P.M: ', 330, 205)
           .font('Helvetica').text(purchase.paymentPhone || 'N/A', 400, 205);
      }

      // ─── Desglose de Productos / Ítems ────────────────────────────────────
      doc.y = 280;
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(12).text('DESGLOSE DE DISEÑOS ADQUIRIDOS', 50, 280);
      doc.strokeColor(borderColor).lineWidth(1).moveTo(50, 295).lineTo(545, 295).stroke();

      // Encabezado de la Tabla
      let currentY = 305;
      doc.rect(50, currentY, 495, 20).fill(secondaryColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9)
         .text('DISEÑO DIGITAL (.CDR COREL DRAW)', 60, currentY + 6)
         .text('CANTIDAD', 350, currentY + 6)
         .text('PRECIO (USD)', 445, currentY + 6, { align: 'right', width: 90 });

      // Cuerpo de la Tabla
      doc.font('Helvetica').fontSize(9);
      currentY += 20;

      purchase.items.forEach((item, index) => {
        // Alternar color de fondo de las filas
        if (index % 2 === 0) {
          doc.rect(50, currentY, 495, 20).fill('#F7FAFC');
        }
        doc.fillColor(textColor)
           .text(item.product.title, 60, currentY + 6, { width: 280 })
           .text('1 (Licencia Digital)', 350, currentY + 6)
           .text(`$${item.priceAtPurchase.toFixed(2)}`, 445, currentY + 6, { align: 'right', width: 90 });
        
        currentY += 20;
      });

      // Línea divisoria de totales
      doc.strokeColor(borderColor).lineWidth(1).moveTo(50, currentY + 5).lineTo(545, currentY + 5).stroke();
      currentY += 15;

      // ─── Totales en USD y Bs ──────────────────────────────────────────────
      const totalBs = purchase.total * exchangeRate;

      doc.fillColor(textColor)
         .font('Helvetica-Bold').fontSize(10)
         .text('TOTAL EN DÓLARES (USD):', 300, currentY)
         .font('Helvetica').text(`$${purchase.total.toFixed(2)}`, 445, currentY, { align: 'right', width: 90 });

      currentY += 15;
      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('TOTAL EN BOLÍVARES (Bs):', 300, currentY)
         .text(`${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`, 445, currentY, { align: 'right', width: 90 });

      currentY += 15;
      doc.fontSize(8).fillColor('#718096')
         .font('Helvetica-Oblique')
         .text(`* Tasa oficial BCV referencial: ${exchangeRate.toFixed(2)} Bs/USD`, 300, currentY, { align: 'right', width: 235 });

      // ─── Pie de Página ────────────────────────────────────────────────────
      doc.fontSize(8).fillColor('#A0AEC0').font('Helvetica')
         .text('Este documento digital sirve como factura y comprobante fiscal de tu adquisición.', 50, 740, { align: 'center' })
         .text('VectorBox C.A. — J-50123456-7. Para soporte, escribe a soporte@vectorbox.com', 50, 752, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
