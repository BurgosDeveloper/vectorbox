import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { 
  IoCartOutline, 
  IoCart, 
  IoPersonOutline, 
  IoPerson,
  IoLogOut,
  IoReceiptOutline, 
  IoReceipt,
  IoGridOutline, 
  IoGrid,
  IoBrushOutline,
  IoBrush
} from 'react-icons/io5';

export const Navbar: React.FC = () => {
  const { user, logout, openLoginModal } = useAuth();
  const { cartCount, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isAtHome = location.pathname === '/';
  const isAtPurchases = location.pathname === '/mis-compras';
  const isAtCustom = location.pathname === '/pedidos-personalizados';

  const handleCatalogClick = (e: React.MouseEvent) => {
    if (isAtHome) {
      e.preventDefault();
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const catalogEl = document.getElementById('catalog-section');
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <nav className="glass navbar-main">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo-link">
          <motion.span 
            className="navbar-logo-text"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            VectorBox
          </motion.span>
        </Link>

        {/* Menu Links */}
        <div className="navbar-menu-links">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            <a 
              href="#catalog-section" 
              onClick={handleCatalogClick} 
              className="nav-link navbar-link" 
              style={{
                color: isAtHome ? 'var(--accent)' : 'var(--text-muted)'
              }}
            >
              {isAtHome ? <IoGrid size={18} /> : <IoGridOutline size={18} />}
              <span>Catálogo</span>
            </a>
          </motion.div>
          
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            <Link 
              to="/pedidos-personalizados" 
              className="nav-link navbar-link" 
              style={{
                color: isAtCustom ? 'var(--accent)' : 'var(--text-muted)'
              }}
            >
              {isAtCustom ? <IoBrush size={18} /> : <IoBrushOutline size={18} />}
              <span>Diseño Personalizado</span>
            </Link>
          </motion.div>
          
          {user && user.role !== 'DEV' && user.role !== 'MAFER' && (
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/mis-compras" 
                className="nav-link navbar-link" 
                style={{
                  color: isAtPurchases ? 'var(--accent)' : 'var(--text-muted)'
                }}
              >
                {isAtPurchases ? <IoReceipt size={18} /> : <IoReceiptOutline size={18} />}
                <span>Mis Compras</span>
              </Link>
            </motion.div>
          )}

          {/* Admin / Dev Links */}
          {user && user.role === 'MAFER' && (
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/admin" 
                className="nav-link navbar-link" 
                style={{ color: location.pathname === '/admin' ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                <IoPerson size={18} />
                <span>Admin Panel</span>
              </Link>
            </motion.div>
          )}
          {user && user.role === 'DEV' && (
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/dev" 
                className="nav-link navbar-link" 
                style={{ color: location.pathname === '/dev' ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                <IoPerson size={18} />
                <span>Dev Console</span>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="navbar-actions">
          {/* Cart Icon */}
          <motion.button 
            onClick={openCart} 
            className="nav-icon-btn navbar-icon-btn" 
            aria-label="Carrito de compras"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {cartCount > 0 ? (
              <IoCart size={24} style={{ color: 'var(--accent)' }} />
            ) : (
              <IoCartOutline size={24} style={{ color: 'var(--text-muted)' }} />
            )}
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="navbar-cart-badge"
              >
                {cartCount}
              </motion.span>
            )}
          </motion.button>

          {/* User Info / Login */}
          {user ? (
            <motion.div 
              className="navbar-user-profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <IoPerson size={18} style={{ color: 'var(--accent)' }} />
              <span className="navbar-user-name">{user.name}</span>
              <motion.button 
                onClick={logout} 
                className="nav-logout-btn navbar-logout-btn" 
                title="Cerrar sesión"
                whileHover={{ scale: 1.15, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                <IoLogOut size={20} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button 
              onClick={openLoginModal} 
              className="btn-premium navbar-login-btn" 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IoPersonOutline size={16} />
              Acceder
            </motion.button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

