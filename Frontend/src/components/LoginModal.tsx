import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Tooltip } from './Tooltip';
import { registerSchema } from '../utils/validators';
import { 
  IoCloseOutline, 
  IoMailOutline, 
  IoLockClosedOutline, 
  IoPersonOutline,
  IoCardOutline,
  IoCallOutline,
  IoHomeOutline
} from 'react-icons/io5';

import { useNavigate } from 'react-router-dom';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login, register, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cedula, setCedula] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    
    if (isRegister) {
      // Validar con Zod en tiempo real
      const result = registerSchema.safeParse({
        name,
        email,
        password,
        cedula,
        billingAddress,
        billingPhone,
      });

      if (!result.success) {
        const errMsg = result.error.issues[0]?.message || 'Datos de registro inválidos';
        setLocalError(errMsg);
        return;
      }
    } else {
      // Validaciones básicas de login
      if (!email.trim() || !email.includes('@')) {
        setLocalError('Por favor, ingresa un correo electrónico válido');
        return;
      }
      if (!password.trim()) {
        setLocalError('La contraseña es obligatoria');
        return;
      }
    }

    setLoading(true);
    try {
      let loggedUser: any;
      if (isRegister) {
        loggedUser = await register(name, email, password, cedula, billingAddress, billingPhone);
      } else {
        loggedUser = await login(email, password);
      }
      
      // Routing intelligence
      if (loggedUser) {
        if (loggedUser.role === 'MAFER') {
          navigate('/admin');
        } else if (loggedUser.role === 'DEV') {
          navigate('/dev');
        } else {
          navigate('/mis-compras');
        }
      }

      // Reset form on success
      setName('');
      setEmail('');
      setPassword('');
      setCedula('');
      setBillingAddress('');
      setBillingPhone('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setLocalError(null);
    clearError();
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
          onClick={closeLoginModal}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={styles.modalBox}
          className="login-modal-box modal-box-responsive"
        >
          {/* Decorative Glow Background */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px',
            background: 'var(--accent)', filter: 'blur(90px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', bottom: '-40px', left: '-40px', width: '150px', height: '150px',
            background: '#fc8181', filter: 'blur(80px)', opacity: 0.08, borderRadius: '50%', pointerEvents: 'none'
          }} />

          {/* Close Button */}
          <motion.button 
            onClick={closeLoginModal} 
            style={styles.closeBtn}
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.9 }}
          >
            <IoCloseOutline size={24} />
          </motion.button>

          {/* Logo Header */}
          <div style={styles.header}>
            <h2 style={styles.title}>
              {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>
            <p style={styles.subtitle}>
              {isRegister 
                ? 'Regístrate para descargar tus diseños editables' 
                : 'Accede a tu biblioteca de vectores y planos Corel'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Show Errors */}
            {(localError || error) && (
              <div style={styles.errorAlert}>
                {localError || error}
              </div>
            )}

            {/* Scrollable Container for inputs if register is active */}
            <div style={{ ...styles.inputsContainer, maxHeight: isRegister ? '360px' : 'none' }} className="login-inputs-container modal-inputs-scroll">
              {/* Name Input (Register Only) */}
              {isRegister && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nombre Completo</label>
                  <Tooltip content="Ingresa tu nombre y apellido para personalizar tu cuenta." position="top">
                    <div style={styles.inputWrapper}>
                      <IoPersonOutline style={styles.inputIcon} />
                      <input
                        type="text"
                        className="input-premium"
                        placeholder="Ej. Mafer Burgos"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ paddingLeft: '44px' }}
                        disabled={loading}
                      />
                    </div>
                  </Tooltip>
                </div>
              )}

              {/* Email Input */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Correo Electrónico</label>
                <Tooltip content="Ingresa tu correo. Se usará para enviar notificaciones e historial de tus compras." position="top">
                  <div style={styles.inputWrapper}>
                    <IoMailOutline style={styles.inputIcon} />
                    <input
                      type="email"
                      className="input-premium"
                      placeholder="ejemplo@vectorbox.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '44px' }}
                      disabled={loading}
                    />
                  </div>
                </Tooltip>
              </div>

              {/* Password Input */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Contraseña</label>
                <Tooltip content="Debe tener al menos 6 caracteres. Usa combinaciones de letras y números para mayor seguridad." position="top">
                  <div style={styles.inputWrapper}>
                    <IoLockClosedOutline style={styles.inputIcon} />
                    <input
                      type="password"
                      className="input-premium"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingLeft: '44px' }}
                      disabled={loading}
                    />
                  </div>
                </Tooltip>
              </div>

              {/* Identificador Nacional (Register Only) */}
              {isRegister && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nº de Identificación Nacional</label>
                  <Tooltip content="Ingresa tu documento de identidad sin guiones ni puntos (Ej: 12345678, DNI, RUT, etc)." position="top">
                    <div style={styles.inputWrapper}>
                      <IoCardOutline style={styles.inputIcon} />
                      <input
                        type="text"
                        className="input-premium"
                        placeholder="Ej. 12345678"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                        style={{ paddingLeft: '44px' }}
                        disabled={loading}
                      />
                    </div>
                  </Tooltip>
                </div>
              )}

              {/* Teléfono de Facturación (Register Only) */}
              {isRegister && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Teléfono de Facturación</label>
                  <Tooltip content="Tu número de contacto principal para la facturación." position="top">
                    <div style={styles.inputWrapper}>
                      <IoCallOutline style={styles.inputIcon} />
                      <input
                        type="text"
                        className="input-premium"
                        placeholder="Ej. 04141234567"
                        value={billingPhone}
                        onChange={(e) => setBillingPhone(e.target.value)}
                        style={{ paddingLeft: '44px' }}
                        disabled={loading}
                      />
                    </div>
                  </Tooltip>
                </div>
              )}

              {/* Dirección de Facturación (Register Only) */}
              {isRegister && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Dirección de Facturación</label>
                  <Tooltip content="Ubicación de domicilio o fiscal para emitir tus comprobantes de compra." position="top">
                    <div style={styles.inputWrapper}>
                      <IoHomeOutline style={styles.inputIcon} />
                      <input
                        type="text"
                        className="input-premium"
                        placeholder="Ej. Av. Bolívar, Res. El Sol, Apto 5-B"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        style={{ paddingLeft: '44px' }}
                        disabled={loading}
                      />
                    </div>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-premium"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              ) : isRegister ? (
                'Registrarse y Comprar'
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Toggle Link */}
          <div style={styles.footer}>
            <span style={styles.footerText}>
              {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
            </span>
            <button onClick={toggleMode} style={styles.toggleBtn} disabled={loading}>
              {isRegister ? 'Inicia Sesión' : 'Regístrate aquí'}
            </button>
          </div>
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
    maxWidth: '90%',
    background: 'linear-gradient(145deg, rgba(20, 26, 23, 0.75) 0%, rgba(12, 16, 14, 0.95) 100%)',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: '1px solid rgba(194, 173, 144, 0.4)',
    borderRadius: '24px',
    padding: '40px 32px',
    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
    zIndex: 1010,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    zIndex: 2,
  },
  header: {
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '2rem',
    color: 'var(--text-primary)',
    marginBottom: '8px',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
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
    overflowY: 'auto' as const,
    paddingRight: '4px',
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
    height: '50px',
    marginTop: '10px',
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
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
  },
  footerText: {
    color: 'var(--text-dimmed)',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
};

export default LoginModal;
