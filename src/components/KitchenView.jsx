import React, { useState, useMemo } from 'react';
import { usePuntoNexus } from '../context/PuntoNexusContext';
import {
  ChefHat, Clock, CheckCircle2, AlertCircle,
  Utensils, ShoppingBag, ArrowRight, RotateCcw, X
} from 'lucide-react';

// ── Configuración de estados de cocina ──────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.4)',
    icon: <Clock size={13} />,
    next: 'preparing',
    nextLabel: 'Preparar →'
  },
  preparing: {
    label: 'Preparando',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.15)',
    border: 'rgba(6,182,212,0.4)',
    icon: <ChefHat size={13} />,
    next: 'ready',
    nextLabel: 'Listo →'
  },
  ready: {
    label: '¡Listo!',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.4)',
    icon: <CheckCircle2 size={13} />,
    next: 'delivered',
    nextLabel: 'Entregado →'
  },
  delivered: {
    label: 'Entregado',
    color: '#64748b',
    bg: 'rgba(100,116,139,0.1)',
    border: 'rgba(100,116,139,0.2)',
    icon: <CheckCircle2 size={13} />,
    next: null,
    nextLabel: null
  }
};

// Tiempo transcurrido en formato legible
const elapsed = (isoStr) => {
  if (!isoStr) return '—';
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
};

// Urgencia visual por tiempo: > 15 min = rojo, > 8 min = amarillo, else normal
const urgency = (isoStr) => {
  if (!isoStr) return 'normal';
  const mins = (Date.now() - new Date(isoStr).getTime()) / 60000;
  if (mins > 15) return 'critical';
  if (mins > 8)  return 'warning';
  return 'normal';
};

const URGENCY_STYLES = {
  normal:   { borderTop: '3px solid rgba(6,182,212,0.5)' },
  warning:  { borderTop: '3px solid rgba(245,158,11,0.8)' },
  critical: { borderTop: '3px solid rgba(239,68,68,0.9)', animation: 'pulse-border 1.5s ease-in-out infinite' }
};

export default function KitchenView({ onClose }) {
  const { tables, updateTableItemStatus, sendTableOrderToKitchen } = usePuntoNexus();

  // Filtro de vista
  const [activeFilter, setActiveFilter] = useState('active'); // 'active' | 'all'

  // Tick para actualizar el tiempo en pantalla cada 15 segundos
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  // Construir lista plana de pedidos: { table, itemIndex, item }
  // Ordenados por ordered_at ASC (los más viejos primero = FIFO)
  const allOrders = useMemo(() => {
    const list = [];
    tables.forEach(table => {
      if (!Array.isArray(table.items) || table.items.length === 0) return;
      table.items.forEach((item, idx) => {
        // Excluir platillos borrador (que aún no han sido solicitados a cocina por el cliente/camarero)
        if (!item.kitchen_status || item.kitchen_status === 'draft') return;
        if (activeFilter === 'active' && item.kitchen_status === 'delivered') return;
        list.push({ table, itemIndex: idx, item });
      });
    });
    // Ordenar por ordered_at (FIFO — primero en entrar, primero en salir)
    list.sort((a, b) => {
      const ta = a.item.ordered_at ? new Date(a.item.ordered_at).getTime() : 0;
      const tb = b.item.ordered_at ? new Date(b.item.ordered_at).getTime() : 0;
      return ta - tb;
    });
    return list;
  }, [tables, activeFilter, tick]);

  // KPIs rápidos
  const kpis = useMemo(() => {
    const all = tables.flatMap(t => t.items || []);
    return {
      pending:   all.filter(i => i.kitchen_status === 'pending').length,
      preparing: all.filter(i => i.kitchen_status === 'preparing').length,
      ready:     all.filter(i => i.kitchen_status === 'ready').length,
      delivered: all.filter(i => i.kitchen_status === 'delivered').length,
    };
  }, [tables, tick]);

  const handleAdvanceStatus = (tableId, itemIndex, currentStatus) => {
    const cfg = STATUS_CONFIG[currentStatus];
    if (!cfg?.next) return;
    updateTableItemStatus(tableId, itemIndex, cfg.next);
  };

  const handleResetStatus = (tableId, itemIndex) => {
    updateTableItemStatus(tableId, itemIndex, 'pending');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(2, 6, 23, 0.97)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', 'system-ui', sans-serif"
    }}>
      {/* ─── CABECERA ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderBottom: '1px solid rgba(6,182,212,0.2)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            borderRadius: '12px', padding: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ChefHat size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
              Vista Cocina
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Comandas en tiempo real · actualiza cada 15s
            </div>
          </div>
        </div>

        {/* KPI chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'Pendiente',  count: kpis.pending,   color: '#f59e0b' },
            { label: 'Preparando', count: kpis.preparing, color: '#06b6d4' },
            { label: '¡Listo!',   count: kpis.ready,     color: '#10b981' },
            { label: 'Entregado',  count: kpis.delivered, color: '#64748b' },
          ].map(k => (
            <div key={k.label} style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${k.color}40`,
              borderRadius: '10px', padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <span style={{ fontSize: '18px', fontWeight: 900, color: k.color }}>{k.count}</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{k.label}</span>
            </div>
          ))}
        </div>

        {/* Filtros + cerrar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '3px' }}>
            {[
              { key: 'active', label: 'En curso' },
              { key: 'all',    label: 'Todos' }
            ].map(f => (
              <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
                background: activeFilter === f.key ? 'rgba(6,182,212,0.25)' : 'transparent',
                border: activeFilter === f.key ? '1px solid rgba(6,182,212,0.5)' : '1px solid transparent',
                color: activeFilter === f.key ? '#06b6d4' : '#94a3b8',
                borderRadius: '8px', padding: '5px 12px',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
              }}>{f.label}</button>
            ))}
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '10px', padding: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ef4444', transition: 'all 0.2s'
          }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ─── CUERPO: columnas por estado ───────────────────────────── */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0',
        overflow: 'hidden'
      }}>
        {(['pending', 'preparing', 'ready', 'delivered']).map(status => {
          const cfg = STATUS_CONFIG[status];
          const colItems = allOrders.filter(o => o.item.kitchen_status === status);
          return (
            <div key={status} style={{
              display: 'flex', flexDirection: 'column',
              borderRight: '1px solid rgba(255,255,255,0.05)',
              overflow: 'hidden'
            }}>
              {/* Cabecera de columna */}
              <div style={{
                padding: '12px 16px',
                background: cfg.bg,
                borderBottom: `2px solid ${cfg.color}60`,
                display: 'flex', alignItems: 'center', gap: '8px',
                flexShrink: 0
              }}>
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {cfg.label}
                </span>
                <span style={{
                  marginLeft: 'auto', background: cfg.color,
                  color: 'white', borderRadius: '999px',
                  padding: '2px 8px', fontSize: '11px', fontWeight: 900
                }}>{colItems.length}</span>
              </div>

              {/* Tarjetas de ítems */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '12px 10px',
                display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                {colItems.length === 0 && (
                  <div style={{
                    textAlign: 'center', padding: '40px 16px',
                    color: '#334155', fontSize: '13px'
                  }}>
                    Sin ítems aquí
                  </div>
                )}

                {colItems.map(({ table, itemIndex, item }, i) => {
                  const urg = urgency(item.ordered_at);
                  const cfg2 = STATUS_CONFIG[status];
                  return (
                    <div key={`${table.id}-${itemIndex}-${i}`} style={{
                      background: 'linear-gradient(135deg, #0f172a 0%, #1a2540 100%)',
                      border: `1px solid ${cfg.border}`,
                      borderRadius: '14px',
                      overflow: 'hidden',
                      ...URGENCY_STYLES[urg],
                      transition: 'box-shadow 0.2s'
                    }}>
                      {/* Mesa + tiempo */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {table.isTakeout
                            ? <ShoppingBag size={13} color="#d97706" />
                            : <Utensils size={13} color="var(--color-cyan, #06b6d4)" />}
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0' }}>
                            {table.name}
                          </span>
                          {table.diners > 0 && (
                            <span style={{ fontSize: '10px', color: '#64748b' }}>· {table.diners} 👤</span>
                          )}
                        </div>
                        {/* Tiempo desde que se ordenó */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          color: urg === 'critical' ? '#ef4444' : urg === 'warning' ? '#f59e0b' : '#64748b',
                          fontSize: '11px', fontWeight: 700
                        }}>
                          <Clock size={11} />
                          {elapsed(item.ordered_at)}
                        </div>
                      </div>

                      {/* Nombre del ítem */}
                      <div style={{ padding: '10px 12px 6px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'white', lineHeight: 1.3 }}>
                          {item.name}
                        </div>
                        {item.notes && (
                          <div style={{
                            marginTop: '4px', fontSize: '11px', color: '#f59e0b',
                            background: 'rgba(245,158,11,0.1)', borderRadius: '6px',
                            padding: '3px 7px', display: 'inline-block'
                          }}>
                            📝 {item.notes}
                          </div>
                        )}
                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>
                          × {item.quantity ?? item.cantidad ?? 1}
                          {item.sku && <span style={{ marginLeft: '8px', color: '#475569', fontSize: '10px' }}>{item.sku}</span>}
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div style={{ padding: '8px 12px', display: 'flex', gap: '6px' }}>
                        {cfg2.next && (
                          <button
                            onClick={() => handleAdvanceStatus(table.id, itemIndex, status)}
                            style={{
                              flex: 1,
                              background: `linear-gradient(135deg, ${cfg2.color}30, ${cfg2.color}15)`,
                              border: `1px solid ${cfg2.color}60`,
                              borderRadius: '8px',
                              padding: '7px 10px',
                              color: cfg2.color,
                              fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                              transition: 'all 0.15s'
                            }}
                          >
                            <ArrowRight size={13} />
                            {cfg2.nextLabel}
                          </button>
                        )}
                        {status !== 'pending' && (
                          <button
                            onClick={() => handleResetStatus(table.id, itemIndex)}
                            title="Devolver a Pendiente"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px', padding: '7px 9px',
                              color: '#64748b', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s'
                            }}
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── PIE: leyenda de urgencia ─────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '20px',
        padding: '10px 24px',
        background: '#0a0f1e',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: '11px', color: '#475569', flexShrink: 0
      }}>
        <span style={{ fontWeight: 700, color: '#334155' }}>Urgencia →</span>
        <span style={{ color: '#06b6d4' }}>● Normal (&lt;8 min)</span>
        <span style={{ color: '#f59e0b' }}>● Atención (8-15 min)</span>
        <span style={{ color: '#ef4444' }}>● Crítico (&gt;15 min)</span>
        <span style={{ marginLeft: 'auto' }}>FIFO: los ítems más antiguos aparecen primero en cada columna</span>
      </div>

      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.25); }
        }
      `}</style>
    </div>
  );
}
