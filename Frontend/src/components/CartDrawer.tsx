import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { IoCloseOutline, IoTrashOutline, IoCartOutline, IoExpandOutline } from 'react-icons/io5';
import ImagePreviewModal from './ImagePreviewModal';

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const { cartItems, isCartOpen, closeCart, removeFromCart, cartTotal } = useCart();
  const { user, openLoginModal } = useAuth();
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const handleCheckoutClick = () => {
    closeCart();
    if (user) {
      onOpenCheckout();
    } else {
      openLoginModal();
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div style={styles.backdrop}>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            style={styles.overlay}
            onClick={closeCart}
          />

          {/* Drawer body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            style={styles.drawerBody}
          >
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.titleWrapper}>
                <IoCartOutline size={24} style={{ color: 'var(--accent)' }} />
                <h3 style={styles.title}>Tu Carrito</h3>
              </div>
              <button onClick={closeCart} style={styles.closeBtn}>
                <IoCloseOutline size={28} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={styles.itemsList}>
              <AnimatePresence>
                {cartItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={styles.emptyCart}
                  >
                    <IoCartOutline size={64} style={{ color: 'var(--card-contrast)', marginBottom: '16px' }} />
                    <p style={{ color: 'var(--text-dimmed)' }}>Tu carrito está vacío</p>
                    <button
                      onClick={closeCart}
                      className="btn-secondary"
                      style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '30px' }}
                    >
                      Explorar Vectores
                    </button>
                  </motion.div>
                ) : (
                  cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ duration: 0.2 }}
                      className="cart-item"
                      style={styles.cartItem}
                    >
                      {/* Image Preview */}
                      <div
                        style={{ position: 'relative', cursor: 'pointer' }}
                        onClick={() => setPreviewImage({ url: item.imageUrl || '', title: item.title })}
                      >
                        <div style={styles.imageOverlayDrawer} className="img-overlay-drawer">
                          <IoExpandOutline size={20} style={{ color: '#fff' }} />
                        </div>
                        <img
                          src={item.imageUrl || '/placeholder.png'}
                          alt={item.title}
                          style={styles.itemImage}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/141a17/c2ad90?text=Corel+Draw';
                          }}
                        />
                      </div>
                      
                      {/* Details */}
                      <div style={styles.itemDetails}>
                        <h4 style={styles.itemTitle}>{item.title}</h4>
                        <span style={styles.itemPrice}>
                          ${item.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="remove-btn"
                        style={styles.removeBtn}
                        title="Eliminar del carrito"
                      >
                        <IoTrashOutline size={18} />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer Summary (Sticky at bottom) */}
            {cartItems.length > 0 && (
              <div style={styles.footer} className="glass">
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Total:</span>
                  <span style={styles.totalAmount}>${cartTotal.toFixed(2)}</span>
                </div>
                
                <button
                  onClick={handleCheckoutClick}
                  className="btn-premium"
                  style={styles.checkoutBtn}
                >
                  {user ? 'Reportar Pago / Checkout' : 'Inicia Sesión para Comprar'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || ''}
        title={previewImage?.title || ''}
        onClose={() => setPreviewImage(null)}
      />
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
    zIndex: 900,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#0C100E',
  },
  drawerBody: {
    position: 'relative' as const,
    width: '420px',
    maxWidth: '100%',
    height: '100%',
    background: '#101513',
    borderLeft: '1px solid rgba(151, 117, 77, 0.2)',
    boxShadow: '-10px 0 30px rgba(0,0,0,0.8)',
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 910,
  },
  header: {
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(194, 173, 144, 0.1)',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-smooth)',
  },
  itemsList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  emptyCart: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '80%',
    textAlign: 'center' as const,
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#141A17',
    border: '1px solid rgba(194, 173, 144, 0.1)',
    borderRadius: '12px',
    transition: 'var(--transition-smooth)',
  },
  itemImage: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    objectFit: 'cover' as const,
    border: '1px solid rgba(151, 117, 77, 0.2)',
    display: 'block',
  },
  imageOverlayDrawer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(20, 26, 23, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    borderRadius: '8px',
    zIndex: 1,
  },
  itemDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  itemTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0,
  },
  itemPrice: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--accent)',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-dimmed)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition-smooth)',
  },
  footer: {
    padding: '24px',
    borderTop: '1px solid rgba(151, 117, 77, 0.2)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  totalAmount: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-athena)',
  },
  checkoutBtn: {
    width: '100%',
    height: '48px',
  },
};
export default CartDrawer;
