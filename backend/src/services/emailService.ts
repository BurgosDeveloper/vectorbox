import nodemailer from 'nodemailer';

// Crear el transportador SMTP reutilizando las variables de entorno
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.mailtrap.io';
  const port = parseInt(process.env.SMTP_PORT || '2525');
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  // Usar puerto seguro 465 si se especifica
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Envía la factura digital en PDF por correo electrónico al cliente
 */
export const sendInvoiceEmail = async (
  to: string,
  clientName: string,
  purchaseId: string,
  pdfBuffer: Buffer
) => {
  try {
    const transporter = createTransporter();
    const senderEmail = process.env.SMTP_USER || 'no-reply@subliacrilico.com';

    const mailOptions = {
      from: `"SubliAcrilico Ventas" <${senderEmail}>`,
      to,
      subject: `Factura Digital de tu Compra #${purchaseId} — SubliAcrilico`,
      text: `Hola ${clientName},\n\n¡Muchas gracias por tu compra en SubliAcrilico!\n\nTu pago ha sido verificado con éxito y tu pedido #${purchaseId} se encuentra ahora APROBADO.\n\nAdjunto a este correo encontrarás la factura digital formal en formato PDF.\n\nYa puedes ingresar a la plataforma para acceder y descargar tus archivos de Corel Draw (.CDR) de forma inmediata.\n\nSaludos cordiales,\nEl equipo de SubliAcrilico`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; color: #2d3748;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a365d; margin: 0;">SUBLIACRILICO</h1>
            <p style="color: #718096; font-size: 12px; letter-spacing: 1px; margin: 5px 0 0 0;">DISEÑOS VECTORIALES PREMIUM</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 25px;" />
          
          <h2 style="color: #2b6cb0; font-size: 18px; margin-top: 0;">¡Hola ${clientName}!</h2>
          <p style="line-height: 1.6; font-size: 14px;">
            Queremos informarte que hemos recibido y verificado tu reporte de pago de forma exitosa. Tu compra con el ID <strong>#${purchaseId}</strong> ha sido <strong>APROBADA</strong>.
          </p>
          <p style="line-height: 1.6; font-size: 14px;">
            En este correo te adjuntamos la <strong>Factura Digital PDF</strong> correspondiente con todos los detalles de facturación de tu pedido.
          </p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/descargas" 
               style="background-color: #2b6cb0; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 5px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              Acceder a mis Descargas
            </a>
          </div>
          
          <p style="line-height: 1.6; font-size: 14px;">
            Si tienes alguna duda o requieres asistencia técnica técnica con los vectores Corel Draw (.CDR), no dudes en escribirnos a <a href="mailto:soporte@subliacrilico.com" style="color: #2b6cb0; text-decoration: none;">soporte@subliacrilico.com</a>.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0 20px 0;" />
          
          <p style="font-size: 11px; color: #a0aec0; text-align: center; margin: 0;">
            Este es un correo de notificación automática enviado por SubliAcrilico. Por favor, no respondas a este mensaje.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `factura_subliacrilico_${purchaseId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] 📧 Factura enviada exitosamente para la compra ${purchaseId} a ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL] ❌ Error al enviar el correo de factura para compra ${purchaseId}:`, error);
    // No bloqueamos el flujo principal si el correo falla, pero lo reportamos
    throw error;
  }
};
