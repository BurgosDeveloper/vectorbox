import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { type Product } from '../context/CartContext';
import { IoCartOutline, IoCheckmarkCircleOutline, IoExpandOutline } from 'react-icons/io5';
import ImagePreviewModal from './ImagePreviewModal';

interface ProductCard3DProps {
  product: Product;
  added: boolean;
  onAddToCart: (product: Product) => void;
}

export const ProductCard3D: React.FC<ProductCard3DProps> = ({ product, added, onAddToCart }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Motion values to track normal relative coordinates (0 to 1)
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  
  // Transform to rotate ranges (-15 to 15 degrees)
  const rotateX = useTransform(y, [0, 1], [15, -15]);
  const rotateY = useTransform(x, [0, 1], [-15, 15]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // Check if the device supports true hover interaction (avoid sticky tilt on touchscreens)
    const supportsHover = window.matchMedia('(hover: hover)').matches;
    if (!supportsHover) {
      x.set(0.5);
      y.set(0.5);
      return;
    }

    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize position from 0 to 1
    const mouseX = (event.clientX - rect.left) / width;
    const mouseY = (event.clientY - rect.top) / height;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    // Smooth reset to origin
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <div style={{ perspective: 1000, height: '100%' }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d' as const,
          ...styles.productCard,
        }}
        whileHover={{
          scale: 1.025,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(151, 117, 77, 0.15)',
          borderColor: 'var(--accent)',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      >
        {/* Visual Preview */}
        <div style={styles.imageContainer} onClick={() => setIsPreviewOpen(true)}>
          <div style={styles.imageOverlay} className="img-overlay">
            <IoExpandOutline size={32} style={{ color: '#fff' }} />
          </div>
          <img
            src={product.imageUrl || 'https://placehold.co/600x400/141a17/c2ad90?text=Corel+Draw'}
            alt={product.title}
            style={styles.productImage}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/141a17/c2ad90?text=Corel+Draw';
            }}
          />
          <div style={styles.badge}>
            .CDR Editable
          </div>
        </div>

        {/* Content */}
        <div style={styles.cardContent}>
          <h3 style={styles.productTitle}>{product.title}</h3>
          <p style={styles.productDescription}>{product.description}</p>
          
          <div style={styles.cardFooter}>
            <span style={styles.productPrice}>
              ${product.price.toFixed(2)}
            </span>
            
            <motion.button
              onClick={() => onAddToCart(product)}
              className={added ? 'btn-secondary' : 'btn-premium'}
              style={{
                padding: '10px 18px',
                fontSize: '0.8rem',
                borderRadius: '6px',
                minWidth: '130px',
                gap: '6px',
              }}
              disabled={added}
              whileHover={{ scale: added ? 1 : 1.05 }}
              whileTap={{ scale: added ? 1 : 0.95 }}
            >
              {added ? (
                <>
                  <IoCheckmarkCircleOutline size={16} style={{ color: 'var(--accent)' }} />
                  Agregado
                </>
              ) : (
                <>
                  <IoCartOutline size={16} />
                  Añadir
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        imageUrl={product.imageUrl || 'https://placehold.co/600x400/141a17/c2ad90?text=Corel+Draw'}
        title={product.title}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};

const styles = {
  productCard: {
    background: '#141A17',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '16px',
    overflow: 'hidden' as const,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  imageContainer: {
    position: 'relative' as const,
    width: '100%',
    aspectRatio: '1.5',
    overflow: 'hidden',
    borderBottom: '1px solid rgba(151, 117, 77, 0.15)',
    cursor: 'pointer',
  },
  imageOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(20, 26, 23, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    pointerEvents: 'none' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: '12px',
    left: '12px',
    backgroundColor: '#0C100E',
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
    letterSpacing: '0.05em',
  },
  cardContent: {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    gap: '12px',
  },
  productTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
  },
  productDescription: {
    fontSize: '0.85rem',
    color: 'var(--text-dimmed)',
    lineHeight: '1.5',
    flex: 1,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
    borderTop: '1px solid rgba(194, 173, 144, 0.08)',
    paddingTop: '14px',
  },
  productPrice: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--accent)',
    fontFamily: 'var(--font-athena)',
  },
};

export default ProductCard3D;
