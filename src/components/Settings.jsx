import React, { useState } from 'react';
import { usePuntoNexus } from '../context/PuntoNexusContext';
import { supabase } from '../utils/supabaseClient';
import { Settings as SettingsIcon, Globe, DollarSign, Percent, Clock, RefreshCw, Utensils, ShoppingBag, ShoppingCart, User, Coffee, Monitor, Truck, Wrench, Store, Check, Sparkles, Palette, Image as ImageIcon, Building2, MapPin, Plus, ShieldCheck, Upload } from 'lucide-react';
import ExchangeRateChart from './ExchangeRateChart';

const GIROS_COMERCIALES = [
  { 
    id: 'boutique', 
    name: 'Boutique', 
    icon: ShoppingBag, 
    color: '#ec4899', 
    gradient: 'linear-gradient(135deg, #f472b6, #ec4899)',
    desc: 'Venta de ropa, calzado, moda, confección y accesorios de vestir.'
  },
  { 
    id: 'alimentos', 
    name: 'Alimentos', 
    icon: ShoppingCart, 
    color: '#a855f7', 
    gradient: 'linear-gradient(135deg, #c084fc, #9333ea)',
    desc: 'Minimarkets, supermercados, abarrotes, bodegas y panaderías.'
  },
  { 
    id: 'servicios', 
    name: 'Servicios', 
    icon: User, 
    color: '#3b82f6', 
    gradient: 'linear-gradient(135deg, #60a5fa, #2563eb)',
    desc: 'Servicios profesionales, talleres, barberías, salones y consultoría.'
  },
  { 
    id: 'gastronomia', 
    name: 'Gastronomía', 
    icon: Coffee, 
    color: '#f59e0b', 
    gradient: 'linear-gradient(135deg, #fbbf24, #d97706)',
    desc: 'Restaurantes, comensales, comandero de mesas, cafeterías y comida rápida.'
  },
  { 
    id: 'electronica', 
    name: 'Electrónica / Accesorios', 
    icon: Monitor, 
    color: '#06b6d4', 
    gradient: 'linear-gradient(135deg, #22d3ee, #0891b2)',
    desc: 'Computación, tecnología, celulares, gadgetry y accesorios.'
  },
  { 
    id: 'repuestos', 
    name: 'Repuestos', 
    icon: Truck, 
    color: '#8b5cf6', 
    gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    desc: 'Repuestos automotrices, garaje, autopartes y suministros.'
  },
  { 
    id: 'ferreteria', 
    name: 'Ferretería', 
    icon: Wrench, 
    color: '#ef4444', 
    gradient: 'linear-gradient(135deg, #f87171, #dc2626)',
    desc: 'Artículos de ferretería, construcción, herramientas y materiales.'
  }
];

export default function Settings({ onOpenProfileModal }) {
  const { companySettings, updateCompanySettings, companyName, setCompanyName, updateCompanyName, syncExchangeRate, rateHistory, bcvRate, paraleloRate, euroRate, bcvLastUpdated, loading, branches = [], activeBranchId, switchBranch, addBranch } = usePuntoNexus();

  const currentGiro = companySettings.business_type || 'gastronomia';
  const selectedGiroObj = GIROS_COMERCIALES.find(g => g.id === currentGiro) || GIROS_COMERCIALES[3];

  // ─── Sincronización manual de sucursales desde Supabase ───
  const [syncingBranches, setSyncingBranches] = useState(false);
  const [branchSyncMsg, setBranchSyncMsg] = useState(null);

  const handleSyncBranchesFromDB = async () => {
    const companyId = companySettings.company_id || localStorage.getItem('punto_nexus_company_id');
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);

    if (!isValidUUID) {
      setBranchSyncMsg({ type: 'warn', text: 'La sincronización remota requiere una cuenta Supabase. Las sucursales actuales están guardadas localmente.' });
      setTimeout(() => setBranchSyncMsg(null), 4000);
      return;
    }

    setSyncingBranches(true);
    try {
      const { data, error } = await supabase
        .from('punto_nexus_branches')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        localStorage.setItem(`punto_nexus_branches_${companyId}`, JSON.stringify(data));
        window.location.reload();
      } else {
        // Limpiar sucursales secundarias fantasmas en localStorage si no existen en el servidor Supabase
        const defaultMain = [{ id: 'branch-matriz', name: 'Matriz Principal', code: 'MATRIZ-01', is_main: true, business_type: 'gastronomia' }];
        localStorage.setItem(`punto_nexus_branches_${companyId}`, JSON.stringify(defaultMain));
        localStorage.setItem(`punto_nexus_active_branch_${companyId}`, 'branch-matriz');
        setBranchSyncMsg({ type: 'info', text: 'No existen sucursales remotas en Supabase para esta empresa. Se han removido las sucursales locales.' });
        setTimeout(() => {
          setBranchSyncMsg(null);
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      const isMissingTable = err.message?.includes('schema cache') || err.message?.includes('does not exist');
      const msg = isMissingTable 
        ? 'La tabla de sucursales en Supabase no ha sido migrada aún. Las sucursales funcionan perfectamente en modo local en esta instancia.'
        : `Error: ${err.message}`;
      setBranchSyncMsg({ type: 'warn', text: msg });
      setTimeout(() => setBranchSyncMsg(null), 6000);
    } finally {
      setSyncingBranches(false);
    }
  };

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoSaveMsg, setLogoSaveMsg] = useState(null);

  const compressImageFile = (file, maxDim = 350) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 0.85));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleLogoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setLogoSaveMsg("⏳ Optimizando y guardando logo en Supabase...");

    const compressedDataUrl = await compressImageFile(file, 350);
    if (!compressedDataUrl) {
      alert("⚠️ No se pudo procesar la imagen seleccionada.");
      setIsUploadingLogo(false);
      return;
    }

    const res = await updateCompanySettings({ logo_url: compressedDataUrl });
    setIsUploadingLogo(false);

    if (res?.error) {
      setLogoSaveMsg("⚠️ Guardado localmente (sin conexión a servidor)");
    } else {
      setLogoSaveMsg("✅ Logo optimizado y sincronizado en Supabase para todas las PCs");
    }
    setTimeout(() => setLogoSaveMsg(null), 5000);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '820px', margin: '0 auto' }}>
      
      {/* Cabecera Principal */}
      <div className="glass-panel" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(99,102,241,0.06))',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '12px',
          background: 'rgba(6,182,212,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-cyan)',
          flexShrink: 0
        }}>
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Ajustes y Localización del Establecimiento</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            Configura el país de operación, moneda, reglas tributarias, logo e identidad del menú digital.
          </p>
        </div>
      </div>

      {/* PANEL 0: SELECTOR DE GIRO COMERCIAL DEL NEGOCIO */}
      <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={16} />
            Giro Comercial & Modalidad del Negocio
          </h3>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: '99px', border: '1px solid #e2e8f0' }}>
            {GIROS_COMERCIALES.length} Giros Disponibles
          </span>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px', marginTop: 0 }}>
          Selecciona el giro de tu empresa. Próximamente los módulos del sistema se adaptarán de forma dinámica según las necesidades operativas de tu rubro.
        </p>

        {/* Barra de Píldoras de Giros Comerciales */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px', scrollbarWidth: 'thin' }}>
          {GIROS_COMERCIALES.map(giro => {
            const IconComp = giro.icon;
            const isSelected = currentGiro === giro.id || (currentGiro === 'restaurant' && giro.id === 'gastronomia') || (currentGiro === 'general' && giro.id === 'repuestos');

            return (
              <button
                key={giro.id}
                type="button"
                onClick={async () => {
                  const res = await updateCompanySettings({ business_type: giro.id });
                  if (res.error) alert(res.error);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '99px',
                  border: isSelected ? `2px solid ${giro.color}` : '1px solid #cbd5e1',
                  background: isSelected ? giro.gradient : '#ffffff',
                  color: isSelected ? '#ffffff' : '#0f172a',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? `0 4px 14px ${giro.color}40` : '0 1px 3px rgba(15,23,42,0.04)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: isSelected ? 'rgba(255,255,255,0.25)' : `${giro.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? '#ffffff' : giro.color
                }}>
                  <IconComp size={14} />
                </div>
                <span>{giro.name}</span>
                {isSelected && <Check size={14} style={{ strokeWidth: 3 }} />}
              </button>
            );
          })}
        </div>

        {/* Tarjeta de Confirmación de Giro Seleccionado */}
        {selectedGiroObj && (
          <div style={{
            background: '#f8fafc',
            border: `1px solid ${selectedGiroObj.color}30`,
            borderLeft: `4px solid ${selectedGiroObj.color}`,
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            gap: '14px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: selectedGiroObj.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: `0 3px 10px ${selectedGiroObj.color}40`
              }}>
                {React.createElement(selectedGiroObj.icon, { size: 20 })}
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                  Giro Activo: {selectedGiroObj.name}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  {selectedGiroObj.desc}
                </div>
              </div>
            </div>

            <span style={{ fontSize: '11px', fontWeight: 700, color: selectedGiroObj.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={13} />
              Configurado para la tienda
            </span>
          </div>
        )}

      </div>

      {/* PANEL 0A: SUCURSALES Y CASAS MATRICES ANCLADAS */}
      <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} />
            Estructura de Sedes y Sucursales Ancladas
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              1 Matriz + {Math.max(0, branches.length - 1)} Sucursales
            </span>
            <button
              onClick={handleSyncBranchesFromDB}
              disabled={syncingBranches}
              title="Recargar sucursales desde el servidor (comparte las sucursales entre todas las cuentas de esta empresa)"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '99px', cursor: 'pointer',
                background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)',
                color: 'var(--color-cyan)', fontSize: '11px', fontWeight: 800,
                opacity: syncingBranches ? 0.6 : 1, transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={12} style={{ animation: syncingBranches ? 'spin 1s linear infinite' : 'none' }} />
              {syncingBranches ? 'Sincronizando...' : 'Sincronizar desde servidor'}
            </button>
          </div>
        </div>

        {/* Mensaje de estado de sincronización */}
        {branchSyncMsg && (
          <div style={{
            padding: '8px 14px', borderRadius: '10px', marginBottom: '12px', fontSize: '12px', fontWeight: 700,
            background: branchSyncMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : branchSyncMsg.type === 'warn' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
            color: branchSyncMsg.type === 'error' ? '#dc2626' : branchSyncMsg.type === 'warn' ? '#b45309' : '#059669',
            border: `1px solid ${branchSyncMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : branchSyncMsg.type === 'warn' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`
          }}>
            {branchSyncMsg.text}
          </div>
        )}

        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px', marginTop: 0 }}>
          Las sucursales creadas quedan ancladas a la <strong>Matriz Principal</strong> de la empresa y son visibles para <strong>todas las cuentas</strong> del mismo establecimiento al sincronizarse con el servidor.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {branches.map(b => {
            const isActive = b.id === activeBranchId;
            return (
              <div
                key={b.id}
                onClick={() => switchBranch(b.id)}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  border: isActive ? '2px solid var(--color-cyan)' : '1px solid #cbd5e1',
                  background: isActive ? 'rgba(6, 182, 212, 0.04)' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{b.name}</span>
                    <span style={{ fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px', background: b.is_main ? '#10b981' : '#06b6d4', color: '#fff' }}>
                      {b.is_main ? 'CASA MATRIZ' : 'SUCURSAL'}
                    </span>
                  </div>
                  {b.address && (
                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={11} />
                      <span>{b.address}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>Código: {b.code || 'SUC-01'}</span>
                  {isActive ? (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={12} /> Activa
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>Hacer clic para activar</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PANEL 0B: IDENTIDAD DE MARCA, LOGO Y COLORES DEL MENÚ QR */}
      <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={16} />
            Identidad de Marca, Logo & Colores del Menú QR
          </h3>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '3px 10px', borderRadius: '99px' }}>
            Personalización para Clientes
          </span>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px', marginTop: 0 }}>
          Define el logo y la paleta cromática de tu empresa. El menú digital QR aplicará automáticamente estos colores y compartirá el nombre de tu marca en cada link generado.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Logo de la Empresa */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 800 }}>Logo de la Empresa (Subir o URL)</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {companySettings.logo_url ? (
                <img 
                  src={companySettings.logo_url} 
                  alt="Logo" 
                  style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                />
              ) : (
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <ImageIcon size={22} />
                </div>
              )}

              <input
                type="text"
                className="form-input"
                placeholder="https://ejemplo.com/logo.png"
                value={companySettings.logo_url || ''}
                onChange={async (e) => {
                  await updateCompanySettings({ logo_url: e.target.value });
                }}
                style={{ flex: 1, minWidth: '160px', fontSize: '12px' }}
              />

              <label 
                className="btn-secondary" 
                style={{ 
                  padding: '8px 12px', 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  cursor: isUploadingLogo ? 'wait' : 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  background: isUploadingLogo ? 'rgba(148, 163, 184, 0.15)' : 'rgba(6,182,212,0.08)',
                  border: isUploadingLogo ? '1px solid #cbd5e1' : '1px solid rgba(6,182,212,0.3)',
                  color: isUploadingLogo ? '#64748b' : 'var(--color-cyan)',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap'
                }}
                title="Selecciona una imagen desde tu equipo (PNG, JPG, SVG)"
              >
                {isUploadingLogo ? <RefreshCw size={13} className="spin" /> : <Upload size={13} />}
                <span>{isUploadingLogo ? 'Subiendo...' : 'Subir Imagen'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  disabled={isUploadingLogo}
                  onChange={handleLogoFileUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
            {logoSaveMsg ? (
              <span style={{ fontSize: '11px', color: logoSaveMsg.includes('⚠️') ? '#d97706' : '#059669', marginTop: '6px', display: 'block', fontWeight: 800 }}>
                {logoSaveMsg}
              </span>
            ) : (
              <span style={{ fontSize: '10.5px', color: '#059669', marginTop: '5px', display: 'block', fontWeight: 700 }}>
                💾 El logo se guarda en la Base de Datos Supabase y se mostrará en tu barra lateral y catálogo QR.
              </span>
            )}
          </div>

          {/* Nombre Comercial */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 800 }}>Nombre Comercial de la Empresa</label>
            <input
              type="text"
              className="form-input"
              value={companyName || 'Punto Nexus'}
              onChange={async (e) => {
                const val = e.target.value;
                await updateCompanyName(val);
              }}
              style={{ fontSize: '13px', fontWeight: 700 }}
            />
            <span style={{ fontSize: '10.5px', color: '#059669', marginTop: '5px', display: 'block', fontWeight: 700 }}>
              💾 El nombre se sincroniza automáticamente con la Base de Datos Supabase para todas las cuentas.
            </span>
          </div>
        </div>

        {/* Selección de Colores del Menú */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
          <label className="form-label" style={{ fontWeight: 800, marginBottom: '12px', display: 'block' }}>
            Paletas de Colores Predefinidas para el Menú QR
          </label>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {[
              { name: '🩵 Smartlean Cyan', brand: '#0f172a', accent: '#06b6d4' },
              { name: '🟢 Verde Esmeralda', brand: '#064e3b', accent: '#10b981' },
              { name: '🟣 Violeta Neón', brand: '#1e1b4b', accent: '#a855f7' },
              { name: '🟧 Ámbar Cálido', brand: '#451a03', accent: '#f59e0b' },
              { name: '🔴 Rojo Carmín', brand: '#450a0a', accent: '#ef4444' },
              { name: '🖤 Monocromo Elegante', brand: '#0f172a', accent: '#0f172a' }
            ].map(p => (
              <button
                key={p.name}
                type="button"
                onClick={async () => {
                  await updateCompanySettings({ 
                    brand_color: p.brand, 
                    accent_color: p.accent,
                    button_color: p.accent,
                    price_color: p.accent
                  });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: companySettings.brand_color === p.brand ? `2px solid ${p.accent}` : '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: p.brand }} />
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: p.accent }} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>

          {/* 3 Controles de Color Específicos: Encabezado, Botón y Precio */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {/* Color del Encabezado */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>🏙️ Fondo del Encabezado</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={companySettings.brand_color || '#0f172a'}
                  onChange={async (e) => await updateCompanySettings({ brand_color: e.target.value })}
                  style={{ width: '38px', height: '38px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={companySettings.brand_color || '#0f172a'}
                  onChange={async (e) => await updateCompanySettings({ brand_color: e.target.value })}
                  style={{ fontFamily: 'monospace', fontSize: '12px', flex: 1 }}
                />
              </div>
            </div>

            {/* Color de los Precios */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>💵 Color de los Precios</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={companySettings.price_color || companySettings.accent_color || '#06b6d4'}
                  onChange={async (e) => await updateCompanySettings({ price_color: e.target.value })}
                  style={{ width: '38px', height: '38px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={companySettings.price_color || companySettings.accent_color || '#06b6d4'}
                  onChange={async (e) => await updateCompanySettings({ price_color: e.target.value })}
                  style={{ fontFamily: 'monospace', fontSize: '12px', flex: 1 }}
                />
              </div>
            </div>

            {/* Color de los Botones */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 700 }}>🔘 Color de Botones (+ AGREGAR)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={companySettings.button_color || companySettings.accent_color || '#06b6d4'}
                  onChange={async (e) => await updateCompanySettings({ button_color: e.target.value })}
                  style={{ width: '38px', height: '38px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={companySettings.button_color || companySettings.accent_color || '#06b6d4'}
                  onChange={async (e) => await updateCompanySettings({ button_color: e.target.value })}
                  style={{ fontFamily: 'monospace', fontSize: '12px', flex: 1 }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Vista Previa de la Cabecera y Tarjeta de Producto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Cabecera */}
          <div style={{
            background: companySettings.brand_color || '#0f172a',
            padding: '14px 18px',
            borderRadius: '12px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            borderBottom: `3px solid ${companySettings.button_color || companySettings.accent_color || '#06b6d4'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {companySettings.logo_url ? (
                <img src={companySettings.logo_url} alt="Logo Preview" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: companySettings.button_color || companySettings.accent_color || '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                  {companyName ? companyName.charAt(0) : 'P'}
                </div>
              )}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900 }}>{companyName || 'Punto Nexus'}</div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Vista Previa del Menú Digital</div>
              </div>
            </div>

            <span style={{ fontSize: '10px', fontWeight: 900, background: `${companySettings.button_color || companySettings.accent_color || '#06b6d4'}30`, color: companySettings.button_color || companySettings.accent_color || '#06b6d4', padding: '3px 8px', borderRadius: '6px' }}>
              ENCABEZADO
            </span>
          </div>

          {/* Mini Tarjeta de Producto para probar precio y botón */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>1+1140 grs. Soprole</div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: companySettings.price_color || companySettings.accent_color || '#06b6d4', marginTop: '2px' }}>
                $700.00 <span style={{ fontSize: '11px', color: '#64748b' }}>(Bs. 512.735)</span>
              </div>
            </div>

            <button
              type="button"
              style={{
                background: companySettings.button_color 
                  ? `linear-gradient(135deg, ${companySettings.button_color} 0%, ${companySettings.button_color}dd 100%)` 
                  : 'linear-gradient(135deg, #06b6d4, #0284c7)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 900,
                boxShadow: `0 4px 12px ${companySettings.button_color || '#06b6d4'}40`
              }}
            >
              + AGREGAR
            </button>
          </div>
        </div>

      </div>

      {/* Grid de Paneles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* PANEL 1: LOCALIZACIÓN GEOGRÁFICA Y TRIBUTOS */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-cyan)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} />
            Localización y Reglas Tributarias
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">País de Operación</label>
              <select
                className="form-input"
                style={{ width: '100%' }}
                value={companySettings.country || 'CL'}
                onChange={async (e) => {
                  const country = e.target.value;
                  let updates = { country };
                  if (country === 'VE') {
                    updates = {
                      ...updates,
                      currency_code: 'VES',
                      currency_symbol: 'Bs.',
                      tax_name: 'IVA',
                      tax_rate: 0.16,
                      use_usd_pricing: true,
                      exchange_rate_source: 'bcv'
                    };
                  } else if (country === 'CO') {
                    updates = {
                      ...updates,
                      currency_code: 'COP',
                      currency_symbol: 'Col$',
                      tax_name: 'IVA',
                      tax_rate: 0.19,
                      use_usd_pricing: false,
                      exchange_rate_source: 'manual',
                      exchange_rate: 1.0
                    };
                  } else if (country === 'AR') {
                    updates = {
                      ...updates,
                      currency_code: 'ARS',
                      currency_symbol: 'AR$',
                      tax_name: 'IVA',
                      tax_rate: 0.21,
                      use_usd_pricing: false,
                      exchange_rate_source: 'manual',
                      exchange_rate: 1.0
                    };
                  } else {
                    // Chile por defecto
                    updates = {
                      ...updates,
                      currency_code: 'CLP',
                      currency_symbol: '$',
                      tax_name: 'IVA',
                      tax_rate: 0.19,
                      use_usd_pricing: false,
                      exchange_rate_source: 'manual',
                      exchange_rate: 1.0
                    };
                  }
                  const res = await updateCompanySettings(updates);
                  if (res.error) alert(res.error);
                }}
              >
                <option value="CL">Chile (CLP / 19% IVA)</option>
                <option value="VE">Venezuela (VES / 16% IVA / Fijación en Dólares)</option>
                <option value="CO">Colombia (COP / 19% IVA)</option>
                <option value="AR">Argentina (ARS / 21% IVA)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Impuesto Configurado ({companySettings.tax_name || 'IVA'})</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '40%', textAlign: 'center', background: '#f8fafc', color: 'var(--text-muted)' }}
                  value={companySettings.tax_name || 'IVA'}
                  disabled
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '60%', background: '#f8fafc', color: 'var(--text-muted)' }}
                  value={`${((companySettings.tax_rate || 0) * 100).toFixed(0)}% (Fijado por Regla de País)`}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 2: MONEDA Y TASAS DE CAMBIO */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-cyan)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} />
            Moneda Base y Fijación Cambiaria (Multidivisa)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Toggle de Precios en USD */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.1)', borderRadius: '12px', padding: '16px' }}>
              <input
                id="use-usd-pricing-checkbox"
                type="checkbox"
                checked={companySettings.use_usd_pricing || false}
                onChange={async (e) => {
                  const res = await updateCompanySettings({ use_usd_pricing: e.target.checked });
                  if (res.error) alert(res.error);
                }}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--color-cyan)', cursor: 'pointer' }}
              />
              <div>
                <label htmlFor="use-usd-pricing-checkbox" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Fijar Precios de Venta en Dólares (USD)
                </label>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                  Activa esta casilla para registrar precios base en USD (recomendado para Venezuela) y multiplicarlos dinámicamente al tipo de cambio para pagos en moneda local.
                </p>
              </div>
            </div>

            {/* Configuración de Tasa de Cambio */}
            {companySettings.use_usd_pricing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Origen de la Tasa de Cambio</label>
                    <select
                      className="form-input"
                      value={companySettings.exchange_rate_source || 'manual'}
                      onChange={async (e) => {
                        const source = e.target.value;
                        const res = await updateCompanySettings({ exchange_rate_source: source });
                        if (res.error) alert(res.error);
                        if (source !== 'manual') {
                          await syncExchangeRate();
                        }
                      }}
                    >
                      <option value="manual">Manual (Ajuste Personalizado)</option>
                      <option value="bcv">Banco Central de Venezuela — USD (BCV Oficial)</option>
                      <option value="euro">Banco Central de Venezuela — EUR (Euro BCV)</option>
                      <option value="paralelo">Dólar Paralelo (Monitor Dólar)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Tasa de Cambio ({companySettings.currency_code || 'VES'}/USD)
                      {companySettings.exchange_rate_source !== 'manual' && (
                        <button 
                          type="button"
                          onClick={async () => {
                            const res = await syncExchangeRate();
                            if (res.error) alert(res.error);
                            else alert(`Tasa de cambio sincronizada con éxito: ${res.rate} VES/USD\n\nFuente Oficial: ${companySettings.exchange_rate_source === 'bcv' ? 'https://ve.dolarapi.com/v1/dolares/oficial' : 'https://ve.dolarapi.com/v1/dolares/paralelo'}`);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontWeight: 700 }}
                        >
                          <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                          Sincronizar Ahora
                        </button>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      value={companySettings.exchange_rate || 1.0}
                      onChange={async (e) => {
                        const rate = Number(e.target.value);
                        if (rate > 0) {
                          await updateCompanySettings({ exchange_rate: rate });
                        }
                      }}
                      placeholder="Ej: 748.7864"
                    />
                  </div>
                </div>

                {/* Enlace transparente directo a la fuente oficial cambiaria */}
                {companySettings.exchange_rate_source !== 'manual' && (
                  <div style={{
                    fontSize: '11px',
                    color: '#64748b',
                    background: 'rgba(6, 182, 212, 0.04)',
                    border: '1px solid rgba(6, 182, 212, 0.15)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}>
                    <span>
                      🌐 <strong>Fuente Oficial Sincronizada:</strong> {companySettings.exchange_rate_source === 'bcv' ? 'Banco Central de Venezuela (API DolarApi)' : 'Monitor Dólar Paralelo'}
                    </span>
                    <a 
                      href={companySettings.exchange_rate_source === 'bcv' ? 'https://ve.dolarapi.com/v1/dolares/oficial' : 'https://ve.dolarapi.com/v1/dolares/paralelo'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#00d2ff', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      Verificar JSON en vivo ↗
                    </a>
                  </div>
                )}

                {/* ── PANEL BCV OFICIAL: 3 TASAS EN TIEMPO REAL ── */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    {/* Logo BCV */}
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '10px', flexShrink: 0 }}>
                      <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>BANCO CENTRAL</div>
                      <div style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>DE VENEZUELA</div>
                    </div>

                    {/* Tasa USD BCV */}
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)', paddingRight: '14px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>🇺🇸 USD · BCV OFICIAL</div>
                      <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--color-cyan)', fontFamily: 'monospace' }}>
                        {bcvRate > 0 ? `Bs. ${bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}` : <span style={{ color: '#475569' }}>Cargando…</span>}
                      </div>
                    </div>

                    {/* Tasa EUR BCV */}
                    <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)', paddingRight: '14px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>🇪🇺 EUR · BCV OFICIAL</div>
                      <div style={{ fontSize: '17px', fontWeight: 900, color: '#a78bfa', fontFamily: 'monospace' }}>
                        {euroRate > 0 ? `Bs. ${euroRate.toLocaleString('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}` : <span style={{ color: '#475569' }}>Cargando…</span>}
                      </div>
                    </div>

                    {/* Tasa Paralelo */}
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>🇺🇸 USD · PARALELO</div>
                      <div style={{ fontSize: '17px', fontWeight: 900, color: '#f472b6', fontFamily: 'monospace' }}>
                        {paraleloRate > 0 ? `Bs. ${paraleloRate.toLocaleString('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}` : <span style={{ color: '#475569' }}>Cargando…</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: bcvLastUpdated === new Date().toISOString().split('T')[0] ? '#10b981' : '#f59e0b' }}>
                      {bcvLastUpdated === new Date().toISOString().split('T')[0]
                        ? '✅ Actualizado hoy'
                        : bcvLastUpdated ? `⏳ Últ: ${bcvLastUpdated}` : '⏳ Sincronizando...'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>
                      <a href="https://ve.dolarapi.com/v1/cotizaciones" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-cyan)', textDecoration: 'underline' }}>ve.dolarapi.com ↗</a>
                    </div>
                    <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                      Ref: <a href="https://www.bcv.org.ve" target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', textDecoration: 'underline' }}>bcv.org.ve ↗</a>
                    </div>
                  </div>
                </div>

                {/* Gráfica de Tendencia Diaria de la Moneda respecto al Dólar */}
                <ExchangeRateChart
                  currencyCode={companySettings.currency_code || 'VES'}
                  currentRate={companySettings.exchange_rate || 1.0}
                  bcvRate={bcvRate}
                  paraleloRate={paraleloRate}
                  rateHistory={rateHistory}
                  onSync={async (customRate) => {
                    if (typeof customRate === 'number' && customRate > 0) {
                      await updateCompanySettings({ exchange_rate: customRate });
                    } else if (companySettings.exchange_rate_source !== 'manual') {
                      const res = await syncExchangeRate();
                      if (res.error) alert(res.error);
                    }
                  }}
                  loading={loading}
                  companySettings={companySettings}
                />
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: HORARIOS COMERCIALES */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-cyan)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} />
            Horarios Comerciales
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Hora de Apertura</label>
              <input
                type="time"
                className="form-input"
                value={companySettings.opening_time || '09:00'}
                onChange={async (e) => {
                  const res = await updateCompanySettings({ opening_time: e.target.value });
                  if (res.error) alert(res.error);
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hora de Cierre</label>
              <input
                type="time"
                className="form-input"
                value={companySettings.closing_time || '20:00'}
                onChange={async (e) => {
                  const res = await updateCompanySettings({ closing_time: e.target.value });
                  if (res.error) alert(res.error);
                }}
              />
            </div>
          </div>
        </div>

        {/* PANEL 3.5: GESTIÓN DE MÓDULOS & PERMISOS DE USUARIOS (SOLO ADMINS) */}
        <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} />
              Gestión de Módulos & Permisos de Usuarios
            </h3>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '3px 10px', borderRadius: '99px', border: '1px solid #bae6fd' }}>
              Configurable por Administrador
            </span>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px', marginTop: 0 }}>
            Activa o desactiva qué módulos están habilitados en el sistema y visibles para las cuentas de <strong>Cajeros / Usuarios</strong>. Los Administradores conservan acceso a los módulos de control.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {[
              { key: 'dashboard', label: '📊 Resumen del Negocio', desc: 'KPIs de ventas y métricas clave' },
              { key: 'pos', label: '🛒 Punto de Venta (POS)', desc: 'Terminal de cobro y boletas' },
              { key: 'tables', label: '🍽️ Mesas & Comandero', desc: 'Control de comandas de restaurante' },
              { key: 'inventory', label: '📦 Gestión de Inventario', desc: 'Control de productos y stock' },
              { key: 'finances', label: '⚖️ Finanzas & Equilibrio', desc: 'Punto de equilibrio y OPEX (Admin)' },
              { key: 'branches', label: '🏢 Control de Sucursales', desc: 'Resumen de sucursales y breakeven por sede' },
              { key: 'history', label: '📜 Historial de Ventas', desc: 'Consulta e impresión de transacciones' },
              { key: 'showcase', label: '📱 Vitrina Cliente QR', desc: 'Catálogo digital interactivo' },
            ].map(mod => {
              const userMods = companySettings.user_modules || {
                dashboard: true, pos: true, tables: true, inventory: true, finances: false, owner: false, history: true, showcase: true
              };
              const isChecked = userMods[mod.key] !== false;

              return (
                <div key={mod.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: isChecked ? 'rgba(6,182,212,0.04)' : '#f8fafc', border: isChecked ? '1px solid rgba(6,182,212,0.3)' : '1px solid #cbd5e1', borderRadius: '12px', padding: '12px 14px' }}>
                  <input
                    type="checkbox"
                    id={`mod-check-${mod.key}`}
                    checked={isChecked}
                    onChange={async (e) => {
                      const updatedMods = { ...userMods, [mod.key]: e.target.checked };
                      const res = await updateCompanySettings({ user_modules: updatedMods });
                      if (res.error) alert(res.error);
                    }}
                    style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#06b6d4', cursor: 'pointer' }}
                  />
                  <div>
                    <label htmlFor={`mod-check-${mod.key}`} style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', cursor: 'pointer', display: 'block' }}>
                      {mod.label}
                    </label>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      {mod.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL 4: PERFIL DE USUARIO Y SEGURIDAD */}
        <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-cyan)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} />
            Perfil de Usuario & Seguridad
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'rgba(6, 182, 212, 0.04)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>Credenciales de Acceso y Nombre</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Modifica tu nombre visible o actualiza tu contraseña de acceso a Punto Nexus.</div>
            </div>
            {onOpenProfileModal && (
              <button 
                type="button"
                className="btn btn-primary"
                onClick={onOpenProfileModal}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                <ShieldCheck size={16} />
                <span>Cambiar Contraseña / Editar Perfil</span>
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
