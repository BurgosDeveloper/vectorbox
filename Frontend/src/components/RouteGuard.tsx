import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: ('DEV' | 'MAFER' | 'CLIENTE')[];
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(4);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || !allowedRoles.includes(user.role)) {
        setShowWarning(true);
        // Start countdown to redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate('/');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [user, loading, allowedRoles, navigate]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <motion.div
          style={styles.spinner}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        <p style={styles.loadingText}>Verificando credenciales de seguridad...</p>
      </div>
    );
  }

  if (showWarning || !user || !allowedRoles.includes(user.role)) {
    return (
      <AnimatePresence>
        <div style={styles.overlay}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            style={styles.card}
          >
            {/* Ambient light glow */}
            <div style={styles.glow} />

            <div style={styles.iconContainer}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FiLock size={40} color="var(--accent)" />
              </motion.div>
              <div style={styles.warningIndicator}>
                <FiAlertTriangle size={14} color="#050505" />
              </div>
            </div>

            <h2 style={styles.title}>Acceso Restringido</h2>
            <p style={styles.description}>
              Este portal está reservado exclusivamente para personal autorizado ({allowedRoles.join(' / ')}).
            </p>

            <div style={styles.redirectBadge}>
              Redireccionando en <span style={styles.countdown}>{countdown}</span> segundos...
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/')}
              style={styles.button}
            >
              <FiArrowLeft size={16} />
              Volver al Catálogo
            </motion.button>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return <>{children}</>;
};

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '24px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid rgba(194, 173, 144, 0.1)',
    borderTopColor: 'var(--accent)',
  },
  loadingText: {
    color: 'var(--text-dimmed)',
    fontSize: '0.9rem',
    letterSpacing: '0.05em',
  },
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(5, 7, 7, 0.85)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '24px',
  },
  card: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '460px',
    background: 'linear-gradient(135deg, rgba(20, 25, 23, 0.7), rgba(10, 12, 11, 0.95))',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '16px',
    padding: '40px 32px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute' as const,
    top: '-30%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '240px',
    height: '240px',
    background: 'radial-gradient(circle, rgba(194, 173, 144, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
    zIndex: 0,
    pointerEvents: 'none' as const,
  },
  iconContainer: {
    position: 'relative' as const,
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(194, 173, 144, 0.06)',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    zIndex: 1,
  },
  warningIndicator: {
    position: 'absolute' as const,
    bottom: 2,
    right: 2,
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontFamily: 'var(--font-athena)',
    color: '#ffffff',
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '12px',
    letterSpacing: '0.02em',
    zIndex: 1,
  },
  description: {
    color: 'var(--text-dimmed)',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    marginBottom: '24px',
    zIndex: 1,
  },
  redirectBadge: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(194, 173, 144, 0.08)',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.85rem',
    color: 'var(--text-dimmed)',
    marginBottom: '32px',
    zIndex: 1,
  },
  countdown: {
    color: 'var(--accent)',
    fontWeight: '700',
    fontSize: '1rem',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    background: 'transparent',
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    zIndex: 1,
    transition: 'all 0.2s ease',
  },
};
