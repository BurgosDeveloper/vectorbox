import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline, IoLogoWhatsapp, IoAlertCircleOutline, IoHelpCircleOutline } from 'react-icons/io5';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestPurchase?: {
    id: string;
    reference: string | null;
    total: number;
    method: string;
  } | null;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose, latestPurchase }) => {
  if (!isOpen) return null;

  const maferWhatsappNumber = '584141234567';

  const handleContactSupport = () => {
    let message = 'Hola Soporte de VectorBox, necesito ayuda con mi cuenta.';
    if (latestPurchase) {
      message = `Hola Soporte de VectorBox, presento un inconveniente con mi compra:
• *ID Compra:* ${latestPurchase.id}
• *Referencia:* ${latestPurchase.reference || 'N/A'}
• *Monto:* $${latestPurchase.total.toFixed(2)}
• *Método:* ${latestPurchase.method}`;
    }
    const whatsappUrl = `https://wa.me/${maferWhatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <div style={styles.backdrop} className="glass">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.overlay}
          onClick={onClose}
        />

        {/* Modal Box */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={styles.modalBox}
          className="modal-box-responsive"
        >
          {/* Close Button */}
          <button onClick={onClose} style={styles.closeBtn}>
            <IoCloseOutline size={28} />
          </button>

          {/* Header */}
          <div style={styles.header}>
            <IoAlertCircleOutline size={48} style={{ color: 'var(--accent)', marginBottom: '8px' }} />
            <h2 style={styles.title}>Soporte y Emergencia</h2>
            <p style={styles.subtitle}>
              ¿Tienes problemas con la validación de tu pago o con la descarga del archivo digital?
            </p>
          </div>

          {/* FAQ Sections */}
          <div style={styles.faqWrapper}>
            {/* Q1 */}
            <div style={styles.faqItem}>
              <div style={styles.faqQuestion}>
                <IoHelpCircleOutline size={20} style={{ color: 'var(--accent)' }} />
                <h4>¿Cuánto tarda la validación de mi pago?</h4>
              </div>
              <p style={styles.faqAnswer}>
                Los reportes de <strong>Pago Móvil Provincial</strong> se concilian automáticamente en segundos. 
                Los pagos por <strong>Zelle</strong> y transferencias manuales son verificados por Mafer y pueden demorar entre 10 minutos y 2 horas.
              </p>
            </div>

            {/* Q2 */}
            <div style={styles.faqItem}>
              <div style={styles.faqQuestion}>
                <IoHelpCircleOutline size={20} style={{ color: 'var(--accent)' }} />
                <h4>El archivo .CDR no descarga al hacer click</h4>
              </div>
              <p style={styles.faqAnswer}>
                Asegúrate de permitir ventanas emergentes o redirecciones en tu navegador. Si el problema persiste, es posible que el proxy seguro de Google Drive esté congestionado; intenta nuevamente en unos minutos.
              </p>
            </div>
          </div>

          {/* Info Details of Latest Purchase */}
          {latestPurchase && (
            <div style={styles.purchaseInfoBox}>
              <h5 style={styles.boxTitle}>Última Transacción Registrada:</h5>
              <div style={styles.boxText}>ID: <strong style={{ color: '#fff' }}>{latestPurchase.id}</strong></div>
              <div style={styles.boxText}>Ref: <strong style={{ color: '#fff' }}>{latestPurchase.reference || 'N/A'}</strong></div>
            </div>
          )}

          {/* Action Button */}
          <motion.button
            onClick={handleContactSupport}
            className="btn-premium"
            style={{ ...styles.supportBtn, backgroundColor: '#25D366', borderColor: '#25D366', color: '#fff' }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(37, 211, 102, 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            <IoLogoWhatsapp size={20} />
            Contactar Soporte en WhatsApp
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const styles = {
  backdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(12, 16, 14, 0.85)',
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  modalBox: {
    position: 'relative' as const,
    width: '480px',
    maxWidth: '92%',
    background: '#141A17',
    border: '1px solid rgba(151, 117, 77, 0.3)',
    borderRadius: '16px',
    padding: '40px 32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
    zIndex: 1110,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  closeBtn: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  title: {
    fontSize: '1.8rem',
    color: 'var(--text-primary)',
    marginBottom: '8px',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  faqWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  faqItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    background: 'rgba(20, 26, 23, 0.4)',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid rgba(194, 173, 144, 0.08)',
  },
  faqQuestion: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  faqAnswer: {
    fontSize: '0.85rem',
    color: 'var(--text-dimmed)',
    lineHeight: '1.5',
  },
  purchaseInfoBox: {
    background: 'rgba(151, 117, 77, 0.05)',
    border: '1px dashed var(--accent)',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  boxTitle: {
    fontSize: '0.85rem',
    color: 'var(--accent)',
    fontWeight: '700',
    marginBottom: '4px',
  },
  boxText: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  supportBtn: {
    width: '100%',
    height: '48px',
    gap: '10px',
  },
};

export default EmergencyModal;
