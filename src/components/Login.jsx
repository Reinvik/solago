import React, { useState } from 'react';
import { usePuntoNexus } from '../context/PuntoNexusContext';
import { Shield, Lock, Mail, RefreshCw, Zap, CreditCard, Package } from 'lucide-react';

export default function Login() {
  const { login, loading } = usePuntoNexus();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    setErrorMsg('');
    const res = await login(email, password);
    if (res && res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="login-split-container">
      {/* Panel Izquierdo: Ventajas Explicativas (Hero) */}
      <div className="login-left-hero">
        <div className="login-hero-header" style={{ gap: '14px', display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div className="login-hero-logo" style={{ width: '56px', height: '56px', background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, flexShrink: 0 }}>
            <img src="/solago-emblem.png" alt="SoLago" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <img 
            src="/solago-wordmark.png" 
            alt="SoLago - Software Online para Locales" 
            style={{ height: '46px', maxWidth: '210px', objectFit: 'contain', display: 'block' }} 
          />
        </div>

        <div className="login-hero-content">
          <div className="login-hero-tag">
            <span className="login-hero-tag-dot"></span>
            Tecnología POS 4.0 Activa
          </div>

          <h1 className="login-hero-title">
            El sistema de ventas <br />
            <span style={{ 
              background: 'linear-gradient(90deg, #00d2ff 0%, #3b82f6 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
              marginTop: '4px'
            }}>
              que impulsa tu negocio
            </span>
          </h1>

          <p className="login-hero-subtitle" style={{ lineHeight: '1.7' }}>
            <strong style={{ color: '#ffffff' }}>SoLago</strong> es el acrónimo de <strong style={{ color: '#ffa100' }}>S</strong>oftware <strong style={{ color: '#ffa100' }}>O</strong>nline para <strong style={{ color: '#3b82f6' }}>L</strong>ocales, <strong style={{ color: '#3b82f6' }}>A</strong>dministración y <strong style={{ color: '#3b82f6' }}>G</strong>estión <strong style={{ color: '#3b82f6' }}>O</strong>perativa. Una plataforma integral diseñada para potenciar las ventas de tu negocio en tiempo real.
          </p>

          <div className="login-features-list">
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <Zap size={18} />
              </div>
              <div className="login-feature-text">
                <h3 className="login-feature-text-title">Actualización de valores automática</h3>
                <p className="login-feature-text-desc">Sincronización instantánea de divisas, reglas impositivas y precios de tu inventario local.</p>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <CreditCard size={18} />
              </div>
              <div className="login-feature-text">
                <h3 className="login-feature-text-title">Vitrina digital con pago automático</h3>
                <p className="login-feature-text-desc">Permite a tus clientes escanear un código QR, ver tu catálogo y pagar directamente desde su celular.</p>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <Package size={18} />
              </div>
              <div className="login-feature-text">
                <h3 className="login-feature-text-title">Descuento de inventario en tiempo real</h3>
                <p className="login-feature-text-desc">Cada boleta descuenta stock automáticamente del esquema privado de tu tienda de forma segura.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="login-hero-footer">
          © {new Date().getFullYear()} SMARTLEAN • PRODUCTO OFICIAL
        </div>
      </div>

      {/* Panel Derecho: Formulario de Login */}
      <div className="login-right-form">
        <div className="login-form-card">
          <div className="login-form-header">
            <h2 className="login-form-title">Bienvenido</h2>
            <p className="login-form-desc">Ingresa tus credenciales corporativas para acceder al terminal.</p>
          </div>

          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#f87171',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="email" style={{ color: '#94a3b8' }}>Correo Electrónico</label>
              <div className="login-dark-input-wrapper">
                <Mail size={18} className="login-dark-input-icon" />
                <input
                  id="email"
                  type="email"
                  className="login-dark-input"
                  placeholder="usuario@solago.com.ve"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="password" style={{ color: '#94a3b8' }}>Contraseña</label>
              <div className="login-dark-input-wrapper">
                <Lock size={18} className="login-dark-input-icon" />
                <input
                  id="password"
                  type="password"
                  className="login-dark-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '16px', marginTop: '12px' }}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Ingresar al POS <span style={{ fontSize: '18px', fontWeight: 'bold' }}>→</span>
                </span>
              )}
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
            <a
              href={typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? '/landing.html' : 'https://www.solago.com.ve'}
              style={{
                color: '#94a3b8',
                fontSize: '13px',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#38bdf8')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <span>←</span> Conoce más sobre SoLago en <strong>solago.com.ve</strong>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
