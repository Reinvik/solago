import React, { useState, useEffect, useMemo } from 'react';
import { usePuntoNexus } from './context/PuntoNexusContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import SalesHistory from './components/SalesHistory';
import Showcase from './components/Showcase';
import NexusOwner from './components/NexusOwner';
import Settings from './components/Settings';
import UserProfileModal from './components/UserProfileModal';
import TablesModule from './components/TablesModule';
import FinanceModule from './components/FinanceModule';
import BranchesControl from './components/BranchesControl';
import { ChefHat, BellRing, LayoutDashboard, ShoppingCart, Package, History, LogOut, User, AlertTriangle, Eye, Shield, Settings as SettingsIcon, RefreshCw, Camera, ShieldCheck, Utensils, Building2, ChevronDown, Check, Plus, MapPin, GitBranch, X, Scale, Menu, ChevronLeft, ChevronRight } from 'lucide-react';

function AppContent() {
  const { user, companyName, logout, lowStockCount, kitchenAlertInfo, kitchenReadyInfo, companySettings, syncExchangeRate, loading, branches = [], activeBranchId, activeBranch = {}, addBranch, switchBranch, bcvRate, euroRate, paraleloRate } = usePuntoNexus();
  const VALID_TABS = useMemo(() => [
    'dashboard', 'pos', 'tables', 'inventory', 'finances', 'branches', 'history', 'showcase', 'owner', 'settings'
  ], []);

  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab') || params.get('m') || window.location.hash.replace('#', '');
      if (urlTab && ['dashboard', 'pos', 'tables', 'inventory', 'finances', 'branches', 'history', 'showcase', 'owner', 'settings'].includes(urlTab)) {
        return urlTab;
      }
    }
    const saved = localStorage.getItem('punto_nexus_active_tab');
    if (saved && ['dashboard', 'pos', 'tables', 'inventory', 'finances', 'branches', 'history', 'showcase', 'owner', 'settings'].includes(saved)) {
      return saved;
    }
    return 'dashboard';
  });

  const setActiveTab = (tab) => {
    if (!tab) return;
    setActiveTabState(tab);
    localStorage.setItem('punto_nexus_active_tab', tab);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [posCartPreload, setPosCartPreload] = useState(null);
  const [overrideCustomerMenu, setOverrideCustomerMenu] = useState(false);
  const [menuCollapsed, setMenuCollapsed] = useState(true); // por defecto contraído en móviles

  const isAdmin = !user?.role || user?.role === 'admin' || user?.role === 'Administrador' || user?.role === 'nexusowner' || user?.role === 'owner';
  const hasBranches = Array.isArray(branches) && branches.length > 0;

  const isModuleVisible = (moduleKey) => {
    if (!user) return true;

    // 1. Módulos otorgados a nivel de Tienda / Cliente por Nexus Owner
    const enabledMods = companySettings?.enabled_modules;
    if (Array.isArray(enabledMods) && enabledMods.length > 0) {
      if (!enabledMods.includes(moduleKey) && moduleKey !== 'owner' && moduleKey !== 'settings') {
        return false;
      }
    }

    // 2. Permisos a nivel de Rol de Usuario
    const role = (user.role || 'admin').toLowerCase();
    if (['admin', 'administrador', 'nexusowner', 'owner', 'gerente'].includes(role)) return true;
    const userMods = companySettings?.user_modules || {};
    return userMods[moduleKey] !== false;
  };

  // Estados de control de sucursales
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchForm, setNewBranchForm] = useState({
    name: '', address: '', phone: '', manager: ''
  });

  const handleCreateBranchSubmit = async (e) => {
    e.preventDefault();
    if (!newBranchForm.name.trim()) return;

    await addBranch(newBranchForm);
    setShowAddBranchModal(false);
    setNewBranchForm({ name: '', address: '', phone: '', manager: '' });
    alert(`✅ Sucursal "${newBranchForm.name}" creada e integrada correctamente.`);
  };

  // Detectar si la URL fue abierta mediante un escáner de QR o link directo de cliente
  const isCustomerMenuUrl = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (
      params.has('mesa') || 
      params.has('table') || 
      params.has('m') || 
      params.has('mode') || 
      params.get('view') === 'showcase' || 
      params.get('menu') === 'true'
    );
  }, []);

  // Actualización dinámica del favicon e ícono del navegador con el logo de la empresa
  useEffect(() => {
    if (companySettings?.logo_url) {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = companySettings.logo_url;
    }
    if (companyName) {
      document.title = `${companyName} - SoLago`;
    }
  }, [companySettings?.logo_url, companyName]);

  // Si se detectó URL de menú cliente QR y el usuario no ha forzado volver al admin:
  if (isCustomerMenuUrl && !overrideCustomerMenu) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '16px 12px' }}>
        {user && (
          <div style={{ maxWidth: '880px', margin: '0 auto 16px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '10px 18px', borderRadius: '14px', color: '#ffffff', boxShadow: '0 4px 14px rgba(15,23,42,0.15)' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
              📱 VISTA DE CLIENTE QR ACTIVA ({user.name})
            </span>
            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, document.title, window.location.pathname);
                setOverrideCustomerMenu(true);
              }}
              style={{ background: 'rgba(6, 182, 212, 0.2)', border: '1px solid #06b6d4', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
            >
              ⚙️ VOLVER AL PANEL ADMIN
            </button>
          </div>
        )}
        <Showcase isPublicView={true} />
      </div>
    );
  }

  // Si no está autenticado y es navegación normal, renderizar Login
  if (!user) {
    return <Login />;
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Resumen del Negocio';
      case 'pos': return 'Terminal de Ventas (POS)';
      case 'tables': return 'Mesas & Comandero de Restaurante';
      case 'inventory': return 'Gestión de Inventario';
      case 'finances': return 'Módulo de Finanzas & Equilibrio';
      case 'branches': return 'Control & Avance de Sucursales';
      case 'history': return 'Historial de Transacciones';
      case 'showcase': return 'Módulo de Vitrina Cliente';
      case 'owner': return 'Panel de Nexus Owner (Super Admin)';
      case 'settings': return 'Configuración del Negocio';
      default: return 'SoLago';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Visualiza tus ganancias y control de stock en tiempo real.';
      case 'tables': return 'Administra comensales, comanda órdenes y liquida cuentas de mesas.';
      case 'pos': return 'Cobra a tus clientes y descuenta stock del inventario al instante.';
      case 'inventory': return 'Administra tus insumos, ajusta precios y registra compras.';
      case 'finances': return 'Punto de equilibrio, simulación de metas y control de egresos operativos (OPEX).';
      case 'branches': return 'Monitoreo consolidado de ventas, avance del breakeven e indicadores por sede.';
      case 'history': return 'Audita boletas, facturas y analiza márgenes de ganancia.';
      case 'showcase': return 'Simulador de la pantalla que ven los clientes en su celular para armar canastas.';
      case 'owner': return 'Gestión de tiendas globales y credenciales del ecosistema.';
      case 'settings': return 'Establece impuestos, tipo de cambio regional y permisos de módulos.';
      default: return '';
    }
  };

  return (
    <div className={`app-container ${menuCollapsed ? 'sidebar-collapsed' : ''}`}>
      
      {/* Botón Flotante para Pantallas Portátiles / Desktop (Collapse Sidebar) */}
      <button 
        className="sidebar-toggle-floating"
        onClick={() => setMenuCollapsed(prev => !prev)}
        title={menuCollapsed ? "Expandir Menú" : "Contraer Menú"}
      >
        {menuCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>

      {/* Backdrop para cerrar el menú flotante a pantalla completa en móviles */}
      {!menuCollapsed && (
        <div className="mobile-menu-backdrop" onClick={() => setMenuCollapsed(true)} />
      )}

      {/* Barra Lateral Navegación (Sidebar) */}
      <aside className={`sidebar ${menuCollapsed ? 'collapsed' : ''}`}>
        
        {/* Botón de cierre para móviles */}
        <button className="mobile-close-menu-btn" onClick={() => setMenuCollapsed(true)}>
          <X size={20} />
        </button>

        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ width: '48px', height: '48px', flexShrink: 0, overflow: 'hidden', background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <img 
              src={companySettings?.logo_url || '/logo.png'} 
              alt={companyName || 'SoLago'} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>

          <div className="sidebar-logo-text-wrapper" style={{ minWidth: 0, overflow: 'hidden' }}>
            <span 
              className="sidebar-logo-text" 
              style={{ 
                fontSize: (companyName && companyName.length > 14) ? '15px' : '18px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block'
              }}
              title={companyName || 'SoLago'}
            >
              {companyName || 'SoLago'}
            </span>
            <span className="sidebar-logo-subtext" style={{ fontSize: '9px', fontWeight: 800, color: 'var(--color-cyan)', letterSpacing: '0.08em' }}>
              {activeBranch?.name || (branches.length > 1 ? `${branches.length} SUCURSALES` : 'CASA MATRIZ')}
            </span>
          </div>
        </div>

        <div className="sidebar-menu-category">MENU PRINCIPAL</div>

        <nav className="sidebar-menu">
          {isModuleVisible('dashboard') && (
            <a 
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); if(window.innerWidth <= 768) setMenuCollapsed(true); }}
              title="Resumen"
              data-title="Resumen"
            >
              <LayoutDashboard size={24} />
              <span>Resumen</span>
            </a>
          )}

          {isModuleVisible('pos') && (
            <a 
              className={`sidebar-item ${activeTab === 'pos' ? 'active' : ''}`}
              onClick={() => { setActiveTab('pos'); if(window.innerWidth <= 768) setMenuCollapsed(true); }}
              title="Punto de Venta"
              data-title="Punto de Venta"
            >
              <ShoppingCart size={24} />
              <span>Punto de Venta</span>
            </a>
          )}

          {isModuleVisible('tables') && (!companySettings?.business_type || companySettings?.business_type === 'gastronomia') && (
            <a 
              className={`sidebar-item ${activeTab === 'tables' ? 'active' : ''}`}
              onClick={() => { setActiveTab('tables'); if(window.innerWidth <= 768) setMenuCollapsed(true); }}
              title="Mesas & Comandero"
              data-title="Mesas & Comandero"
            >
              <Utensils size={24} />
              <span>Mesas & Comandero</span>
            </a>
          )}

          {isModuleVisible('inventory') && (
            <a 
              className={`sidebar-item ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => { setActiveTab('inventory'); if(window.innerWidth <= 768) setMenuCollapsed(true); }}
              title="Inventario"
              data-title="Inventario"
            >
              <Package size={24} />
              <span>Inventario</span>
              {lowStockCount > 0 && (
                <span className="sidebar-item-badge">{lowStockCount}</span>
              )}
            </a>
          )}

          {isModuleVisible('finances') && (
            <a 
              className={`sidebar-item ${activeTab === 'finances' ? 'active' : ''}`}
              onClick={() => { setActiveTab('finances'); if(window.innerWidth <= 768) setMenuCollapsed(true); }}
              title="Finanzas & Equilibrio"
              data-title="Finanzas & Equilibrio"
            >
              <Scale size={24} />
              <span>Finanzas & Equilibrio</span>
            </a>
          )}

          {isModuleVisible('branches') && (hasBranches || isAdmin) && (
            <a 
              className={`sidebar-item ${activeTab === 'branches' ? 'active' : ''}`}
              onClick={() => { setActiveTab('branches'); if(window.innerWidth <= 768) setMenuCollapsed(true); }}
              style={{ color: 'var(--color-cyan)' }}
              title="Control de Sucursales"
              data-title="Control de Sucursales"
            >
              <Building2 size={24} />
              <span>Control de Sucursales</span>
            </a>
          )}

          {user?.role === 'nexusowner' && (
            <a 
              className={`sidebar-item ${activeTab === 'owner' ? 'active' : ''}`}
              onClick={() => { setActiveTab('owner'); if(window.innerWidth <= 768) setMenuCollapsed(true); }}
              style={{ borderTop: '1px dashed rgba(6, 182, 212, 0.2)', marginTop: '8px', paddingTop: '12px', color: '#f59e0b' }}
              title="Panel Nexus Owner (Super Admin)"
              data-title="Panel Nexus Owner"
            >
              <Shield size={24} />
              <span>Panel Nexus Owner</span>
            </a>
          )}

          {isModuleVisible('showcase') && (
            <a 
              className={`sidebar-item ${activeTab === 'showcase' ? 'active' : ''}`}
              onClick={() => { setActiveTab('showcase'); if(window.innerWidth <= 768) setMenuCollapsed(true); }}
              style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', marginTop: '8px', paddingTop: '12px' }}
              title="Vitrina Cliente"
              data-title="Vitrina Cliente"
            >
              <Eye size={24} />
              <span>Vitrina Cliente</span>
            </a>
          )}
        </nav>

        {/* Footer Sidebar - Usuario Activo estilo Nexus Lean */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar-wrapper" onClick={() => setIsProfileModalOpen(true)} style={{ cursor: 'pointer' }} title="Editar Perfil y Seguridad">
              <div className="user-avatar-circle">
                <User size={22} />
              </div>
              <div className="user-avatar-camera">
                <Camera size={11} />
              </div>
            </div>
            <div className="user-details">
              <span className="user-name">{user.name || 'Admin'}</span>
              <span className="user-role-badge">
                {user.role === 'nexusowner' ? 'Super Admin' : 'Administrador'}
              </span>
            </div>
          </div>
          <button 
            className={`btn-change-profile ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('settings'); if(window.innerWidth <= 768) setMenuCollapsed(true); }}
            title="Ir a Configuración General y de Sucursales"
          >
            <SettingsIcon size={24} />
            <span>CONFIGURACIÓN</span>
          </button>
          <div className="sidebar-footer-buttons">
            <button className="btn-sidebar-action btn-sidebar-restart" onClick={() => window.location.reload()}>
              <RefreshCw size={12} className="restart-icon" />
              REINICIAR
            </button>
            <button className="btn-sidebar-action btn-sidebar-logout" onClick={logout}>
              <LogOut size={12} />
              SALIR
            </button>
          </div>
        </div>
      </aside>

      {/* Panel de Contenido Principal (Derecha) */}
      <main className="main-content">
        
        {/* Cabecera */}
        <header className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Botón de Menú Hamburguesa para Móviles */}
            <button 
              className="mobile-menu-toggle-btn"
              onClick={() => setMenuCollapsed(false)}
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="page-title">{getPageTitle()}</h1>
              <p className="page-subtitle">{getPageSubtitle()}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Selector o Indicador de Sucursal Asignada */}
            <div style={{ position: 'relative' }}>
              {!isAdmin ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 14px',
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: 'var(--color-cyan)'
                  }}
                  title="Sucursal asignada fijada por la administración para tu usuario"
                >
                  <Building2 size={15} />
                  <span>{activeBranch.name || 'Sucursal Asignada'}</span>
                  <span style={{
                    fontSize: '9.5px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 900
                  }}>
                    🔒 ASIGNADA
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBranchDropdown(prev => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 14px',
                    background: activeBranch.is_main ? 'rgba(16, 185, 129, 0.08)' : 'rgba(6, 182, 212, 0.08)',
                    border: activeBranch.is_main ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: activeBranch.is_main ? '#059669' : 'var(--color-cyan)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Cambiar Sucursal o Casa Matriz"
                >
                  <Building2 size={15} />
                  <span>{activeBranch.name || 'Matriz Principal'}</span>
                  <span style={{
                    fontSize: '9.5px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: activeBranch.is_main ? '#10b981' : '#06b6d4',
                    color: '#ffffff',
                    fontWeight: 900
                  }}>
                    {activeBranch.is_main ? 'MATRIZ' : 'SUCURSAL'}
                  </span>
                  <ChevronDown size={14} />
                </button>
              )}

              {showBranchDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  width: '260px',
                  background: '#ffffff',
                  borderRadius: '14px',
                  boxShadow: '0 10px 25px rgba(15,23,42,0.15)',
                  border: '1px solid #e2e8f0',
                  padding: '8px',
                  zIndex: 9999
                }}>
                  <div style={{ padding: '6px 10px', fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sucursales Ancladas ({branches.length})
                  </div>
                  {branches.map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        switchBranch(b.id);
                        setShowBranchDropdown(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: b.id === activeBranchId ? 'rgba(6,182,212,0.08)' : 'transparent',
                        color: b.id === activeBranchId ? 'var(--color-cyan)' : '#0f172a',
                        fontWeight: b.id === activeBranchId ? 800 : 600,
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={14} />
                        <div>
                          <div>{b.name}</div>
                          {b.address && <div style={{ fontSize: '10px', color: '#64748b' }}>{b.address}</div>}
                        </div>
                      </div>
                      {b.is_main ? (
                        <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: '#10b981', color: '#fff', fontWeight: 800 }}>MATRIZ</span>
                      ) : b.id === activeBranchId ? (
                        <Check size={14} style={{ color: 'var(--color-cyan)' }} />
                      ) : null}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setShowBranchDropdown(false);
                      setShowAddBranchModal(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginTop: '4px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      borderRadius: '8px',
                      background: 'rgba(6, 182, 212, 0.08)',
                      border: '1px dashed rgba(6, 182, 212, 0.3)',
                      color: 'var(--color-cyan)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={14} />
                    <span>+ AGREGAR SUCURSAL</span>
                  </button>
                </div>
              )}
            </div>

            {companySettings?.use_usd_pricing && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.04) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: '99px',
                fontSize: '11px',
                fontWeight: '800',
                color: '#0f172a',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
              }}>
                {/* Dólar BCV Oficial */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title="Dólar Oficial BCV (USD)">
                  <span style={{ color: '#0284c7', fontWeight: 900 }}>🏛️ BCV:</span>
                  <span style={{ color: '#0f172a', fontWeight: 900 }}>
                    {bcvRate > 0 ? bcvRate.toFixed(2) : (companySettings.exchange_rate ? Number(companySettings.exchange_rate).toFixed(2) : '---')}
                  </span>
                </div>

                <span style={{ color: '#cbd5e1', fontWeight: 400 }}>|</span>

                {/* Euro BCV Oficial */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title="Euro Oficial BCV (EUR)">
                  <span style={{ color: '#059669', fontWeight: 900 }}>💶 EUR:</span>
                  <span style={{ color: '#0f172a', fontWeight: 900 }}>
                    {euroRate > 0 ? euroRate.toFixed(2) : '---'}
                  </span>
                </div>

                <span style={{ color: '#cbd5e1', fontWeight: 400 }}>|</span>

                {/* Dólar Paralelo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title="Dólar Paralelo (Monitor Dólar)">
                  <span style={{ color: '#9333ea', fontWeight: 900 }}>📈 PAR:</span>
                  <span style={{ color: '#0f172a', fontWeight: 900 }}>
                    {paraleloRate > 0 ? paraleloRate.toFixed(2) : '---'}
                  </span>
                </div>

                {/* Botón Sincronizar en Vivo */}
                <button
                  type="button"
                  onClick={async () => {
                    const res = await syncExchangeRate();
                    if (res.error) alert(res.error);
                    else alert(`✅ Tasas actualizadas en vivo:\n• Dólar BCV: ${res.bcvRate || res.rate} VES\n• Euro BCV: ${res.euroRate} VES\n• Dólar Paralelo: ${res.paraleloRate} VES`);
                  }}
                  style={{
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: 'none',
                    color: 'var(--color-cyan)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    padding: 0,
                    marginLeft: '2px',
                    transition: 'all 0.2s ease'
                  }}
                  title="Sincronizar Tasas en Vivo (BCV, EUR y Paralelo)"
                >
                  <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Banner de aviso de Cocina ("Alerta de Cocina - Mayor Atraso") */}
        {kitchenAlertInfo?.hasAlert && activeTab !== 'tables' && (
          <div 
            className={`alert-banner ${kitchenAlertInfo.maxDelayMins >= 15 ? 'red-glow' : 'amber-glow'}`}
            style={{
              background: kitchenAlertInfo.maxDelayMins >= 15 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: kitchenAlertInfo.maxDelayMins >= 15 ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
              color: kitchenAlertInfo.maxDelayMins >= 15 ? '#dc2626' : '#b45309'
            }}
          >
            <ChefHat size={18} style={{ color: kitchenAlertInfo.maxDelayMins >= 15 ? '#dc2626' : '#d97706' }} />
            <span>
              <strong>¡Alerta de Cocina ({activeBranch?.name || 'Sucursal'})!</strong> Tienes {kitchenAlertInfo.pendingItemsCount} {kitchenAlertInfo.pendingItemsCount === 1 ? 'comanda pendiente' : 'comandas pendientes'} en cocina.
              {kitchenAlertInfo.oldestTable && (
                <>
                  {' '}Comanda de <strong>{kitchenAlertInfo.oldestTable.name}</strong> ({kitchenAlertInfo.oldestItem?.name || 'Pedido'}) lleva <strong>{kitchenAlertInfo.maxDelayMins} min sin atender</strong> (Mayor Atraso).
                </>
              )}
            </span>
            <button 
              className="alert-banner-btn" 
              onClick={() => setActiveTab('tables')}
              style={{
                background: kitchenAlertInfo.maxDelayMins >= 15 ? '#dc2626' : '#d97706',
                color: '#ffffff'
              }}
            >
              Ver Cocina
            </button>
          </div>
        )}
        {/* Banner de aviso de Platillos Listos para Servir (Verde Emerald Glow) */}
        {kitchenReadyInfo?.hasReadyAlert && activeTab !== 'tables' && (
          <div 
            className="alert-banner emerald-glow"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              color: '#047857',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)'
            }}
          >
            <BellRing size={18} style={{ color: '#10b981' }} />
            <span>
              <strong>🛎️ ¡Platillos Listos para Servir ({activeBranch?.name || 'Sucursal'})!</strong> Tienes {kitchenReadyInfo.readyItemsCount} {kitchenReadyInfo.readyItemsCount === 1 ? 'platillo listo' : 'platillos listos'} en cocina esperando ser entregados a la mesa.
              {kitchenReadyInfo.oldestReadyTable && (
                <>
                  {' '}Pedido de <strong>{kitchenReadyInfo.oldestReadyTable.name}</strong> ({kitchenReadyInfo.oldestReadyItem?.name || 'Platillo'}) lleva <strong>{kitchenReadyInfo.maxReadyDelayMins} min listo</strong> sin entregar.
                </>
              )}
            </span>
            <button 
              className="alert-banner-btn" 
              onClick={() => setActiveTab('tables')}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              🛎️ Servir / Ver Mesas
            </button>
          </div>
        )}

        {/* Banner de aviso de inventario bajo ("SoLago Alert") */}
        {lowStockCount > 0 && activeTab !== 'inventory' && (
          <div className="alert-banner amber-glow">
            <AlertTriangle size={18} />
            <span>
              <strong>¡Alerta de Inventario ({activeBranch?.name || 'Sucursal'})!</strong> Tienes {lowStockCount} {lowStockCount === 1 ? 'producto con' : 'productos con'} stock crítico por debajo del límite mínimo configurado.
            </span>
            <button className="alert-banner-btn" onClick={() => setActiveTab('inventory')}>
              Ver Inventario
            </button>
          </div>
        )}

        {/* Cuerpo / Vistas */}
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'pos' && <POS setActiveTab={setActiveTab} initialCart={posCartPreload} clearInitialCart={() => setPosCartPreload(null)} />}
        {activeTab === 'tables' && <TablesModule setActiveTab={setActiveTab} setPosCart={(cart) => setPosCartPreload(cart)} />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'finances' && <FinanceModule />}
        {activeTab === 'branches' && <BranchesControl setActiveTab={setActiveTab} />}
        {activeTab === 'history' && <Dashboard setActiveTab={setActiveTab} initialSubTab="history" />}
        {activeTab === 'showcase' && <Showcase />}
        {activeTab === 'owner' && <NexusOwner />}
        {activeTab === 'settings' && <Settings onOpenProfileModal={() => setIsProfileModalOpen(true)} />}

      </main>

      {/* Modal de Perfil y Cambio de Contraseña */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      {/* Modal para Crear y Registrar Nueva Sucursal */}
      {showAddBranchModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '460px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div className="modal-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={22} style={{ color: 'var(--color-cyan)' }} />
                <h3 className="modal-title" style={{ fontSize: '18px', fontWeight: 900 }}>Agregar Nueva Sucursal</h3>
              </div>
              <button className="modal-close" onClick={() => setShowAddBranchModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBranchSubmit}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Nombre de la Sucursal / Sede *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Nexus Minimarket, Sucursal Centro, Sede Norte"
                  value={newBranchForm.name}
                  onChange={(e) => setNewBranchForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Giro Comercial de esta Sucursal *</label>
                <select
                  className="form-input"
                  value={newBranchForm.business_type || 'alimentos'}
                  onChange={(e) => setNewBranchForm(prev => ({ ...prev, business_type: e.target.value }))}
                >
                  <option value="alimentos">🛒 Alimentos (Minimarket / Bodega / Abasto)</option>
                  <option value="gastronomia">🍔 Gastronomía (Restaurante / Comida Rápida)</option>
                  <option value="boutique">🛍️ Boutique / Tienda de Moda</option>
                  <option value="servicios">👤 Servicios / Consultoría</option>
                  <option value="electronica">📱 Electrónica / Accesorios</option>
                  <option value="repuestos">🚚 Repuestos / Autopartes</option>
                  <option value="ferreteria">🔧 Ferretería / Construcción</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Dirección / Ubicación</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Av. Brasil 450, Local 12"
                  value={newBranchForm.address}
                  onChange={(e) => setNewBranchForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Teléfono de Contacto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: +56 9 8765 4321"
                  value={newBranchForm.phone}
                  onChange={(e) => setNewBranchForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Administrador / Encargado de Sede</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Carlos Ramírez"
                  value={newBranchForm.manager}
                  onChange={(e) => setNewBranchForm(prev => ({ ...prev, manager: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddBranchModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} />
                  <span>Crear Sucursal Anclada</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <React.StrictMode>
      {/* El proveedor se envuelve directamente aquí */}
      <AppContent />
    </React.StrictMode>
  );
}
