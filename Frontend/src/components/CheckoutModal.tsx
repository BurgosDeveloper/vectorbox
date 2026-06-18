import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../utils/api';
import { Tooltip } from './Tooltip';
import { checkoutSchema } from '../utils/validators';
import { 
  IoCloseOutline, 
  IoReceiptOutline, 
  IoCallOutline, 
  IoPersonOutline, 
  IoKeyOutline,
  IoCardOutline,
  IoPhonePortraitOutline
} from 'react-icons/io5';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = 'ZELLE' | 'PROVINCIAL';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ZELLE');
  const [reference, setReference] = useState('');
  const [holder, setHolder] = useState('');
  const [phone, setPhone] = useState('');

  // Billing details
  const [cedula, setCedula] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingPhone, setBillingPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exchange rate states
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // Pre-fill user billing and payment fields when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setCedula(user.cedula || '');
      setBillingAddress(user.billingAddress || '');
      setBillingPhone(user.billingPhone || '');
      
      // Auto-completar los campos de pago con los datos de registro
      setHolder(user.email || '');
      setPhone(user.billingPhone || '');
    }
  }, [isOpen, user]);

  // Fetch exchange rate on modal open
  useEffect(() => {
    if (isOpen) {
      const fetchRate = async () => {
        try {
          const data = await api.get('/payments/exchange-rate');
          if (data && data.rate) {
            setExchangeRate(data.rate);
          }
        } catch (err) {
          console.error('Error obteniendo tasa de cambio:', err);
        }
      };
      fetchRate();
    } else {
      setExchangeRate(null);
    }
  }, [isOpen]);

  const totalBs = exchangeRate ? cartTotal * exchangeRate : null;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reference.trim()) {
      setError('Por favor, ingresa el número de referencia bancaria.');
      return;
    }
    if (paymentMethod === 'ZELLE' && !holder.trim()) {
      setError('Por favor, ingresa el titular de la cuenta Zelle.');
      return;
    }
    if (paymentMethod === 'PROVINCIAL' && !phone.trim()) {
      setError('Por favor, ingresa el celular emisor del Pago Móvil.');
      return;
    }

    // Validate billing fields with Zod
    const validationResult = checkoutSchema.safeParse({
      cedula,
      billingAddress,
      billingPhone,
    });

    if (!validationResult.success) {
      const errMsg = validationResult.error.issues[0]?.message || 'Datos de facturación inválidos';
      setError(errMsg);
      return;
    }

    setLoading(true);
    try {
      const productIds = cartItems.map((item) => item.id);
      
      const payload: any = {
        productIds,
        paymentMethod,
        paymentReference: reference.trim(),
        frontendExchangeRate: exchangeRate,
        cedula,
        billingAddress,
        billingPhone,
      };

      if (paymentMethod === 'ZELLE') {
        payload.paymentHolder = holder.trim();
      } else {
        payload.paymentPhone = phone.trim();
      }

      await api.post('/purchases/checkout', payload);

      clearCart();
      onClose();
      navigate('/mis-compras');
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Error al procesar el pago. Inténtalo de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
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
          initial={{ scale: 0.9, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 25 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          style={styles.modalBox}
          className="checkout-modal-box modal-box-responsive"
        >
          {/* Close Button */}
          <button onClick={onClose} style={styles.closeBtn}>
            <IoCloseOutline size={28} />
          </button>

          {/* Header */}
          <div style={styles.header}>
            <h2 style={styles.title}>Reportar Pago</h2>
            <p style={styles.subtitle}>
              Estás adquiriendo {cartItems.length} {cartItems.length === 1 ? 'diseño' : 'diseños'} por un total de{' '}
              <strong style={{ color: 'var(--accent)' }}>${cartTotal.toFixed(2)}</strong>
              {paymentMethod === 'PROVINCIAL' && totalBs !== null && (
                <>
                  {' '} / <strong style={{ color: 'var(--accent)' }}>Bs. {totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </>
              )}
            </p>
          </div>

          {/* Selector de Método de Pago con Píldora Deslizante */}
          <div style={styles.methodSelector}>
            <div style={styles.tabContainer}>
              <motion.div
                layoutId="activePaymentTab"
                style={{
                  ...styles.activeTabPill,
                  left: paymentMethod === 'ZELLE' ? '4px' : 'calc(50% - 2px)',
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              />
              
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('ZELLE');
                  setError(null);
                }}
                className="method-tab-responsive"
                style={{
                  ...styles.methodTab,
                  color: paymentMethod === 'ZELLE' ? '#0C100E' : 'var(--text-muted)',
                }}
              >
                <IoCardOutline size={18} />
                Zelle (USD)
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('PROVINCIAL');
                  setError(null);
                }}
                className="method-tab-responsive"
                style={{
                  ...styles.methodTab,
                  color: paymentMethod === 'PROVINCIAL' ? '#0C100E' : 'var(--text-muted)',
                }}
              >
                <IoPhonePortraitOutline size={18} />
                Pago Móvil
              </button>
            </div>
          </div>

          {/* Instrucciones de Pago */}
          <div style={styles.instructions}>
            <AnimatePresence mode="wait">
              {paymentMethod === 'ZELLE' ? (
                <motion.p
                  key="zelle-instruct"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={styles.instructionText}
                >
                  Envía tu pago a: <strong style={{ color: '#fff' }}>pagos@vectorbox.com</strong><br />
                  A nombre de: <strong style={{ color: '#fff' }}>VectorBox C.A.</strong>
                </motion.p>
              ) : (
                <motion.p
                  key="provincial-instruct"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={styles.instructionText}
                >
                  Envía Pago Móvil a Provincial (0108) por un monto exacto de{' '}
                  <strong style={{ color: '#fff' }}>
                    {totalBs !== null ? `Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '...'}
                  </strong>
                  <br /><br />
                  RIF: <strong style={{ color: '#fff' }}>J-123456789</strong> | Celular: <strong style={{ color: '#fff' }}>0414-1234567</strong>
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Formulario de Reporte */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.errorAlert}>{error}</div>}

            {/* Contenedor de Inputs con Scroll */}
            <div style={styles.inputsContainer} className="checkout-inputs-container modal-inputs-scroll">
              {/* Referencia */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Número de Referencia</label>
                <Tooltip content="Ingresa los últimos 6 u 8 dígitos de la referencia bancaria de tu comprobante." position="top">
                  <div style={styles.inputWrapper}>
                    <IoKeyOutline style={styles.inputIcon} />
                    <motion.input
                      type="text"
                      className="input-premium"
                      placeholder="Ej. 987654"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      style={{ paddingLeft: '44px' }}
                      disabled={loading}
                      whileFocus={{ 
                        boxShadow: '0 0 25px rgba(255, 215, 0, 0.6)', 
                        borderColor: '#FFD700',
                        scale: 1.02
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </Tooltip>
              </div>

              {/* Campos condicionales con animación */}
              <div style={{ position: 'relative', minHeight: '82px' }}>
                <AnimatePresence mode="wait">
                  {paymentMethod === 'ZELLE' ? (
                    <motion.div
                      key="zelle-fields"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      style={styles.inputGroup}
                    >
                      <label style={styles.label}>Correo del titular de la cuenta</label>
                      <Tooltip content="Correo electrónico de la cuenta Zelle emisora." position="top">
                        <div style={styles.inputWrapper}>
                          <IoPersonOutline style={styles.inputIcon} />
                          <input
                            type="email"
                            className="input-premium"
                            placeholder="Ej. tu-correo@gmail.com"
                            value={holder}
                            onChange={(e) => setHolder(e.target.value)}
                            style={{ paddingLeft: '44px' }}
                            disabled={loading}
                          />
                        </div>
                      </Tooltip>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="provincial-fields"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      style={styles.inputGroup}
                    >
                      <label style={styles.label}>Teléfono Emisor</label>
                      <Tooltip content="El número de teléfono móvil desde el cual realizaste el Pago Móvil." position="top">
                        <div style={styles.inputWrapper}>
                          <IoCallOutline style={styles.inputIcon} />
                          <input
                            type="text"
                            className="input-premium"
                            placeholder="Ej. 04141234567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ paddingLeft: '44px' }}
                            disabled={loading}
                          />
                        </div>
                      </Tooltip>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="btn-premium"
              style={styles.submitBtn}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              ) : (
                <>
                  <IoReceiptOutline size={18} />
                  Reportar Pago Realizado
                </>
              )}
            </motion.button>
          </form>
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
    zIndex: 1000,
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
    width: '460px',
    maxWidth: '92%',
    background: '#141A17',
    border: '1px solid rgba(151, 117, 77, 0.3)',
    borderRadius: '16px',
    padding: '40px 32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
    zIndex: 1010,
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
    marginBottom: '24px',
  },
  title: {
    fontSize: '2rem',
    color: 'var(--text-primary)',
    marginBottom: '8px',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
  },
  methodSelector: {
    width: '100%',
    background: 'rgba(20, 26, 23, 0.6)',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '30px',
    padding: '4px',
    marginBottom: '24px',
  },
  tabContainer: {
    position: 'relative' as const,
    display: 'flex',
    width: '100%',
    height: '42px',
    alignItems: 'center',
  },
  activeTabPill: {
    position: 'absolute' as const,
    top: '4px',
    bottom: '4px',
    width: 'calc(50% - 2px)',
    backgroundColor: 'var(--accent)',
    borderRadius: '25px',
    zIndex: 1,
  },
  methodTab: {
    flex: 1,
    height: '100%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    zIndex: 2,
    transition: 'color 0.25s ease',
  },
  instructions: {
    background: 'rgba(20, 26, 23, 0.6)',
    border: '1px dashed rgba(151, 117, 77, 0.3)',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  instructionText: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  inputsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    maxHeight: '280px',
    overflowY: 'auto' as const,
    paddingRight: '6px',
    marginBottom: '10px',
  },
  sectionDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '12px 0 4px 0',
    borderBottom: '1px solid rgba(194, 173, 144, 0.15)',
    paddingBottom: '8px',
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--accent)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    width: '100%',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  inputWrapper: {
    position: 'relative' as const,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '16px',
    color: 'var(--accent)',
    fontSize: '20px',
    pointerEvents: 'none' as const,
  },
  submitBtn: {
    width: '100%',
    marginTop: '10px',
    height: '50px',
    fontSize: '0.9rem',
    gap: '10px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#fc8181',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '0.9rem',
    textAlign: 'center' as const,
  },
};
export default CheckoutModal;
