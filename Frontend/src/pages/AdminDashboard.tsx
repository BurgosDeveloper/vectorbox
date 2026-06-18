import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import {
  FiBriefcase,
  FiUploadCloud,
  FiDollarSign,
  FiFileText,
  FiCheck,
  FiX,
  FiFile,
  FiAlertCircle,
  FiTrendingUp,
} from 'react-icons/fi';

// Audio synthesis using browser Web Audio API for a offline-first chime alert
const playIncomingAlert = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play a delightful digital double chime (chords G5 -> C6)
    const now = ctx.currentTime;
    
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      
      gainNode.gain.setValueAtTime(0.08, start);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(783.99, now, 0.3); // G5
    playTone(1046.50, now + 0.08, 0.5); // C6
    } catch (e) {
      // Audio synthesis not supported or failed
    }
};

const playSuccessAlert = () => {
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
      gainNode.gain.setValueAtTime(0.1, start);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(523.25, now, 0.15); // C5
    playTone(659.25, now + 0.08, 0.15); // E5
    playTone(783.99, now + 0.16, 0.3); // G5
  } catch (e) {}
};

interface Purchase {
  id: string;
  total: number;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  paymentMethod: 'ZELLE' | 'PROVINCIAL';
  paymentReference: string | null;
  paymentHolder: string | null;
  paymentPhone: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    priceAtPurchase: number;
    product: {
      title: string;
    };
  }>;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'sales' | 'csv'>('sales');
  const { socket } = useSocket();

  // Catalog State
  const [catalogForm, setCatalogForm] = useState({
    title: '',
    description: '',
    price: '',
    googleDriveFileId: '',
    categoryId: '',
  });
  const [mockupImage, setMockupImage] = useState<string | null>(null);
  const [mockupName, setMockupName] = useState<string>('');
  const [isCatalogSubmitting, setIsCatalogSubmitting] = useState(false);
  const [catalogSuccess, setCatalogSuccess] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sales State
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isPurchasesLoading, setIsPurchasesLoading] = useState(true);
  const [salesMessage, setSalesMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // CSV Reconciler State
  const [csvText, setCsvText] = useState('');
  const [isCsvReconciling, setIsCsvReconciling] = useState(false);
  const [csvResult, setCsvResult] = useState<{ count: number; totalBs: number } | null>(null);
  const [csvDragActive, setCsvDragActive] = useState(false);

  // 1. Fetch initial data on mount
  useEffect(() => {
    fetchPurchases();
    fetchCategories();
  }, []);

  const fetchPurchases = async () => {
    try {
      setIsPurchasesLoading(true);
      const data = await api.get('/admin/purchases');
      setPurchases(data);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setIsPurchasesLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get('/products/categories');
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // 2. Setup WebSocket new-payment listener
  useEffect(() => {
    if (!socket) return;

    socket.on('new-payment', (newPurchase: Purchase) => {
      // Avoid duplicate listing if already loaded
      setPurchases((prev) => {
        const exists = prev.some((p) => p.id === newPurchase.id);
        if (exists) {
          // Update the payment reference details
          return prev.map((p) => (p.id === newPurchase.id ? newPurchase : p));
        }
        playIncomingAlert();
        return [newPurchase, ...prev];
      });
    });

    return () => {
      socket.off('new-payment');
    };
  }, [socket]);

  // Handle Catalog Mockup File convert to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMockupName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMockupImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogForm.title || !catalogForm.price || !mockupImage) {
      setCatalogError('Por favor completa los campos obligatorios y carga un diseño de mockup.');
      return;
    }

    try {
      setIsCatalogSubmitting(true);
      setCatalogError(null);
      setCatalogSuccess(false);

      await api.post('/admin/products', {
        title: catalogForm.title,
        description: catalogForm.description,
        price: parseFloat(catalogForm.price),
        googleDriveFileId: catalogForm.googleDriveFileId || null,
        categoryId: catalogForm.categoryId || null,
        image: mockupImage,
      });

      setCatalogSuccess(true);
      playSuccessAlert();
      setCatalogForm({
        title: '',
        description: '',
        price: '',
        googleDriveFileId: '',
        categoryId: '',
      });
      setMockupImage(null);
      setMockupName('');
    } catch (err: any) {
      setCatalogError(err.message || 'Error al guardar el producto.');
    } finally {
      setIsCatalogSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      setIsCategorySubmitting(true);
      setCategoryMessage(null);
      const data = await api.post('/admin/categories', { name: newCategory.trim() });
      setCategories((prev) => [...prev, data]);
      setNewCategory('');
      setCategoryMessage({ text: 'Categoría agregada', type: 'success' });
      playSuccessAlert();
      setTimeout(() => setCategoryMessage(null), 3000);
    } catch (err: any) {
      setCategoryMessage({ text: err.message || 'Error al crear', type: 'error' });
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  // Handle Sales Manual Approve
  const handleApprove = async (id: string) => {
    try {
      setSalesMessage(null);
      await api.post(`/admin/purchases/${id}/approve`);
      
      // Update local state row
      setPurchases((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'APROBADO' } : p))
      );
      playSuccessAlert();
      setSalesMessage({ text: 'Pago aprobado y descarga liberada.', type: 'success' });
    } catch (err: any) {
      setSalesMessage({ text: err.message || 'Error al aprobar compra.', type: 'error' });
    }
  };

  // Handle Sales Manual Reject
  const handleReject = async (id: string) => {
    try {
      setSalesMessage(null);
      await api.post(`/admin/purchases/${id}/reject`);
      
      // Update local state row
      setPurchases((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'RECHAZADO' } : p))
      );
      setSalesMessage({ text: 'Pago rechazado correctamente.', type: 'success' });
    } catch (err: any) {
      setSalesMessage({ text: err.message || 'Error al rechazar compra.', type: 'error' });
    }
  };

  // Handle CSV Parse & upload
  const handleCSVSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    try {
      setIsCsvReconciling(true);
      setCsvResult(null);

      const res = await api.post('/admin/reconcile-csv', { csvText });
      const reconciledList = res.data || [];
      const totalAmount = reconciledList.reduce((sum: number, p: any) => sum + p.total, 0);

      setCsvResult({
        count: reconciledList.length,
        totalBs: totalAmount,
      });
      
      playSuccessAlert();
      
      // Update state for all reconciled purchases
      setPurchases((prev) =>
        prev.map((p) => {
          const match = reconciledList.find((r: any) => r.id === p.id);
          return match ? { ...p, status: 'APROBADO' } : p;
        })
      );

      setCsvText('');
    } catch (err: any) {
      alert(err.message || 'Error al conciliar CSV');
    } finally {
      setIsCsvReconciling(false);
    }
  };

  // Handle Drag & Drop for CSV
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setCsvDragActive(true);
    } else if (e.type === 'dragleave') {
      setCsvDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCsvDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.brandTitle}>Panel de Control Administrativo</h1>
          <p style={styles.brandSubtitle}>Manejo de catálogo digital e ingresos corporativos de MAFER</p>
        </div>
        
        {/* Navigation Tabs */}
        <div style={styles.tabsContainer} className="dashboard-tabs-responsive">
          <button
            onClick={() => setActiveTab('sales')}
            style={{ ...styles.tabBtn, ...(activeTab === 'sales' ? styles.tabBtnActive : {}) }}
          >
            <FiDollarSign />
            Ventas Registradas
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            style={{ ...styles.tabBtn, ...(activeTab === 'catalog' ? styles.tabBtnActive : {}) }}
          >
            <FiBriefcase />
            Agregar Producto
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            style={{ ...styles.tabBtn, ...(activeTab === 'csv' ? styles.tabBtnActive : {}) }}
          >
            <FiFileText />
            Conciliador CSV
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Tab CONTENT: SALES */}
        {activeTab === 'sales' && (
          <motion.div
            key="sales"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={styles.contentCard}
          >
            {/* Decorative Glow */}
            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'var(--accent)', filter: 'blur(120px)', opacity: 0.08, borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', background: '#4ade80', filter: 'blur(100px)', opacity: 0.05, borderRadius: '50%', pointerEvents: 'none' }} />

            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Historial de Transacciones en Tiempo Real</h2>
              <p style={styles.cardSubtitle}>
                Los checkouts de los clientes se reflejan aquí de inmediato mediante WebSockets.
              </p>
            </div>

            {salesMessage && (
              <div
                style={{
                  ...styles.alert,
                  background: salesMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderColor: salesMessage.type === 'success' ? '#22c55e' : '#ef4444',
                  color: salesMessage.type === 'success' ? '#4ade80' : '#f87171',
                }}
              >
                <FiAlertCircle />
                {salesMessage.text}
              </div>
            )}

            {isPurchasesLoading ? (
              <div style={styles.loadingWrapper}>
                <div style={styles.loaderSpinner} />
                <span style={{ color: 'var(--text-dimmed)' }}>Cargando compras...</span>
              </div>
            ) : purchases.length === 0 ? (
              <div style={styles.emptyState}>
                <FiDollarSign size={40} style={{ color: 'var(--accent)', opacity: 0.3, marginBottom: '16px' }} />
                <h3>No hay transacciones registradas</h3>
                <p>Las compras de los usuarios aparecerán aquí cuando hagan checkout.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Cliente</th>
                      <th style={styles.th}>Diseños</th>
                      <th style={styles.th}>Método</th>
                      <th style={styles.th}>Referencia / Origen</th>
                      <th style={styles.th}>Monto</th>
                      <th style={styles.th}>Estado</th>
                      <th style={styles.th} className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {purchases.map((purchase) => (
                        <motion.tr
                          key={purchase.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0 }}
                          style={{
                            ...styles.tr,
                            borderLeft: purchase.status === 'PENDIENTE' ? '3px solid var(--accent)' : '3px solid transparent',
                          }}
                        >
                          <td style={styles.td}>
                            <div style={styles.clientName}>{purchase.user?.name || 'Cliente'}</div>
                            <div style={styles.clientEmail}>{purchase.user?.email}</div>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.productBadgeContainer}>
                              {purchase.items?.map((item) => (
                                <span key={item.id} style={styles.productBadge}>
                                  {item.product?.title}
                                </span>
                              )) || '—'}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.badge,
                                background: purchase.paymentMethod === 'ZELLE' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(14, 116, 144, 0.12)',
                                color: purchase.paymentMethod === 'ZELLE' ? '#a78bfa' : '#22d3ee',
                                border: purchase.paymentMethod === 'ZELLE' ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(14, 116, 144, 0.3)',
                              }}
                            >
                              {purchase.paymentMethod}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {purchase.paymentReference ? (
                              <div>
                                <div style={{ color: '#ffffff', fontWeight: '500' }}>
                                  Ref: {purchase.paymentReference}
                                </div>
                                <div style={styles.clientEmail}>
                                  {purchase.paymentMethod === 'ZELLE'
                                    ? `Titular: ${purchase.paymentHolder}`
                                    : `Cel: ${purchase.paymentPhone}`}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-dimmed)', fontStyle: 'italic' }}>
                                Sin reportar pago
                              </span>
                            )}
                          </td>
                          <td style={{ ...styles.td, color: '#ffffff', fontWeight: '600' }}>
                            ${purchase.total.toFixed(2)}
                          </td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.badge,
                                background:
                                  purchase.status === 'APROBADO'
                                    ? 'rgba(34, 197, 94, 0.1)'
                                    : purchase.status === 'RECHAZADO'
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : 'rgba(234, 179, 8, 0.1)',
                                color:
                                  purchase.status === 'APROBADO'
                                    ? '#4ade80'
                                    : purchase.status === 'RECHAZADO'
                                    ? '#f87171'
                                    : '#facc15',
                                border:
                                  purchase.status === 'APROBADO'
                                    ? '1px solid rgba(34, 197, 94, 0.3)'
                                    : purchase.status === 'RECHAZADO'
                                    ? '1px solid rgba(239, 68, 68, 0.3)'
                                    : '1px solid rgba(234, 179, 8, 0.3)',
                              }}
                            >
                              {purchase.status}
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' as const }}>
                            {purchase.status === 'PENDIENTE' && (
                              <div style={styles.actionGroup}>
                                <button
                                  onClick={() => handleApprove(purchase.id)}
                                  title="Aprobar Pago"
                                  style={{ ...styles.circleBtn, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderColor: '#22c55e' }}
                                >
                                  <FiCheck size={14} />
                                </button>
                                <button
                                  onClick={() => handleReject(purchase.id)}
                                  title="Rechazar Pago"
                                  style={{ ...styles.circleBtn, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: '#ef4444' }}
                                >
                                  <FiX size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab CONTENT: CATALOG */}
        {activeTab === 'catalog' && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={styles.contentCard}
          >
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Agregar Diseño al Catálogo</h2>
              <p style={styles.cardSubtitle}>
                Ingresa los metadatos y mockup del nuevo acrílico sublimado.
              </p>
            </div>

            {catalogSuccess && (
              <div style={{ ...styles.alert, background: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e', color: '#4ade80' }}>
                <FiCheck /> ¡Producto agregado con éxito! Ya está visible en el catálogo de clientes.
              </div>
            )}

            {catalogError && (
              <div style={{ ...styles.alert, background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', color: '#f87171' }}>
                <FiAlertCircle /> {catalogError}
              </div>
            )}

            <form onSubmit={handleCatalogSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Título del Diseño *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Llavero Acrílico Anime Goku"
                    value={catalogForm.title}
                    onChange={(e) => setCatalogForm({ ...catalogForm, title: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Precio (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1.50"
                    value={catalogForm.price}
                    onChange={(e) => setCatalogForm({ ...catalogForm, price: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Descripción / Medidas</label>
                <textarea
                  rows={3}
                  placeholder="Ej. Dimensiones: 5x5 cm. Formato vectorial óptimo para corte láser de acrílicos..."
                  value={catalogForm.description}
                  onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Categoría *</label>
                  <select
                    required
                    value={catalogForm.categoryId}
                    onChange={(e) => setCatalogForm({ ...catalogForm, categoryId: e.target.value })}
                    style={{ ...styles.input, appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="" disabled>Selecciona o crea una...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} style={{ color: '#000' }}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Nueva Categoría (Rápido)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Ej. Llaveros"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleCategorySubmit}
                      disabled={isCategorySubmitting || !newCategory.trim()}
                      style={{ ...styles.btnOutline, whiteSpace: 'nowrap' }}
                    >
                      {isCategorySubmitting ? '...' : 'Crear'}
                    </button>
                  </div>
                  {categoryMessage && (
                    <span style={{ fontSize: '0.8rem', color: categoryMessage.type === 'success' ? '#4ade80' : '#f87171', marginTop: '4px' }}>
                      {categoryMessage.text}
                    </span>
                  )}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Google Drive File ID *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1A2b3c4d5e6f7g8h9i0j..."
                  value={catalogForm.googleDriveFileId}
                  onChange={(e) => setCatalogForm({ ...catalogForm, googleDriveFileId: e.target.value })}
                  style={styles.input}
                />
                <span style={styles.inputHint}>
                  Identificador del archivo en Drive (CorelDraw vector) que el cliente descargará una vez aprobado su pago.
                </span>
              </div>

              {/* Drag-and-drop Image Upload */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Mockup Visual (PNG/JPG) *</label>
                <div style={styles.dropZone}>
                  <input
                    type="file"
                    accept="image/*"
                    id="mockup-file"
                    onChange={handleFileChange}
                    style={styles.fileInputHidden}
                  />
                  <label htmlFor="mockup-file" style={styles.dropZoneLabel}>
                    {mockupImage ? (
                      <div style={styles.previewContainer}>
                        <img src={mockupImage} alt="Preview" style={styles.imagePreview} />
                        <span style={styles.previewText}>{mockupName} (Click para cambiar)</span>
                      </div>
                    ) : (
                      <>
                        <FiUploadCloud size={32} style={{ color: 'var(--accent)', marginBottom: '12px' }} />
                        <span style={{ fontWeight: '500', color: '#ffffff' }}>Carga el mockup del diseño</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)' }}>
                          Haz click para explorar tus archivos locales
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCatalogSubmitting}
                style={{ ...styles.submitBtn, opacity: isCatalogSubmitting ? 0.7 : 1 }}
              >
                {isCatalogSubmitting ? 'Subiendo mockup y creando...' : 'Crear Producto'}
              </button>
            </form>
          </motion.div>
        )}

        {/* Tab CONTENT: CSV RECONCILER */}
        {activeTab === 'csv' && (
          <motion.div
            key="csv"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={styles.contentCard}
          >
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Conciliador Automático de Cuentas Bancarias</h2>
              <p style={styles.cardSubtitle}>
                Arrastra tu archivo de estado de cuenta CSV o pega las líneas en el panel para conciliar compras pendientes al instante.
              </p>
            </div>

            {csvResult && (
              <div style={styles.reconcileReport}>
                <div style={styles.reportHeader}>
                  <FiTrendingUp size={24} color="var(--accent)" />
                  <span style={styles.reportTitle}>Resultado de Conciliación</span>
                </div>
                <div style={styles.reportStats}>
                  <div style={styles.reportStatCard}>
                    <div style={styles.reportStatVal}>{csvResult.count}</div>
                    <div style={styles.reportStatLabel}>Pagos Conciliados y Aprobados</div>
                  </div>
                  <div style={styles.reportStatCard}>
                    <div style={styles.reportStatVal}>Bs. {csvResult.totalBs.toFixed(2)}</div>
                    <div style={styles.reportStatLabel}>Monto Total Liberado</div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleCSVSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Pega el texto del CSV del Banco o Arrastra el Archivo</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    ...styles.csvDropZone,
                    borderColor: csvDragActive ? 'var(--accent)' : 'rgba(194, 173, 144, 0.15)',
                    background: csvDragActive ? 'rgba(194, 173, 144, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                  }}
                >
                  <textarea
                    rows={8}
                    required
                    placeholder="Formato recomendado:&#10;Fecha,Referencia,Monto,Concepto&#10;15/06/2026,987654,150.00,PAGO MOVIL RECIBIDO..."
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    style={styles.csvTextarea}
                  />
                  <div style={styles.csvDragMessage}>
                    <FiFile size={16} style={{ marginRight: '6px' }} />
                    Arrastra y suelta tu archivo .csv aquí para cargarlo automáticamente
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCsvReconciling || !csvText.trim()}
                style={{ ...styles.submitBtn, opacity: isCsvReconciling || !csvText.trim() ? 0.7 : 1 }}
              >
                {isCsvReconciling ? 'Buscando concordancias y emitiendo sockets...' : 'Iniciar Conciliación'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: {
    width: '1200px',
    maxWidth: '94%',
    margin: '40px auto 80px auto',
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
  },
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '24px',
    borderBottom: '1px solid rgba(194, 173, 144, 0.1)',
    paddingBottom: '24px',
  },
  brandTitle: {
    fontFamily: 'var(--font-athena)',
    fontSize: '2rem',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '0.01em',
  },
  brandSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-dimmed)',
    marginTop: '4px',
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid rgba(194, 173, 144, 0.08)',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-dimmed)',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  tabBtnActive: {
    background: 'var(--accent)',
    color: '#050505',
    boxShadow: '0 4px 12px rgba(194, 173, 144, 0.25)',
  },
  contentCard: {
    position: 'relative' as const,
    background: 'linear-gradient(145deg, rgba(20, 26, 23, 0.7) 0%, rgba(12, 16, 14, 0.9) 100%)',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: '1px solid rgba(194, 173, 144, 0.25)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  cardHeader: {
    marginBottom: '24px',
  },
  cardTitle: {
    fontFamily: 'var(--font-athena)',
    fontSize: '1.4rem',
    color: '#ffffff',
  },
  cardSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-dimmed)',
    marginTop: '4px',
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.9rem',
    marginBottom: '24px',
    transition: 'all 0.3s ease',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    gap: '16px',
  },
  loaderSpinner: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '2px solid rgba(194, 173, 144, 0.1)',
    borderTopColor: 'var(--accent)',
    animation: 'spin 1.2s infinite linear',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: '60px 24px',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px dashed rgba(194, 173, 144, 0.1)',
    borderRadius: '12px',
    color: 'var(--text-dimmed)',
  },
  tableResponsive: {
    width: '100%',
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
  },
  th: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(194, 173, 144, 0.15)',
    color: 'var(--text-dimmed)',
    fontSize: '0.8rem',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
    transition: 'background-color 0.2s ease',
    background: 'rgba(255, 255, 255, 0.005)',
  },
  td: {
    padding: '18px 20px',
    verticalAlign: 'middle',
    fontSize: '0.9rem',
  },
  clientName: {
    color: '#ffffff',
    fontWeight: '600',
  },
  clientEmail: {
    color: 'var(--text-dimmed)',
    fontSize: '0.8rem',
    marginTop: '2px',
  },
  productBadgeContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    maxWidth: '220px',
  },
  productBadge: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '0.75rem',
    color: '#ffffff',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.02em',
  },
  actionGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  circleBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    flex: 1,
    minWidth: '240px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#ffffff',
  },
  input: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#ffffff',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  textarea: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#ffffff',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    outline: 'none',
    resize: 'vertical' as const,
    transition: 'all 0.2s ease',
  },
  inputHint: {
    fontSize: '0.75rem',
    color: 'var(--text-dimmed)',
  },
  dropZone: {
    border: '2px dashed rgba(194, 173, 144, 0.25)',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.01)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  fileInputHidden: {
    display: 'none',
  },
  dropZoneLabel: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px 20px',
    width: '100%',
    cursor: 'pointer',
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
  },
  imagePreview: {
    maxHeight: '120px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  previewText: {
    fontSize: '0.8rem',
    color: 'var(--accent)',
    fontWeight: '500',
  },
  submitBtn: {
    alignSelf: 'flex-start',
    background: 'var(--accent)',
    color: '#050505',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 28px',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(194, 173, 144, 0.25)',
    transition: 'all 0.2s ease',
  },
  btnOutline: {
    background: 'transparent',
    color: 'var(--accent)',
    border: '1px solid var(--accent)',
    borderRadius: '8px',
    padding: '0 20px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  csvDropZone: {
    border: '2px dashed',
    borderRadius: '10px',
    padding: '16px',
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    transition: 'all 0.25s ease',
  },
  csvTextarea: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    outline: 'none',
    resize: 'vertical' as const,
    zIndex: 1,
  },
  csvDragMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-dimmed)',
    fontSize: '0.78rem',
    pointerEvents: 'none' as const,
    borderTop: '1px solid rgba(194, 173, 144, 0.08)',
    paddingTop: '12px',
  },
  reconcileReport: {
    background: 'rgba(194, 173, 144, 0.04)',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '24px',
  },
  reportHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  reportTitle: {
    fontWeight: '700',
    color: '#ffffff',
    fontSize: '0.95rem',
  },
  reportStats: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  reportStatCard: {
    flex: 1,
    minWidth: '180px',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '16px',
  },
  reportStatVal: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--accent)',
  },
  reportStatLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-dimmed)',
    marginTop: '4px',
  },
};
