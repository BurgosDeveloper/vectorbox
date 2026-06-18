import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import {
  FiUsers,
  FiActivity,
  FiClock,
  FiDatabase,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiTerminal,
  FiX,
  FiAlertTriangle,
} from 'react-icons/fi';

interface ClientUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  purchases: Array<{
    id: string;
    total: number;
    status: string;
  }>;
}

interface SystemLog {
  id: string;
  timestamp: string;
  type: 'API_REQUEST' | 'SOCKET_EVENT' | 'DATABASE_EVENT' | 'SYSTEM_ALERT';
  method?: string;
  path?: string;
  status?: number;
  event: string;
  details: string;
}

export default function DevDashboard() {
  const { socket, isConnected } = useSocket();
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'metrics' | 'clients' | 'logs'>('metrics');

  // Metrics state
  const [metrics, setMetrics] = useState({
    registeredUsers: 0,
    activeUsers: 0,
    averageSessionTime: 0,
    revenue: 0,
  });

  // Active Users Real-Time History (last 15 points)
  const [activeUsersHistory, setActiveUsersHistory] = useState<number[]>([1, 2, 1, 2, 3, 2, 2, 3, 2, 4, 3, 2]);

  // Client list state
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(true);

  // Logs state
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Editing modal state
  const [editingUser, setEditingUser] = useState<ClientUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [editError, setEditError] = useState<string | null>(null);

  // 1. Fetch initial statistics, clients, and logs on mount
  useEffect(() => {
    fetchMetrics();
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchMetrics = async () => {
    try {
      const data = await api.get('/dev/metrics');
      setMetrics(data);
      // Initialize history with initial active users count
      if (data && typeof data.activeUsers === 'number') {
        setActiveUsersHistory((prev) => {
          const next = [...prev];
          next[next.length - 1] = data.activeUsers;
          return next;
        });
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsUsersLoading(true);
      const data = await api.get('/dev/users');
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/dev/logs');
      setLogs((res || []).reverse());
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  // 2. Scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (activeTab === 'logs') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  // 3. Bind WebSocket events for live online users count and live logs
  useEffect(() => {
    if (!socket) return;

    socket.on('active-users-update', ({ count }: { count: number }) => {
      setMetrics((prev) => ({ ...prev, activeUsers: count }));
      setActiveUsersHistory((prev) => {
        const next = [...prev, count];
        if (next.length > 15) {
          next.shift();
        }
        return next;
      });
    });

    socket.on('system-log-entry', (newLog: SystemLog) => {
      setLogs((prev) => {
        const updated = [...prev, newLog];
        if (updated.length > 150) {
          updated.shift();
        }
        return updated;
      });
      // Increment session metric or revenue if log contains database approvals
      if (newLog.event.includes('aprobada') || newLog.event.includes('conciliada')) {
        fetchMetrics();
      }
    });

    return () => {
      socket.off('active-users-update');
      socket.off('system-log-entry');
    };
  }, [socket]);

  // Filter users by search query
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Trigger Edit User Modal
  const openEditModal = (user: ClientUser) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email });
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updated = await api.put(`/dev/users/${editingUser.id}`, editForm);
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, name: updated.name, email: updated.email } : u))
      );
      setEditingUser(null);
      fetchMetrics();
    } catch (err: any) {
      setEditError(err.message || 'Error al actualizar el usuario.');
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente a este cliente y todo su historial de compras?')) {
      return;
    }

    try {
      await api.delete(`/dev/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      fetchMetrics();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar usuario');
    }
  };

  const getLogTypeColor = (type: SystemLog['type']) => {
    switch (type) {
      case 'API_REQUEST':
        return '#22d3ee'; // Cyan
      case 'SOCKET_EVENT':
        return '#e879f9'; // Pink/Magenta
      case 'DATABASE_EVENT':
        return '#34d399'; // Green
      case 'SYSTEM_ALERT':
        return '#fbbf24'; // Orange/Yellow
      default:
        return '#ffffff';
    }
  };

  // SVG Chart Calculation for Active Users
  const maxVal = Math.max(...activeUsersHistory, 5); // scale support (min 5)
  const chartPoints = activeUsersHistory
    .map((val, i) => {
      const x = (i / (activeUsersHistory.length - 1)) * 520 + 20;
      const y = 140 - (val / maxVal) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const chartAreaPoints = activeUsersHistory.length > 0 
    ? `${chartPoints} ${(activeUsersHistory.length - 1) / (activeUsersHistory.length - 1) * 520 + 20},140 20,140`
    : '';

  // Radial Gauge for Session Time (compared to target 15m)
  const maxSessionTarget = 15;
  const sessionPercentage = Math.min((metrics.averageSessionTime / maxSessionTarget) * 100, 100);
  const strokeDashoffset = 282.6 - (282.6 * sessionPercentage) / 100;

  // Milestone Progress for Revenue (Target goal $800.00)
  const targetRevenueGoal = 800.0;
  const revenueGoalPercentage = Math.min((metrics.revenue / targetRevenueGoal) * 100, 100);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.brandTitle}>DevOps & IT Analytics</h1>
          <p style={styles.brandSubtitle}>Monitoreo de sockets en tiempo real y administración del sistema</p>
        </div>
        
        {/* Navigation Tabs */}
        <div style={styles.tabsContainer} className="dashboard-tabs-responsive">
          <button
            onClick={() => setActiveTab('metrics')}
            style={{ ...styles.tabBtn, ...(activeTab === 'metrics' ? styles.tabBtnActive : {}) }}
          >
            <FiActivity />
            Analíticas e IT
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            style={{ ...styles.tabBtn, ...(activeTab === 'clients' ? styles.tabBtnActive : {}) }}
          >
            <FiUsers />
            Gestión de Clientes
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{ ...styles.tabBtn, ...(activeTab === 'logs' ? styles.tabBtnActive : {}) }}
          >
            <FiTerminal />
            Auditoría en Vivo
          </button>
        </div>
      </div>

      {/* Metrics Row (Rendered globally for quick status viewing) */}
      <div className="dev-metrics-row">
        <div className="dev-metric-card">
          <div className="dev-metric-header">
            <FiUsers size={20} color="var(--accent)" />
            <span className="dev-metric-label">Clientes Registrados</span>
          </div>
          <div className="dev-metric-value">{metrics.registeredUsers}</div>
        </div>

        <div className="dev-metric-card active">
          <div className="dev-metric-header">
            <FiActivity size={20} color="var(--accent)" />
            <span className="dev-metric-label">Sockets Activos (En vivo)</span>
          </div>
          <motion.div
            key={metrics.activeUsers}
            initial={{ scale: 0.8, color: '#ffffff' }}
            animate={{ scale: 1, color: 'var(--accent)' }}
            className="dev-metric-value"
          >
            {metrics.activeUsers}
          </motion.div>
        </div>

        <div className="dev-metric-card">
          <div className="dev-metric-header">
            <FiClock size={20} color="var(--accent)" />
            <span className="dev-metric-label">Sesión Promedio</span>
          </div>
          <div className="dev-metric-value">{metrics.averageSessionTime} min</div>
        </div>

        <div className="dev-metric-card">
          <div className="dev-metric-header">
            <FiDatabase size={20} color="var(--accent)" />
            <span className="dev-metric-label">Facturación Aprobada</span>
          </div>
          <div className="dev-metric-value">${metrics.revenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Connection warning if WebSocket fails */}
      {!isConnected && (
        <div style={styles.warningAlert}>
          <FiAlertTriangle size={18} />
          <span>El WebSocket se encuentra desconectado. Intentando reconectar con la IP local...</span>
        </div>
      )}

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {/* Tab 1: METRICS PANEL */}
        {activeTab === 'metrics' && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={styles.gridContainer}
          >
            {/* Chart 1: Sockets Trend */}
            <div style={styles.chartBlock}>
              <div style={styles.chartHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiActivity color="var(--accent)" />
                  <span style={styles.chartTitle}>Flujo de Usuarios Activos (WebSocket)</span>
                </div>
                <span style={styles.liveTag}>LIVE UPDATING</span>
              </div>
              <div style={styles.chartBody}>
                {activeUsersHistory.length > 1 && (
                  <svg viewBox="0 0 560 160" style={styles.svgChart}>
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="20" y1="40" x2="540" y2="40" stroke="rgba(194, 173, 144, 0.05)" />
                    <line x1="20" y1="90" x2="540" y2="90" stroke="rgba(194, 173, 144, 0.05)" />
                    <line x1="20" y1="140" x2="540" y2="140" stroke="rgba(194, 173, 144, 0.15)" />
                    
                    {/* Fill Area */}
                    {chartAreaPoints && <polygon points={chartAreaPoints} fill="url(#chartGlow)" />}
                    
                    {/* Trend Line */}
                    <polyline
                      points={chartPoints}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Active Endpoint Pulsing Marker */}
                    {activeUsersHistory.map((val, i) => {
                      if (i !== activeUsersHistory.length - 1) return null;
                      const x = (i / (activeUsersHistory.length - 1)) * 520 + 20;
                      const y = 140 - (val / maxVal) * 100;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="5" fill="var(--accent)" />
                          <circle cx={x} cy={y} r="12" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.6">
                            <animate attributeName="r" values="5;15;5" dur="1.8s" repeatCount="indefinite" />
                          </circle>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            {/* Side Analytics Block */}
            <div style={styles.chartBlockMiniGrid}>
              {/* Radial Gauge for Session Time */}
              <div style={styles.gaugeBlock}>
                <span style={styles.chartTitle}>Retención & Sesiones</span>
                <div style={styles.gaugeContainer}>
                  <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="8" />
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="8"
                      strokeDasharray="282.6"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div style={styles.gaugeLabel}>
                    <div style={styles.gaugeValue}>{metrics.averageSessionTime}m</div>
                    <div style={styles.gaugeSub}>Promedio</div>
                  </div>
                </div>
                <span style={styles.gaugeHint}>Tiempo promedio por cada sesión activa de clientes</span>
              </div>

              {/* Progress Milestones for Revenue */}
              <div style={styles.revenueGoalBlock}>
                <span style={styles.chartTitle}>Meta Mensual de Facturación</span>
                <div style={styles.revenueGoalBody}>
                  <div style={styles.revenueValues}>
                    <span style={{ color: '#ffffff', fontWeight: '700' }}>${metrics.revenue.toFixed(2)}</span>
                    <span style={{ color: 'var(--text-dimmed)' }}>Meta: ${targetRevenueGoal.toFixed(2)}</span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${revenueGoalPercentage}%` }} />
                  </div>
                  <div style={styles.goalMilestones}>
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: CLIENTS CRUD PANEL */}
        {activeTab === 'clients' && (
          <motion.div
            key="clients"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={styles.crudPanel}
          >
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Administración de Clientes</h2>
              <div style={styles.searchBox}>
                <FiSearch style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            {isUsersLoading ? (
              <div style={styles.loadingWrapper}>
                <div style={styles.loaderSpinner} />
                <span>Cargando clientes...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={styles.emptyState}>
                <FiUsers size={32} style={{ color: 'var(--text-dimmed)', opacity: 0.3 }} />
                <p>No se encontraron clientes</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nombre</th>
                      <th style={styles.th}>Correo Electrónico</th>
                      <th style={styles.th}>Compras</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredUsers.map((user) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          style={styles.tr}
                        >
                          <td style={styles.td}>
                            <span style={styles.userName}>{user.name}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.userEmail}>{user.email}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.purchasesCount}>
                              {user.purchases?.length || 0} compras
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' as const }}>
                            <div style={styles.actions}>
                              <button
                                onClick={() => openEditModal(user)}
                                style={styles.actionBtnEdit}
                                title="Editar Perfil"
                              >
                                <FiEdit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                style={styles.actionBtnDelete}
                                title="Eliminar Cliente"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
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

        {/* Tab 3: SOCKETS AUDIT LOGS */}
        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={styles.terminalPanel}
          >
            <div style={styles.panelHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiTerminal size={18} color="var(--accent)" />
                <h2 style={styles.panelTitle}>Consola de Auditoría en Vivo</h2>
              </div>
              <span style={styles.terminalIndicator}>Escuchando sockets...</span>
            </div>

            <div style={styles.terminalBody}>
              {logs.length === 0 ? (
                <div style={styles.terminalEmpty}>
                  <code>&gt; Esperando eventos del sistema...</code>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} style={styles.logLine}>
                    <span style={styles.logTime}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      style={{
                        ...styles.logBadge,
                        color: getLogTypeColor(log.type),
                        borderColor: getLogTypeColor(log.type),
                      }}
                    >
                      {log.type}
                    </span>
                    <span style={styles.logEvent}>{log.event}</span>
                    {log.details && <span style={styles.logDetails}>— {log.details}</span>}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div style={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={styles.modal}
            >
              <div style={styles.modalHeader}>
                <h3>Editar Perfil de Cliente</h3>
                <button onClick={() => setEditingUser(null)} style={styles.modalClose}>
                  <FiX size={18} />
                </button>
              </div>

              {editError && (
                <div style={styles.modalError}>
                  <FiAlertTriangle /> {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} style={styles.modalForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setEditingUser(null)} style={styles.cancelBtn}>
                    Cancelar
                  </button>
                  <button type="submit" style={styles.saveBtn}>
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
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
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(194, 173, 144, 0.1)',
    padding: '8px 16px',
    borderRadius: '8px',
  },
  statusIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    boxShadow: '0 0 8px currentColor',
  },
  statusText: {
    fontSize: '0.8rem',
    color: '#ffffff',
    fontWeight: '500',
  },
  metricsRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  metricCard: {
    flex: 1,
    minWidth: '220px',
    background: 'linear-gradient(135deg, rgba(20, 25, 22, 0.7), rgba(8, 10, 9, 0.95))',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  metricLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-dimmed)',
    fontWeight: '600',
    letterSpacing: '0.02em',
  },
  metricValue: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  warningAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 18px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    fontSize: '0.85rem',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '24px',
    '@media(max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chartBlock: {
    position: 'relative' as const,
    background: 'linear-gradient(145deg, rgba(20, 26, 23, 0.7) 0%, rgba(12, 16, 14, 0.9) 100%)',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: '1px solid rgba(194, 173, 144, 0.25)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  chartTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '0.01em',
  },
  liveTag: {
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    color: '#4ade80',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  chartBody: {
    width: '100%',
    padding: '10px 0',
  },
  svgChart: {
    width: '100%',
    height: '160px',
    overflow: 'visible',
  },
  chartBlockMiniGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  gaugeBlock: {
    background: 'linear-gradient(180deg, rgba(15, 20, 18, 0.75) 0%, rgba(8, 10, 9, 0.95) 100%)',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
  },
  gaugeContainer: {
    position: 'relative' as const,
    width: '120px',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeLabel: {
    position: 'absolute' as const,
    textAlign: 'center' as const,
  },
  gaugeValue: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  gaugeSub: {
    fontSize: '0.7rem',
    color: 'var(--text-dimmed)',
  },
  gaugeHint: {
    fontSize: '0.75rem',
    color: 'var(--text-dimmed)',
    textAlign: 'center' as const,
  },
  revenueGoalBlock: {
    background: 'linear-gradient(180deg, rgba(15, 20, 18, 0.75) 0%, rgba(8, 10, 9, 0.95) 100%)',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  revenueGoalBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    width: '100%',
  },
  revenueValues: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
  },
  progressTrack: {
    height: '10px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '5px',
    overflow: 'hidden',
    border: '1px solid rgba(194, 173, 144, 0.1)',
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: '5px',
    transition: 'width 0.8s ease',
    boxShadow: '0 0 10px rgba(194, 173, 144, 0.4)',
  },
  goalMilestones: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    color: 'var(--text-dimmed)',
  },
  crudPanel: {
    background: 'linear-gradient(180deg, rgba(15, 20, 18, 0.75) 0%, rgba(8, 10, 9, 0.95) 100%)',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  panelTitle: {
    fontFamily: 'var(--font-athena)',
    fontSize: '1.25rem',
    color: '#ffffff',
  },
  searchBox: {
    position: 'relative' as const,
    width: '260px',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-dimmed)',
  },
  searchInput: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '8px',
    padding: '8px 12px 8px 36px',
    color: '#ffffff',
    fontSize: '0.85rem',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    gap: '12px',
    color: 'var(--text-dimmed)',
  },
  loaderSpinner: {
    width: '24px',
    height: '24px',
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
    padding: '40px 0',
    gap: '12px',
    color: 'var(--text-dimmed)',
  },
  tableResponsive: {
    width: '100%',
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(194, 173, 144, 0.15)',
    color: 'var(--text-dimmed)',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    textAlign: 'left' as const,
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.01)',
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle',
    fontSize: '0.85rem',
  },
  userName: {
    color: '#ffffff',
    fontWeight: '600',
  },
  userEmail: {
    color: 'var(--text-dimmed)',
  },
  purchasesCount: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    color: '#ffffff',
  },
  actions: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'flex-end',
  },
  actionBtnEdit: {
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    background: 'rgba(194, 173, 144, 0.06)',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    color: 'var(--accent)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  actionBtnDelete: {
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    background: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  terminalPanel: {
    background: '#070a08',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    height: '520px',
  },
  terminalIndicator: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '700',
  },
  terminalBody: {
    flex: 1,
    overflowY: 'auto' as const,
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    borderRadius: '8px',
    padding: '16px',
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    color: '#e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    lineHeight: '1.5',
  },
  terminalEmpty: {
    color: 'var(--text-dimmed)',
    fontStyle: 'italic',
  },
  logLine: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    wordBreak: 'break-all' as const,
  },
  logTime: {
    color: '#4b5563',
    whiteSpace: 'nowrap' as const,
  },
  logBadge: {
    border: '1px solid',
    borderRadius: '3px',
    padding: '0 4px',
    fontSize: '0.65rem',
    fontWeight: '700',
    whiteSpace: 'nowrap' as const,
    transform: 'translateY(1px)',
  },
  logEvent: {
    color: '#f3f4f6',
  },
  logDetails: {
    color: '#6b7280',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    background: '#0a0d0c',
    border: '1px solid rgba(194, 173, 144, 0.2)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#ffffff',
  },
  modalClose: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-dimmed)',
    cursor: 'pointer',
  },
  modalError: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '0.82rem',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '0.8rem',
    color: 'var(--text-dimmed)',
    fontWeight: '600',
  },
  input: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(194, 173, 144, 0.15)',
    borderRadius: '6px',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '0.88rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    padding: '8px 16px',
    color: 'var(--text-dimmed)',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  saveBtn: {
    background: 'var(--accent)',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    color: '#050505',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};
