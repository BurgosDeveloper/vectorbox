import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import LandingPage from './pages/LandingPage';
import MyPurchases from './pages/MyPurchases';
import CustomOrders from './pages/CustomOrders';
import AdminDashboard from './pages/AdminDashboard';
import DevDashboard from './pages/DevDashboard';
import { RouteGuard } from './components/RouteGuard';
import BackgroundGlow from './components/BackgroundGlow';
import AutoLogout from './components/AutoLogout';

function AppContent() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <>
      <AutoLogout />
      {/* Fondo animado premium de acrílico líquido y partículas */}
      <BackgroundGlow />

      {/* Barra de navegación superior fija */}
      <Navbar />
      
      {/* Contenedor principal de vistas */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/mis-compras" element={<MyPurchases />} />
          <Route path="/pedidos-personalizados" element={<CustomOrders />} />
          <Route
            path="/admin"
            element={
              <RouteGuard allowedRoles={['MAFER']}>
                <AdminDashboard />
              </RouteGuard>
            }
          />
          <Route
            path="/dev"
            element={
              <RouteGuard allowedRoles={['DEV']}>
                <DevDashboard />
              </RouteGuard>
            }
          />
        </Routes>
      </main>

      {/* Capa global de Modales y Drawers */}
      <LoginModal />
      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />

      {/* Footer corporativo */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <span style={styles.brand}>VectorBox</span>
          <p style={styles.copy}>&copy; 2026 VectorBox. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SocketProvider>
          <Router>
            <AppContent />
          </Router>
        </SocketProvider>
      </CartProvider>
    </AuthProvider>
  );
}

const styles = {
  footer: {
    borderTop: '1px solid rgba(194, 173, 144, 0.1)',
    background: '#070a09',
    padding: '40px 0',
    marginTop: 'auto',
  },
  footerContent: {
    width: '1200px',
    maxWidth: '92%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
  },
  brand: {
    fontFamily: 'var(--font-athena)',
    color: 'var(--accent)',
    fontSize: '1.25rem',
    fontWeight: '700',
    letterSpacing: '0.12em',
  },
  copy: {
    fontSize: '0.8rem',
    color: 'var(--text-dimmed)',
  },
};

export default App;
