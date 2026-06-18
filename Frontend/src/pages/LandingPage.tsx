import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCart, type Product } from '../context/CartContext';
import { api } from '../utils/api';
import { IoGridOutline } from 'react-icons/io5';
import AnimatedTitle from '../components/AnimatedTitle';
import ProductCard3D from '../components/ProductCard3D';


export const LandingPage: React.FC = () => {
  const { addToCart, isInCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('General');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products').catch(() => null),
          api.get('/products/categories').catch(() => null)
        ]);

        const list = Array.isArray(prodRes) ? prodRes : prodRes?.data || [];
        if (list.length > 0) {
          setProducts(list);
        } else {
          setProducts([]);
        }

        const catList = Array.isArray(catRes) ? catRes : catRes?.data || [];
        setCategories(catList);

      } catch (err) {
        console.error('Error fetching data:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = activeCategory === 'General' 
    ? products 
    : products.filter(p => p.category?.name === activeCategory);

  const handleScrollToCatalog = () => {
    const catalogEl = document.getElementById('catalog-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="landing-hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* $100k Premium Ambient Glows */}
        <div className="landing-hero-glow" style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(194, 173, 144, 0.15) 0%, rgba(12, 16, 14, 0) 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', left: '-10%', width: '400px', height: '400px', background: 'rgba(255, 255, 255, 0.03)', filter: 'blur(120px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'rgba(194, 173, 144, 0.08)', filter: 'blur(150px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
        
        <div className="landing-hero-content" style={{ position: 'relative', zIndex: 1 }}>
          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', 
              padding: '6px 16px', borderRadius: '30px', 
              background: 'rgba(194, 173, 144, 0.1)', border: '1px solid rgba(194, 173, 144, 0.3)',
              color: 'var(--accent)', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: '24px', boxShadow: '0 0 20px rgba(194, 173, 144, 0.15)'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }}></span>
            Exclusividad y Precisión CNC
          </motion.div>

          {/* Título animado dinámico por letras */}
          <AnimatedTitle
            text="Vectores de Precisión en Acrílico"
            className="landing-hero-title"
          />

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="landing-hero-subtitle"
            style={{ fontSize: '1.2rem', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto 40px auto', color: 'rgba(255,255,255,0.7)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
          >
            Descarga planos editables en Corel Draw (.cdr) testeados milimétricamente para corte láser y grabado de alta gama.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="landing-hero-actions"
            style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}
          >
            <motion.button 
              onClick={handleScrollToCatalog} 
              className="btn-premium landing-hero-btn" 
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(194, 173, 144, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              style={{ padding: '16px 32px', fontSize: '1.1rem' }}
            >
              <IoGridOutline size={20} />
              Explorar Catálogo
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalog-section" className="landing-catalog-section">
        <div className="landing-section-header">
          <h2 className="landing-section-title">Catálogo Premium</h2>
          <div className="landing-section-divider" />
          <p className="landing-section-subtitle">
            Selecciona los vectores digitales que necesitas y agrégalos al carrito. Tu descarga se activará en tu panel inmediatamente al conciliar el pago.
          </p>
        </div>

        {loading ? (
          <div className="landing-loader-container">
            <div className="spinner" />
            <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Cargando catálogo premium...</p>
          </div>
        ) : (
          <>
            {/* Category Badges Horizontal Scroll */}
            {categories.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '16px',
                marginBottom: '32px',
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none', // IE
              }} className="categories-scroll-container">
                <style>{`
                  .categories-scroll-container::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                
                <motion.button
                  onClick={() => setActiveCategory('General')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '30px',
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: activeCategory === 'General' ? '1px solid var(--accent)' : '1px solid rgba(194, 173, 144, 0.2)',
                    background: activeCategory === 'General' ? 'var(--accent)' : 'rgba(20, 26, 23, 0.6)',
                    color: activeCategory === 'General' ? '#0C100E' : 'var(--text-muted)',
                    boxShadow: activeCategory === 'General' ? '0 0 15px rgba(194, 173, 144, 0.4)' : 'none',
                  }}
                >
                  General
                </motion.button>
                
                {categories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.name)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '30px',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: activeCategory === cat.name ? '1px solid var(--accent)' : '1px solid rgba(194, 173, 144, 0.2)',
                      background: activeCategory === cat.name ? 'var(--accent)' : 'rgba(20, 26, 23, 0.6)',
                      color: activeCategory === cat.name ? '#0C100E' : 'var(--text-muted)',
                      boxShadow: activeCategory === cat.name ? '0 0 15px rgba(194, 173, 144, 0.4)' : 'none',
                    }}
                  >
                    {cat.name}
                  </motion.button>
                ))}
              </div>
            )}

            <motion.div layout className="landing-grid">
              {filteredProducts.map((product) => {
                const added = isInCart(product.id);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    key={product.id}
                  >
                    <ProductCard3D
                      product={product}
                      added={added}
                      onAddToCart={addToCart}
                    />
                  </motion.div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-dimmed)' }}>
                  No hay diseños disponibles en esta categoría.
                </div>
              )}
            </motion.div>
          </>
        )}
      </section>
    </div>
  );
};

export default LandingPage;
