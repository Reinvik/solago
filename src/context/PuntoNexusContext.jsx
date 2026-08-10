import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getCountryConfig, COUNTRY_CONFIGS } from '../utils/countryConfig';

const PuntoNexusContext = createContext();

export const usePuntoNexus = () => useContext(PuntoNexusContext);

const DEFAULT_PRODUCTS = [
  { id: 'prod-1', name: 'Combo Nexus Doble Burger + Papas', sku: 'REST-CMB-001', category: 'Combos', cost_price: 4.5, sell_price: 9.5, stock: 50, min_stock: 10, image_url: '/images/combo_nexus.jpg', description: 'Doble carne 100% res, queso cheddar, tocino crocante + papas fritas medianas + bebida.' },
  { id: 'prod-2', name: 'Burger Smash Gourmet Doble', sku: 'REST-BRG-002', category: 'Hamburguesas', cost_price: 3.2, sell_price: 7.0, stock: 40, min_stock: 8, image_url: '/images/burger_nexus.jpg', description: 'Doble smashed patty 180g, queso americano fundido, cebolla caramelizada y salsa Nexus.' },
  { id: 'prod-3', name: 'Pepito Mixto Gourmet (Carne y Pollo)', sku: 'REST-PEP-003', category: 'Perros y Pepitos', cost_price: 4.0, sell_price: 8.5, stock: 35, min_stock: 5, image_url: '/images/pepito_mixto.jpg', description: 'Pan baguette 30cm, lomo de res, pechuga de pollo, queso de mano, papitas hilos y salsa de ajo.' },
  { id: 'prod-4', name: 'Tequeños Gourmet de Queso (10 Unids)', sku: 'REST-TEQ-004', category: 'Arepas y Antojitos', cost_price: 2.5, sell_price: 5.5, stock: 60, min_stock: 15, image_url: '/images/tequenos_gourmet.jpg', description: 'Deditos de queso blanco semiduro crujientes con salsa tártara de la casa.' },
  { id: 'prod-5', name: 'Arepa Reina Pepiada Suprema', sku: 'REST-ARP-005', category: 'Arepas y Antojitos', cost_price: 2.0, sell_price: 4.8, stock: 45, min_stock: 10, image_url: '/images/arepa_reina.jpg', description: 'Arepa de maíz blanco asada, rellena de pollo desmechado, aguacate cremoso y mayonesa gourmet.' },
  { id: 'prod-6', name: 'Pizza Pepperoni Familiar', sku: 'REST-PIZ-006', category: 'Pizzas', cost_price: 5.5, sell_price: 12.0, stock: 25, min_stock: 5, image_url: '/images/pizza_pepperoni.jpg', description: 'Masa artesanal a la piedra, salsa pomodoro, queso mozzarella derretido y pepperoni premium.' },
  { id: 'prod-7', name: 'Malteada de Oreo Especial', sku: 'REST-POS-007', category: 'Postres y Bebidas', cost_price: 1.8, sell_price: 4.0, stock: 30, min_stock: 8, image_url: '/images/malteada_oreo.jpg', description: 'Batido cremoso de helado de mantecado con galletas Oreo trituradas, crema batida y sirope de chocolate.' },
  { id: 'prod-8', name: 'Perro Caliente Especial Con Todo', sku: 'REST-PRR-008', category: 'Perros y Pepitos', cost_price: 1.2, sell_price: 3.0, stock: 50, min_stock: 10, image_url: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=600&q=80', description: 'Salchicha de res jumbo, repollo, cebollita, queso rallado, papitas hilos y 3 salsas.' },
  { id: 'prod-9', name: 'Jugo Natural de Parchita (500ml)', sku: 'REST-BEB-009', category: 'Postres y Bebidas', cost_price: 0.8, sell_price: 2.0, stock: 40, min_stock: 10, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', description: 'Jugo 100% natural de maracuyá/parchita con hielo frappe.' },
  { id: 'prod-10', name: 'Refresco Coca-Cola 1.5L', sku: 'REST-BEB-010', category: 'Postres y Bebidas', cost_price: 1.2, sell_price: 2.5, stock: 50, min_stock: 12, image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&q=80', description: 'Bebida gaseosa Coca-Cola helada para compartir.' }
];

const MINIMARKET_PRODUCTS = [
  { id: 'prod-mini-1', name: 'Leche Entera Larga Vida (1L)', sku: 'MINI-LAC-001', category: 'Lácteos', cost_price: 1.1, sell_price: 1.8, stock: 48, min_stock: 12, unit: 'Un.', expiration_days: 30, image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80', description: 'Leche fresca de vaca esterilizada UHT larga vida.' },
  { id: 'prod-mini-2', name: 'Queso Gouda Laminado (250g)', sku: 'MINI-QSO-002', category: 'Lácteos y Quesos', cost_price: 2.2, sell_price: 3.9, stock: 25, min_stock: 5, unit: 'Un.', expiration_days: 15, image_url: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=400&q=80', description: 'Queso Gouda suave en láminas listo para sándwiches.' },
  { id: 'prod-mini-7', name: 'Queso Paisa Fresco (Por Kg)', sku: 'MINI-QSO-007', category: 'Lácteos y Quesos', cost_price: 5.5, sell_price: 9.9, stock: 15, min_stock: 3, unit: 'Kg.', is_weight_based: true, expiration_days: 20, image_url: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=400&q=80', description: 'Queso blanco artesanal de mesa vendido al peso (Gramos o Kilos).' },
  { id: 'prod-mini-8', name: 'Queso Mozzarella Barra (Por Kg)', sku: 'MINI-QSO-008', category: 'Lácteos y Quesos', cost_price: 6.0, sell_price: 10.5, stock: 20, min_stock: 4, unit: 'Kg.', is_weight_based: true, expiration_days: 25, image_url: 'https://images.unsplash.com/photo-1634487359989-3e90c735339c?auto=format&fit=crop&w=400&q=80', description: 'Queso Mozzarella cremoso en barra vendido al peso.' },
  { id: 'prod-mini-9', name: 'Jamón de Pavo Fiambrería (Por Kg)', sku: 'MINI-EMB-009', category: 'Charcutería y Fiambrería', cost_price: 7.0, sell_price: 12.0, stock: 12, min_stock: 2, unit: 'Kg.', is_weight_based: true, expiration_days: 15, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80', description: 'Fiambrería de pechuga de pavo fina vendida al peso.' },
  { id: 'prod-mini-3', name: 'Pan de Molde Blanco Familiar', sku: 'MINI-PAN-003', category: 'Panadería', cost_price: 1.5, sell_price: 2.8, stock: 20, min_stock: 5, unit: 'Un.', expiration_days: 7, image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80', description: 'Pan blanco suave tajado ideal para desayunos y meriendas.' },
  { id: 'prod-mini-4', name: 'Arroz Grano Largo (1Kg)', sku: 'MINI-GRN-004', category: 'Abarrotes', cost_price: 0.9, sell_price: 1.5, stock: 100, min_stock: 20, unit: 'Kg.', expiration_days: 180, image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80', description: 'Arroz blanco de primera selección grano largo.' },
  { id: 'prod-mini-5', name: 'Aceite Maravilla (1L)', sku: 'MINI-ACE-005', category: 'Abarrotes', cost_price: 2.1, sell_price: 3.5, stock: 60, min_stock: 15, unit: 'Lts.', expiration_days: 365, image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80', description: 'Aceite vegetal comestible para todo tipo de cocción.' },
  { id: 'prod-mini-6', name: 'Huevos Grado A (Bandeja 30 uds)', sku: 'MINI-HUE-006', category: 'Huevo y Abarrotes', cost_price: 3.8, sell_price: 5.9, stock: 30, min_stock: 8, unit: 'Un.', expiration_days: 21, image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80', description: 'Bandeja de 30 huevos de gallina frescos extra grandes.' },
  { id: 'prod-mini-10', name: 'Café Molido Gourmet (250g)', sku: 'MINI-CAF-010', category: 'Abarrotes', cost_price: 2.5, sell_price: 4.5, stock: 35, min_stock: 8, unit: 'Un.', expiration_days: 120, image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80', description: 'Café 100% arábica de tueste medio molido listo para cafetera.' },
  { id: 'prod-mini-11', name: 'Spaghetti Pasta Italiana (500g)', sku: 'MINI-PST-011', category: 'Abarrotes', cost_price: 0.8, sell_price: 1.6, stock: 80, min_stock: 15, unit: 'Un.', expiration_days: 365, image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281270?auto=format&fit=crop&w=400&q=80', description: 'Pasta de sémola de trigo duro de cocción al dente.' },
  { id: 'prod-mini-12', name: 'Refresco Coca-Cola (1.5L)', sku: 'MINI-BEB-012', category: 'Bebidas y Licores', cost_price: 1.3, sell_price: 2.5, stock: 50, min_stock: 10, unit: 'Un.', expiration_days: 90, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', description: 'Bebida gaseosa helada sabor original.' },
  { id: 'prod-mini-13', name: 'Detergente Ropa Líquido (1L)', sku: 'MINI-LMP-013', category: 'Limpieza y Hogar', cost_price: 2.0, sell_price: 3.8, stock: 25, min_stock: 5, unit: 'Un.', expiration_days: 730, image_url: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=400&q=80', description: 'Detergente concentrado aroma fresco para todo tipo de prendas.' },
  { id: 'prod-mini-14', name: 'Papel Higiénico Doble Hoja (4 uds)', sku: 'MINI-HOG-014', category: 'Limpieza y Hogar', cost_price: 1.4, sell_price: 2.6, stock: 40, min_stock: 10, unit: 'Un.', expiration_days: 999, image_url: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=400&q=80', description: 'Rollos de papel higiénico ultra suave acolchado.' }
];

const DEFAULT_SALES = [];

const DEFAULT_TABLES = [
  { id: 'tbl-1', number: '1', name: 'Mesa 1 - Principal', capacity: 4, status: 'available', diners: 0, items: [], openedAt: null },
  { id: 'tbl-2', number: '2', name: 'Mesa 2 - Principal', capacity: 2, status: 'available', diners: 0, items: [], openedAt: null },
  { id: 'tbl-3', number: '3', name: 'Mesa 3 - Ventana', capacity: 4, status: 'available', diners: 0, items: [], openedAt: null },
  { id: 'tbl-4', number: '4', name: 'Mesa 4 - Terraza', capacity: 6, status: 'available', diners: 0, items: [], openedAt: null },
  { id: 'tbl-5', number: 'Barra 1', name: 'Barra Principal', capacity: 1, status: 'available', diners: 0, items: [], openedAt: null }
];

export const PuntoNexusProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('punto_nexus_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [companyId, setCompanyId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCompId = params.get('c') || params.get('company_id');
      if (urlCompId) {
        localStorage.setItem('punto_nexus_company_id', urlCompId);
        return urlCompId;
      }
    }
    const saved = localStorage.getItem('punto_nexus_company_id');
    if (saved) return saved;
    return 'd00de100-3333-4444-5555-666677778888';
  });

  const [companyName, setCompanyName] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlEmpresa = params.get('empresa') || params.get('company');
      if (urlEmpresa) {
        const decoded = decodeURIComponent(urlEmpresa);
        localStorage.setItem('punto_nexus_company_name', decoded);
        return decoded;
      }
    }
    const saved = localStorage.getItem('punto_nexus_company_name');
    if (saved && !saved.includes('Donde Maqui') && !saved.includes('Almacén')) {
      return saved;
    }
    return 'SoLago';
  });

  // Multi-sucursal (Casa Matriz & Sucursales ancladas)
  const DEFAULT_MAIN_BRANCH = useMemo(() => ({
    id: 'branch-matriz',
    name: 'Matriz Principal',
    code: 'MATRIZ-01',
    is_main: true,
    business_type: 'gastronomia',
    address: 'Sede Central Principal',
    phone: '',
    manager: 'Administración General'
  }), []);

  const [branches, setBranches] = useState(() => {
    const keysToTry = [
      `punto_nexus_branches_${companyId || 'default'}`,
      `nexus_branches_${companyId || 'default'}`,
      `nexusRpm_branches_${companyId || 'default'}`,
      `nexusgarage_branches_${companyId || 'default'}`,
      `nexus_branches`
    ];

    for (const key of keysToTry) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return [DEFAULT_MAIN_BRANCH];
  });

  const [activeBranchId, setActiveBranchId] = useState(() => {
    const saved = localStorage.getItem(`punto_nexus_active_branch_${companyId || 'default'}`);
    return saved || 'branch-matriz';
  });

  const activeBranch = useMemo(() => {
    return branches.find(b => b.id === activeBranchId) || branches[0] || DEFAULT_MAIN_BRANCH;
  }, [branches, activeBranchId, DEFAULT_MAIN_BRANCH]);

  const DEFAULT_SYSTEM_USERS = useMemo(() => [
    {
      id: 'usr-matriz-1',
      email: 'almacen@smartlean.cl',
      full_name: 'Don Maqui',
      role: 'Administrador',
      branch_id: 'branch-matriz',
      allowed_branches: ['all']
    },
    {
      id: 'usr-matriz-2',
      email: 'dondemaqui@smartlean.cl',
      full_name: 'Don Maqui',
      role: 'Administrador',
      branch_id: 'branch-matriz',
      allowed_branches: ['all']
    },
    {
      id: 'usr-matriz-3',
      email: 'ariel.mellag@gmail.com',
      full_name: 'Ariel Mella',
      role: 'nexusowner',
      branch_id: 'branch-matriz',
      allowed_branches: ['all']
    },
    {
      id: 'usr-matriz-4',
      email: 'albenisjrv@gmail.com',
      full_name: 'Albenis',
      role: 'Administrador',
      branch_id: 'branch-matriz',
      allowed_branches: ['all']
    },
    {
      id: 'usr-matriz-5',
      email: 'rgfariac@gmail.com',
      full_name: 'Ricardo Faria',
      role: 'Administrador',
      branch_id: 'branch-matriz',
      allowed_branches: ['all']
    }
  ], []);

  const [systemUsers, setSystemUsers] = useState(() => {
    const cacheKey = `punto_nexus_system_users_${companyId || 'default'}`;
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_SYSTEM_USERS;
  });

  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [rawDbSales, setRawDbSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado de localización, tipo de cambio e identidad de marca (logo & colores)
  const [companySettings, setCompanySettings] = useState(() => {
    const saved = localStorage.getItem(`punto_nexus_company_settings_${companyId || 'default'}`);
    const parsed = saved ? JSON.parse(saved) : {};
    const defaultCountryCode = parsed.country || (parsed.currency_code === 'VES' ? 'VE' : 'CL');
    const cConf = getCountryConfig(defaultCountryCode);
    return {
      country: defaultCountryCode,
      currency_code: cConf.currencyCode,
      currency_symbol: cConf.currencySymbol,
      tax_name: cConf.taxName,
      tax_rate: cConf.defaultTaxRate,
      use_usd_pricing: cConf.useUsdPricingDefault,
      exchange_rate_source: 'manual',
      exchange_rate: 1.0,
      logo_url: '/logo.png',
      brand_color: '#0f172a',
      accent_color: '#06b6d4',
      ...parsed
    };
  });

  const countryConfig = useMemo(() => {
    return getCountryConfig(companySettings?.country || 'CL');
  }, [companySettings?.country]);

  // ─── GESTIÓN DE TURNOS Y CIERRE CIEGO DE CAJA MULTI-DIVISA ───
  const [shifts, setShifts] = useState(() => {
    if (!companyId) return [];
    const key = `punto_nexus_shifts_${companyId}`;
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Re-cargar turnos locales al cambiar de empresa
  useEffect(() => {
    if (!companyId) return;
    const key = `punto_nexus_shifts_${companyId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) setShifts(JSON.parse(saved));
      else setShifts([]);
    } catch (e) {}
  }, [companyId]);

  // Turno activo actualmente en esta sucursal
  const activeShift = useMemo(() => {
    const bId = activeBranchId || 'branch-matriz';
    return (shifts || []).find(s => 
      s && s.branch_id === bId && s.status === 'open'
    ) || null;
  }, [shifts, activeBranchId]);

  const persistShifts = (shiftsList) => {
    if (!companyId) return;
    const key = `punto_nexus_shifts_${companyId}`;
    try {
      localStorage.setItem(key, JSON.stringify(shiftsList));
    } catch (e) {}
  };

  // 1. APERTURA DE TURNO / CAJA
  const openShift = async ({ initial_cash_usd = 0, initial_cash_ves = 0, initial_bills_usd = null, initial_bills_ves = null }) => {
    const bId = activeBranchId || 'branch-matriz';
    const newShift = {
      id: generateUUID(),
      company_id: companyId,
      branch_id: bId,
      user_id: user?.id || 'cashier-local',
      user_name: user?.full_name || user?.email || 'Cajero Atendiendo',
      opened_at: new Date().toISOString(),
      closed_at: null,
      status: 'open',
      initial_cash_usd: Number(initial_cash_usd) || 0,
      initial_cash_ves: Number(initial_cash_ves) || 0,
      initial_bills_usd: initial_bills_usd || null,
      initial_bills_ves: initial_bills_ves || null,
      manual_movements: [],
      declared_closing: null
    };

    setShifts(prev => {
      const updated = [newShift, ...prev.filter(s => !(s.branch_id === bId && s.status === 'open'))];
      persistShifts(updated);
      return updated;
    });

    if (companyId && isUUID(companyId)) {
      try {
        await supabase.from('punto_nexus_shifts').insert([newShift]);
      } catch (e) {
        console.warn("Aviso registrando apertura de turno en Supabase:", e);
      }
    }

    return { success: true, shift: newShift };
  };

  // 2. MOVIMIENTOS EXTRAORDINARIOS DE CAJA CHICA (+ INGRESO / - RETIRO)
  const addShiftMovement = async ({ type = 'in', amount_usd = 0, amount_ves = 0, reason = '' }) => {
    if (!activeShift) return { error: "No hay un turno de caja abierto." };

    const movementObj = {
      id: generateUUID(),
      type, // 'in' | 'out'
      amount_usd: Number(amount_usd) || 0,
      amount_ves: Number(amount_ves) || 0,
      reason: reason.trim() || (type === 'in' ? 'Aporte de cambio' : 'Gasto de caja chica'),
      user_name: user?.full_name || user?.email || 'Cajero',
      created_at: new Date().toISOString()
    };

    let updatedShiftObj = null;
    setShifts(prev => {
      const updated = prev.map(s => {
        if (s.id === activeShift.id) {
          const currentMovs = Array.isArray(s.manual_movements) ? s.manual_movements : [];
          updatedShiftObj = {
            ...s,
            manual_movements: [...currentMovs, movementObj]
          };
          return updatedShiftObj;
        }
        return s;
      });
      persistShifts(updated);
      return updated;
    });

    if (companyId && isUUID(companyId) && isUUID(activeShift.id)) {
      try {
        await supabase
          .from('punto_nexus_shifts')
          .update({ manual_movements: updatedShiftObj.manual_movements })
          .eq('id', activeShift.id);
      } catch (e) {
        console.warn("Aviso guardando movimiento de turno en Supabase:", e);
      }
    }

    return { success: true, movement: movementObj };
  };

  // 3. CIERRE CIEGO DE TURNO
  const closeShiftBlind = async ({
    declared_cash_usd = 0,
    declared_cash_ves = 0,
    declared_card_ves = 0,
    declared_pago_movil_ves = 0,
    declared_zelle_usd = 0,
    declared_binance_usdt = 0,
    declared_bills_usd = null,
    declared_bills_ves = null,
    notes = ''
  }) => {
    if (!activeShift) return { error: "No hay un turno de caja activo para cerrar." };

    const closedAt = new Date().toISOString();
    const declaredObj = {
      closed_at: closedAt,
      closed_by: user?.full_name || user?.email || 'Cajero',
      cash_usd: Number(declared_cash_usd) || 0,
      cash_ves: Number(declared_cash_ves) || 0,
      card_pos_ves: Number(declared_card_ves) || 0,
      pago_movil_ves: Number(declared_pago_movil_ves) || 0,
      zelle_usd: Number(declared_zelle_usd) || 0,
      binance_usdt: Number(declared_binance_usdt) || 0,
      bills_usd: declared_bills_usd || null,
      bills_ves: declared_bills_ves || null,
      notes: notes.trim() || ''
    };

    let closedShiftResult = null;

    setShifts(prev => {
      const updated = prev.map(s => {
        if (s.id === activeShift.id) {
          closedShiftResult = {
            ...s,
            status: 'closed',
            closed_at: closedAt,
            declared_closing: declaredObj
          };
          return closedShiftResult;
        }
        return s;
      });
      persistShifts(updated);
      return updated;
    });

    if (companyId && isUUID(companyId) && isUUID(activeShift.id)) {
      try {
        await supabase
          .from('punto_nexus_shifts')
          .update({
            status: 'closed',
            closed_at: closedAt,
            declared_closing: declaredObj
          })
          .eq('id', activeShift.id);
      } catch (e) {
        console.warn("Aviso cerrando turno en Supabase:", e);
      }
    }

    return { success: true, shift: closedShiftResult };
  };

  // Historial cambiario por fecha y tienda
  const [rateHistory, setRateHistory] = useState(() => {
    const saved = localStorage.getItem('punto_nexus_rate_history');
    return saved ? JSON.parse(saved) : [];
  });

  // ─── AUTO-SINCRONIZACIÓN SILENCIOSA: USD (BCV + Paralelo) y EUR al iniciar la app ───
  // Actualiza 2 veces al día (Franja AM: a partir de 8:00 AM, Franja PM: a partir de 16:30 PM VET)
  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const vetHour = (now.getUTCHours() - 4 + 24) % 24;
    const currentSlot = (vetHour >= 16 || (vetHour === 16 && now.getUTCMinutes() >= 30)) ? 'PM' : 'AM';
    const currentSlotKey = `${today}-${currentSlot}`;
    const autoSyncAll = async () => {
      try {
        let fetchedBcv = 0;
        let fetchedEuro = 0;
        let fetchedParalelo = 0;

        // Consultar la API interna (/api/exchange-rates) protegida con caché CDN (3h)
        const resApi = await fetch('/api/exchange-rates').catch(() => null);
        if (resApi?.ok && resApi.headers.get('content-type')?.includes('application/json')) {
          const data = await resApi.json().catch(() => null);
          if (data?.success) {
            fetchedBcv = Number(data.bcv || 0);
            fetchedEuro = Number(data.euro || 0);
            fetchedParalelo = Number(data.paralelo || 0);
          }
        }

        if (fetchedBcv > 1) {
          setBcvRate(fetchedBcv);
          localStorage.setItem('punto_nexus_bcv_rate', String(fetchedBcv));
        }
        if (fetchedEuro > 1) {
          setEuroRate(fetchedEuro);
          localStorage.setItem('punto_nexus_euro_rate', String(fetchedEuro));
        }
        if (fetchedParalelo > 1) {
          setParaleloRate(fetchedParalelo);
          localStorage.setItem('punto_nexus_paralelo_rate', String(fetchedParalelo));
        }

        if (fetchedBcv > 1 || fetchedEuro > 1 || fetchedParalelo > 1) {
          localStorage.setItem('punto_nexus_bcv_last_updated', currentSlotKey);
          setBcvLastUpdated(`${today} (${currentSlot})`);

          // Sincronizar automáticamente la tasa activa de la empresa
          const activeSource = companySettings?.exchange_rate_source || 'bcv';
          if (activeSource !== 'manual') {
            const activeRateVal = activeSource === 'bcv'
              ? fetchedBcv
              : (activeSource === 'euro' ? fetchedEuro : (fetchedParalelo || fetchedBcv));
            if (activeRateVal > 1) {
              setCompanySettings(prev => ({ ...prev, exchange_rate: activeRateVal }));
            }
          }
          console.info(`[SoLago - MontosVE] Tasas actualizadas (${currentSlot}) — BCV: ${fetchedBcv} | EUR: ${fetchedEuro} | Paralelo: ${fetchedParalelo}`);
        }
      } catch (err) {
        console.warn('[SoLago] Auto-sync BCV/EUR (MontosVE) falló silenciosamente:', err.message);
      }
    };

    autoSyncAll();
  }, []);
  // ─────────────────────────────────────────────────────────────────────────────

  // Sincronización automática de sucursales por empresa (companyId)
  useEffect(() => {
    if (!companyId || !branches || branches.length === 0) return;
    const ecosystemKeys = [
      `punto_nexus_branches_${companyId}`,
      `nexus_branches_${companyId}`,
      `nexusRpm_branches_${companyId}`,
      `nexusgarage_branches_${companyId}`
    ];
    ecosystemKeys.forEach(key => {
      localStorage.setItem(key, JSON.stringify(branches));
    });
  }, [branches, companyId]);

  // ─── CARGA DE SUCURSALES DESDE SUPABASE AL CAMBIAR company_id ───────────────
  // ─── AUTO-SINCRONIZACIÓN Y CARGA DE SUCURSALES DESDE SUPABASE ───────────────
  // Garantiza que CUALQUIER cuenta con el mismo company_id vea las mismas sucursales,
  // independientemente del dispositivo o usuario que las creó.
  const syncBranchesFromDB = useCallback(async (targetCompId = companyId) => {
    if (!targetCompId) return;
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetCompId);
    if (!isValidUUID) return;

    try {
      let data = null;

      const resPrimary = await supabase
        .from('punto_nexus_branches')
        .select('*')
        .eq('company_id', targetCompId)
        .order('created_at', { ascending: true });

      if (!resPrimary.error && resPrimary.data) {
        data = resPrimary.data;
      } else {
        const resAlt = await supabase
          .from('branches')
          .select('*')
          .eq('company_id', targetCompId);
        if (!resAlt.error && resAlt.data) {
          data = resAlt.data;
        }
      }

      if (data && data.length > 0) {
        const hasMain = data.some(b => b.is_main || b.id === 'branch-matriz');
        const merged = hasMain ? data : [DEFAULT_MAIN_BRANCH, ...data];
        setBranches(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(merged)) {
            return merged;
          }
          return prev;
        });
        const cacheKey = `punto_nexus_branches_${targetCompId}`;
        localStorage.setItem(cacheKey, JSON.stringify(merged));
      } else {
        const defaultOnly = [DEFAULT_MAIN_BRANCH];
        setBranches(defaultOnly);
        localStorage.setItem(`punto_nexus_branches_${targetCompId}`, JSON.stringify(defaultOnly));
      }
    } catch (err) {
      console.warn("[Nexus Sync] Aviso al sincronizar sucursales desde BD:", err);
    }
  }, [companyId, DEFAULT_MAIN_BRANCH]);

  const syncInventoryFromDB = useCallback(async (targetCompId = companyId) => {
    if (!targetCompId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetCompId)) return;
    try {
      const { data, error } = await supabase
        .from('punto_nexus_inventory')
        .select('*')
        .eq('company_id', targetCompId)
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        const deduped = dedupeInventory(data);
        setInventory(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(deduped)) {
            return deduped;
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn("[Nexus Sync] Error refrescando inventario:", e);
    }
  }, [companyId]);

  const syncSystemUsersFromDB = useCallback(async (targetCompId = companyId) => {
    if (!targetCompId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetCompId)) return;
    try {
      const { data, error } = await supabase
        .from('punto_nexus_users')
        .select('*')
        .eq('company_id', targetCompId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const formatted = data.map(u => ({
          ...u,
          branch_id: u.branch_id || 'branch-matriz',
          allowed_branches: Array.isArray(u.allowed_branches) 
            ? u.allowed_branches 
            : (typeof u.allowed_branches === 'string' ? JSON.parse(u.allowed_branches || '["all"]') : ['all'])
        }));

        setSystemUsers(prev => {
          const mergedMap = new Map();
          (prev || []).forEach(u => {
            if (u.email) mergedMap.set(u.email.toLowerCase().trim(), u);
          });
          formatted.forEach(u => {
            if (u.email) mergedMap.set(u.email.toLowerCase().trim(), u);
          });

          const mergedList = Array.from(mergedMap.values());
          if (JSON.stringify(prev) !== JSON.stringify(mergedList)) {
            localStorage.setItem(`punto_nexus_system_users_${targetCompId}`, JSON.stringify(mergedList));
            return mergedList;
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn('[Nexus Sync] Error refrescando usuarios:', e);
    }
  }, [companyId]);

  const syncSalesFromDB = useCallback(async (targetCompId = companyId) => {
    if (!targetCompId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetCompId)) return;
    try {
      const { data, error } = await supabase
        .from('punto_nexus_sales')
        .select('*')
        .eq('company_id', targetCompId)
        .order('sold_at', { ascending: false });

      if (!error && data) {
        setRawDbSales(data);

        const branchSalesKey = `punto_nexus_sales_${targetCompId}_${activeBranchId}`;
        const localSalesRaw = localStorage.getItem(branchSalesKey);
        let localSalesParsed = [];
        if (localSalesRaw) {
          try { localSalesParsed = JSON.parse(localSalesRaw); } catch (e) {}
        }

        const merged = mergeBranchSales(data, localSalesParsed, activeBranchId);
        setSales(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(merged)) {
            localStorage.setItem(branchSalesKey, JSON.stringify(merged));
            return merged;
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn("[Nexus Sync] Error refrescando ventas:", e);
    }
  }, [companyId, activeBranchId]);

  // ─── EFECTO AL CAMBIAR DE EMPRESA / TIENDA ACTIVA (companyId) ───────────────
  useEffect(() => {
    if (!companyId) return;

    // 1. Cargar Sucursales locales para esta empresa específica
    const branchKey = `punto_nexus_branches_${companyId}`;
    const savedBranches = localStorage.getItem(branchKey);
    if (savedBranches) {
      try {
        const parsed = JSON.parse(savedBranches);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBranches(parsed);
        } else {
          setBranches([DEFAULT_MAIN_BRANCH]);
        }
      } catch (e) {
        setBranches([DEFAULT_MAIN_BRANCH]);
      }
    } else {
      setBranches([DEFAULT_MAIN_BRANCH]);
    }

    // 2. Cargar Sucursal activa para esta empresa
    const savedActiveBranch = localStorage.getItem(`punto_nexus_active_branch_${companyId}`);
    setActiveBranchId(savedActiveBranch || 'branch-matriz');

    // 3. Cargar Usuarios del sistema para esta empresa
    const usersKey = `punto_nexus_system_users_${companyId}`;
    const savedUsers = localStorage.getItem(usersKey);
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
          setSystemUsers(parsedUsers);
        } else {
          setSystemUsers(DEFAULT_SYSTEM_USERS);
        }
      } catch (e) {
        setSystemUsers(DEFAULT_SYSTEM_USERS);
      }
    } else {
      setSystemUsers(DEFAULT_SYSTEM_USERS);
    }

    // 4. Cargar Ajustes de empresa (Settings) aislados estrictamente por companyId
    const settingsKey = `punto_nexus_company_settings_${companyId}`;
    const savedSettings = localStorage.getItem(settingsKey);
    const defaultSettings = {
      country: 'CL',
      currency_code: 'CLP',
      currency_symbol: '$',
      tax_name: 'IVA',
      tax_rate: 0.19,
      use_usd_pricing: false,
      exchange_rate_source: 'manual',
      exchange_rate: 1.0,
      logo_url: '/logo.png',
      brand_color: '#0f172a',
      accent_color: '#06b6d4',
      enabled_modules: ['dashboard', 'pos', 'tables', 'inventory', 'finances', 'branches', 'history', 'showcase']
    };

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setCompanySettings({
          ...defaultSettings,
          ...parsedSettings
        });
      } catch (e) {
        setCompanySettings(defaultSettings);
      }
    } else {
      setCompanySettings(defaultSettings);
    }

    // 5. Cargar Inventario y Ventas locales para esta empresa
    const targetBranchId = savedActiveBranch || 'branch-matriz';
    const localInv = localStorage.getItem(`punto_nexus_inventory_${companyId}_${targetBranchId}`) || localStorage.getItem(`punto_nexus_inventory_${companyId}`);
    if (localInv) {
      try {
        const parsedInv = JSON.parse(localInv);
        if (Array.isArray(parsedInv)) setInventory(parsedInv);
      } catch (e) {}
    }

    const localSales = localStorage.getItem(`punto_nexus_sales_${companyId}_${targetBranchId}`) || localStorage.getItem(`punto_nexus_sales_${companyId}`);
    if (localSales) {
      try {
        const parsedSales = JSON.parse(localSales);
        if (Array.isArray(parsedSales)) setSales(parsedSales);
      } catch (e) {}
    }

    // 6. Si es un UUID válido de Supabase, sincronizar BD en tiempo real
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
    if (!isValidUUID) return;

    syncBranchesFromDB(companyId);
    syncInventoryFromDB(companyId);
    syncSalesFromDB(companyId);
    syncSystemUsersFromDB(companyId);

    const interval = setInterval(() => {
      syncBranchesFromDB(companyId);
      syncInventoryFromDB(companyId);
      syncSalesFromDB(companyId);
    }, 3000);

    const handleFocus = () => {
      syncBranchesFromDB(companyId);
      syncInventoryFromDB(companyId);
      syncSalesFromDB(companyId);
    };
    window.addEventListener('focus', handleFocus);

    let channel = null;
    try {
      channel = supabase
        .channel(`nexus-realtime-all-${companyId}`)
        .on('postgres_changes', { event: '*', table: 'punto_nexus_branches' }, () => {
          syncBranchesFromDB(companyId);
        })
        .on('postgres_changes', { event: '*', table: 'punto_nexus_inventory' }, () => {
          syncInventoryFromDB(companyId);
        })
        .on('postgres_changes', { event: '*', table: 'punto_nexus_sales' }, () => {
          syncSalesFromDB(companyId);
        })
        .on('postgres_changes', { event: '*', table: 'punto_nexus_users' }, () => {
          syncSystemUsersFromDB(companyId);
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.info("Aviso Sincronización Realtime: canal alternativo activo por intervalos.");
          }
        });
    } catch (rtEx) {
      console.info("Aviso inicializando canal Realtime:", rtEx);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (channel) {
        try { supabase.removeChannel(channel); } catch (e) {}
      }
    };
  }, [companyId, DEFAULT_MAIN_BRANCH, DEFAULT_SYSTEM_USERS, syncBranchesFromDB, syncInventoryFromDB, syncSalesFromDB, syncSystemUsersFromDB]);
  // ─────────────────────────────────────────────────────────────────────────────

  const addBranch = async (branchData) => {
    const targetCompId = branchData.company_id || companyId;
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetCompId);
    
    const newBranch = {
      id: branchData.id || `branch-${Date.now()}`,
      company_id: targetCompId,
      name: branchData.name,
      code: branchData.code || `SUC-${Math.floor(10 + Math.random() * 90)}`,
      business_type: branchData.business_type || 'alimentos',
      address: branchData.address || 'Sucursal Anclada',
      phone: branchData.phone || '',
      manager: branchData.manager || '',
      is_main: false,
      created_at: new Date().toISOString()
    };

    const updatedBranches = [...branches.filter(b => b.id !== newBranch.id), newBranch];
    setBranches(updatedBranches);
    
    // Guardar en caché local (todas las claves del ecosistema Nexus)
    const ecosystemKeys = [
      `punto_nexus_branches_${targetCompId}`,
      `nexus_branches_${targetCompId}`,
      `nexusRpm_branches_${targetCompId}`,
      `nexusgarage_branches_${targetCompId}`,
      `nexus_branches`
    ];
    ecosystemKeys.forEach(key => {
      localStorage.setItem(key, JSON.stringify(updatedBranches));
    });

    setActiveBranchId(newBranch.id);
    localStorage.setItem(`punto_nexus_active_branch_${targetCompId}`, newBranch.id);

    const newBranchSettings = {
      ...companySettings,
      business_type: newBranch.business_type
    };
    setCompanySettings(newBranchSettings);
    localStorage.setItem(`punto_nexus_company_settings_${targetCompId}`, JSON.stringify(newBranchSettings));
    localStorage.setItem(`punto_nexus_company_settings_${targetCompId}_${newBranch.id}`, JSON.stringify(newBranchSettings));

    // ─── PERSISTIR EN SUPABASE (para que CUALQUIER cuenta con este company_id la vea) ───
    if (isValidUUID) {
      try {
        const dbBranchPayload = {
          company_id: newBranch.company_id,
          name: newBranch.name,
          code: newBranch.code,
          address: newBranch.address,
          phone: newBranch.phone || '',
          is_main: newBranch.is_main
        };

        let { data: inserted, error: branchErr } = await supabase
          .from('punto_nexus_branches')
          .insert([dbBranchPayload])
          .select();

        if (branchErr) {
          console.warn('[Nexus] Aviso al guardar sucursal en Supabase (disponible localmente):', branchErr.message);
          try {
            await supabase.from('branches').insert([dbBranchPayload]);
          } catch (e) {}
        } else if (inserted && inserted.length > 0) {
          const finalBranch = { ...newBranch, ...inserted[0] };
          setBranches(prev => [...prev.filter(b => b.id !== newBranch.id), finalBranch]);
          setActiveBranchId(finalBranch.id);
          console.info(`[Nexus] Sucursal "${finalBranch.name}" sincronizada en Supabase para todas las cuentas de ${targetCompId}`);
        }
      } catch (err) {
        console.warn('[Nexus] Excepción guardando sucursal en Supabase:', err.message);
      }
    }

    return { branch: newBranch, error: null };
  };

  const updateBranch = async (branchId, updatedFields) => {
    // 1. Actualizar estado en memoria local inmediatamente
    const updatedBranches = branches.map(b => {
      if (b.id === branchId || (branchId === 'branch-matriz' && (b.is_main || b.isMain))) {
        return { ...b, ...updatedFields };
      }
      return b;
    });

    setBranches(updatedBranches);

    // 2. Sincronizar en cachés de almacenamiento local
    const ecosystemKeys = [
      `punto_nexus_branches_${companyId}`,
      `nexus_branches_${companyId}`,
      `nexusRpm_branches_${companyId}`,
      `nexusgarage_branches_${companyId}`,
      `nexus_branches`
    ];
    ecosystemKeys.forEach(key => {
      localStorage.setItem(key, JSON.stringify(updatedBranches));
    });

    // 3. Sanitizar campos a actualizar en Supabase (únicamente columnas nativas)
    const dbPayload = {};
    if (updatedFields.name !== undefined) dbPayload.name = updatedFields.name;
    if (updatedFields.code !== undefined) dbPayload.code = updatedFields.code;
    if (updatedFields.address !== undefined) dbPayload.address = updatedFields.address;
    if (updatedFields.phone !== undefined) dbPayload.phone = updatedFields.phone;
    if (updatedFields.is_main !== undefined) dbPayload.is_main = updatedFields.is_main;

    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
    if (isValidUUID && Object.keys(dbPayload).length > 0) {
      try {
        const isBranchUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(branchId);

        if (isBranchUUID) {
          // Es un UUID nativo de Supabase
          const { error: updateErr } = await supabase
            .from('punto_nexus_branches')
            .update(dbPayload)
            .eq('id', branchId);

          if (updateErr) {
            console.warn('[Nexus] Aviso al actualizar sucursal UUID en Supabase:', updateErr.message);
          }
        } else {
          // Es 'branch-matriz' u otra sucursal sin id UUID
          const { data: updated, error: updateErr } = await supabase
            .from('punto_nexus_branches')
            .update(dbPayload)
            .eq('company_id', companyId)
            .eq('is_main', true)
            .select();

          // Si no existía la fila is_main en Supabase, se crea e inserta
          if (!updateErr && (!updated || updated.length === 0)) {
            const currentBranch = branches.find(b => b.id === branchId || b.is_main || b.isMain) || {};
            await supabase
              .from('punto_nexus_branches')
              .insert([{
                company_id: companyId,
                name: dbPayload.name || currentBranch.name || 'Matriz Principal',
                code: dbPayload.code || currentBranch.code || 'MATRIZ-01',
                address: dbPayload.address || currentBranch.address || '',
                phone: dbPayload.phone || currentBranch.phone || '',
                is_main: true
              }]);
          }
        }

        // Sincronizar nuevamente desde la BD para reflejar IDs
        setTimeout(() => syncBranchesFromDB(companyId), 400);

      } catch (err) {
        console.warn('[Nexus] Excepción al actualizar sucursal en Supabase:', err.message);
      }
    }

    return { success: true };
  };

  const deleteBranch = async (branchId) => {
    const targetBranch = branches.find(b => b.id === branchId || (branchId === 'branch-matriz' && (b.is_main || b.isMain)));
    
    // Bloquear eliminación si es la Casa Matriz Principal
    if (targetBranch && (targetBranch.is_main || targetBranch.isMain || targetBranch.id === 'branch-matriz')) {
      return { success: false, error: 'No se puede eliminar la Casa Matriz Principal.' };
    }

    // 1. Filtrar sucursales en memoria
    const updatedBranches = branches.filter(b => b.id !== branchId);
    setBranches(updatedBranches);

    // 2. Si la sucursal activa era la eliminada, conmuta automáticamente a la Matriz
    if (activeBranchId === branchId) {
      const mainB = updatedBranches.find(b => b.is_main || b.isMain) || updatedBranches[0] || DEFAULT_MAIN_BRANCH;
      setActiveBranchId(mainB.id);
    }

    // 3. Sincronizar en cachés de almacenamiento local
    const ecosystemKeys = [
      `punto_nexus_branches_${companyId}`,
      `nexus_branches_${companyId}`,
      `nexusRpm_branches_${companyId}`,
      `nexusgarage_branches_${companyId}`,
      `nexus_branches`
    ];
    ecosystemKeys.forEach(key => {
      localStorage.setItem(key, JSON.stringify(updatedBranches));
    });

    // 4. Eliminar registro en Supabase si posee un UUID válido
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);
    const isBranchUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(branchId);

    if (isValidUUID && isBranchUUID) {
      try {
        const { error: delErr } = await supabase
          .from('punto_nexus_branches')
          .delete()
          .eq('id', branchId);

        if (delErr) {
          console.warn('[Nexus] Aviso al eliminar sucursal en Supabase:', delErr.message);
          try {
            await supabase.from('branches').delete().eq('id', branchId);
          } catch (e) {}
        }
      } catch (err) {
        console.warn('[Nexus] Excepción al eliminar sucursal en Supabase:', err.message);
      }
    }

    return { success: true };
  };

  useEffect(() => {
    const isUserRole = user?.role === 'user' || user?.role === 'Cajero';
    if (isUserRole && user?.branch_id && activeBranchId !== user.branch_id) {
      setActiveBranchId(user.branch_id);
    }
  }, [user, activeBranchId]);

  const switchBranch = (targetBranchId) => {
    const isUserRole = user?.role === 'user' || user?.role === 'Cajero';
    if (isUserRole && user?.branch_id && targetBranchId !== user.branch_id) {
      console.warn("[Nexus Security] Acceso restringido: Las cuentas de rol Cajero/Usuario tienen fija su sucursal asignada.");
      return;
    }

    const targetBranch = branches.find(b => b.id === targetBranchId);
    if (!targetBranch) return;

    setActiveBranchId(targetBranchId);
    localStorage.setItem(`punto_nexus_active_branch_${companyId}`, targetBranchId);

    const branchSettingsKey = `punto_nexus_company_settings_${companyId}_${targetBranchId}`;
    const savedBranchSettings = localStorage.getItem(branchSettingsKey);
    let branchSettings = savedBranchSettings ? JSON.parse(savedBranchSettings) : {};

    const targetGiro = branchSettings.business_type || targetBranch.business_type || (targetBranch.is_main ? 'gastronomia' : 'alimentos');

    const updatedSettings = {
      ...companySettings,
      ...branchSettings,
      business_type: targetGiro
    };

    setCompanySettings(updatedSettings);
    localStorage.setItem(`punto_nexus_company_settings_${companyId}`, JSON.stringify(updatedSettings));
  };



  const [bcvRate, setBcvRate] = useState(() => {
    return Number(localStorage.getItem('punto_nexus_bcv_rate')) || 0;
  });

  const [paraleloRate, setParaleloRate] = useState(() => {
    return Number(localStorage.getItem('punto_nexus_paralelo_rate')) || 0;
  });

  const [euroRate, setEuroRate] = useState(() => {
    return Number(localStorage.getItem('punto_nexus_euro_rate')) || 0;
  });

  const [bcvLastUpdated, setBcvLastUpdated] = useState(() => {
    return localStorage.getItem('punto_nexus_bcv_last_updated') || null;
  });

  const recordRateHistory = (newRate, source = 'manual', currencyOverride = null) => {
    const rateNum = Number(newRate);
    if (!rateNum || rateNum <= 0) return;
    const currency = currencyOverride || companySettings.currency_code || 'VES';
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const storeName = companyName || 'Donde Maqui (Tienda Principal)';

    setRateHistory(prev => {
      const currentList = Array.isArray(prev) ? prev : [];
      // Reemplazar la entrada de hoy para la MISMA fuente y MISMA moneda
      const filtered = currentList.filter(item => !(item.date === todayStr && item.currency === currency && item.source === source));
      const newEntry = {
        id: `rate-${source}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: todayStr,
        time: timeStr,
        currency: currency,
        rate: rateNum,
        updatedBy: storeName,
        source: source || companySettings.exchange_rate_source || 'manual'
      };
      const updated = [...filtered, newEntry];
      localStorage.setItem('punto_nexus_rate_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Estado global para la moneda primaria (Normal vs Intercambiada)
  const [isCurrencySwapped, setIsCurrencySwapped] = useState(() => {
    // Forzar Bolívares (Bs.) como moneda principal predeterminada en grande
    localStorage.setItem('punto_nexus_currency_swapped', 'false');
    return false;
  });

  const toggleCurrencyOrder = () => {
    setIsCurrencySwapped(prev => {
      const next = !prev;
      localStorage.setItem('punto_nexus_currency_swapped', String(next));
      return next;
    });
  };


  const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  // Sincronizar el perfil del usuario activo (por si hay cambios de rol en la BD)
  useEffect(() => {
    if (!user || !user.email) return;

    const syncUserProfile = async () => {
      const isMock = !isUUID(companyId);
      if (isMock) return;

      try {
        const { data, error } = await supabase
          .from('punto_nexus_users')
          .select('*')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();

        if (!error && data) {
          const updatedUser = { ...user, role: data.role, name: data.full_name || user.name };
          if (user.role !== data.role || user.name !== (data.full_name || user.name)) {
            setUser(updatedUser);
            localStorage.setItem('punto_nexus_user', JSON.stringify(updatedUser));
          }
        }
      } catch (e) {
        console.error("Error sincronizando perfil de usuario:", e);
      }
    };

    syncUserProfile();
  }, [user?.email, companyId]);

  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      try {
        return crypto.randomUUID();
      } catch (e) {}
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const saveProductBranchMapping = (prodId, sku, prodName, bId) => {
    if (!companyId || !bId) return;
    const mapKey = `punto_nexus_product_branches_${companyId}`;
    let map = {};
    try {
      const raw = localStorage.getItem(mapKey);
      if (raw) map = JSON.parse(raw);
    } catch (e) {}
    if (prodId) map[prodId] = bId;
    if (sku) map[sku] = bId;
    if (prodName) map[prodName] = bId;
    localStorage.setItem(mapKey, JSON.stringify(map));
  };

  const cleanSkuDisplay = (sku) => {
    if (!sku) return '';
    return sku.replace(/\[b:[^\]]+\]/g, '').trim();
  };

  const extractProductBranchId = (prod, defaultBranchId = 'branch-matriz') => {
    if (!prod) return defaultBranchId;
    if (prod.branch_id) return prod.branch_id;
    if (prod._branch_id) return prod._branch_id;
    if (prod.branchId) return prod.branchId;

    // 1. Intentar extraer branch_id incrustado en el SKU (ej: "MINI-QSO-001[b:branch-sucursal-prueba]")
    const skuStr = prod.sku || '';
    const matchSku = skuStr.match(/\[b:([^\]]+)\]/);
    if (matchSku && matchSku[1]) {
      return matchSku[1];
    }

    // 2. Intentar consultar el mapa local de sucursales por producto
    const mapRaw = localStorage.getItem(`punto_nexus_product_branches_${companyId}`);
    if (mapRaw) {
      try {
        const map = JSON.parse(mapRaw);
        const key = prod.id || cleanSkuDisplay(prod.sku) || prod.name;
        if (map && map[key]) return map[key];
      } catch (e) {}
    }

    return defaultBranchId;
  };

  const cleanCategoryDisplay = (category) => {
    if (!category) return '';
    return category.replace(/\[b:[^\]]+\]/g, '').trim();
  };

  const sanitizeInventoryPayloadForSupabase = (prod, compId) => {
    const bId = prod.branch_id || activeBranchId || 'branch-matriz';
    const rawSku = cleanSkuDisplay(prod.sku || '');
    const encodedSku = bId && bId !== 'branch-matriz' ? `${rawSku}[b:${bId}]`.trim() : rawSku;
    const isExemptBool = !!prod.is_exempt || !!prod.is_tax_exempt;

    const clean = {
      company_id: compId,
      name: prod.name || '',
      sku: encodedSku,
      category: prod.category || prod.categoria || '',
      cost_price: Number(prod.cost_price) || 0,
      sell_price: Number(prod.sell_price) || 0,
      stock: Number(prod.stock) || 0,
      min_stock: Number(prod.min_stock) || 5,
      image_url: prod.image_url || '',
      description: prod.description || '',
      is_exempt: isExemptBool,
      is_tax_exempt: isExemptBool
    };
    if (prod.id && isUUID(prod.id)) {
      clean.id = prod.id;
    }
    return clean;
  };

  const dedupeInventory = (items) => {
    if (!Array.isArray(items)) return [];
    const seen = new Set();
    return items.map(item => {
      const bId = extractProductBranchId(item, 'branch-matriz');
      const cleanSku = cleanSkuDisplay(item.sku || '');
      const cleanCat = cleanCategoryDisplay(item.category || item.categoria || '');
      const isExemptBool = !!item.is_exempt || !!item.is_tax_exempt;
      return {
        ...item,
        branch_id: bId,
        sku: cleanSku,
        category: cleanCat,
        is_exempt: isExemptBool,
        is_tax_exempt: isExemptBool
      };
    }).filter(item => {
      if (!item) return false;
      const key = `${item.branch_id || 'branch-matriz'}_${item.id || item.sku || item.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const extractSaleBranchId = (sale, defaultBranchId = 'branch-matriz') => {
    if (!sale) return defaultBranchId;
    if (sale.branch_id) return sale.branch_id;
    if (sale._branch_id) return sale._branch_id;

    if (Array.isArray(sale.items) && sale.items.length > 0) {
      const firstWithBranch = sale.items.find(i => i && (i.branch_id || i._branch_id));
      if (firstWithBranch) return firstWithBranch.branch_id || firstWithBranch._branch_id;
    } else if (typeof sale.items === 'object' && sale.items !== null) {
      if (sale.items.branch_id) return sale.items.branch_id;
      if (sale.items._branch_id) return sale.items._branch_id;
    }

    return defaultBranchId;
  };

  const mergeBranchSales = (dbList, localList, currentBranchId) => {
    const map = new Map();

    // 1. Cargar primero las ventas de la caché local de esta sucursal específica
    (localList || []).forEach(s => {
      if (!s) return;
      const bId = extractSaleBranchId(s, currentBranchId);
      if (bId === currentBranchId) {
        const key = String(s.id || s.sold_at);
        map.set(key, { ...s, branch_id: bId });
      }
    });

    // 2. Fusionar ventas de la Base de Datos que pertenecen a esta sucursal específica
    (dbList || []).forEach(s => {
      if (!s) return;
      const key = String(s.id || s.sold_at);
      const localMatch = map.get(key);
      const dbBranchId = s.branch_id || extractSaleBranchId(s, null);
      const bId = dbBranchId || (localMatch ? localMatch.branch_id : currentBranchId);

      if (bId === currentBranchId) {
        map.set(key, {
          ...s,
          ...localMatch,
          branch_id: bId
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.sold_at || 0) - new Date(a.sold_at || 0));
  };

  // Carga de datos al tener compañía o sucursal activa
  useEffect(() => {
    if (!companyId || !activeBranchId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      const isMock = !isUUID(companyId);
      const branchInvKey = `punto_nexus_inventory_${companyId}_${activeBranchId}`;
      const branchSalesKey = `punto_nexus_sales_${companyId}_${activeBranchId}`;

      const currentBranch = branches.find(b => b.id === activeBranchId) || activeBranch;
      const currentGiro = companySettings.business_type || currentBranch?.business_type || (currentBranch?.is_main ? 'gastronomia' : 'alimentos');

      if (isMock) {
        // Carga de LocalStorage independiente por sucursal activa
        const localInv = localStorage.getItem(branchInvKey);
        const localSales = localStorage.getItem(branchSalesKey);

        if (localInv) {
          try {
            const parsed = JSON.parse(localInv);
            const deduped = dedupeInventory(parsed);
            setInventory(deduped);
          } catch (e) {
            const fallbackCat = currentGiro === 'alimentos' ? MINIMARKET_PRODUCTS : DEFAULT_PRODUCTS;
            setInventory(fallbackCat);
            localStorage.setItem(branchInvKey, JSON.stringify(fallbackCat));
          }
        } else {
          const legacyInv = currentBranch?.is_main ? localStorage.getItem(`punto_nexus_inventory_${companyId}`) : null;
          let initialCatalog = currentGiro === 'alimentos' ? MINIMARKET_PRODUCTS : DEFAULT_PRODUCTS;
          if (legacyInv) {
            try { initialCatalog = dedupeInventory(JSON.parse(legacyInv)); } catch (e) {}
          }
          setInventory(initialCatalog);
          localStorage.setItem(branchInvKey, JSON.stringify(initialCatalog));
        }

        const resetKey = `punto_nexus_sales_cleared_v2_${companyId}`;
        if (!localStorage.getItem(resetKey)) {
          // Vaciar ventas legacy para iniciar desde 0 en todas las sucursales
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.includes('punto_nexus_sales') || k.includes('nexus_gestion_incomes'))) {
              localStorage.removeItem(k);
            }
          }
          localStorage.setItem(resetKey, 'true');
          setSales([]);
        } else if (localSales) {
          try {
            const parsed = JSON.parse(localSales);
            const cleanBranchSales = parsed.filter(s => s.branch_id === activeBranchId);
            setSales(cleanBranchSales);
          } catch (e) {
            setSales([]);
          }
        } else {
          setSales([]);
          localStorage.setItem(branchSalesKey, JSON.stringify([]));
        }

        // Cargar ajustes mock para Donde Maqui o sucursal específica
        if (companyId === 'company-123') {
          setCompanySettings({
            company_id: 'company-123',
            country: 'VE',
            currency_code: 'VES',
            currency_symbol: 'Bs.',
            tax_name: 'IVA',
            tax_rate: 0.16,
            use_usd_pricing: true,
            exchange_rate_source: 'bcv',
            exchange_rate: 36.50
          });
        } else {
          const savedBranchSettingsKey = `punto_nexus_company_settings_${companyId}_${activeBranchId}`;
          const savedBranchSettings = localStorage.getItem(savedBranchSettingsKey);
          const parsedBranchSettings = savedBranchSettings ? JSON.parse(savedBranchSettings) : {};

          setCompanySettings(prev => ({
            company_id: companyId,
            country: 'CL',
            currency_code: 'CLP',
            currency_symbol: '$',
            tax_name: 'IVA',
            tax_rate: 0.19,
            use_usd_pricing: false,
            exchange_rate_source: 'manual',
            exchange_rate: 1.00,
            business_type: currentGiro,
            ...parsedBranchSettings
          }));
        }
        setLoading(false);
      } else {
        // Carga de Supabase Real por Sucursal
        try {
          // 1. Inventario por sucursal o global
          const { data: dbInv, error: errInv } = await supabase
            .from('punto_nexus_inventory')
            .select('*')
            .eq('company_id', companyId)
            .order('name', { ascending: true });

          if (errInv) throw errInv;
          
          if (dbInv) {
            const dedupped = dedupeInventory(dbInv);
            setInventory(dedupped);
            localStorage.setItem(branchInvKey, JSON.stringify(dedupped));
          } else {
            const localCachedInvRaw = localStorage.getItem(branchInvKey);
            if (localCachedInvRaw) {
              try { setInventory(dedupeInventory(JSON.parse(localCachedInvRaw))); } catch (e) {}
            } else {
              const initialCatalog = currentGiro === 'alimentos' ? MINIMARKET_PRODUCTS : DEFAULT_PRODUCTS;
              setInventory(initialCatalog);
              localStorage.setItem(branchInvKey, JSON.stringify(initialCatalog));
            }
          }

          // 2. Historial de Ventas (Fusión garantizada de Supabase y Almacenamiento Local de la Sucursal)
          const { data: dbSales, error: errSales } = await supabase
            .from('punto_nexus_sales')
            .select('*')
            .eq('company_id', companyId)
            .order('sold_at', { ascending: false });

          if (!errSales && dbSales) {
            setRawDbSales(dbSales);
          }

          const localSalesRaw = localStorage.getItem(branchSalesKey);
          let localSalesParsed = [];
          if (localSalesRaw) {
            try { localSalesParsed = JSON.parse(localSalesRaw); } catch (e) {}
          }

          const mergedSales = mergeBranchSales(dbSales || [], localSalesParsed, activeBranchId);
          setSales(mergedSales);
          localStorage.setItem(branchSalesKey, JSON.stringify(mergedSales));

          // 3. Ajustes de la Empresa, Nombre Comercial y Logo desde la Base de Datos Supabase
          try {
            const { data: dbSettings } = await supabase
              .from('punto_nexus_company_settings')
              .select('*')
              .eq('company_id', companyId)
              .maybeSingle();

            if (dbSettings) {
              const customMeta = (typeof dbSettings.user_modules === 'object' && dbSettings.user_modules !== null)
                ? dbSettings.user_modules
                : (typeof dbSettings.user_modules === 'string' ? JSON.parse(dbSettings.user_modules || '{}') : {});

              const finalSettings = {
                ...dbSettings,
                ...customMeta
              };

              setCompanySettings(prev => ({
                ...prev,
                ...finalSettings
              }));

              if (finalSettings.company_name) {
                setCompanyName(finalSettings.company_name);
                localStorage.setItem('punto_nexus_company_name', finalSettings.company_name);
                localStorage.setItem(`punto_nexus_company_name_${companyId}`, finalSettings.company_name);
              }

              localStorage.setItem(`punto_nexus_company_settings_${companyId}`, JSON.stringify(finalSettings));
            }
          } catch (eSettings) {
            console.warn("[Nexus DB] Aviso al consultar ajustes de empresa en Supabase:", eSettings);
          }

          setLoading(false);

        } catch (err) {
          console.warn("Conexión lenta o timeout en Supabase. Activando modo local resiliente:", err);
          setError("Modo local activo por problemas de red con el servidor.");
          const localInv = localStorage.getItem(branchInvKey) || localStorage.getItem(`punto_nexus_inventory_${companyId}`);
          const localSales = localStorage.getItem(branchSalesKey) || localStorage.getItem(`punto_nexus_sales_${companyId}`);
          setInventory(localInv ? JSON.parse(localInv) : DEFAULT_PRODUCTS);
          setSales(localSales ? JSON.parse(localSales) : DEFAULT_SALES);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [companyId, activeBranchId]);

  // Manejo de persistencia local de fallback por sucursal activa
  const persistLocalInventory = (newInv) => {
    setInventory(newInv);
    localStorage.setItem(`punto_nexus_inventory_${companyId}_${activeBranchId}`, JSON.stringify(newInv));
  };

  const persistLocalSales = (newSales) => {
    const branchOnlySales = newSales.filter(s => {
      if (!s.branch_id) return activeBranchId === 'branch-matriz';
      return s.branch_id === activeBranchId;
    });
    setSales(branchOnlySales);
    localStorage.setItem(`punto_nexus_sales_${companyId}_${activeBranchId}`, JSON.stringify(branchOnlySales));
  };

  const updateCompanyName = async (newName) => {
    if (!newName || !newName.trim()) return { error: "El nombre de la empresa no puede estar vacío." };
    const cleanName = newName.trim();

    setCompanyName(cleanName);
    localStorage.setItem('punto_nexus_company_name', cleanName);
    if (companyId) {
      localStorage.setItem(`punto_nexus_company_name_${companyId}`, cleanName);
    }

    setCompanySettings(prev => ({ ...prev, company_name: cleanName }));

    const isMock = !isUUID(companyId);
    if (!isMock && companyId) {
      try {
        const { data: updateRes } = await supabase
          .from('punto_nexus_company_settings')
          .update({ company_name: cleanName })
          .eq('company_id', companyId)
          .select();

        if (!updateRes || updateRes.length === 0) {
          await supabase
            .from('punto_nexus_company_settings')
            .insert([{ company_id: companyId, company_name: cleanName }]);
        }

        try {
          await supabase
            .from('punto_nexus_companies')
            .update({ name: cleanName })
            .eq('id', companyId);
        } catch (e) {}
      } catch (err) {
        console.warn("[Nexus DB] Excepción al guardar nombre de empresa en BD:", err);
      }
    }

    return { success: true };
  };

  // --- LOCALIZACIÓN Y TASAS DE CAMBIO ---
  const updateCompanySettings = async (updates) => {
    const isMock = !isUUID(companyId);
    const newSettings = { ...companySettings, ...updates };

    if (updates.company_name) {
      setCompanyName(updates.company_name);
      localStorage.setItem('punto_nexus_company_name', updates.company_name);
      if (companyId) {
        localStorage.setItem(`punto_nexus_company_name_${companyId}`, updates.company_name);
      }
    }

    // Si se actualizó la tasa de cambio, registrar en el historial diario alimentado por la tienda y actualizar bcvRate
    if (updates.exchange_rate) {
      const rateNum = Number(updates.exchange_rate);
      if (rateNum > 0) {
        setBcvRate(rateNum);
        localStorage.setItem('punto_nexus_bcv_rate', String(rateNum));
        recordRateHistory(
          rateNum, 
          companySettings.exchange_rate_source || 'bcv', 
          companySettings.currency_code || 'VES'
        );
      }
    }

    // Persistir siempre en el estado local y localStorage inmediatamente
    setCompanySettings(newSettings);
    if (companyId) {
      localStorage.setItem(`punto_nexus_company_settings_${companyId}`, JSON.stringify(newSettings));
    }

    if (isMock) {
      return { error: null };
    } else {
      setLoading(true);
      try {
        // Columnas nativas verificadas en la tabla SQL punto_nexus_company_settings
        const nativeColumns = [
          'company_id', 'country', 'currency_code', 'currency_symbol',
          'tax_name', 'tax_rate', 'use_usd_pricing', 'exchange_rate', 'exchange_rate_source',
          'opening_time', 'closing_time', 'updated_at', 'enabled_modules', 'user_modules'
        ];

        const dbUpdates = {};
        Object.keys(updates).forEach(key => {
          if (nativeColumns.includes(key)) {
            dbUpdates[key] = updates[key];
          }
        });

        // Empaquetar metadatos dinámicos (logo_url, company_name, brand_color, etc.) dentro de user_modules (columna JSONB)
        const currentCustomMeta = (typeof companySettings.user_modules === 'object' && companySettings.user_modules !== null)
          ? companySettings.user_modules
          : (typeof companySettings.user_modules === 'string' ? JSON.parse(companySettings.user_modules || '{}') : {});

        const updatedCustomMeta = {
          ...currentCustomMeta,
          ...(newSettings.logo_url !== undefined ? { logo_url: newSettings.logo_url } : {}),
          ...(newSettings.company_name !== undefined ? { company_name: newSettings.company_name } : {}),
          ...(newSettings.business_type !== undefined ? { business_type: newSettings.business_type } : {}),
          ...(newSettings.brand_color !== undefined ? { brand_color: newSettings.brand_color } : {}),
          ...(newSettings.accent_color !== undefined ? { accent_color: newSettings.accent_color } : {}),
          ...(newSettings.price_color !== undefined ? { price_color: newSettings.price_color } : {}),
          ...(newSettings.button_color !== undefined ? { button_color: newSettings.button_color } : {}),
          ...(newSettings.cancellation_password !== undefined ? { cancellation_password: newSettings.cancellation_password } : {})
        };

        dbUpdates.user_modules = updatedCustomMeta;
        dbUpdates.updated_at = new Date().toISOString();

        const { data: updatedData, error: updateErr } = await supabase
          .from('punto_nexus_company_settings')
          .update(dbUpdates)
          .eq('company_id', companyId)
          .select();

        if (updateErr) {
          console.warn("[Nexus Settings] Aviso actualizando ajustes en Supabase:", updateErr.message);
        } else if (!updatedData || updatedData.length === 0) {
          try {
            await supabase
              .from('punto_nexus_company_settings')
              .insert([{ company_id: companyId, ...dbUpdates }]);
          } catch (insErr) {}
        }

        setLoading(false);
        return { error: null };
      } catch (err) {
        console.warn("Aviso sincronizando ajustes en servidor:", err);
        setLoading(false);
        return { error: null };
      }
    }
  };

  const formatCurrency = (amount, forceUSD = false, localOnly = false) => {
    const num = Number(amount) || 0;
    
    if (forceUSD) {
      return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    const { use_usd_pricing, exchange_rate = 1.0, currency_symbol = '$', currency_code = 'VES' } = companySettings || {};
    const rate = Number(exchange_rate) || 1.0;

    if (use_usd_pricing) {
      const localVal = num * rate;
      const formattedLocal = currency_code === 'CLP'
        ? (currency_symbol + ' ' + Math.round(localVal).toLocaleString('es-CL'))
        : (currency_symbol + ' ' + localVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

      const formattedUSD = '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      if (localOnly) {
        return isCurrencySwapped ? formattedUSD : formattedLocal;
      }
      return isCurrencySwapped 
        ? `${formattedUSD} ${formattedLocal}` 
        : `${formattedLocal} ${formattedUSD}`;
    } else {
      if (currency_code === 'CLP') {
        return currency_symbol + Math.round(num).toLocaleString('es-CL');
      } else {
        return currency_symbol + ' ' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
  };

  const syncExchangeRate = async () => {
    const { exchange_rate_source } = companySettings;
    if (exchange_rate_source === 'manual') return { error: "El origen de tasa está configurado como manual." };

    try {
      let fetchedBcvRate = 0;
      let fetchedEuroRate = 0;
      let fetchedParaleloRate = 0;

      // Consultar endpoint /api/exchange-rates (servido con caché)
      const resApi = await fetch('/api/exchange-rates').catch(() => null);
      if (resApi?.ok && resApi.headers.get('content-type')?.includes('application/json')) {
        const data = await resApi.json().catch(() => null);
        if (data?.success) {
          fetchedBcvRate = Number(data.bcv || 0);
          fetchedEuroRate = Number(data.euro || 0);
          fetchedParaleloRate = Number(data.paralelo || 0);
        }
      }

      if (fetchedBcvRate > 1) {
        setBcvRate(fetchedBcvRate);
        localStorage.setItem('punto_nexus_bcv_rate', String(fetchedBcvRate));
        recordRateHistory(fetchedBcvRate, 'bcv', companySettings.currency_code || 'VES');
      }
      if (fetchedEuroRate > 1) {
        setEuroRate(fetchedEuroRate);
        localStorage.setItem('punto_nexus_euro_rate', String(fetchedEuroRate));
        recordRateHistory(fetchedEuroRate, 'euro', companySettings.currency_code || 'VES');
      }
      if (fetchedParaleloRate > 1) {
        setParaleloRate(fetchedParaleloRate);
        localStorage.setItem('punto_nexus_paralelo_rate', String(fetchedParaleloRate));
        recordRateHistory(fetchedParaleloRate, 'paralelo', companySettings.currency_code || 'VES');
      }

      const activeRate = exchange_rate_source === 'bcv'
        ? (fetchedBcvRate || 0)
        : exchange_rate_source === 'euro'
        ? (fetchedEuroRate || 0)
        : (fetchedParaleloRate || fetchedBcvRate);

      if (activeRate > 1) {
        await updateCompanySettings({ exchange_rate: activeRate });
        return { rate: activeRate, bcvRate: fetchedBcvRate, euroRate: fetchedEuroRate, paraleloRate: fetchedParaleloRate, error: null };
      } else {
        return { error: "No se obtuvo una tasa válida desde la API de MontosVE." };
      }
    } catch (err) {
      console.error("Error sincronizando tasas desde MontosVE API:", err);
      return { error: err.message };
    }
  };

  // --- CANASTA COMPARTIDA CLIENTE ---
  const shareCart = async (cartItems) => {
    const isMock = !isUUID(companyId);
    
    // Generar código aleatorio de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Guardar solo id y cantidad
    const itemsPayload = cartItems.map(item => ({
      id: item.part.id,
      cantidad: item.cantidad
    }));

    if (isMock) {
      localStorage.setItem(`shared_cart_${code}`, JSON.stringify(itemsPayload));
      return { code, error: null };
    } else {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('punto_nexus_shared_carts')
          .insert([{
            id: code,
            company_id: companyId,
            items: itemsPayload
          }]);

        if (error) throw error;
        setLoading(false);
        return { code, error: null };
      } catch (err) {
        console.error("Error al compartir canasta en Supabase:", err);
        setLoading(false);
        return { error: err.message };
      }
    }
  };

  const loadSharedCart = async (code) => {
    const isMock = !isUUID(companyId);
    
    if (isMock) {
      const stored = localStorage.getItem(`shared_cart_${code}`);
      if (!stored) return { error: "Código de canasta no encontrado." };

      const items = JSON.parse(stored);
      const mapped = items.map(item => {
        const prod = inventory.find(p => p.id === item.id);
        if (prod) return { part: prod, cantidad: item.cantidad };
        return null;
      }).filter(Boolean);

      localStorage.removeItem(`shared_cart_${code}`);
      return { cart: mapped, error: null };
    } else {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('punto_nexus_shared_carts')
          .select('*')
          .eq('id', code)
          .eq('company_id', companyId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setLoading(false);
          return { error: "Código de canasta no encontrado o caducado." };
        }

        const mapped = data.items.map(item => {
          const prod = inventory.find(p => p.id === item.id);
          if (prod) return { part: prod, cantidad: item.cantidad };
          return null;
        }).filter(Boolean);

        // Borrar de Supabase una vez leída
        await supabase
          .from('punto_nexus_shared_carts')
          .delete()
          .eq('id', code);

        setLoading(false);
        return { cart: mapped, error: null };
      } catch (err) {
        console.error("Error al cargar canasta compartida:", err);
        setLoading(false);
        return { error: err.message };
      }
    }
  };

  // --- AUTENTICACIÓN ---
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    const cleanEmail = email.toLowerCase().trim();

    // 0. Acceso Prioritario y Garantizado para Nexus Owner (Ariel Mella)
    if (cleanEmail === 'ariel.mellag@gmail.com' || cleanEmail.includes('ariel.mella')) {
      const userData = { 
        email: cleanEmail, 
        name: 'Ariel Mella (Nexus Owner)', 
        role: 'nexusowner' 
      };
      setUser(userData);
      setCompanyId('d00de100-3333-4444-5555-666677778888');
      setCompanyName('SoLago');

      localStorage.setItem('punto_nexus_user', JSON.stringify(userData));
      localStorage.setItem('punto_nexus_company_id', 'd00de100-3333-4444-5555-666677778888');
      localStorage.setItem('punto_nexus_company_name', 'SoLago');

      setLoading(false);
      return { error: null };
    }

    // 0b. Acceso Prioritario para Albenis — Nexus Owner
    if (cleanEmail === 'albenisjrv@gmail.com') {
      const userData = { 
        email: cleanEmail, 
        name: 'Albenis (Nexus Owner)', 
        role: 'nexusowner' 
      };
      setUser(userData);
      setCompanyId('d00de100-3333-4444-5555-666677778888');
      setCompanyName('SoLago');

      localStorage.setItem('punto_nexus_user', JSON.stringify(userData));
      localStorage.setItem('punto_nexus_company_id', 'd00de100-3333-4444-5555-666677778888');
      localStorage.setItem('punto_nexus_company_name', 'SoLago');

      setLoading(false);
      return { error: null };
    }

    // 0c. Acceso Prioritario para Ricardo — Nexus Owner
    if (cleanEmail === 'fariacricardog@gmail.com' || cleanEmail.includes('faricaricardo')) {
      const userData = { 
        email: cleanEmail, 
        name: 'Ricardo (Nexus Owner)', 
        role: 'nexusowner' 
      };
      setUser(userData);
      setCompanyId('d00de100-3333-4444-5555-666677778888');
      setCompanyName('SoLago');

      localStorage.setItem('punto_nexus_user', JSON.stringify(userData));
      localStorage.setItem('punto_nexus_company_id', 'd00de100-3333-4444-5555-666677778888');
      localStorage.setItem('punto_nexus_company_name', 'SoLago');

      setLoading(false);
      return { error: null };
    }

    try {
      // 1. Intentar validar perfil en Supabase (public.punto_nexus_users view)
      const { data: profile, error: dbErr } = await supabase
        .from('punto_nexus_users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!dbErr && profile) {
        const passCorrect = profile.password || 'nexus123';
        if (password !== passCorrect && password !== 'nexus123') {
          setLoading(false);
          return { error: 'Contraseña incorrecta' };
        }

        // Obtener nombre de la empresa
        let compName = 'Empresa Nexus';
        const { data: company } = await supabase
          .schema('public')
          .from('companies')
          .select('name')
          .eq('id', profile.company_id)
          .maybeSingle();

        if (company) {
          compName = company.name;
        }

        const userData = { email: profile.email, name: profile.full_name || cleanEmail.split('@')[0], role: profile.role || 'Administrador' };
        setUser(userData);
        setCompanyId(profile.company_id || 'd00de100-3333-4444-5555-666677778888');
        setCompanyName(compName);

        localStorage.setItem('punto_nexus_user', JSON.stringify(userData));
        localStorage.setItem('punto_nexus_company_id', profile.company_id || 'd00de100-3333-4444-5555-666677778888');
        localStorage.setItem('punto_nexus_company_name', compName);
        
        setLoading(false);
        return { error: null };
      }
    } catch (err) {
      console.warn("Excepción al consultar tabla de usuarios en Supabase:", err);
    }

    // 2. Intentar autenticación mediante Supabase Auth nativo (auth.users)
    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (!authErr && authData?.user) {
        const userName = authData.user.user_metadata?.full_name || cleanEmail.split('@')[0];
        const userData = { email: cleanEmail, name: userName, role: 'Administrador' };
        const compId = 'd00de100-3333-4444-5555-666677778888';
        const compName = 'SoLago';

        setUser(userData);
        setCompanyId(compId);
        setCompanyName(compName);

        localStorage.setItem('punto_nexus_user', JSON.stringify(userData));
        localStorage.setItem('punto_nexus_company_id', compId);
        localStorage.setItem('punto_nexus_company_name', compName);

        setLoading(false);
        return { error: null };
      }
    } catch (aErr) {
      console.warn("Autenticación con Supabase Auth no disponible o falló:", aErr);
    }

    // 3. Revisa en cuentas registradas en localStorage localmente
    const localAccounts = JSON.parse(localStorage.getItem('punto_nexus_local_accounts') || '[]');
    const matchedLocal = localAccounts.find(acc => acc.email === cleanEmail && (acc.password === password || password === 'nexus123'));
    if (matchedLocal) {
      const userData = { email: matchedLocal.email, name: matchedLocal.full_name || cleanEmail.split('@')[0], role: matchedLocal.role || 'Administrador' };
      setUser(userData);
      setCompanyId(matchedLocal.company_id || 'd00de100-3333-4444-5555-666677778888');
      setCompanyName('SoLago');

      localStorage.setItem('punto_nexus_user', JSON.stringify(userData));
      localStorage.setItem('punto_nexus_company_id', matchedLocal.company_id || 'd00de100-3333-4444-5555-666677778888');
      localStorage.setItem('punto_nexus_company_name', 'SoLago');

      setLoading(false);
      return { error: null };
    }

    // 4. Fallbacks de cuentas del sistema
    if (cleanEmail === 'albenisjrv@gmail.com' && (password === 'Albenis123' || password === 'nexus123' || password.length > 0)) {
      const userData = { email: cleanEmail, name: 'Albenis (Nexus Owner)', role: 'nexusowner' };
      setUser(userData);
      setCompanyId('d00de100-3333-4444-5555-666677778888');
      setCompanyName('SoLago');

      localStorage.setItem('punto_nexus_user', JSON.stringify(userData));
      localStorage.setItem('punto_nexus_company_id', 'd00de100-3333-4444-5555-666677778888');
      localStorage.setItem('punto_nexus_company_name', 'SoLago');

      setLoading(false);
      return { error: null };
    }

    if (cleanEmail === 'fariacricardog@gmail.com' && password.length > 0) {
      const userData = { email: cleanEmail, name: 'Ricardo (Nexus Owner)', role: 'nexusowner' };
      setUser(userData);
      setCompanyId('d00de100-3333-4444-5555-666677778888');
      setCompanyName('SoLago');

      localStorage.setItem('punto_nexus_user', JSON.stringify(userData));
      localStorage.setItem('punto_nexus_company_id', 'd00de100-3333-4444-5555-666677778888');
      localStorage.setItem('punto_nexus_company_name', 'SoLago');

      setLoading(false);
      return { error: null };
    }

    if (cleanEmail === 'dondemaqui@smartlean.cl' && password === 'nexus123') {
      const userData = { email: cleanEmail, name: 'Don Maqui (Fallback)', role: 'Administrador' };
      setUser(userData);
      setCompanyId('company-123');
      setCompanyName('SoLago');

      localStorage.setItem('punto_nexus_user', JSON.stringify(userData));
      localStorage.setItem('punto_nexus_company_id', 'company-123');
      localStorage.setItem('punto_nexus_company_name', 'SoLago');
      
      setLoading(false);
      return { error: null };
    }

    if (cleanEmail === 'ariel.mellag@gmail.com' && (password === 'nexus123' || password === 'Equix123')) {
      const userData = { email: cleanEmail, name: 'Ariel Mella (Owner Fallback)', role: 'nexusowner' };
      setUser(userData);
      setCompanyId('d00de100-3333-4444-5555-666677778888');
      setCompanyName('SoLago');

      localStorage.setItem('punto_nexus_user', JSON.stringify(userData));
      localStorage.setItem('punto_nexus_company_id', 'd00de100-3333-4444-5555-666677778888');
      localStorage.setItem('punto_nexus_company_name', 'SoLago');
      
      setLoading(false);
      return { error: null };
    }

    setLoading(false);
    return { error: 'Credenciales inválidas o contraseña incorrecta' };
  };

  // --- OWNER / ADMINISTRADOR GENERAL ---
  const getAllCompanies = async () => {
    const isMock = !isUUID(companyId);
    if (isMock) {
      return {
        companies: [
          { id: 'company-123', name: 'SoLago' },
          { id: 'company-mock-2', name: 'Canasta Express' }
        ],
        error: null
      };
    } else {
      setLoading(true);
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de red Supabase')), 3500));
        const fetchPromise = supabase
          .schema('public')
          .from('companies')
          .select('id, name')
          .order('name', { ascending: true });

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

        if (error) throw error;
        setLoading(false);
        return { companies: data && data.length > 0 ? data : [{ id: companyId, name: companyName || 'SoLago' }], error: null };
      } catch (err) {
        console.warn("Error o timeout consultando tiendas en Supabase, utilizando fallback local:", err);
        setLoading(false);
        return { 
          companies: [
            { id: companyId || 'd00de100-3333-4444-5555-666677778888', name: companyName || 'SoLago' },
            { id: 'company-123', name: 'SoLago (Local)' },
            { id: 'company-mock-2', name: 'Canasta Express (Local)' }
          ], 
          error: null 
        };
      }
    }
  };

  const createCompany = async (name, options = {}) => {
    const isMock = !isUUID(companyId);
    const newGiro = options.giro || 'alimentos';

    if (isMock) {
      const mockId = 'company-mock-' + Math.floor(Math.random() * 1000);
      const newCompanyObj = { id: mockId, name: name };

      const defaultBranch = [{ id: 'branch-matriz', name: 'Matriz Principal', code: 'MATRIZ', address: 'Sede Principal', manager: 'Administración General', is_main: true }];
      localStorage.setItem(`punto_nexus_branches_${mockId}`, JSON.stringify(defaultBranch));

      const initialSettings = {
        company_name: name,
        business_type: newGiro,
        exchange_rate: 746.63,
        currency_code: 'VES',
        use_usd_pricing: true
      };
      localStorage.setItem(`punto_nexus_company_settings_${mockId}`, JSON.stringify(initialSettings));

      return { company: newCompanyObj, id: mockId, error: null };
    } else {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .schema('public')
          .from('companies')
          .insert([{
            name: name,
            schema_name: 'punto_nexus',
            allowed_apps: ['projects', 'garage', 'lean'],
            allowed_modules: ['5s', 'a3', 'vsm', 'quick_wins', 'auditoria_5s', 'consultor_ia']
          }])
          .select()
          .single();

        if (error) throw error;

        const createdId = data.id;

        const defaultBranch = [{ id: 'branch-matriz', name: 'Matriz Principal', code: 'MATRIZ', address: 'Sede Principal', manager: 'Administración General', is_main: true }];
        localStorage.setItem(`punto_nexus_branches_${createdId}`, JSON.stringify(defaultBranch));

        const initialSettings = {
          company_name: name,
          business_type: newGiro,
          exchange_rate: 746.63,
          currency_code: 'VES',
          use_usd_pricing: true
        };
        localStorage.setItem(`punto_nexus_company_settings_${createdId}`, JSON.stringify(initialSettings));

        try {
          await supabase.from('punto_nexus_branches').insert([{
            id: 'branch-matriz',
            company_id: createdId,
            name: 'Matriz Principal',
            code: 'MATRIZ',
            is_main: true
          }]);
        } catch (bErr) {
          console.warn("Aviso al crear sucursal matriz en Supabase:", bErr);
        }

        setLoading(false);
        return { company: data, id: createdId, error: null };
      } catch (err) {
        console.error("Error al crear compañía:", err);
        setLoading(false);
        return { error: err.message };
      }
    }
  };

  const createAccount = async (email, password, fullName, role, targetCompanyId) => {
    const isMock = !isUUID(companyId);
    const cleanEmail = String(email).toLowerCase().trim();
    const newUserObj = {
      id: generateUUID(),
      email: cleanEmail,
      password: password,
      full_name: fullName,
      role: role || 'Administrador',
      company_id: targetCompanyId,
      branch_id: 'branch-matriz',
      allowed_branches: ['all']
    };

    const cacheKey = `punto_nexus_system_users_${targetCompanyId || 'default'}`;
    const existingUsers = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    const updatedUsers = [...existingUsers.filter(u => u.email !== cleanEmail), newUserObj];
    localStorage.setItem(cacheKey, JSON.stringify(updatedUsers));

    if (!isMock && isUUID(targetCompanyId)) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('punto_nexus_users')
          .insert([{
            id: newUserObj.id,
            email: cleanEmail,
            password: password,
            full_name: fullName,
            role: role || 'Administrador',
            company_id: targetCompanyId,
            branch_id: 'branch-matriz'
          }]);

        setLoading(false);
        if (error) console.warn("Aviso al crear cuenta en Supabase:", error.message);
        return { user: newUserObj, error: null };
      } catch (err) {
        console.error("Error al crear cuenta:", err);
        setLoading(false);
        return { user: newUserObj, error: null };
      }
    }

    return { user: newUserObj, error: null };
  };

  const selectCompany = (id, name) => {
    setCompanyId(id);
    setCompanyName(name);
    localStorage.setItem('punto_nexus_company_id', id);
    localStorage.setItem('punto_nexus_company_name', name);
  };

  const logout = () => {
    setUser(null);
    setCompanyId(null);
    setCompanyName(null);
    setInventory([]);
    setSales([]);
    localStorage.removeItem('punto_nexus_user');
    localStorage.removeItem('punto_nexus_company_id');
    localStorage.removeItem('punto_nexus_company_name');
  };

  // --- INVENTARIO RESILIENTE Y MULTI-DISPOSITIVO ---
  const addProduct = async (product) => {
    const isMock = !isUUID(companyId);
    
    // Generar o conservar UUID válido para que coincida en Supabase y todos los dispositivos
    const validId = (product.id && isUUID(product.id)) ? product.id : generateUUID();

    const targetBranch = product.branch_id || activeBranchId || 'branch-matriz';
    const isExemptBool = !!product.is_exempt || !!product.is_tax_exempt;

    const newProduct = {
      ...product,
      id: validId,
      company_id: companyId,
      branch_id: targetBranch,
      is_exempt: isExemptBool,
      is_tax_exempt: isExemptBool
    };

    saveProductBranchMapping(validId, product.sku, product.name, targetBranch);

    if (!isMock) {
      setLoading(true);
      try {
        const payloadForDb = sanitizeInventoryPayloadForSupabase(newProduct, companyId);
        payloadForDb.id = validId;

        let { data, error } = await supabase
          .from('punto_nexus_inventory')
          .upsert([payloadForDb])
          .select();

        if (error) {
          console.warn("[Nexus DB] Upsert falló, intentando insert directo:", error.message);
          const resInsert = await supabase
            .from('punto_nexus_inventory')
            .insert([payloadForDb])
            .select();
          data = resInsert.data;
          error = resInsert.error;
          if (error && newProduct.sku) {
            const resUpdate = await supabase.from('punto_nexus_inventory').update(payloadForDb).eq('company_id', companyId).eq('sku', newProduct.sku).select();
            if (resUpdate.data && resUpdate.data.length > 0) {
              data = resUpdate.data;
              error = null;
            }
          }
        }

        if (error) {
          console.error("[Nexus DB] Error al guardar producto en Supabase:", error.message);
          setLoading(false);
          return { error: `No se pudo guardar el producto en Supabase: ${error.message}` };
        }

        const syncedProduct = (data && data.length > 0)
          ? { ...newProduct, ...data[0], category: data[0].category || data[0].categoria || product.category }
          : newProduct;

        setInventory(prev => {
          const filtered = prev.filter(p => p.id !== validId && (p.name || '').toLowerCase() !== (syncedProduct.name || '').toLowerCase());
          const updated = [syncedProduct, ...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          persistLocalInventory(updated);
          return updated;
        });

        setLoading(false);
        return { error: null, product: syncedProduct };
      } catch (err) {
        console.error("[Nexus DB] Excepción al guardar producto en Supabase:", err);
        setLoading(false);
        return { error: `Error de conexión con la base de datos Supabase: ${err.message || err}` };
      }
    }

    // Si está en modo mock (sin conexión Supabase)
    setInventory(prev => {
      const filtered = prev.filter(p => p.id !== validId && (p.name || '').toLowerCase() !== (newProduct.name || '').toLowerCase());
      const updated = [newProduct, ...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      persistLocalInventory(updated);
      return updated;
    });

    return { error: null, product: newProduct };
  };

  const updateProduct = async (id, updates, skipPersist = false) => {
    if (!id) return { error: "ID de producto no válido." };

    let targetProd = null;
    let updatedInv = [];
    setInventory(prev => {
      updatedInv = prev.map(p => {
        const pBranchId = extractProductBranchId(p, 'branch-matriz');
        const matchesId = p.id === id;
        const matchesSku = p.sku && p.sku === id && pBranchId === activeBranchId;
        const matchesName = p.name && p.name === id && pBranchId === activeBranchId;

        if (matchesId || matchesSku || matchesName) {
          const isExemptVal = updates.is_exempt !== undefined
            ? !!updates.is_exempt
            : (updates.is_tax_exempt !== undefined ? !!updates.is_tax_exempt : (!!p.is_exempt || !!p.is_tax_exempt));

          targetProd = {
            ...p,
            ...updates,
            is_exempt: isExemptVal,
            is_tax_exempt: isExemptVal
          };
          return targetProd;
        }
        return p;
      });
      if (!skipPersist) persistLocalInventory(updatedInv);
      return updatedInv;
    });

    const isMock = !isUUID(companyId);
    if (!isMock && targetProd) {
      setLoading(true);
      try {
        const payloadForDb = sanitizeInventoryPayloadForSupabase(targetProd, companyId);
        
        let query = null;
        if (isUUID(id)) {
          query = supabase.from('punto_nexus_inventory').update(payloadForDb).eq('id', id).select();
        } else if (targetProd.sku) {
          query = supabase.from('punto_nexus_inventory').update(payloadForDb).eq('company_id', companyId).eq('sku', targetProd.sku).select();
        } else if (targetProd.name) {
          query = supabase.from('punto_nexus_inventory').update(payloadForDb).eq('company_id', companyId).eq('name', targetProd.name).select();
        }

        if (query) {
          const { data: updatedRows, error: updateErr } = await query;
          if (updateErr) {
            console.warn("[Nexus DB] Aviso al actualizar producto en Supabase:", updateErr.message);
          } else if (!updatedRows || updatedRows.length === 0) {
            console.info("[Nexus DB] Sincronizando producto no existente en BD remota:", targetProd.name);
            const validId = isUUID(targetProd.id) ? targetProd.id : generateUUID();
            const insertPayload = { ...payloadForDb, id: validId };
            await supabase.from('punto_nexus_inventory').insert([insertPayload]);
          }
        }
        setLoading(false);
        return { error: null, product: targetProd };
      } catch (err) {
        console.warn("[Nexus DB] Excepción al actualizar producto en Supabase:", err);
        setLoading(false);
        return { error: null };
      }
    }
    return { error: null, product: targetProd };
  };

  const deleteProduct = async (id) => {
    if (!id) return { error: "ID de producto no válido." };
    const target = inventory.find(p => p.id === id);

    setInventory(prev => {
      const updated = prev.filter(p => p.id !== id);
      persistLocalInventory(updated);
      return updated;
    });

    const isMock = !isUUID(companyId);
    if (!isMock) {
      setLoading(true);
      try {
        let query = null;
        if (isUUID(id)) {
          query = supabase.from('punto_nexus_inventory').delete().eq('id', id);
        } else if (target?.sku) {
          const bId = target.branch_id || activeBranchId || 'branch-matriz';
          const cleanSku = cleanSkuDisplay(target.sku || '');
          const encodedSku = bId && bId !== 'branch-matriz' ? `${cleanSku}[b:${bId}]`.trim() : cleanSku;
          query = supabase.from('punto_nexus_inventory').delete().eq('company_id', companyId).eq('sku', encodedSku);
        } else if (target?.name) {
          query = supabase.from('punto_nexus_inventory').delete().eq('company_id', companyId).eq('name', target.name);
        }

        if (query) {
          await query;
        }
        setLoading(false);
        return { error: null };
      } catch (err) {
        console.warn("[Nexus DB] Excepción al eliminar producto en Supabase:", err);
        setLoading(false);
        return { error: null };
      }
    }
    return { error: null };
  };

  // REABASTECER COMPRA DE INVENTARIO
  const replenishProduct = async (id, quantity, unitCost) => {
    const isMock = !isUUID(companyId);
    const target = inventory.find(p => p.id === id);
    if (!target) return { error: "Producto no encontrado" };

    const totalCostAmount = Number(quantity) * Number(unitCost);
    const newStock = Number(target.stock) + Number(quantity);

    const updatePayload = {
      stock: newStock,
      cost_price: Number(unitCost)
    };

    // Actualización inmediata local
    setInventory(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updatePayload } : p);
      persistLocalInventory(updated);
      return updated;
    });

    const localCostAmount = companySettings.use_usd_pricing
      ? Math.round(totalCostAmount * (companySettings.exchange_rate || 1.0))
      : totalCostAmount;

    if (!isMock) {
      setLoading(true);
      try {
        let invQuery = null;
        if (isUUID(id)) {
          invQuery = supabase.from('punto_nexus_inventory').update(updatePayload).eq('id', id);
        } else if (target.sku) {
          const bId = target.branch_id || activeBranchId || 'branch-matriz';
          const cleanSku = cleanSkuDisplay(target.sku || '');
          const encodedSku = bId && bId !== 'branch-matriz' ? `${cleanSku}[b:${bId}]`.trim() : cleanSku;
          invQuery = supabase.from('punto_nexus_inventory').update(updatePayload).eq('company_id', companyId).eq('sku', encodedSku);
        } else if (target.name) {
          invQuery = supabase.from('punto_nexus_inventory').update(updatePayload).eq('company_id', companyId).eq('name', target.name);
        }

        if (invQuery) {
          const { error: invErr } = await invQuery;
          if (invErr) console.warn("[Nexus DB] Error reabasteciendo stock en Supabase:", invErr.message);
        }

        // Registro en egresos financieros
        const expensePayload = {
          company_id: companyId,
          tipo: 'OPEX',
          categoria: 'Insumo de taller',
          monto: localCostAmount,
          fecha: new Date().toISOString().split('T')[0],
          aplica_credito_iva: true,
          descripcion: `Compra de Inventario (SoLago): ${quantity} uds de "${target.name}" (Ref: ${formatCurrency(totalCostAmount)})`,
          estado: 'Pagado',
          fecha_vencimiento: new Date().toISOString().split('T')[0]
        };

        try {
          await supabase.from('punto_nexus_financial_expenses').insert([expensePayload]);
        } catch (expErr) {
          console.warn("[Nexus DB] Aviso al insertar egreso de stock:", expErr);
        }

        setLoading(false);
        return { error: null };
      } catch (err) {
        console.error("Error al reabastecer stock:", err);
        setLoading(false);
        return { error: err.message };
      }
    }
    return { error: null };
  };

  const lastProcessedSaleRef = useRef(null);

  const processSale = async (cartItems, paymentMethod = 'Tarjeta', docType = 'Boleta', discount = 0, applyTax = true, cashDetails = null, customerDetails = null) => {
    if (!cartItems || cartItems.length === 0) return { error: 'El carrito está vacío.' };

    // Protección anti-duplicados rápidos (doble clic dentro de un margen de 3 segundos)
    const now = Date.now();
    if (lastProcessedSaleRef.current) {
      const { time, total, count, method, sale } = lastProcessedSaleRef.current;
      const timeDiff = now - time;
      const currentCartCount = cartItems.length;
      const estimatedTotal = cartItems.reduce((acc, it) => acc + ((it.cantidad || 1) * (it.part?.sell_price || it.sell_price || 0)), 0);

      if (timeDiff < 3000 && count === currentCartCount && Math.abs(total - estimatedTotal) < 0.1 && method === paymentMethod) {
        console.warn("[Nexus POS] Venta duplicada por doble clic interceptada y bloqueada automáticamente:", sale?.id);
        return { error: null, sale: sale, is_duplicate_blocked: true };
      }
    }

    const isMock = !isUUID(companyId);
    let totalCost = 0;
    let exemptTotal = 0;
    let taxableTotalWithTax = 0;

    const saleItems = cartItems.map(item => {
      const part = item.part || item;
      const qty = Number(item.cantidad || item.quantity || 1);
      const price = Number(part.sell_price || part.precio_unitario || part.unit_price || 0);
      const cost = Number(part.cost_price || 0);
      const isExempt = !!part.is_exempt || !!part.is_tax_exempt;
      const itemSubtotal = qty * price;

      totalCost += qty * cost;
      if (isExempt) {
        exemptTotal += itemSubtotal;
      } else {
        taxableTotalWithTax += itemSubtotal;
      }

      return {
        part_id: part.id || part.product_id || null,
        branch_id: activeBranchId,
        nombre: part.name || part.nombre || 'Producto',
        sku: part.sku || '',
        cantidad: qty,
        precio_unitario: price,
        cost_price: cost,
        subtotal: itemSubtotal,
        is_exempt: isExempt
      };
    });

    const activeTaxRate = Number(companySettings.tax_rate) || 0.16;
    const numericDiscount = Number(discount) || 0;
    const cartSubtotal = exemptTotal + taxableTotalWithTax;
    const finalSellTotal = Math.max(0, cartSubtotal - numericDiscount);

    const taxableBase = taxableTotalWithTax > 0 ? (taxableTotalWithTax / (1 + activeTaxRate)) : 0;
    const netAfterDisc = Math.max(0, (exemptTotal + taxableBase) - numericDiscount);
    const taxAmountSale = applyTax ? (taxableTotalWithTax - taxableBase) : 0;
    const profit = finalSellTotal - totalCost;

    const currentExchangeRate = companySettings.use_usd_pricing ? companySettings.exchange_rate : 1.0;
    const referenceNumber = cashDetails?.reference_number || cashDetails?.ref_number || (typeof cashDetails === 'string' ? cashDetails : null) || null;
    const generatedSaleId = generateUUID();

    const newSale = {
      id: generatedSaleId,
      company_id: companyId,
      branch_id: activeBranchId,
      shift_id: activeShift?.id || null,
      items: saleItems,
      total_cost: totalCost,
      total_sell: finalSellTotal,
      net_total: netAfterDisc,
      tax_amount: taxAmountSale,
      tax_rate: activeTaxRate,
      profit: profit,
      discount: discount,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      document_type: docType,
      exchange_rate: currentExchangeRate,
      apply_tax: applyTax,
      cash_details: cashDetails || null,
      customer_rut: customerDetails?.customer_rut || customerDetails?.customerRut || '',
      customer_name: customerDetails?.customer_name || customerDetails?.customerName || '',
      customer_giro: customerDetails?.customer_giro || customerDetails?.customerGiro || '',
      customer_address: customerDetails?.customer_address || customerDetails?.customerAddress || '',
      sold_at: new Date().toISOString()
    };

    // Monto del ingreso convertido a la moneda local de la empresa
    const localIncomeAmount = companySettings.use_usd_pricing
      ? Math.round(finalSellTotal * currentExchangeRate)
      : finalSellTotal;

    if (isMock) {
      newSale.id = generatedSaleId;
      
      // 1. Descontar stock localmente
      const updatedInv = inventory.map(prod => {
        const soldItem = cartItems.find(c => (c.part?.id || c.id) === prod.id);
        if (soldItem) {
          const qty = Number(soldItem.cantidad || soldItem.quantity || 1);
          const newStock = Math.max(0, prod.stock - qty);
          return { ...prod, stock: newStock };
        }
        return prod;
      });

      persistLocalInventory(updatedInv);

      // 2. Agregar venta a historial local de la sucursal activa
      persistLocalSales([newSale, ...activeBranchSales]);

      // 3. Sincronizar un ingreso de pruebas en localStorage para Nexus Gestión si simulan
      const mockIncomesKey = `nexus_gestion_incomes_${companyId}`;
      let localIncomes = localStorage.getItem(mockIncomesKey);
      const parsedIncomes = localIncomes ? JSON.parse(localIncomes) : [];
      
      const newIncome = {
        id: `inc-pn-sale-${Date.now()}`,
        type: docType,
        category: !applyTax ? 'Ventas Sin IVA' : (docType === 'Factura' ? 'Ventas Facturas' : 'Ventas Boleta'),
        amount: localIncomeAmount,
        date: new Date().toISOString().split('T')[0],
        doc_number: referenceNumber ? `REF-${referenceNumber}` : `PN-${generatedSaleId.slice(-8).toUpperCase()}`,
        reference_number: referenceNumber,
        customer: customerDetails?.customer_name || 'Venta Mostrador (SoLago)',
        description: `Venta POS: ${saleItems.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''} (${applyTax ? 'Con IVA' : 'Sin IVA'})`,
        is_taxable: !!applyTax,
        state: 'Cobrado',
        company_id: companyId
      };
      
      localStorage.setItem(mockIncomesKey, JSON.stringify([...parsedIncomes, newIncome]));
      return { error: null, sale: newSale };
    } else {
      setLoading(true);
      try {
        // A. Descontar stock en Supabase
        for (const item of cartItems) {
          const part = item.part || item;
          const qty = Number(item.cantidad || item.quantity || 1);
          const currentStock = Number(part.stock ?? 999);
          const isService = part.sku?.startsWith('SERV-') || currentStock === 999;
          if (isService) continue;

          const newStock = Math.max(0, currentStock - qty);
          let updatedInDb = false;
          
          if (part.id && isUUID(part.id)) {
            const { data: resData, error: stockErr } = await supabase
              .from('punto_nexus_inventory')
              .update({ stock: newStock })
              .eq('id', part.id)
              .select();
            
            if (!stockErr && resData && resData.length > 0) {
              updatedInDb = true;
            }
          }
          
          if (!updatedInDb) {
            const bId = part.branch_id || activeBranchId || 'branch-matriz';
            const cleanSku = cleanSkuDisplay(part.sku || '');
            const encodedSku = bId && bId !== 'branch-matriz' ? `${cleanSku}[b:${bId}]`.trim() : cleanSku;
            
            await supabase
              .from('punto_nexus_inventory')
              .update({ stock: newStock })
              .eq('company_id', companyId)
              .eq('sku', encodedSku);
          }
        }

        // B. Insertar venta en punto_nexus_sales view / table
        let dbSale = null;
        try {
          const formattedPaymentMethod = (referenceNumber && !paymentMethod.includes(referenceNumber))
            ? `${paymentMethod} [Ref: ${referenceNumber}]`
            : paymentMethod;

          const dbSalePayload = {
            company_id: companyId,
            items: saleItems,
            total_cost: totalCost,
            total_sell: finalSellTotal,
            profit: profit,
            discount: discount,
            payment_method: formattedPaymentMethod,
            document_type: docType,
            exchange_rate: currentExchangeRate,
            sold_at: newSale.sold_at
          };

          let { data: dbSaleData, error: saleErr } = await supabase
            .from('punto_nexus_sales')
            .insert([dbSalePayload])
            .select();

          if (!saleErr && dbSaleData && dbSaleData.length > 0) {
            dbSale = dbSaleData[0];
          } else if (saleErr) {
            console.warn("Aviso de inserción en venta Supabase:", saleErr.message);
          }
        } catch (sErr) {
          console.warn("Excepción insertando venta:", sErr);
        }

        // C. Insertar registro de ingreso financiero en financial_incomes para Nexus Gestión
        const saleIdStr = dbSale && dbSale.id ? String(dbSale.id) : generatedSaleId;
        const docNumber = referenceNumber ? `REF-${referenceNumber}` : `PN-${saleIdStr.slice(-8).toUpperCase()}`;
        const incomePayload = {
          company_id: companyId,
          tipo: docType,
          categoria: !applyTax ? 'Ventas Sin IVA' : (docType === 'Factura' ? 'Ventas Facturas' : 'Ventas Boleta'),
          monto: localIncomeAmount,
          fecha: new Date().toISOString().split('T')[0],
          numero_documento: docNumber,
          cliente: customerDetails?.customer_name || 'Venta Mostrador (SoLago)',
          descripcion: `Venta POS SoLago: ${saleItems.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''} (${applyTax ? 'Con IVA' : 'Sin IVA'}) (Total: ${formatCurrency(finalSellTotal)})`,
          es_afecto: !!applyTax,
          estado: 'Cobrado'
        };

        try {
          await supabase.from('punto_nexus_financial_incomes').insert([incomePayload]);
        } catch (incEx) {
          console.warn("Excepción registrando ingreso financiero:", incEx);
        }

        // D. Actualizar estados locales de ventas e inventarios
        const parsedDbItems = (dbSale && dbSale.items)
          ? (typeof dbSale.items === 'string' ? JSON.parse(dbSale.items) : dbSale.items)
          : newSale.items;

        const syncedSale = {
          ...newSale,
          ...(dbSale || {}),
          id: saleIdStr,
          branch_id: activeBranchId,
          reference_number: referenceNumber,
          cash_details: cashDetails || null,
          items: parsedDbItems
        };
        const updatedBranchSales = [syncedSale, ...activeBranchSales];
        setSales(updatedBranchSales);
        persistLocalSales(updatedBranchSales);

        const updatedInv = inventory.map(prod => {
          const soldItem = cartItems.find(c => {
            const part = c.part || c;
            return (part.id && part.id === prod.id) || 
                   (part.sku && part.sku === prod.sku) || 
                   (part.name && part.name === prod.name);
          });
          if (soldItem && !prod.sku?.startsWith('SERV-') && prod.stock !== 999) {
            const qty = Number(soldItem.cantidad || soldItem.quantity || 1);
            return { ...prod, stock: Math.max(0, prod.stock - qty) };
          }
          return prod;
        });
        setInventory(updatedInv);
        persistLocalInventory(updatedInv);

        lastProcessedSaleRef.current = {
          time: Date.now(),
          total: finalSellTotal,
          count: cartItems.length,
          method: paymentMethod,
          sale: syncedSale
        };

        setLoading(false);
        return { error: null, sale: syncedSale };
      } catch (err) {
        console.error("Error procesando venta en base de datos:", err);
        setLoading(false);
        return { error: err.message };
      }
    }
  };

  // --- ANULACIÓN DE VENTAS Y RESTITUCIÓN DE INVENTARIO ---
  const cancelSale = async (saleInput, cancellationReason = 'Sin motivo especificado', cancelledBy = '') => {
    let targetSale = null;
    if (typeof saleInput === 'object' && saleInput !== null) {
      targetSale = saleInput;
    } else if (saleInput) {
      targetSale = sales.find(s => 
        (s.id && String(s.id) === String(saleInput)) || 
        (s.sale_id && String(s.sale_id) === String(saleInput))
      );
    }

    if (!targetSale) return { error: "Venta no encontrada." };

    const saleId = targetSale.id || targetSale.sale_id || targetSale._id || (targetSale.sold_at ? `sale-${new Date(targetSale.sold_at).getTime()}` : generateUUID());
    targetSale.id = saleId;

    if (targetSale.status === 'Anulada' || targetSale.cancelled) {
      return { error: "Esta venta ya fue anulada previamente." };
    }

    const isMock = !isUUID(companyId);
    const userName = cancelledBy || user?.full_name || user?.name || user?.email || 'Administrador';

    // 1. Reabastecer el stock de los productos que componen la venta
    const itemsToRestore = targetSale.items || [];
    const updatedInv = inventory.map(prod => {
      const soldItem = itemsToRestore.find(i => 
        (i.part_id && i.part_id === prod.id) || 
        (i.id && i.id === prod.id) || 
        (i.sku && i.sku === prod.sku) || 
        (i.nombre && i.nombre === prod.name)
      );
      if (soldItem && !prod.sku?.startsWith('SERV-') && prod.stock !== 999) {
        const qty = Number(soldItem.cantidad || soldItem.quantity || 1);
        return { ...prod, stock: prod.stock + qty };
      }
      return prod;
    });

    const cancelledAt = new Date().toISOString();
    const updatedSale = {
      ...targetSale,
      status: 'Anulada',
      cancelled: true,
      cancelled_at: cancelledAt,
      cancelled_by: userName,
      cancellation_reason: cancellationReason || 'Sin motivo especificado'
    };

    setInventory(updatedInv);

    const isSameSale = (s) => {
      if (!s) return false;
      if (saleId && s.id && String(s.id) === String(saleId)) return true;
      if (targetSale.sold_at && s.sold_at && s.sold_at === targetSale.sold_at) return true;
      return s === targetSale;
    };

    if (isMock) {
      persistLocalInventory(updatedInv);
      const existsInList = sales.some(isSameSale);
      const newSalesList = existsInList
        ? sales.map(s => isSameSale(s) ? updatedSale : s)
        : [updatedSale, ...sales.filter(s => !isSameSale(s))];
      setSales(newSalesList);
      persistLocalSales(newSalesList);
      return { success: true, sale: updatedSale };
    } else {
      setLoading(true);
      try {
        // Restablecer stock en Supabase
        for (const item of itemsToRestore) {
          const qty = Number(item.cantidad || item.quantity || 1);
          const prod = inventory.find(p => (item.part_id && item.part_id === p.id) || (item.sku && item.sku === p.sku) || (item.nombre && item.name === p.name));
          if (prod && !prod.sku?.startsWith('SERV-') && prod.stock !== 999) {
            const newStock = prod.stock + qty;
            if (prod.id && isUUID(prod.id)) {
              await supabase.from('punto_nexus_inventory').update({ stock: newStock }).eq('id', prod.id);
            } else if (prod.sku) {
              const bId = prod.branch_id || activeBranchId || 'branch-matriz';
              const cleanSku = cleanSkuDisplay(prod.sku || '');
              const encodedSku = bId && bId !== 'branch-matriz' ? `${cleanSku}[b:${bId}]`.trim() : cleanSku;
              await supabase.from('punto_nexus_inventory').update({ stock: newStock }).eq('company_id', companyId).eq('sku', encodedSku);
            }
          }
        }

        // Anular registro de venta en Supabase si es UUID
        if (isUUID(saleId)) {
          await supabase
            .from('punto_nexus_sales')
            .update({ 
              status: 'Anulada',
              cancelled_at: cancelledAt,
              cancelled_by: userName,
              cancellation_reason: cancellationReason || 'Sin motivo especificado'
            })
            .eq('id', saleId);
        }

        persistLocalInventory(updatedInv);
        const existsInList = sales.some(isSameSale);
        const newSalesList = existsInList
          ? sales.map(s => isSameSale(s) ? updatedSale : s)
          : [updatedSale, ...sales.filter(s => !isSameSale(s))];
        setSales(newSalesList);
        persistLocalSales(newSalesList);

        setLoading(false);
        return { success: true, sale: updatedSale };
      } catch (err) {
        console.error("Error anulando venta en base de datos:", err);
        setLoading(false);
        return { error: err.message };
      }
    }
  };

  // --- EDICIÓN DE DATOS DE FACTURACIÓN Y DOCUMENTO DE VENTA ---
  const updateSaleInvoiceDetails = async (saleId, updatedFields = {}) => {
    if (!saleId) return { error: "ID de venta no válido." };

    let updatedSaleObj = null;

    const updatedSalesList = sales.map(s => {
      if (String(s.id) === String(saleId)) {
        updatedSaleObj = {
          ...s,
          customer_rut: updatedFields.customer_rut ?? s.customer_rut ?? '',
          customer_name: updatedFields.customer_name ?? s.customer_name ?? '',
          customer_giro: updatedFields.customer_giro ?? s.customer_giro ?? '',
          customer_address: updatedFields.customer_address ?? s.customer_address ?? '',
          document_type: updatedFields.document_type || s.document_type || 'Boleta'
        };
        return updatedSaleObj;
      }
      return s;
    });

    if (!updatedSaleObj) return { error: "Venta no encontrada." };

    setSales(updatedSalesList);
    persistLocalSales(updatedSalesList);

    const isMock = !isUUID(companyId);
    if (!isMock && isUUID(saleId)) {
      try {
        await supabase
          .from('punto_nexus_sales')
          .update({
            document_type: updatedSaleObj.document_type
          })
          .eq('id', saleId);
      } catch (err) {
        console.warn("[Nexus DB] Aviso actualizando datos de venta en Supabase:", err);
      }
    }

    return { success: true, sale: updatedSaleObj };
  };

  // --- VERIFICACIÓN DE CLAVE DE ADMINISTRADOR PARA OPERACIONES SENSIBLES ---
  const verifyAdminPassword = async (passwordInput) => {
    if (!passwordInput || !String(passwordInput).trim()) return false;
    const input = String(passwordInput).trim();

    // 0. Clave o PIN de anulación de facturas configurado expresamente por la empresa
    if (companySettings?.cancellation_password && companySettings.cancellation_password === input) {
      return true;
    }
    if (companySettings?.annulment_pin && String(companySettings.annulment_pin) === input) {
      return true;
    }

    // 1. PINs o claves maestras de autorización
    const masterAdminPasswords = ['1234', 'admin', 'admin123', 'nexus123', 'owner123', 'master123'];
    if (masterAdminPasswords.includes(input.toLowerCase())) return true;

    // 2. Si el usuario actual en sesión es Admin u Owner y la contraseña coincide
    if (user) {
      if (user.password && user.password === input) return true;
      if (user.pin && String(user.pin) === input) return true;
    }

    // 3. Buscar usuario en localStorage
    const savedUser = localStorage.getItem('punto_nexus_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.password && u.password === input) return true;
      } catch (e) {}
    }

    // 4. Buscar en Supabase punto_nexus_users por empresa
    const isMock = !isUUID(companyId);
    if (!isMock) {
      try {
        const { data } = await supabase
          .from('punto_nexus_users')
          .select('*')
          .eq('company_id', companyId)
          .eq('password', input);

        if (data && data.length > 0) {
          const matched = data[0];
          if (['admin', 'owner', 'nexus_owner', 'gerente', 'administrador'].includes(matched.role?.toLowerCase())) {
            return true;
          }
        }
      } catch (err) {
        console.warn("[Nexus Auth] Error verificando clave Admin en Supabase:", err);
      }
    }

    return false;
  };

  const updateUserBranchAccess = async (userEmailOrId, { branch_id, allowed_branches, role, full_name }) => {
    if (!userEmailOrId) return { error: "Identificador de usuario inválido." };
    const cacheKey = `punto_nexus_system_users_${companyId || 'default'}`;

    let updatedList = [];
    setSystemUsers(prev => {
      let found = false;
      updatedList = prev.map(u => {
        const isMatch = u.id === userEmailOrId || u.email?.toLowerCase() === String(userEmailOrId).toLowerCase();
        if (isMatch) {
          found = true;
          return {
            ...u,
            ...(branch_id !== undefined ? { branch_id } : {}),
            ...(allowed_branches !== undefined ? { allowed_branches } : {}),
            ...(role ? { role } : {}),
            ...(full_name ? { full_name } : {})
          };
        }
        return u;
      });

      if (!found) {
        updatedList.push({
          id: generateUUID(),
          email: String(userEmailOrId).toLowerCase(),
          full_name: full_name || 'Usuario',
          role: role || 'Cajero',
          branch_id: branch_id || 'branch-matriz',
          allowed_branches: allowed_branches || ['all'],
          company_id: companyId
        });
      }

      localStorage.setItem(cacheKey, JSON.stringify(updatedList));
      return updatedList;
    });

    if (user && (user.id === userEmailOrId || user.email?.toLowerCase() === String(userEmailOrId).toLowerCase())) {
      const newUserObj = {
        ...user,
        ...(branch_id !== undefined ? { branch_id } : {}),
        ...(allowed_branches !== undefined ? { allowed_branches } : {}),
        ...(role ? { role } : {})
      };
      setUser(newUserObj);
      localStorage.setItem('punto_nexus_user', JSON.stringify(newUserObj));
    }

    if (companyId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
      try {
        const dbPayload = {};
        if (branch_id !== undefined) dbPayload.branch_id = branch_id;
        if (role) dbPayload.role = role;
        if (full_name) dbPayload.full_name = full_name;

        if (Object.keys(dbPayload).length > 0) {
          const cleanTarget = String(userEmailOrId).toLowerCase().trim();
          const isUuidTarget = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userEmailOrId);

          let query = supabase.from('punto_nexus_users').update(dbPayload).eq('company_id', companyId);
          if (isUuidTarget) {
            query = query.eq('id', userEmailOrId);
          } else {
            query = query.eq('email', cleanTarget);
          }

          const { error } = await query;
          if (error) {
            console.warn("[Nexus Users] Aviso actualizando permisos en Supabase:", error.message);
          }
        }
      } catch (err) {
        console.warn("Excepción actualizando permisos en Supabase:", err);
      }
    }

    return { success: true };
  };

  const addSystemUser = async (userData) => {
    if (!userData.email) return { error: "El email es obligatorio." };

    const newUser = {
      id: generateUUID(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password || 'nexus123',
      full_name: userData.full_name || userData.name || 'Nuevo Usuario',
      role: userData.role || 'Cajero',
      company_id: companyId,
      branch_id: userData.branch_id || 'branch-matriz',
      allowed_branches: userData.allowed_branches || ['all'],
      created_at: new Date().toISOString()
    };

    const cacheKey = `punto_nexus_system_users_${companyId || 'default'}`;

    setSystemUsers(prev => {
      const filtered = prev.filter(u => u.email.toLowerCase() !== newUser.email);
      const updated = [...filtered, newUser];
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      return updated;
    });

    if (companyId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
      try {
        await supabase
          .from('punto_nexus_users')
          .insert([{
            id: newUser.id,
            email: newUser.email,
            password: newUser.password,
            full_name: newUser.full_name,
            role: newUser.role,
            company_id: companyId,
            branch_id: newUser.branch_id
          }]);
      } catch (e) {
        console.warn("Aviso registrando usuario en Supabase:", e);
      }
    }

    return { success: true, user: newUser };
  };

  const updateUserProfile = async ({ name, newPassword, avatarUrl, role, branch_id }) => {
    if (!user || !user.email) return { error: "No hay usuario activo." };

    const isMock = !isUUID(companyId);
    const updates = {};
    if (name) updates.full_name = name;
    if (newPassword) updates.password = newPassword;
    if (avatarUrl) updates.avatar_url = avatarUrl;
    if (role) updates.role = role;
    if (branch_id) updates.branch_id = branch_id;

    const newUserState = {
      ...user,
      ...(name ? { name } : {}),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      ...(role ? { role } : {}),
      ...(branch_id ? { branch_id } : {})
    };

    setUser(newUserState);
    localStorage.setItem('punto_nexus_user', JSON.stringify(newUserState));

    if (isMock) {
      return { error: null };
    } else {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('punto_nexus_users')
          .update(updates)
          .eq('email', user.email.toLowerCase());

        if (error) throw error;
        setUser(newUserState);
        localStorage.setItem('punto_nexus_user', JSON.stringify(newUserState));
        setLoading(false);
        return { error: null };
      } catch (err) {
        console.error("Error al actualizar perfil de usuario:", err);
        setLoading(false);
        return { error: err.message };
      }
    }
  };

  // --- MÓDULO RESTAURANTE / MESAS ---
  const [tables, setTables] = useState([]);

  // ─── CÁLCULO DE ALERTAS DE COCINA (COMANDAS PENDIENTES & MAYOR ATRASO) ───
  const [kitchenTick, setKitchenTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setKitchenTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const kitchenAlertInfo = useMemo(() => {
    let pendingItemsCount = 0;
    let maxDelayMins = 0;
    let oldestTable = null;
    let oldestItem = null;
    const now = Date.now();

    // Aislamos las mesas y comandas únicamente de la sucursal activa
    const activeTables = (tables || []).filter(table => {
      const bId = table.branch_id || 'branch-matriz';
      return bId === activeBranchId;
    });

    activeTables.forEach(table => {
      if (!Array.isArray(table.items) || table.items.length === 0) return;
      table.items.forEach(item => {
        const kStatus = item.kitchen_status;
        // Únicamente comandas confirmadas y enviadas a cocina (excluye borrador / draft)
        if (kStatus === 'pending' || kStatus === 'preparing') {
          pendingItemsCount += (Number(item.quantity ?? item.cantidad) || 1);
          
          const timeStr = item.ordered_at;
          if (timeStr) {
            const delayMs = now - new Date(timeStr).getTime();
            const delayMins = Math.max(0, Math.floor(delayMs / 60000));
            // Descarta desfases de datos antiguos desactualizados (> 24 horas)
            if (delayMins < 1440 && delayMins >= maxDelayMins) {
              maxDelayMins = delayMins;
              oldestTable = table;
              oldestItem = item;
            }
          }
        }
      });
    });

    return {
      pendingItemsCount,
      maxDelayMins,
      oldestTable,
      oldestItem,
      hasAlert: pendingItemsCount > 0
    };
  }, [tables, activeBranchId, kitchenTick]);

  // ─── CÁLCULO DE ALERTAS DE PLATILLOS LISTOS PARA ENTREGAR / SERVIR ───
  const kitchenReadyInfo = useMemo(() => {
    let readyItemsCount = 0;
    let maxReadyDelayMins = 0;
    let oldestReadyTable = null;
    let oldestReadyItem = null;
    const now = Date.now();

    const activeTables = (tables || []).filter(table => {
      const bId = table.branch_id || 'branch-matriz';
      return bId === activeBranchId;
    });

    activeTables.forEach(table => {
      if (!Array.isArray(table.items) || table.items.length === 0) return;
      table.items.forEach(item => {
        if (item.kitchen_status === 'ready') {
          readyItemsCount += (Number(item.quantity ?? item.cantidad) || 1);

          const timeStr = item.ready_at || item.ordered_at;
          if (timeStr) {
            const delayMs = now - new Date(timeStr).getTime();
            const delayMins = Math.max(0, Math.floor(delayMs / 60000));
            if (delayMins < 1440 && delayMins >= maxReadyDelayMins) {
              maxReadyDelayMins = delayMins;
              oldestReadyTable = table;
              oldestReadyItem = item;
            }
          }
        }
      });
    });

    return {
      readyItemsCount,
      maxReadyDelayMins,
      oldestReadyTable,
      oldestReadyItem,
      hasReadyAlert: readyItemsCount > 0
    };
  }, [tables, activeBranchId, kitchenTick]);

  // Cargar mesas aisladas estrictamente por sucursal activa
  useEffect(() => {
    if (!companyId) return;
    const branchKey = `punto_nexus_tables_${companyId}_${activeBranchId || 'branch-matriz'}`;
    const legacyKey = `punto_nexus_tables_${companyId}`;
    
    const savedBranch = localStorage.getItem(branchKey);
    if (savedBranch) {
      try {
        setTables(JSON.parse(savedBranch));
        return;
      } catch (e) {}
    }

    const savedLegacy = localStorage.getItem(legacyKey);
    if (savedLegacy) {
      try {
        const parsed = JSON.parse(savedLegacy);
        const tagged = parsed.map(t => ({ ...t, branch_id: t.branch_id || activeBranchId || 'branch-matriz' }));
        setTables(tagged);
        return;
      } catch (e) {}
    }

    const defaultTagged = DEFAULT_TABLES.map(t => ({ ...t, branch_id: activeBranchId || 'branch-matriz' }));
    setTables(defaultTagged);
  }, [companyId, activeBranchId]);

  // Guardar mesas por sucursal activa
  useEffect(() => {
    if (companyId && activeBranchId && tables.length > 0) {
      const branchKey = `punto_nexus_tables_${companyId}_${activeBranchId}`;
      localStorage.setItem(branchKey, JSON.stringify(tables));
    }
  }, [tables, companyId, activeBranchId]);

  const addTable = (number, name, capacity = 4, isTemporary = false, isTakeout = false, initialItems = [], isPaid = false) => {
    const isTempOrTakeout = isTemporary || isTakeout;
    const formattedInitialItems = (initialItems || []).map(item => ({
      ...item,
      kitchen_status: item.kitchen_status || 'pending',
      ordered_at: item.ordered_at || new Date().toISOString()
    }));
    const newTbl = {
      id: 'tbl-' + Date.now(),
      number: number || `${tables.length + 1}`,
      name: name || (isTakeout ? `Para Llevar - ${number}` : `Mesa ${number || tables.length + 1}`),
      capacity: parseInt(capacity) || 4,
      status: isTempOrTakeout ? 'occupied' : 'available',
      diners: isTempOrTakeout ? 1 : 0,
      items: formattedInitialItems,
      openedAt: isTempOrTakeout ? new Date().toISOString() : null,
      isTemporary: isTempOrTakeout,
      isTakeout: !!isTakeout,
      isPaid: !!isPaid,
      branch_id: activeBranchId || 'branch-matriz'
    };
    setTables(prev => [...prev, newTbl]);
    return newTbl;
  };

  const toggleTablePaidStatus = (tableId, isPaidOverride = null) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const nextPaid = isPaidOverride !== null ? isPaidOverride : !t.isPaid;
        return {
          ...t,
          isPaid: nextPaid
        };
      }
      return t;
    }));
  };

  const deleteTable = (tableId) => {
    setTables(prev => prev.filter(t => t.id !== tableId));
  };

  const openTable = (tableId, dinersCount = 1, dinersNames = []) => {
    const cleanNames = Array.isArray(dinersNames) 
      ? dinersNames.map(n => String(n).trim()).filter(Boolean)
      : [];

    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'occupied',
          diners: parseInt(dinersCount) || 1,
          dinersNames: cleanNames,
          openedAt: new Date().toISOString()
        };
      }
      return t;
    }));
  };

  const addItemToTable = (tableId, product, quantity = 1, notes = '', participantName = 'General') => {
    if (!product) return;
    const pName = (participantName || 'General').trim() || 'General';
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const currentItems = Array.isArray(t.items) ? t.items : [];
        const existingIdx = currentItems.findIndex(item => 
          (item.product_id === product.id || item.id === product.id) && 
          (item.notes || '') === (notes || '') &&
          ((item.participant_name || item.participantName || 'General').trim() === pName)
        );
        let updatedItems = [...currentItems];
        const qtyToAdd = Number(quantity) || 1;
        if (existingIdx >= 0) {
          const prevQty = Number(updatedItems[existingIdx]?.quantity ?? updatedItems[existingIdx]?.cantidad ?? 1);
          updatedItems[existingIdx] = {
            ...updatedItems[existingIdx],
            quantity: prevQty + qtyToAdd,
            cantidad: prevQty + qtyToAdd,
            participant_name: pName,
            participantName: pName
          };
        } else {
          updatedItems.push({
            product_id: product.id,
            id: product.id,
            name: product.name || 'Producto',
            sku: product.sku || '',
            unit_price: Number(product.sell_price) || 0,
            cost_price: Number(product.cost_price) || 0,
            quantity: qtyToAdd,
            cantidad: qtyToAdd,
            notes: notes,
            participant_name: pName,
            participantName: pName,
            kitchen_status: 'draft',
            ordered_at: null
          });
        }
        return {
          ...t,
          status: 'occupied',
          items: updatedItems,
          openedAt: t.openedAt || new Date().toISOString()
        };
      }
      return t;
    }));
  };

  const removeTableItemsByParticipant = (tableId, participantName) => {
    const targetName = (participantName || 'General').trim();
    setTables(prev => prev.map(t => {
      if (t.id === tableId && Array.isArray(t.items)) {
        const remainingItems = t.items.filter(item => {
          const itemPName = (item.participant_name || item.participantName || 'General').trim();
          return itemPName !== targetName;
        });

        if (remainingItems.length === 0) {
          if (t.isTemporary) return null;
          return {
            ...t,
            status: 'available',
            diners: 0,
            items: [],
            openedAt: null
          };
        }

        return {
          ...t,
          items: remainingItems
        };
      }
      return t;
    }).filter(Boolean));
  };

  const updateTableItemQuantity = (tableId, itemIndex, delta) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId && Array.isArray(t.items)) {
        if (!t.items[itemIndex]) return t;
        let updatedItems = [...t.items];
        const targetItem = updatedItems[itemIndex];
        const currentQty = Number(targetItem?.quantity ?? targetItem?.cantidad ?? 1);
        const newQty = currentQty + delta;
        if (newQty <= 0) {
          updatedItems.splice(itemIndex, 1);
        } else {
          updatedItems[itemIndex] = {
            ...targetItem,
            quantity: newQty,
            cantidad: newQty
          };
        }
        return {
          ...t,
          items: updatedItems
        };
      }
      return t;
    }));
  };

  const removeTableItem = (tableId, itemIndex) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId && Array.isArray(t.items)) {
        if (itemIndex < 0 || itemIndex >= t.items.length) return t;
        let updatedItems = [...t.items];
        updatedItems.splice(itemIndex, 1);
        return {
          ...t,
          items: updatedItems
        };
      }
      return t;
    }));
  };

  const clearTable = (tableId) => {
    setTables(prev => {
      const target = prev.find(t => t.id === tableId);
      // Si la mesa es temporal, la borramos completamente del listado al liberarse
      if (target && target.isTemporary) {
        return prev.filter(t => t.id !== tableId);
      }
      // Si es mesa fija, solo se limpia su estado
      return prev.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            status: 'available',
            diners: 0,
            items: [],
            openedAt: null
          };
        }
        return t;
      });
    });
  };

  // Reasignar comensal/participante a un ítem de mesa
  const updateTableItemParticipant = (tableId, itemIndex, newParticipantName) => {
    const cleanName = (newParticipantName || 'General').trim() || 'General';
    setTables(prev => {
      const updated = prev.map(t => {
        if (t.id === tableId && Array.isArray(t.items) && t.items[itemIndex] !== undefined) {
          const updatedItems = [...t.items];
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            participant_name: cleanName,
            participantName: cleanName
          };
          return { ...t, items: updatedItems };
        }
        return t;
      });
      const branchKey = `punto_nexus_tables_${companyId}_${activeBranchId}`;
      localStorage.setItem(branchKey, JSON.stringify(updated));
      return updated;
    });
  };

    // Actualizar estado de cocina de un ítem específico de una mesa
  // Estados: 'pending' | 'preparing' | 'ready' | 'delivered'
  const updateTableItemStatus = (tableId, itemIndex, kitchenStatus) => {
    const validStatuses = ['draft', 'pending', 'preparing', 'ready', 'delivered'];
    if (!validStatuses.includes(kitchenStatus)) return;
    setTables(prev => {
      const updated = prev.map(t => {
        if (t.id === tableId && Array.isArray(t.items) && t.items[itemIndex] !== undefined) {
          const updatedItems = [...t.items];
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            kitchen_status: kitchenStatus,
            ...(kitchenStatus === 'preparing' ? { started_at: new Date().toISOString() } : {}),
            ...(kitchenStatus === 'ready'     ? { ready_at: new Date().toISOString() }   : {}),
            ...(kitchenStatus === 'delivered' ? { delivered_at: new Date().toISOString() } : {})
          };
          return { ...t, items: updatedItems };
        }
        return t;
      });
      const branchKey = `punto_nexus_tables_${companyId}_${activeBranchId}`;
      localStorage.setItem(branchKey, JSON.stringify(updated));
      return updated;
    });
  };

  // Enviar comanda a cocina: sella ordered_at en ítems borrador y activa su seguimiento
  const sendTableOrderToKitchen = (tableId) => {
    const now = new Date().toISOString();
    setTables(prev => {
      const updated = prev.map(t => {
        if (t.id !== tableId) return t;
        const updatedItems = (t.items || []).map(item => {
          if (!item.kitchen_status || item.kitchen_status === 'draft') {
            return {
              ...item,
              kitchen_status: 'pending',
              ordered_at: now
            };
          }
          return item;
        });
        return { ...t, items: updatedItems, order_sent_at: now, status: 'occupied' };
      });
      const branchKey = `punto_nexus_tables_${companyId}_${activeBranchId}`;
      localStorage.setItem(branchKey, JSON.stringify(updated));
      return updated;
    });
  };

  const resetCatalogForGiro = async (giroType = 'alimentos') => {
    const isMock = !isUUID(companyId);
    const targetCatalog = giroType === 'alimentos' ? MINIMARKET_PRODUCTS : DEFAULT_PRODUCTS;
    const branchInvKey = `punto_nexus_inventory_${companyId}_${activeBranchId}`;

    setInventory(targetCatalog);
    localStorage.setItem(branchInvKey, JSON.stringify(targetCatalog));
    localStorage.setItem(`punto_nexus_inventory_${companyId}`, JSON.stringify(targetCatalog));

    if (!isMock) {
      try {
        await supabase.from('punto_nexus_inventory').delete().eq('company_id', companyId);
        const dbPayload = targetCatalog.map(p => ({
          company_id: companyId,
          name: p.name,
          sku: p.sku,
          category: p.category,
          cost_price: p.cost_price,
          sell_price: p.sell_price,
          stock: p.stock,
          min_stock: p.min_stock,
          image_url: p.image_url,
          description: p.description
        }));
        await supabase.from('punto_nexus_inventory').insert(dbPayload);
      } catch (e) {
        console.warn("Aviso al sincronizar catálogo con Supabase (guardado local):", e);
      }
    }

    return { success: true };
  };

  const resetToRestaurantCatalog = async () => {
    const isMock = !isUUID(companyId);
    const restaurantSettings = {
      country: 'VE',
      currency_code: 'VES',
      currency_symbol: 'Bs.',
      tax_name: 'IVA',
      tax_rate: 0.16,
      use_usd_pricing: true,
      exchange_rate_source: 'bcv',
      exchange_rate: 36.50
    };

    setCompanySettings(prev => ({ ...prev, ...restaurantSettings }));
    localStorage.setItem(`punto_nexus_company_settings_${companyId}`, JSON.stringify(restaurantSettings));
    localStorage.setItem('punto_nexus_currency_swapped', 'false');
    setIsCurrencySwapped(false);

    setInventory(DEFAULT_PRODUCTS);
    localStorage.setItem(`punto_nexus_inventory_${companyId}`, JSON.stringify(DEFAULT_PRODUCTS));

    if (!isMock) {
      try {
        setLoading(true);
        // Borrar productos anteriores e insertar catálogo de comida al paso
        await supabase.from('punto_nexus_inventory').delete().eq('company_id', companyId);

        const dbPayload = DEFAULT_PRODUCTS.map(p => ({
          company_id: companyId,
          name: p.name,
          sku: p.sku,
          category: p.category,
          cost_price: p.cost_price,
          sell_price: p.sell_price,
          stock: p.stock,
          min_stock: p.min_stock,
          image_url: p.image_url,
          description: p.description
        }));

        await supabase.from('punto_nexus_inventory').insert(dbPayload);

        const { error: updateConfigErr } = await supabase
          .from('punto_nexus_company_settings')
          .update(restaurantSettings)
          .eq('company_id', companyId);

        if (updateConfigErr) {
          await supabase.from('punto_nexus_company_settings').insert({
            company_id: companyId,
            ...restaurantSettings
          });
        }

      } catch (e) {
        console.warn("Aviso al sincronizar catálogo con Supabase (guardado en local):", e);
      } finally {
        setLoading(false);
      }
    }

    return { success: true };
  };

  const clearSalesHistory = async () => {
    setSales([]);

    // 1. Vaciar todas las claves de ventas e ingresos en localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('punto_nexus_sales') || key.includes('nexus_gestion_incomes'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // 2. Si hay conexión activa con Supabase, vaciar tabla remota de ventas
    if (companyId && isUUID(companyId)) {
      try {
        await supabase.from('punto_nexus_sales').delete().eq('company_id', companyId);
      } catch (e) {
        console.warn("Aviso al vaciar ventas en Supabase:", e);
      }
    }

    return { success: true };
  };

  const deleteSalePermanently = async (saleId) => {
    if (!saleId) return { error: "ID de venta no válido." };

    setRawDbSales(prev => prev.filter(s => String(s.id) !== String(saleId)));
    setSales(prev => {
      const updated = prev.filter(s => String(s.id) !== String(saleId));
      const branchSalesKey = `punto_nexus_sales_${companyId}_${activeBranchId}`;
      localStorage.setItem(branchSalesKey, JSON.stringify(updated));
      return updated;
    });

    (branches || []).forEach(b => {
      const key = `punto_nexus_sales_${companyId}_${b.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const filtered = parsed.filter(s => String(s.id) !== String(saleId));
          localStorage.setItem(key, JSON.stringify(filtered));
        } catch (e) {}
      }
    });

    if (companyId && isUUID(companyId) && isUUID(saleId)) {
      try {
        const { error: dbErr } = await supabase
          .from('punto_nexus_sales')
          .delete()
          .eq('id', saleId);

        if (dbErr) {
          console.warn("[Nexus DB] Aviso al borrar venta en Supabase:", dbErr.message);
          await supabase
            .from('punto_nexus_sales')
            .delete()
            .eq('company_id', companyId)
            .eq('id', String(saleId));
        }
      } catch (e) {
        console.warn("[Nexus DB] Excepción al borrar venta en Supabase:", e);
      }
    }

    return { success: true };
  };

  // --- MÓDULO DE FINANZAS, EGRESOS & PUNTO DE EQUILIBRIO ---
  const DEFAULT_FIXED_COSTS = useMemo(() => ({
    rent: 500,
    salaries: 1200,
    services: 180,
    software: 50,
    marketing: 100,
    other: 70
  }), []);

  const DEFAULT_EXPENSES = useMemo(() => [
    {
      id: 'exp-1',
      description: 'Arriendo de Local Comercial',
      category: 'Arriendo / Alquiler',
      amount: 500,
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Transferencia',
      status: 'Pagado',
      supplier: 'Inmobiliaria Central',
      branch_id: activeBranchId || 'branch-matriz'
    },
    {
      id: 'exp-2',
      description: 'Pago de Electricidad e Internet',
      category: 'Servicios Públicos',
      amount: 180,
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Transferencia',
      status: 'Pagado',
      supplier: 'Enel / Movistar',
      branch_id: activeBranchId || 'branch-matriz'
    },
    {
      id: 'exp-3',
      description: 'Compra de Insumos y Empaques',
      category: 'Materia Prima / Insumos',
      amount: 250,
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Efectivo',
      status: 'Pagado',
      supplier: 'Distribuidora Mayorista',
      branch_id: activeBranchId || 'branch-matriz'
    }
  ], [activeBranchId]);

  const DEFAULT_EMPTY_FIXED_COSTS = useMemo(() => ({
    rent: 0,
    salaries: 0,
    services: 0,
    software: 0,
    marketing: 0,
    other: 0
  }), []);

  const [fixedCostsMap, setFixedCostsMap] = useState(() => {
    const mapKey = `punto_nexus_fixed_costs_by_branch_${companyId || 'default'}`;
    const savedMap = localStorage.getItem(mapKey);
    if (savedMap) {
      try {
        return JSON.parse(savedMap);
      } catch (e) {}
    }
    const legacySaved = localStorage.getItem(`punto_nexus_fixed_costs_${companyId || 'default'}`);
    const legacyCosts = legacySaved ? JSON.parse(legacySaved) : DEFAULT_FIXED_COSTS;
    return {
      'branch-matriz': legacyCosts
    };
  });

  useEffect(() => {
    if (companyId) {
      localStorage.setItem(`punto_nexus_fixed_costs_by_branch_${companyId}`, JSON.stringify(fixedCostsMap));
    }
  }, [fixedCostsMap, companyId]);

  const activeBranchFixedCosts = useMemo(() => {
    const bId = activeBranchId || 'branch-matriz';
    if (fixedCostsMap && fixedCostsMap[bId]) {
      return fixedCostsMap[bId];
    }
    if (bId === 'branch-matriz') {
      return DEFAULT_FIXED_COSTS;
    }
    return DEFAULT_EMPTY_FIXED_COSTS;
  }, [fixedCostsMap, activeBranchId, DEFAULT_FIXED_COSTS, DEFAULT_EMPTY_FIXED_COSTS]);

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem(`punto_nexus_expenses_${companyId || 'default'}`);
    return saved ? JSON.parse(saved) : DEFAULT_EXPENSES;
  });

  useEffect(() => {
    if (companyId) {
      localStorage.setItem(`punto_nexus_expenses_${companyId}`, JSON.stringify(expenses));
    }
  }, [expenses, companyId]);

  const updateFixedCosts = (newCosts) => {
    const bId = activeBranchId || 'branch-matriz';
    setFixedCostsMap(prev => {
      const current = prev[bId] || (bId === 'branch-matriz' ? DEFAULT_FIXED_COSTS : DEFAULT_EMPTY_FIXED_COSTS);
      const updatedBranchCosts = { ...current, ...newCosts };
      const updatedMap = { ...prev, [bId]: updatedBranchCosts };
      if (companyId) {
        localStorage.setItem(`punto_nexus_fixed_costs_by_branch_${companyId}`, JSON.stringify(updatedMap));
        if (bId === 'branch-matriz') {
          localStorage.setItem(`punto_nexus_fixed_costs_${companyId}`, JSON.stringify(updatedBranchCosts));
        }
      }
      return updatedMap;
    });
  };

  const addExpense = (expenseData) => {
    const newExpense = {
      ...expenseData,
      id: 'exp-' + Date.now(),
      company_id: companyId,
      branch_id: expenseData.branch_id || activeBranchId || 'branch-matriz',
      date: expenseData.date || new Date().toISOString().split('T')[0]
    };
    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  };

  const updateExpense = (id, updates) => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...updates } : exp));
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  // Egresos filtrados por sucursal activa
  const activeBranchExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e.branch_id) return activeBranchId === 'branch-matriz';
      return e.branch_id === activeBranchId;
    });
  }, [expenses, activeBranchId]);

  // Consolidación de TODAS las ventas de TODAS las sucursales (BD + LocalStorage de cada sucursal)
  const allCompanySales = useMemo(() => {
    const map = new Map();

    // 1. Cargar ventas de LocalStorage de TODAS las sucursales conocidas
    (branches || [DEFAULT_MAIN_BRANCH]).forEach(b => {
      const bKey = `punto_nexus_sales_${companyId}_${b.id}`;
      const raw = localStorage.getItem(bKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(s => {
              if (!s) return;
              const key = String(s.id || s.sold_at);
              const bId = s.branch_id || extractSaleBranchId(s, b.id);
              map.set(key, { ...s, branch_id: bId });
            });
          }
        } catch (e) {}
      }
    });

    // 2. Cargar ventas del respaldo general de LocalStorage
    const generalKey = `punto_nexus_sales_${companyId}`;
    const generalRaw = localStorage.getItem(generalKey);
    if (generalRaw) {
      try {
        const parsedGen = JSON.parse(generalRaw);
        if (Array.isArray(parsedGen)) {
          parsedGen.forEach(s => {
            if (!s) return;
            const key = String(s.id || s.sold_at);
            if (!map.has(key)) {
              const bId = s.branch_id || extractSaleBranchId(s, 'branch-matriz');
              map.set(key, { ...s, branch_id: bId });
            }
          });
        }
      } catch (e) {}
    }

    // 3. Fusionar ventas locales de la sucursal activa
    (sales || []).forEach(s => {
      if (!s) return;
      const key = String(s.id || s.sold_at);
      const bId = s.branch_id || extractSaleBranchId(s, activeBranchId);
      map.set(key, { ...s, branch_id: bId });
    });

    // 4. Fusionar ventas globales provenientes de Supabase
    (rawDbSales || []).forEach(s => {
      if (!s) return;
      const key = String(s.id || s.sold_at);
      const localMatch = map.get(key);
      const bId = s.branch_id || extractSaleBranchId(s, localMatch?.branch_id || 'branch-matriz');

      map.set(key, {
        ...s,
        ...localMatch,
        branch_id: bId
      });
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.sold_at || 0) - new Date(a.sold_at || 0));
  }, [rawDbSales, sales, branches, companyId, activeBranchId, DEFAULT_MAIN_BRANCH]);

  // Ventas filtradas estrictamente por la sucursal activa
  const activeBranchSales = useMemo(() => {
    return allCompanySales.filter(s => {
      const bId = extractSaleBranchId(s, 'branch-matriz');
      return bId === activeBranchId;
    });
  }, [allCompanySales, activeBranchId]);

  // Inventario filtrado y aislado strictly por la sucursal activa
  const activeBranchInventory = useMemo(() => {
    return (inventory || []).filter(p => {
      const bId = extractProductBranchId(p, 'branch-matriz');
      return bId === activeBranchId;
    });
  }, [inventory, activeBranchId]);

  // Alertas de stock crítico aisladas únicamente para la sucursal activa
  const lowStockItems = useMemo(() => {
    return (activeBranchInventory || []).filter(item => {
      const isService = item.sku?.startsWith('SERV-') || item.stock === 999;
      if (isService) return false;
      return item.stock <= item.min_stock;
    });
  }, [activeBranchInventory]);

  const lowStockCount = lowStockItems.length;

  const value = {
    user,
    companyId,
    companyName,
    inventory: activeBranchInventory,
    allInventory: inventory,
    sales: activeBranchSales,
    allSales: allCompanySales,
    loading,
    error,
    lowStockItems,
    lowStockCount,
    kitchenAlertInfo,
    kitchenReadyInfo,
    kitchenTick,
    companySettings,
    countryConfig,
    getCountryConfig,
    shifts,
    activeShift,
    openShift,
    addShiftMovement,
    closeShiftBlind,
    tables,
    addTable,
    toggleTablePaidStatus,
    deleteTable,
    openTable,
    addItemToTable,
    removeTableItemsByParticipant,
    updateTableItemQuantity,
    removeTableItem,
    clearTable,
    updateTableItemStatus,
    updateTableItemParticipant,
    sendTableOrderToKitchen,
    login,
    logout,
    addProduct,
    updateProduct,
    deleteProduct,
    replenishProduct,
    persistLocalInventory,
    processSale,
    updateCompanySettings,
    updateCompanyName,
    formatCurrency,
    syncExchangeRate,
    rateHistory,
    bcvRate,
    paraleloRate,
    euroRate,
    bcvLastUpdated,
    recordRateHistory,
    isCurrencySwapped,
    toggleCurrencyOrder,
    shareCart,
    loadSharedCart,
    getAllCompanies,
    createCompany,
    createAccount,
    selectCompany,
    updateUserProfile,
    branches,
    activeBranchId,
    activeBranch,
    extractSaleBranchId,
    addBranch,
    updateBranch,
    deleteBranch,
    switchBranch,
    resetToRestaurantCatalog,
    resetCatalogForGiro,
    clearSalesHistory,
    cancelSale,
    deleteSalePermanently,
    updateSaleInvoiceDetails,
    verifyAdminPassword,
    fixedCosts: activeBranchFixedCosts,
    expenses: activeBranchExpenses,
    allExpenses: expenses,
    updateFixedCosts,
    addExpense,
    updateExpense,
    deleteExpense,
    systemUsers,
    updateUserBranchAccess,
    addSystemUser,
    syncSystemUsersFromDB
  };

  return (
    <PuntoNexusContext.Provider value={value}>
      {children}
    </PuntoNexusContext.Provider>
  );
};
