import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { usePuntoNexus } from '../context/PuntoNexusContext';

export default function AdminPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  requireReason = false,
  user = null,
  title = "Autorización de Administrador Requerida",
  actionName = "anular esta venta"
}) {
  const { verifyAdminPassword } = usePuntoNexus();
  const [password, setPassword] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (requireReason && !cancellationReason.trim()) {
      setError('Por favor indica el motivo o justificación de la anulación.');
      return;
    }
    if (!password.trim()) {
      setError('Por favor ingresa la clave de Administrador.');
      return;
    }

    setLoading(true);
    const isValid = await verifyAdminPassword(password);
    setLoading(false);

    if (isValid) {
      setPassword('');
      setError('');
      onConfirm(cancellationReason.trim()); setCancellationReason('');
    } else {
      setError('Contraseña de administrador incorrecta. Acceso denegado.');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 20000 }}>
      <div
        className="modal-content glass-panel cyan-glow"
        style={{
          maxWidth: '420px',
          padding: '24px',
          background: '#090f1e',
          color: '#fff',
          borderRadius: '20px',
          border: '1px solid rgba(239, 68, 68, 0.4)'
        }}
      >
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={22} style={{ color: '#ef4444' }} />
            <h3 className="modal-title" style={{ margin: 0, fontSize: '16px', color: '#fff' }}>
              {title}
            </h3>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p style={{ fontSize: '12.5px', color: '#cbd5e1', marginBottom: '16px', lineHeight: '1.4' }}>
          Para <strong>{actionName}</strong> se requiere la clave de <strong>Administrador</strong> o la <strong>Clave de Anulación de Facturas</strong> configurada.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '10px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {requireReason && (
            <div style={{ marginBottom: '14px', background: '#1e293b', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
                👤 Usuario Responsable: <span style={{ color: 'var(--color-cyan)', fontWeight: 900 }}>{user?.full_name || user?.name || user?.email || 'Administrador'}</span>
              </div>
            </div>
          )}

          {requireReason && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-cyan)', display: 'block', marginBottom: '6px' }}>
                📝 Motivo / Justificación de la Anulación *
              </label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Escribe el motivo (ej. Error en cobro, cliente canceló, devolución...)"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '13px',
                  borderRadius: '10px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#fff',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-cyan)', display: 'block', marginBottom: '6px' }}>
              Contraseña de Administrador *
            </label>
            <input
              type="password"
              className="form-input"
              autoFocus
              placeholder="Ingresa clave de Admin o Clave de Anulación..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                borderRadius: '10px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#fff'
              }}
            />
            <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '6px', display: 'block' }}>
              💡 PIN por defecto: <code>1234</code> o la clave de tu cuenta Admin.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ShieldCheck size={16} />
              <span>{loading ? 'Verificando...' : 'Autorizar y Anular'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
