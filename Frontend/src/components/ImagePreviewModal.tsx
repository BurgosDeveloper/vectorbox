import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline, IoExpandOutline, IoSearchOutline } from 'react-icons/io5';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, imageUrl, title, onClose }) => {
  const [scale, setScale] = useState(1);

  // Reset scale when closed or changed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setScale(1), 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => (prev === 1 ? 2.5 : 1));
  };

  const handleClose = () => {
    setScale(1);
    onClose();
  };

  return (
    <AnimatePresence>
      <div style={styles.backdrop} className="glass" onClick={handleClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.overlay}
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={styles.modalContent}
          onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer click en el modal
        >
          <button onClick={handleClose} style={styles.closeBtn} title="Cerrar vista previa">
            <IoCloseOutline size={32} />
          </button>
          
          <div style={styles.header}>
            <IoSearchOutline size={20} style={{ color: 'var(--accent)' }} />
            <h3 style={styles.title}>{title}</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 'auto', marginRight: '16px' }}>
              Clic para {scale === 1 ? 'acercar' : 'alejar'}
            </span>
          </div>

          <div style={styles.imageContainer} onClick={handleZoom}>
            <motion.img 
              src={imageUrl} 
              alt={title} 
              drag={scale > 1}
              dragConstraints={{ top: -500, left: -500, right: 500, bottom: 500 }}
              dragElastic={0.1}
              animate={{ scale }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                ...styles.image,
                cursor: scale === 1 ? 'zoom-in' : 'grab',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none',
              }} 
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              whileTap={{ cursor: scale > 1 ? 'grabbing' : 'zoom-in' }}
            />
            {/* Transparent overlay specifically to intercept easy right-click save plugins if needed, but motion.img with contextMenu block is usually enough */}
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
    zIndex: 9999, // Debe estar por encima de todo
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(5, 5, 5, 0.95)',
    backdropFilter: 'blur(15px)',
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  modalContent: {
    position: 'relative' as const,
    width: '95vw',
    height: '95vh',
    background: '#0c100e',
    borderRadius: '24px',
    border: '1px solid rgba(194, 173, 144, 0.3)',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.9), 0 0 50px rgba(194, 173, 144, 0.15)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    zIndex: 10000,
  },
  closeBtn: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '46px',
    height: '46px',
    zIndex: 10,
    backdropFilter: 'blur(4px)',
    transition: 'all 0.2s ease',
  },
  header: {
    position: 'absolute' as const,
    bottom: '0',
    left: '0',
    width: '100%',
    padding: '30px 24px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 100%)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 10,
    pointerEvents: 'none' as const,
  },
  title: {
    margin: 0,
    color: '#fff',
    fontSize: '1.4rem',
    fontWeight: '600',
    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
  },
  imageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    overflow: 'hidden', // Evita que la imagen se salga del marco al hacer zoom
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const,
    display: 'block',
    pointerEvents: 'auto' as const,
  },
};

export default ImagePreviewModal;
