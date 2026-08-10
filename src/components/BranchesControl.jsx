import React, { useState, useMemo } from 'react';
import { usePuntoNexus } from '../context/PuntoNexusContext';
import DualCurrencyDisplay from './DualCurrencyDisplay';
import { 
  Building2, PlusCircle, TrendingUp, Award, DollarSign, Package, User, MapPin, 
  CheckCircle, AlertTriangle, Scale, ArrowRight, Store, RefreshCw, BarChart3, 
  Users, Check, Edit3, ShieldCheck, Globe, Lock, Search, UserPlus, Filter, 
  CheckSquare, Square, X, ChevronRight, KeyRound, Trash2
} from 'lucide-react';

export default function BranchesControl({ setActiveTab }) {
  const { 
    companyName, 
    branches = [], 
    activeBranchId, 
    switchBranch, 
    addBranch, 
    updateBranch,
    deleteBranch,
    sales = [],
    allSales = [], 
    inventory = [],
    companySettings = {},
    updateCompanySettings, 
    formatCurrency,
    fixedCosts = {},
    systemUsers = [],
    updateUserBranchAccess,
    addSystemUser,
    createCompany,
    createAccount,
    selectCompany,
    user
  } = usePuntoNexus();

  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'users'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModalBranch, setEditModalBranch] = useState(null);
  const [deleteModalBranch, setDeleteModalBranch] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [creating, setCreating] = useState(false);

  // Estados para Creación de Tienda Matriz & Administrador
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyGiro, setNewCompanyGiro] = useState('alimentos');
  const [adminMode, setAdminMode] = useState('new');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [createdModalData, setCreatedModalData] = useState(null);
  const [creatingCompany, setCreatingCompany] = useState(false);

  // Estados para Clave de Anulación de Facturas
  const [showAnnulPassModal, setShowAnnulPassModal] = useState(false);
  const [newCancellationPass, setNewCancellationPass] = useState('');
  const [confirmCancellationPass, setConfirmCancellationPass] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  // Estados para pestaña de usuarios
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userBranchFilter, setUserBranchFilter] = useState('all');
  const [editingUserAccess, setEditingUserAccess] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Estados temporales del modal de edición de usuario
  const [editFormBranchId, setEditFormBranchId] = useState('branch-matriz');
  const [editFormRole, setEditFormRole] = useState('Cajero');
  const [editFormAccessAll, setEditFormAccessAll] = useState(true);
  const [editFormSelectedBranches, setEditFormSelectedBranches] = useState([]);

  // Estado del modal para nuevo usuario
  const [newUserData, setNewUserData] = useState({
    full_name: '',
    email: '',
    password: 'nexus123',
    role: 'Cajero',
    branch_id: 'branch-matriz',
    accessAll: true,
    selectedBranches: []
  });

  const [newBranchData, setNewBranchData] = useState({
    name: '',
    address: '',
    phone: '',
    manager: '',
    code: ''
  });

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Abrir modal de edición de accesos de usuario
  const handleOpenEditUserAccess = (u) => {
    setEditingUserAccess(u);
    const pBranch = u.branch_id || 'branch-matriz';
    setEditFormBranchId(pBranch);
    setEditFormRole(u.role || 'Cajero');

    const allowed = u.allowed_branches || ['all'];
    const isAll = Array.isArray(allowed) ? allowed.includes('all') : true;
    setEditFormAccessAll(isAll);

    if (!isAll && Array.isArray(allowed)) {
      setEditFormSelectedBranches(allowed);
    } else {
      setEditFormSelectedBranches(branches.map(b => b.id));
    }
  };

  // Guardar cambios de permisos de usuario
  const handleSaveUserAccessSubmit = async (e) => {
    e.preventDefault();
    if (!editingUserAccess) return;

    const finalAllowed = editFormAccessAll
      ? ['all']
      : (editFormSelectedBranches.length > 0 ? editFormSelectedBranches : [editFormBranchId]);

    const res = await updateUserBranchAccess(editingUserAccess.id || editingUserAccess.email, {
      branch_id: editFormBranchId,
      allowed_branches: finalAllowed,
      role: editFormRole,
      full_name: editingUserAccess.full_name || editingUserAccess.name
    });

    if (res?.success) {
      setEditingUserAccess(null);
      alert(`✅ Permisos de sucursal para "${editingUserAccess.full_name || editingUserAccess.email}" actualizados con éxito.`);
    } else {
      alert(`⚠️ ${res?.error || 'No se pudieron actualizar los permisos del usuario.'}`);
    }
  };

  // Guardar nuevo usuario
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserData.email.trim()) return;

    const finalAllowed = newUserData.accessAll
      ? ['all']
      : (newUserData.selectedBranches.length > 0 ? newUserData.selectedBranches : [newUserData.branch_id]);

    const res = await addSystemUser({
      full_name: newUserData.full_name,
      email: newUserData.email,
      password: newUserData.password,
      role: newUserData.role,
      branch_id: newUserData.branch_id,
      allowed_branches: finalAllowed
    });

    if (res?.success) {
      setShowAddUserModal(false);
      setNewUserData({
        full_name: '',
        email: '',
        password: 'nexus123',
        role: 'Cajero',
        branch_id: 'branch-matriz',
        accessAll: true,
        selectedBranches: []
      });
      alert(`✅ Usuario "${newUserData.full_name || newUserData.email}" registrado y asignado correctamente.`);
    } else {
      alert(`⚠️ ${res?.error || 'Error al registrar usuario.'}`);
    }
  };

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    return systemUsers.filter(u => {
      const search = userSearchTerm.toLowerCase();
      const name = (u.full_name || u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const role = (u.role || '').toLowerCase();

      const matchesSearch = !search || name.includes(search) || email.includes(search) || role.includes(search);
      
      const pBranch = u.branch_id || 'branch-matriz';
      const matchesBranch = userBranchFilter === 'all' || pBranch === userBranchFilter || (u.allowed_branches && u.allowed_branches.includes(userBranchFilter));

      return matchesSearch && matchesBranch;
    });
  }, [systemUsers, userSearchTerm, userBranchFilter]);

  // Filtrar ventas válidas de TODAS las sucursales por mes y año seleccionado (excluye ventas anuladas)
  const monthSalesAll = useMemo(() => {
    const list = (allSales && allSales.length > 0) ? allSales : sales;
    return list.filter(s => {
      if (s.status === 'Anulada' || s.cancelled) return false;
      const rawDate = s.sold_at || s.created_at || s.fecha;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [allSales, sales, selectedMonth, selectedYear]);

  // Total ventas consolidadas del mes
  const totalSalesConsolidated = useMemo(() => {
    return monthSalesAll.reduce((acc, s) => acc + Number(s.total_sell || s.total || 0), 0);
  }, [monthSalesAll]);

  // Costo Fijo Base por Sucursal
  const totalFixedCostsCompany = useMemo(() => {
    return (
      Number(fixedCosts.rent || 0) +
      Number(fixedCosts.salaries || 0) +
      Number(fixedCosts.services || 0) +
      Number(fixedCosts.software || 0) +
      Number(fixedCosts.marketing || 0) +
      Number(fixedCosts.other || 0)
    );
  }, [fixedCosts]);

  // Estimado de margen promedio (%)
  const avgMarginPct = 40.0;
  const breakEvenTargetPerBranch = useMemo(() => {
    const totalBreakeven = totalFixedCostsCompany > 0 ? (totalFixedCostsCompany / (avgMarginPct / 100)) : 1000;
    const branchCount = Math.max(1, branches.length);
    return totalBreakeven / branchCount;
  }, [totalFixedCostsCompany, branches]);

  // Métricas procesadas por cada sucursal
  const branchMetricsList = useMemo(() => {
    return branches.map(b => {
      const isMain = b.is_main || b.id === 'branch-matriz';
      
      const bSales = monthSalesAll.filter(s => {
        const sBranch = s.branch_id || s.branchId || 'branch-matriz';
        if (isMain) return !s.branch_id || sBranch === b.id || sBranch === 'branch-matriz';
        return sBranch === b.id;
      });

      const totalSales = bSales.reduce((acc, s) => acc + Number(s.total_sell || s.total || 0), 0);
      const salesCount = bSales.length;
      const avgTicket = salesCount > 0 ? totalSales / salesCount : 0;
      const shareOfTotalPct = totalSalesConsolidated > 0 ? Math.round((totalSales / totalSalesConsolidated) * 100) : 0;

      const breakevenCoveragePct = breakEvenTargetPerBranch > 0 
        ? Math.min(300, Math.round((totalSales / breakEvenTargetPerBranch) * 100)) 
        : 100;
      
      const isBreakevenReached = totalSales >= breakEvenTargetPerBranch;
      const branchInvValue = inventory.reduce((acc, p) => acc + (Number(p.stock || 0) * Number(p.sell_price || 0)), 0);

      // Contar usuarios pertenecientes a esta sucursal
      const assignedUsersCount = systemUsers.filter(u => (u.branch_id || 'branch-matriz') === b.id).length;

      return {
        ...b,
        isMain,
        totalSales,
        salesCount,
        avgTicket,
        shareOfTotalPct,
        breakevenCoveragePct,
        isBreakevenReached,
        branchInvValue,
        assignedUsersCount
      };
    });
  }, [branches, monthSalesAll, totalSalesConsolidated, breakEvenTargetPerBranch, inventory, systemUsers]);

  // Sucursal líder
  const topSellingBranch = useMemo(() => {
    if (branchMetricsList.length === 0) return null;
    return [...branchMetricsList].sort((a, b) => b.totalSales - a.totalSales)[0];
  }, [branchMetricsList]);

  // Handler para agregar nueva sucursal
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!newBranchData.name.trim()) return;

    setCreating(true);
    await addBranch(newBranchData);
    setCreating(false);
    setShowAddModal(false);
    setNewBranchData({ name: '', address: '', phone: '', manager: '', code: '' });
    alert(`✅ Sucursal "${newBranchData.name}" registrada con éxito.`);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── CABECERA PRINCIPAL & SUB-PESTAÑAS DE NAVEGACIÓN ── */}
      <div className="glass-panel" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(99,102,241,0.08))',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(6,182,212,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-cyan)',
              flexShrink: 0
            }}>
              <Building2 size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  Control de Sucursales & Personal
                </h2>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '99px', border: '1px solid #bae6fd' }}>
                  Vista Dueño / Multi-Sede
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                Gestiona el rendimiento comercial de tus sedes y administra los accesos y sucursales asignadas a cada usuario.
              </p>
            </div>
          </div>

          {/* Selector de Fecha o Acciones Rápidas */}
          {activeSubTab === 'overview' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <select
                className="form-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 800, borderRadius: '10px' }}
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx}>{name} {selectedYear}</option>
                ))}
              </select>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAddCompanyModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' }}
                title="Crea una empresa matriz independiente para otro cliente o dueño"
              >
                <Building2 size={16} />
                <span>+ Nueva Tienda Matriz</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setNewCancellationPass(companySettings?.cancellation_password || 'nexus123');
                  setConfirmCancellationPass(companySettings?.cancellation_password || 'nexus123');
                  setShowAnnulPassModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                title="Configura la clave o PIN requerida para anular facturas y ventas"
              >
                <KeyRound size={16} />
                <span>🔑 Clave Anulación Facturas</span>
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 }}
              >
                <PlusCircle size={16} />
                <span>+ Nueva Sucursal</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowAddUserModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 }}
              >
                <UserPlus size={16} />
                <span>+ Registrar Usuario</span>
              </button>
            </div>
          )}
        </div>

        {/* ── BARRA DE PESTAÑAS DE CONTROL SUCURSALES ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderTop: '1px solid rgba(6,182,212,0.15)',
          paddingTop: '14px',
          overflowX: 'auto'
        }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            style={{
              padding: '9px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: activeSubTab === 'overview' ? '1px solid var(--color-cyan)' : '1px solid transparent',
              background: activeSubTab === 'overview' ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.6)',
              color: activeSubTab === 'overview' ? 'var(--color-cyan)' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <BarChart3 size={17} />
            <span>🏢 Rendimiento & Sedes ({branches.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            style={{
              padding: '9px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: activeSubTab === 'users' ? '1px solid var(--color-cyan)' : '1px solid transparent',
              background: activeSubTab === 'users' ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.6)',
              color: activeSubTab === 'users' ? 'var(--color-cyan)' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Users size={17} />
            <span>👥 Usuarios & Permisos por Sucursal</span>
            <span style={{ fontSize: '10px', background: 'var(--color-cyan)', color: '#fff', padding: '2px 7px', borderRadius: '99px', fontWeight: 900 }}>
              {systemUsers.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── VISTA 1: OVERVIEW DE SUCURSALES & RENDIMIENTO COMERCIAL ── */}
      {activeSubTab === 'overview' && (
        <>
          {/* Métricas Clave Consolidadas */}
          <div className="branches-metrics-grid">
            <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Ventas Consolidadas</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(6,182,212,0.12)', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <DualCurrencyDisplay amount={totalSalesConsolidated} fontSize="24px" primaryColor="var(--color-cyan)" showSwap={false} />
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
                Suma total de {branches.length} {branches.length === 1 ? 'sucursal' : 'sucursales'} en {monthNames[selectedMonth]}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Sede Líder del Mes</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(245,158,11,0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={16} />
                </div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {topSellingBranch ? topSellingBranch.name : 'N/A'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 800, marginTop: '4px' }}>
                {topSellingBranch ? `Aporta el ${topSellingBranch.shareOfTotalPct}% de los ingresos` : 'Sin ventas este mes'}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Meta Equilibrio Sede</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Scale size={16} />
                </div>
              </div>
              <DualCurrencyDisplay amount={breakEvenTargetPerBranch} fontSize="20px" primaryColor="#10b981" showSwap={false} />
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
                Ventas estimadas por sucursal para cubrir costos
              </div>
            </div>
          </div>

          {/* Grid Tarjetas de Sucursales */}
          <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={18} style={{ color: 'var(--color-cyan)' }} />
            Avance e Indicadores por Cada Sucursal
          </h3>

          <div className="branches-control-grid">
            {branchMetricsList.map(b => {
              const isActive = activeBranchId === b.id || (!activeBranchId && b.isMain);

              return (
                <div 
                  key={b.id}
                  className="glass-panel"
                  style={{
                    padding: '22px',
                    background: isActive ? 'linear-gradient(135deg, rgba(6,182,212,0.04), rgba(255,255,255,1))' : '#ffffff',
                    border: isActive ? '2px solid var(--color-cyan)' : '1px solid #e2e8f0',
                    borderRadius: '20px',
                    boxShadow: isActive ? '0 8px 24px rgba(6,182,212,0.12)' : '0 4px 14px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: b.isMain ? '#dcfce7' : '#e0f2fe', color: b.isMain ? '#15803d' : '#0369a1' }}>
                            {b.isMain ? 'Casa Matriz' : (b.code || 'Sucursal')}
                          </span>
                          {isActive && (
                            <span style={{ fontSize: '10px', fontWeight: 900, background: '#06b6d4', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                              SEDE EN USO
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            {b.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setEditModalBranch({ ...b })}
                            style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--color-cyan)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title="Renombrar o editar datos de esta sede"
                          >
                            <Edit3 size={12} />
                            <span>Editar</span>
                          </button>
                          {!b.isMain && b.id !== 'branch-matriz' && (
                            <button
                              type="button"
                              onClick={() => { setDeleteModalBranch(b); setDeleteConfirmText(''); }}
                              style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              title="Eliminar esta sucursal del sistema"
                            >
                              <Trash2 size={12} />
                              <span>Eliminar</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Aporte Total</span>
                        <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--color-cyan)' }}>{b.shareOfTotalPct}%</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                      {b.address && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={13} /> {b.address}</div>}
                      {b.manager && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={13} /> Manager: <strong>{b.manager}</strong></div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: 700 }}>
                        <Users size={13} /> Personal Asignado: <strong>{b.assignedUsersCount} {b.assignedUsersCount === 1 ? 'usuario' : 'usuarios'}</strong>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '14px', border: '1px solid #f1f5f9', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Ventas del Mes:</span>
                        <DualCurrencyDisplay amount={b.totalSales} fontSize="18px" primaryColor="#0f172a" showSwap={false} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', fontSize: '11.5px', color: '#475569' }}>
                        <div>
                          <span style={{ color: '#64748b' }}>Transacciones:</span> <strong>{b.salesCount}</strong>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: '#64748b' }}>Ticket Prom:</span> <strong>{formatCurrency(b.avgTicket)}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: b.isBreakevenReached ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)', border: b.isBreakevenReached ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: b.isBreakevenReached ? '#15803d' : '#b45309', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Scale size={13} />
                          Punto de Equilibrio Sede
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 900, color: b.isBreakevenReached ? '#15803d' : '#b45309' }}>
                          {b.breakevenCoveragePct}% Cobertura
                        </span>
                      </div>

                      <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '99px', overflow: 'hidden', marginBottom: '6px' }}>
                        <div 
                          style={{ 
                            width: `${Math.min(100, b.breakevenCoveragePct)}%`, 
                            height: '100%', 
                            background: b.isBreakevenReached ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                            borderRadius: '99px',
                            transition: 'width 0.5s ease'
                          }} 
                        />
                      </div>

                      <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Meta: {formatCurrency(breakEvenTargetPerBranch)}</span>
                        <span style={{ fontWeight: 800, color: b.isBreakevenReached ? '#059669' : '#d97706' }}>
                          {b.isBreakevenReached ? '✅ Equilibrio Alcanzado' : `Falta ${formatCurrency(Math.max(0, breakEvenTargetPerBranch - b.totalSales))}`}
                        </span>
                      </div>
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() => switchBranch(b.id)}
                    className={isActive ? 'btn-secondary' : 'btn-primary'}
                    style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '10px', fontWeight: 800, marginTop: '8px', gap: '6px' }}
                  >
                    {isActive ? (
                      <>
                        <Check size={16} />
                        <span>SEDE ACTIVA EN EL PANEL</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        <span>⚡ ACTIVAR Y GESTIONAR ESTA SEDE</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Tabla Comparativa Consolidada */}
          <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', marginTop: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} style={{ color: 'var(--color-cyan)' }} />
              Tabla Comparativa Rendimiento de Sedes ({monthNames[selectedMonth]})
            </h3>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="premium-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '11px', textTransform: 'uppercase', color: '#64748b' }}>
                    <th style={{ padding: '12px 14px' }}>Sucursal / Sede</th>
                    <th style={{ padding: '12px 14px' }}>Encargado</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Usuarios</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Ventas Totales</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>N° Transacciones</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Meta Equilibrio</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>% Cobertura</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {branchMetricsList.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building2 size={15} style={{ color: b.isMain ? '#10b981' : 'var(--color-cyan)' }} />
                          <div>
                            <div>{b.name}</div>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{b.isMain ? 'Casa Matriz' : (b.code || 'Sucursal')}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontWeight: 600 }}>
                        {b.manager || 'No asignado'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: '99px', background: 'rgba(6,182,212,0.1)', color: '#0284c7' }}>
                          👥 {b.assignedUsersCount}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                        {formatCurrency(b.totalSales)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--color-cyan)' }}>
                        {b.salesCount}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>
                        {formatCurrency(breakEvenTargetPerBranch)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', background: b.isBreakevenReached ? '#dcfce7' : '#fef3c7', color: b.isBreakevenReached ? '#15803d' : '#b45309' }}>
                          {b.breakevenCoveragePct}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => switchBranch(b.id)}
                          style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 800, borderRadius: '8px', background: activeBranchId === b.id ? '#f1f5f9' : 'var(--color-cyan)', color: activeBranchId === b.id ? '#64748b' : '#fff', border: 'none', cursor: 'pointer' }}
                        >
                          {activeBranchId === b.id ? 'Activa' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── VISTA 2: PESTAÑA DE USUARIOS & PERMISOS DE ACCESO A SUCURSALES ── */}
      {activeSubTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TARJETA DE SEGURIDAD: CLAVE DE ANULACIÓN DE FACTURAS */}
          <div className="glass-panel" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)', borderRadius: '16px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ef4444', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.25)' }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#991b1b', margin: 0 }}>
                  Clave de Anulación de Facturas & Ventas
                </h4>
                <p style={{ fontSize: '11.5px', color: '#7f1d1d', margin: '2px 0 0 0' }}>
                  Contraseña maestra que solicitará el sistema a los cajeros al intentar anular cualquier boleta, factura o venta.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fca5a5', fontSize: '12px', color: '#991b1b', fontWeight: 800 }}>
                Clave Actual: <code>{companySettings?.cancellation_password || 'nexus123'}</code>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setNewCancellationPass(companySettings?.cancellation_password || 'nexus123');
                  setConfirmCancellationPass(companySettings?.cancellation_password || 'nexus123');
                  setShowAnnulPassModal(true);
                }}
                style={{ background: '#ef4444', borderColor: '#dc2626', fontSize: '12px', padding: '8px 14px', borderRadius: '10px' }}
              >
                ⚙️ Cambiar Clave de Anulación
              </button>
            </div>
          </div>

          {/* RESUMEN DE USUARIOS MULTI-SEDE */}
          <div className="branches-metrics-grid">
            <div className="glass-panel" style={{ padding: '18px 20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Personal Activo</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(6,182,212,0.12)', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>
                {systemUsers.length} <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>usuarios</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Registrados en el sistema de la empresa
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px 20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Acceso Total Multi-Sede</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={16} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>
                {systemUsers.filter(u => !u.allowed_branches || u.allowed_branches.includes('all')).length} <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>con acceso global</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Tienen visibilidad en todas las sucursales
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '18px 20px', background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Acceso Restringido</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(245,158,11,0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={16} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#d97706' }}>
                {systemUsers.filter(u => u.allowed_branches && !u.allowed_branches.includes('all')).length} <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>por selección</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Acceso restringido a sedes específicas
              </div>
            </div>
          </div>

          {/* BARRA DE FILTROS & BÚSQUEDA DE USUARIOS */}
          <div className="glass-panel" style={{ padding: '16px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Buscar usuario por nombre, email o rol..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  style={{ paddingLeft: '36px', fontSize: '13px', borderRadius: '10px', width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={14} />
                Sucursal Personal:
              </label>
              <select
                className="form-input"
                value={userBranchFilter}
                onChange={(e) => setUserBranchFilter(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 800, borderRadius: '10px' }}
              >
                <option value="all">Todas las Sedes ({branches.length})</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code || 'SUC'})</option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLA PRINCIPAL DE USUARIOS & PERMISOS */}
          <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--color-cyan)' }} />
                  Directorio de Personal & Asignación de Sucursales
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Identifica a qué sucursal pertenece cada usuario y configura si tiene permiso para conmutar a todas o sedes específicas.
                </p>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowAddUserModal(true)}
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <UserPlus size={15} />
                <span>+ Nuevo Usuario</span>
              </button>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="premium-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontSize: '11px', textTransform: 'uppercase', color: '#64748b' }}>
                    <th style={{ padding: '12px 14px' }}>Usuario / Empleado</th>
                    <th style={{ padding: '12px 14px' }}>Rol en Sistema</th>
                    <th style={{ padding: '12px 14px' }}>Sucursal Personal (Principal)</th>
                    <th style={{ padding: '12px 14px' }}>Alcance de Permisos / Acceso</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        No se encontraron usuarios registrados que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const pBranchId = u.branch_id || 'branch-matriz';
                      const pBranchObj = branches.find(b => b.id === pBranchId) || branches[0];
                      const allowed = u.allowed_branches || ['all'];
                      const hasAccessToAll = Array.isArray(allowed) && allowed.includes('all');

                      const allowedBranchObjs = Array.isArray(allowed) 
                        ? allowed.filter(id => id !== 'all').map(id => branches.find(b => b.id === id)).filter(Boolean)
                        : [];

                      return (
                        <tr key={u.id || u.email} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                          {/* Columna Usuario */}
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(99,102,241,0.15))',
                                color: 'var(--color-cyan)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '14px',
                                textTransform: 'uppercase'
                              }}>
                                {(u.full_name || u.name || u.email || 'U').charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                                  {u.full_name || u.name || 'Sin Nombre'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Columna Rol */}
                          <td style={{ padding: '14px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: '8px',
                              background: ['admin', 'administrador', 'owner', 'nexusowner'].includes((u.role || '').toLowerCase()) ? '#dcfce7' : '#f1f5f9',
                              color: ['admin', 'administrador', 'owner', 'nexusowner'].includes((u.role || '').toLowerCase()) ? '#15803d' : '#475569',
                              border: '1px solid rgba(0,0,0,0.05)'
                            }}>
                              {u.role || 'Cajero'}
                            </span>
                          </td>

                          {/* Columna Sucursal Personal */}
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, border: '1px solid #bae6fd' }}>
                              <Building2 size={14} />
                              <span>{pBranchObj ? pBranchObj.name : 'Matriz Principal'}</span>
                            </div>
                          </td>

                          {/* Columna Alcance de Accesos */}
                          <td style={{ padding: '14px' }}>
                            {hasAccessToAll ? (
                              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                                <Globe size={13} />
                                <span>🌐 Acceso a TODAS las Sucursales</span>
                              </span>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {allowedBranchObjs.length === 0 ? (
                                  <span style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>
                                    Solo {pBranchObj?.name || 'Sucursal Asignada'}
                                  </span>
                                ) : (
                                  allowedBranchObjs.map(b => (
                                    <span key={b.id} style={{ fontSize: '10.5px', fontWeight: 800, background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                      <Store size={10} />
                                      {b.name}
                                    </span>
                                  ))
                                )}
                              </div>
                            )}
                          </td>

                          {/* Columna Acción */}
                          <td style={{ padding: '14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditUserAccess(u)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                borderRadius: '8px',
                                background: 'rgba(6,182,212,0.1)',
                                color: 'var(--color-cyan)',
                                border: '1px solid rgba(6,182,212,0.3)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Edit3 size={13} />
                              <span>Cambiar Permisos</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── MODAL: EDITAR SUCURSAL PERSONAL & ACCESOS DEL USUARIO ── */}
      {editingUserAccess && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '520px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--color-cyan)' }} />
                  Asignar Sucursal & Permisos de Acceso
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                  Usuario: {editingUserAccess.full_name || editingUserAccess.email}
                </span>
              </div>
              <button className="modal-close" onClick={() => setEditingUserAccess(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveUserAccessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* 1. SELECCIÓN DE SUCURSAL PERSONAL / PRINCIPAL */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <label className="form-label" style={{ fontWeight: 900, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={15} style={{ color: 'var(--color-cyan)' }} />
                  1. Sucursal Personal / Principal del Empleado *
                </label>
                <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', marginBottom: '8px' }}>
                  Es la sede predeterminada donde este usuario inicia sesión y registra sus transacciones diarias.
                </p>
                <select
                  className="form-input"
                  value={editFormBranchId}
                  onChange={(e) => setEditFormBranchId(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 800, borderRadius: '10px' }}
                  required
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.is_main ? 'Casa Matriz' : (b.code || 'Sucursal')})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. CONFIGURACIÓN DE ACCESOS & SELECCIÓN CON CHECKBOX */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <label className="form-label" style={{ fontWeight: 900, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={15} style={{ color: 'var(--color-cyan)' }} />
                  2. Alcance de Permisos / Acceso a Sucursales
                </label>
                <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', marginBottom: '10px' }}>
                  Determina si el usuario puede conmutar entre todas las sedes o únicamente las seleccionadas con check.
                </p>

                {/* Opción 1: Acceso Total a TODAS las sucursales */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  background: editFormAccessAll ? '#e0f2fe' : '#ffffff',
                  border: editFormAccessAll ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  marginBottom: '12px',
                  transition: 'all 0.15s ease'
                }} onClick={() => setEditFormAccessAll(!editFormAccessAll)}>
                  <input
                    type="checkbox"
                    checked={editFormAccessAll}
                    onChange={(e) => setEditFormAccessAll(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-cyan)', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 900, color: editFormAccessAll ? '#0369a1' : '#334155' }}>
                      🌐 Dar acceso a TODAS las sucursales (Acceso Total / Multi-Sede)
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Permite ver y seleccionar cualquier sede actual o futura de la empresa.
                    </div>
                  </div>
                </div>

                {/* Opción 2: Lista de Checkboxes por Sucursal (si no es Acceso Total) */}
                {!editFormAccessAll && (
                  <div style={{ padding: '10px', background: '#ffffff', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
                      Selecciona las sucursales autorizadas para este usuario:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {branches.map(b => {
                        const isChecked = editFormSelectedBranches.includes(b.id);
                        return (
                          <label
                            key={b.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: isChecked ? 'rgba(6,182,212,0.08)' : '#f8fafc',
                              border: isChecked ? '1px solid var(--color-cyan)' : '1px solid #e2e8f0',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditFormSelectedBranches(prev => [...prev, b.id]);
                                  } else {
                                    setEditFormSelectedBranches(prev => prev.filter(id => id !== b.id));
                                  }
                                }}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--color-cyan)' }}
                              />
                              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                                {b.name}
                              </span>
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                              {b.is_main ? 'Matriz' : (b.code || 'Sede')}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. SELECCIÓN DE ROL */}
              <div>
                <label className="form-label">Rol del Usuario</label>
                <select
                  className="form-input"
                  value={editFormRole}
                  onChange={(e) => setEditFormRole(e.target.value)}
                  style={{ width: '100%', padding: '9px', fontSize: '12.5px', borderRadius: '10px' }}
                >
                  <option value="Administrador">Administrador (Control Total)</option>
                  <option value="Gerente">Gerente de Sede</option>
                  <option value="Cajero">Cajero / Operador POS</option>
                  <option value="Vendedor">Vendedor</option>
                </select>
              </div>

              {/* BOTONES ACCIÓN */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingUserAccess(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Permisos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REGISTRAR NUEVO USUARIO DE SEDE ── */}
      {showAddUserModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '480px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} style={{ color: 'var(--color-cyan)' }} />
                Registrar Nuevo Usuario / Empleado
              </h3>
              <button className="modal-close" onClick={() => setShowAddUserModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Nombre Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Carlos Mendoza"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Correo Electrónico *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="carlos@empresa.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Contraseña Inicial</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="nexus123"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Sucursal Personal / Principal *</label>
                <select
                  className="form-input"
                  value={newUserData.branch_id}
                  onChange={(e) => setNewUserData({ ...newUserData, branch_id: e.target.value })}
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Rol del Usuario</label>
                <select
                  className="form-input"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value="Cajero">Cajero / POS</option>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Gerente">Gerente de Sede</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddUserModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Registrar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: AGREGAR NUEVA SUCURSAL ── */}
      {showAddModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '480px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={18} style={{ color: 'var(--color-cyan)' }} />
                Registrar Nueva Sucursal / Sede
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateBranch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Nombre de la Sucursal *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Sucursal Las Mercedes, Sede Norte, Minimarket Centro"
                  value={newBranchData.name}
                  onChange={(e) => setNewBranchData({ ...newBranchData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Código / Identificador Sede</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: SUC-002, NORTE-01"
                  value={newBranchData.code}
                  onChange={(e) => setNewBranchData({ ...newBranchData, code: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Dirección Física / Ubicación</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Av. Principal con Calle 4"
                  value={newBranchData.address}
                  onChange={(e) => setNewBranchData({ ...newBranchData, address: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Manager / Encargado de la Sucursal</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Roberto Gómez"
                  value={newBranchData.manager}
                  onChange={(e) => setNewBranchData({ ...newBranchData, manager: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Guardando...' : '+ Crear Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR / RENOMBRAR SUCURSAL O CASA MATRIZ ── */}
      {editModalBranch && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '480px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} style={{ color: 'var(--color-cyan)' }} />
                Renombrar & Editar Sede
              </h3>
              <button className="modal-close" onClick={() => setEditModalBranch(null)}>✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              await updateBranch(editModalBranch.id, {
                name: editModalBranch.name,
                code: editModalBranch.code,
                address: editModalBranch.address,
                manager: editModalBranch.manager
              });
              setEditModalBranch(null);
              alert(`✅ Datos de "${editModalBranch.name}" guardados correctamente.`);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Nombre de la Sucursal / Sede *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Sede Principal La California, Sucursal Centro"
                  value={editModalBranch.name || ''}
                  onChange={(e) => setEditModalBranch({ ...editModalBranch, name: e.target.value })}
                  required
                />
                {editModalBranch.isMain && (
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginTop: '5px', display: 'block' }}>
                    💡 Esta es la Casa Matriz. Puedes asignarle cualquier nombre propio.
                  </span>
                )}
              </div>

              <div>
                <label className="form-label">Código / Identificador de la Sede</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: MATRIZ-01, SUC-02"
                  value={editModalBranch.code || ''}
                  onChange={(e) => setEditModalBranch({ ...editModalBranch, code: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Dirección Física / Ubicación</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Av. Francisco de Miranda, Local 4"
                  value={editModalBranch.address || ''}
                  onChange={(e) => setEditModalBranch({ ...editModalBranch, address: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Manager / Encargado de la Sede</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Roberto Gómez"
                  value={editModalBranch.manager || ''}
                  onChange={(e) => setEditModalBranch({ ...editModalBranch, manager: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setEditModalBranch(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN SEGURA PARA ELIMINAR SUCURSAL ── */}
      {deleteModalBranch && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '450px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                Eliminar Sucursal
              </h3>
              <button className="modal-close" onClick={() => setDeleteModalBranch(null)}>✕</button>
            </div>

            <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', marginBottom: '16px' }}>
              ¿Estás seguro de que deseas eliminar permanentemente la sucursal <strong style={{ color: '#0f172a' }}>"{deleteModalBranch.name}"</strong>?
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 14px', borderRadius: '12px', marginBottom: '16px', fontSize: '12px', color: '#991b1b' }}>
              ⚠️ <strong>Confirmación de Seguridad Obligatoria:</strong><br />
              Para proceder y confirmar la eliminación de esta sede, por favor escribe la palabra <strong style={{ color: '#ef4444', textDecoration: 'underline' }}>Eliminar</strong> a continuación:
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (deleteConfirmText.trim().toLowerCase() !== 'eliminar') {
                alert('⚠️ Debes escribir exactamente la palabra "Eliminar" para confirmar.');
                return;
              }

              const res = await deleteBranch(deleteModalBranch.id);
              setDeleteModalBranch(null);
              setDeleteConfirmText('');

              if (res && res.error) {
                alert(`Error al eliminar sucursal: ${res.error}`);
              } else {
                alert(`✅ Sucursal "${deleteModalBranch.name}" eliminada correctamente del sistema.`);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                className="form-input"
                placeholder='Escribe "Eliminar" aquí para habilitar el botón...'
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: deleteConfirmText.trim().toLowerCase() === 'eliminar' ? '2px solid #10b981' : '1.5px solid #cbd5e1'
                }}
                autoFocus
                required
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDeleteModalBranch(null)}
                  style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px' }}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={deleteConfirmText.trim().toLowerCase() !== 'eliminar'}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 900,
                    borderRadius: '10px',
                    background: deleteConfirmText.trim().toLowerCase() === 'eliminar' ? '#ef4444' : '#cbd5e1',
                    color: '#ffffff',
                    border: 'none',
                    cursor: deleteConfirmText.trim().toLowerCase() === 'eliminar' ? 'pointer' : 'not-allowed',
                    boxShadow: deleteConfirmText.trim().toLowerCase() === 'eliminar' ? '0 4px 12px rgba(239, 68, 68, 0.35)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Trash2 size={14} />
                  <span>Eliminar Definitivamente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIGURAR CONTRASEÑA DE ANULACIÓN DE FACTURAS ── */}
      {showAnnulPassModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '460px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={22} style={{ color: '#ef4444' }} />
                Clave de Anulación de Facturas
              </h3>
              <button className="modal-close" onClick={() => setShowAnnulPassModal(false)}>✕</button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.4', marginBottom: '16px' }}>
              Establece la contraseña o PIN que exigirá el sistema para autorizar la anulación de facturas, boletas o transacciones registradas.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newCancellationPass.trim()) {
                alert('⚠️ Por favor ingresa una clave de anulación válida.');
                return;
              }
              if (newCancellationPass.trim() !== confirmCancellationPass.trim()) {
                alert('⚠️ La confirmación de la contraseña no coincide.');
                return;
              }

              setSavingPass(true);
              const res = await updateCompanySettings({
                cancellation_password: newCancellationPass.trim(),
                annulment_pin: newCancellationPass.trim()
              });
              setSavingPass(false);

              if (res && res.error) {
                alert(`Error guardando contraseña: ${res.error}`);
              } else {
                alert(`✅ Contraseña de anulación de facturas actualizada a "${newCancellationPass.trim()}".`);
                setShowAnnulPassModal(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                  🔐 Nueva Contraseña / PIN de Anulación *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: anular2026 o PIN 9988"
                  value={newCancellationPass}
                  onChange={(e) => setNewCancellationPass(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', fontWeight: 800 }}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                  🔒 Confirmar Contraseña *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Repite la contraseña para confirmar..."
                  value={confirmCancellationPass}
                  onChange={(e) => setConfirmCancellationPass(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', fontWeight: 800 }}
                  required
                />
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: '10px', fontSize: '11.5px', color: '#991b1b' }}>
                💡 <strong>Tip de Seguridad:</strong> Comparte esta clave únicamente con los supervisores o administradores autorizados para anular ventas en la sucursal.
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAnnulPassModal(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPass}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 900,
                    borderRadius: '10px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>{savingPass ? 'Guardando...' : 'Guardar Clave de Anulación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR NUEVA TIENDA MATRIZ INDEPENDIENTE & ADMINISTRADOR ── */}
      {showAddCompanyModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '520px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} style={{ color: 'var(--color-cyan)' }} />
                  Crear Nueva Tienda Matriz (Empresa Independiente)
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Registra un nuevo comercio o cliente con su propia Casa Matriz y Administrador
                </span>
              </div>
              <button className="modal-close" onClick={() => setShowAddCompanyModal(false)}>✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newCompanyName.trim()) return alert('Ingresa el nombre de la tienda.');

              let finalEmail = adminEmail.trim();
              let finalPass = adminPassword.trim();
              let finalName = adminFullName.trim();

              if (adminMode === 'owner') {
                finalEmail = user?.email || 'admin@puntonexus.com';
                finalPass = user?.password || 'nexus2026';
                finalName = user?.name || user?.full_name || 'Nexus Owner';
              } else {
                if (!finalEmail || !finalPass || !finalName) {
                  return alert('Completa el nombre, correo y contraseña del Administrador.');
                }
              }

              setCreatingCompany(true);
              const companyRes = await createCompany(newCompanyName.trim(), { giro: newCompanyGiro });

              if (companyRes.error) {
                setCreatingCompany(false);
                return alert(`Error: ${companyRes.error}`);
              }

              const newCompId = companyRes.id;
              await createAccount(finalEmail, finalPass, finalName, 'Administrador', newCompId);
              setCreatingCompany(false);
              setShowAddCompanyModal(false);

              setCreatedModalData({
                companyId: newCompId,
                companyName: newCompanyName.trim(),
                adminName: finalName,
                adminEmail: finalEmail,
                adminPassword: finalPass
              });

              setNewCompanyName('');
              setAdminFullName('');
              setAdminEmail('');
              setAdminPassword('');
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* 1. NOMBRE Y GIRO */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  🏢 Nombre de la Empresa / Tienda Matriz *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Repuestos El Chispazo, Minimarket San José"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />

                <label className="form-label" style={{ fontWeight: 800, color: '#0f172a', marginTop: '10px', marginBottom: '4px', display: 'block' }}>
                  🛒 Giro del Negocio / Tipo de Comercio *
                </label>
                <select
                  className="form-input"
                  value={newCompanyGiro}
                  onChange={(e) => setNewCompanyGiro(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12.5px', fontWeight: 800, borderRadius: '8px' }}
                >
                  <option value="alimentos">🛒 Minimarket / Abasto / Alimentos</option>
                  <option value="gastronomia">🍔 Restaurante / Comida al Paso / Fast Food</option>
                  <option value="servicios">🔧 Taller / Repuestos / Servicios Técnicos</option>
                  <option value="general">🛍️ Comercio General / Tienda de Retail</option>
                </select>
              </div>

              {/* 2. ADMINISTRADOR DE LA TIENDA */}
              <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                <label className="form-label" style={{ fontWeight: 900, color: '#0369a1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={15} />
                  👤 Configuración del Administrador de la Tienda
                </label>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setAdminMode('new')}
                    style={{
                      flex: 1, padding: '7px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800,
                      background: adminMode === 'new' ? '#0284c7' : '#ffffff', color: adminMode === 'new' ? '#ffffff' : '#0369a1',
                      border: adminMode === 'new' ? 'none' : '1px solid #7dd3fc', cursor: 'pointer'
                    }}
                  >
                    + Crear Nuevo Correo & Clave
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminMode('owner')}
                    style={{
                      flex: 1, padding: '7px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800,
                      background: adminMode === 'owner' ? '#0284c7' : '#ffffff', color: adminMode === 'owner' ? '#ffffff' : '#0369a1',
                      border: adminMode === 'owner' ? 'none' : '1px solid #7dd3fc', cursor: 'pointer'
                    }}
                  >
                    Usar mi Correo Actual
                  </button>
                </div>

                {adminMode === 'new' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '2px' }}>
                        Nombre Completo del Administrador:
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: Carlos Silva (Dueño)"
                        value={adminFullName}
                        onChange={(e) => setAdminFullName(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: '12.5px' }}
                        required={adminMode === 'new'}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '2px' }}>
                        📧 Correo de Ingreso (Email):
                      </label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Ej: carlos@elchispazo.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: '12.5px' }}
                        required={adminMode === 'new'}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '2px' }}>
                        🔐 Contraseña Inicial de Acceso:
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: chispazo2026"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', fontSize: '12.5px', fontWeight: 800 }}
                        required={adminMode === 'new'}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#0369a1', background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #7dd3fc' }}>
                    💡 Se asignará tu correo actual <strong>{user?.email || 'admin@puntonexus.com'}</strong> como Administrador de esta nueva tienda matriz.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddCompanyModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={creatingCompany}>
                  {creatingCompany ? 'Creando Tienda...' : '🚀 Crear Tienda Matriz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO TRAS CREAR TIENDA MATRIZ EN BRANCHES CONTROL */}
      {createdModalData && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '480px', padding: '24px', background: '#ffffff', borderRadius: '24px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
              <CheckCircle size={32} />
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
              ¡Tienda Matriz Creada Exitosamente!
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 18px 0' }}>
              Se ha registrado la empresa <strong>"{createdModalData.companyName}"</strong> y su cuenta de Administrador principal.
            </p>

            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '14px', textAlign: 'left', marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '10px' }}>
                🔑 CREDENCIALES DEL ADMINISTRADOR:
              </div>
              <div style={{ fontSize: '12.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>🏢 <strong>Empresa / Tienda:</strong> {createdModalData.companyName}</div>
                <div>👤 <strong>Administrador:</strong> {createdModalData.adminName}</div>
                <div>📧 <strong>Correo de Ingreso:</strong> <span style={{ color: '#0284c7', fontWeight: 800 }}>{createdModalData.adminEmail}</span></div>
                <div>🔐 <strong>Contraseña Inicial:</strong> <span style={{ background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', fontWeight: 900, color: '#0369a1' }}>{createdModalData.adminPassword}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCreatedModalData(null)}
                style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: 800 }}
              >
                Cerrar
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  selectCompany(createdModalData.companyId, createdModalData.companyName);
                  setCreatedModalData(null);
                }}
                style={{ flex: 1.3, padding: '10px', fontSize: '12px', fontWeight: 900, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
              >
                ⚡ Conmutar a esta Tienda
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
