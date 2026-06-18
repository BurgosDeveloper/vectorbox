import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../utils/api';
import { 
  IoDownloadOutline, 
  IoTimeOutline, 
  IoCloseCircleOutline, 
  IoGridOutline, 
  IoLibraryOutline,
  IoAlertCircleOutline,
  IoCardOutline,
  IoPhonePortraitOutline
} from 'react-icons/io5';
import { motion } from 'framer-motion';
import EmergencyModal from '../components/EmergencyModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { IoExpandOutline } from 'react-icons/io5';

const playSuccessChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gainNode.gain.setValueAtTime(0.08, start);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(523.25, now, 0.12); // C5
    playTone(659.25, now + 0.06, 0.12); // E5
    playTone(783.99, now + 0.12, 0.35); // G5
  } catch (e) {}
};

interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
}

interface PurchaseItem {
  id: string;
  productId: string;
  product: Product;
}

interface Purchase {
  id: string;
  total: number;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  paymentMethod: 'ZELLE' | 'PROVINCIAL';
  paymentReference: string | null;
  createdAt: string;
  items: PurchaseItem[];
}

export const MyPurchases: React.FC = () => {
  const { user, loading: authLoading, openLoginModal } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const latestPurchase = purchases.length > 0 ? {
    id: purchases[0].id,
    reference: purchases[0].paymentReference,
    total: purchases[0].total,
    method: purchases[0].paymentMethod
  } : null;

  const fetchPurchases = async () => {
    try {
      const response = await api.get('/purchases');
      const list = Array.isArray(response) ? response : response?.data || [];
      setPurchases(list);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirigir al home y abrir modal de login si no está autenticado
        navigate('/');
        openLoginModal();
      } else {
        fetchPurchases();
      }
    }
  }, [user, authLoading]);

  // Real-time payment reconciliation listener
  useEffect(() => {
    if (!socket) return;

    socket.on('payment-approved', (approvedPurchase: Purchase) => {
      setPurchases((prev) => {
        const match = prev.some((p) => p.id === approvedPurchase.id);
        if (match) {
          playSuccessChime();
          // Update the specific purchase to trigger download state
          return prev.map((p) => (p.id === approvedPurchase.id ? approvedPurchase : p));
        }
        return prev;
      });
    });

    socket.on('payment-rejected', (rejectedPurchase: Purchase) => {
      setPurchases((prev) => {
        const match = prev.some((p) => p.id === rejectedPurchase.id);
        if (match) {
          return prev.map((p) => (p.id === rejectedPurchase.id ? rejectedPurchase : p));
        }
        return prev;
      });
    });

    return () => {
      socket.off('payment-approved');
      socket.off('payment-rejected');
    };
  }, [socket]);


  const handleDownload = async (purchaseId: string, productId: string) => {
    try {
      const response = await api.get(`/downloads/${purchaseId}?productId=${productId}`);
      if (response && typeof response.blob === 'function') {
        const blob = await response.blob();
        let filename = 'descarga_vectorbox.cdr';
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const matches = /filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i.exec(contentDisposition);
          if (matches && matches[1]) filename = decodeURIComponent(matches[1]);
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error al descargar:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="purchases-center-container">
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Cargando tu biblioteca digital...</p>
      </div>
    );
  }

  return (
    <div className="purchases-container">
      <div className="purchases-header">
        <div className="purchases-title-wrapper">
          <IoLibraryOutline size={28} style={{ color: 'var(--accent)' }} />
          <h2 className="purchases-title">Mi Biblioteca</h2>
        </div>
        <p className="purchases-subtitle">
          Monitorea el estado de tus compras y descarga tus vectores de diseño editables.
        </p>
      </div>

      {purchases.length === 0 ? (
        <div className="purchases-empty-container">
          <IoLibraryOutline size={64} style={{ color: 'var(--card-contrast)', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '10px' }}>Tu Biblioteca está vacía</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px' }}>
            Aún no has adquirido diseños premium. Visita nuestro catálogo para elegir vectores de corte láser y grabado.
          </p>
          <button onClick={() => navigate('/')} className="btn-premium" style={{ borderRadius: '30px' }}>
            <IoGridOutline size={18} />
            Ir al Catálogo
          </button>
        </div>
      ) : (
        <div className="purchases-grid">
          {purchases.map((purchase) => (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01, y: -5 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="purchases-card"
              style={{
                background: 'linear-gradient(145deg, rgba(20, 26, 23, 0.7) 0%, rgba(12, 16, 14, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(194, 173, 144, 0.4)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                borderRadius: '24px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Decorative Glow Background */}
              <div style={{
                position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px',
                background: 'var(--accent)', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none'
              }} />

              {/* Card Header Info */}
              <div className="purchase-card-header" style={{ 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderBottom: '1px solid rgba(194, 173, 144, 0.15)',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span className="purchases-card-date" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Orden del {new Date(purchase.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </span>
                  <div className="purchases-ref-info" style={{ marginTop: '4px', fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {purchase.paymentMethod === 'ZELLE' ? <IoCardOutline style={{ color: 'var(--accent)' }}/> : <IoPhonePortraitOutline style={{ color: 'var(--accent)' }}/>}
                    {purchase.paymentMethod} • <span style={{ color: 'var(--text-muted)' }}>Ref:</span> {purchase.paymentReference || 'N/A'}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="purchases-badge-wrapper">
                  {purchase.status === 'APROBADO' && (
                    <span className="purchases-status-badge badge-approved" style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Aprobada</span>
                  )}
                  {purchase.status === 'PENDIENTE' && (
                    <span className="purchases-status-badge badge-pending" style={{ boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>En Revisión</span>
                  )}
                  {purchase.status === 'RECHAZADO' && (
                    <span className="purchases-status-badge badge-rejected" style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Rechazada</span>
                  )}
                </div>
              </div>

              {/* Items List inside Purchase */}
              <div className="purchases-items-list" style={{ padding: '24px' }}>
                {purchase.items.map((item) => (
                  <div key={item.id} className="purchase-item-row" style={{ 
                    borderBottom: 'none', 
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '12px',
                    border: '1px solid rgba(194, 173, 144, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                  }}>
                    <div 
                      style={{ position: 'relative', cursor: 'pointer' }}
                      onClick={() => setPreviewImage({ url: item.product?.imageUrl || '', title: item.product?.title || 'Diseño' })}
                    >
                      <div 
                        className="img-overlay-purchases" 
                        style={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          background: 'rgba(20, 26, 23, 0.6)', borderRadius: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0, transition: 'opacity 0.2s ease', zIndex: 1
                        }}
                      >
                        <IoExpandOutline size={24} style={{ color: '#fff' }} />
                      </div>
                      <img
                        src={item.product?.imageUrl || 'https://placehold.co/120x120/141a17/c2ad90?text=Diseño'}
                        alt={item.product?.title}
                        className="purchases-item-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/120x120/141a17/c2ad90?text=Diseño';
                        }}
                        style={{ 
                          width: '80px', height: '80px', borderRadius: '12px',
                          border: '2px solid rgba(194, 173, 144, 0.6)', 
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                          objectFit: 'cover', display: 'block'
                        }}
                      />
                      <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: 'var(--accent)', borderRadius: '50%', padding: '4px', boxShadow: '0 0 10px rgba(194,173,144,0.5)', zIndex: 2 }}>
                         <IoGridOutline size={14} color="#0C100E" />
                      </div>
                    </div>
                    
                    <div className="purchases-item-details" style={{ flex: 1 }}>
                      <h4 className="purchases-item-title" style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '4px' }}>{item.product?.title || 'Diseño Premium'}</h4>
                      <p className="purchases-item-desc" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <IoLibraryOutline style={{ color: 'var(--accent)' }}/> 
                        Archivo Editable Original
                      </p>
                    </div>

                    {/* Action Button based on Purchase Status */}
                    <div className="purchases-action-column" style={{ marginLeft: 'auto' }}>
                      {purchase.status === 'APROBADO' ? (
                        <motion.button
                          whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(194, 173, 144, 0.5)' }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDownload(purchase.id, item.productId)}
                          className="btn-premium btn-download-glow"
                          style={{ 
                            padding: '12px 24px', borderRadius: '30px', 
                            background: 'var(--accent)', color: '#0C100E', 
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontWeight: '700'
                          }}
                        >
                          <IoDownloadOutline size={20} />
                          Descargar .CDR
                        </motion.button>
                      ) : purchase.status === 'PENDIENTE' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', background: 'rgba(194, 173, 144, 0.1)', padding: '10px 16px', borderRadius: '20px' }}>
                          <IoTimeOutline size={20} className="spinner-pulse" />
                          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Validando...</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 16px', borderRadius: '20px' }}>
                          <IoCloseCircleOutline size={20} />
                          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Cancelado</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Total */}
              <div className="purchases-card-footer" style={{ 
                background: 'rgba(194, 173, 144, 0.05)', 
                borderTop: '1px solid rgba(194, 173, 144, 0.1)',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inversión Total</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent)', textShadow: '0 0 15px rgba(194, 173, 144, 0.4)' }}>${purchase.total.toFixed(2)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Floating Emergency Button */}
      <motion.button
        onClick={() => setIsEmergencyOpen(true)}
        className="purchases-floating-emergency-btn"
        whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)' }}
        whileTap={{ scale: 0.95 }}
      >
        <IoAlertCircleOutline size={22} style={{ color: '#fff' }} />
        ¿Problemas con tu compra?
      </motion.button>

      {/* Emergency Help Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        latestPurchase={latestPurchase}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || ''}
        title={previewImage?.title || ''}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default MyPurchases;

