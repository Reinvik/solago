import React, { useState, useEffect, useMemo } from 'react';
import { usePuntoNexus } from '../context/PuntoNexusContext';
import DualCurrencyDisplay from './DualCurrencyDisplay';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  CheckCircle2, 
  Utensils, 
  QrCode, 
  Sparkles, 
  Send, 
  Coffee, 
  ChefHat,
  ShoppingBasket,
  Lock,
  ExternalLink,
  Info,
  Flame,
  Check,
  ShieldCheck,
  Copy,
  Printer,
  Grid
} from 'lucide-react';

export default function Showcase({ isPublicView = false }) {
  const { 
    inventory, 
    companySettings, 
    companyName, 
    formatCurrency, 
    shareCart, 
    tables, 
    addItemToTable, 
    openTable 
  } = usePuntoNexus();

  // Estados de simulación y control de acceso del cliente
  const [selectedTableId, setSelectedTableId] = useState('');
  const [isTableLocked, setIsTableLocked] = useState(false);
  const [hasNoTableMode, setHasNoTableMode] = useState(false); // Si ingresó sin mesa (general QR)

  // Copiado & Modal de Todos los QR
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showAllQrsModal, setShowAllQrsModal] = useState(false);

  // Estados de la tienda/menú
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [basket, setBasket] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [participantName, setParticipantName] = useState(() => localStorage.getItem('punto_nexus_diner_name') || '');
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  const handleParticipantNameChange = (val) => {
    setParticipantName(val);
    localStorage.setItem('punto_nexus_diner_name', val);
  };

  // Modales de Éxito
  const [kioskOrderSuccess, setKioskOrderSuccess] = useState(null);
  const [generatedCode, setGeneratedCode] = useState(null);

  // Helper para asignar imagen de comida real si falta la foto
  const getProductImage = (prod) => {
    if (prod.image_url) return prod.image_url;
    const name = (prod.name || '').toLowerCase();
    const cat = (prod.category || '').toLowerCase();
    if (name.includes('combo')) return '/images/combo_nexus.jpg';
    if (name.includes('hamburg') || name.includes('burger') || cat.includes('hamburg')) return '/images/burger_nexus.jpg';
    if (name.includes('pepito') || cat.includes('pepito')) return '/images/pepito_mixto.jpg';
    if (name.includes('tequeño') || name.includes('tequeno')) return '/images/tequenos_gourmet.jpg';
    if (name.includes('arepa') || cat.includes('arepa')) return '/images/arepa_reina.jpg';
    if (name.includes('pizza') || cat.includes('pizza')) return '/images/pizza_pepperoni.jpg';
    if (name.includes('malteada') || name.includes('batido') || name.includes('oreo')) return '/images/malteada_oreo.jpg';
    if (name.includes('papas') || name.includes('fries') || cat.includes('papas')) return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80';
    if (name.includes('perro') || name.includes('hot dog')) return 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=600&q=80';
    if (name.includes('bebida') || name.includes('soda') || name.includes('jugo') || name.includes('coca') || cat.includes('bebida')) return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80';
    if (name.includes('café') || name.includes('coffee') || cat.includes('café')) return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80';
    if (name.includes('torta') || name.includes('postre') || cat.includes('postre')) return '/images/malteada_oreo.jpg';
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';
  };

  // Detectar mesa fijada en la URL (ej: ?mesa=1 o ?table=tbl-1) o si es QR general
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableQuery = urlParams.get('mesa') || urlParams.get('table') || urlParams.get('m');
    const modeQuery = urlParams.get('mode');

    if (tableQuery && tables.length > 0) {
      const foundTable = tables.find(t => 
        t.id === tableQuery || 
        t.number.toString().toLowerCase() === tableQuery.toLowerCase() || 
        t.name.toLowerCase().includes(tableQuery.toLowerCase())
      );
      if (foundTable) {
        setSelectedTableId(foundTable.id);
        setIsTableLocked(true);
        setHasNoTableMode(false);
      } else {
        setSelectedTableId(tables[0].id);
        setIsTableLocked(true);
        setHasNoTableMode(false);
      }
    } else if (modeQuery === 'takeaway' || (!tableQuery && !selectedTableId)) {
      setHasNoTableMode(true);
      setSelectedTableId('');
      setIsTableLocked(false);
    }
  }, [tables]);

  // Categorías
  const categories = useMemo(() => {
    const cats = new Set(inventory.map(p => p.category).filter(Boolean));
    return ['ALL', ...Array.from(cats)];
  }, [inventory]);

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    return inventory.filter(p => {
      if (p.sku?.startsWith('SERV-')) return false;

      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [inventory, selectedCategory, searchQuery]);

  // Helper para identificar productos de forma única
  const getProdKey = (p) => p?.id || p?.sku || p?.name;

  // Gestión de Canasta (Soporta unidades y productos a granel/peso en Kilos/Gramos)
  const addToBasket = (product, weightQtyOverride = null) => {
    if (!product) return;

    const isWeightProduct = product.is_weight_based || product.unit === 'Kg.' || product.unit === 'g';
    let weightQty = weightQtyOverride;

    if (isWeightProduct && weightQty === null) {
      let inputStr = window.prompt(
        `⚖️ Selección por Peso - "${product.name}":\n\n- Ingrese los GRAMOS (ej: 250, 400, 500, 750)\n- O ingrese los KILOS (ej: 0.250, 0.500, 1.5)\n\nPrecio por Kg: $${Number(product.sell_price || 0).toFixed(2)}`,
        "250"
      );
      if (!inputStr) return; // cancelado
      inputStr = inputStr.toLowerCase().trim().replace(',', '.').replace('g', '').replace('kg', '');
      
      let parsedNum = parseFloat(inputStr);
      if (isNaN(parsedNum) || parsedNum <= 0) {
        alert("Por favor ingrese un gramaje o peso válido.");
        return;
      }

      // Si se ingresó en gramos (ej: 250, 400, 750), convertir automáticamente a Kilos (dividir entre 1000)
      weightQty = parsedNum >= 10 ? parsedNum / 1000 : parsedNum;
    }

    const initialQty = weightQty !== null ? weightQty : 1;
    const targetKey = getProdKey(product);
    const existing = basket.find(item => getProdKey(item.part) === targetKey);

    if (existing) {
      const newQty = existing.cantidad + initialQty;
      setBasket(basket.map(item =>
        getProdKey(item.part) === targetKey ? { ...item, cantidad: Number(newQty.toFixed(3)) } : item
      ));
    } else {
      setBasket([...basket, { part: product, cantidad: Number(initialQty.toFixed(3)) }]);
    }
  };

  const updateBasketQty = (targetProd, delta) => {
    const targetKey = typeof targetProd === 'string' ? targetProd : getProdKey(targetProd);
    const item = basket.find(i => getProdKey(i.part) === targetKey);
    if (!item) return;

    const newQty = item.cantidad + delta;
    if (newQty <= 0) {
      setBasket(basket.filter(i => getProdKey(i.part) !== targetKey));
    } else {
      setBasket(basket.map(i => getProdKey(i.part) === targetKey ? { ...i, cantidad: newQty } : i));
    }
  };

  const totalItemsCount = basket.reduce((sum, item) => sum + item.cantidad, 0);
  const totalAmount = basket.reduce((sum, item) => sum + item.cantidad * item.part.sell_price, 0);

  // Confirmar Pedido
  const handleConfirmKioskOrder = async () => {
    if (basket.length === 0) return;
    setProcessingOrder(true);

    if (selectedTableId && !hasNoTableMode) {
      const targetTable = tables.find(t => t.id === selectedTableId) || tables[0];
      if (targetTable) {
        if (targetTable.status !== 'occupied') {
          openTable(targetTable.id, 2);
        }
        const activeParticipant = participantName.trim() || 'General';
        for (const item of basket) {
          addItemToTable(targetTable.id, item.part, item.cantidad, orderNotes.trim(), activeParticipant);
        }
      }

      const orderTicket = `ORD-${Math.floor(100 + Math.random() * 900)}`;
      setKioskOrderSuccess({
        ticket: orderTicket,
        tableName: targetTable?.name || 'Mesa',
        itemsCount: totalItemsCount,
        total: totalAmount
      });
    } else {
      const res = await shareCart(basket);
      if (!res.error) {
        setGeneratedCode(res.code);
      } else {
        alert(`Error al procesar: ${res.error}`);
      }
    }

    setProcessingOrder(false);
    setIsCheckoutDrawerOpen(false);
    setBasket([]);
    setOrderNotes('');
  };

  const selectedTableObj = tables.find(t => t.id === selectedTableId);

  // URL Base & URL Activa del QR (Incluye Identificador de la Empresa)
  const baseUrl = window.location.origin + window.location.pathname;
  const companyQuery = `empresa=${encodeURIComponent(companyName || 'Punto Nexus')}&c=${companySettings.company_id || 'd00de100-3333-4444-5555-666677778888'}`;
  const activeQrUrl = !hasNoTableMode && selectedTableObj 
    ? `${baseUrl}?${companyQuery}&mesa=${encodeURIComponent(selectedTableObj.name)}`
    : `${baseUrl}?${companyQuery}&mode=takeaway`;

  const activeQrLabel = !hasNoTableMode && selectedTableObj 
    ? `QR Oficial ${selectedTableObj.name} (${companyName})`
    : `QR Oficial Pedido Para Llevar (${companyName})`;

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2200);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '880px', margin: '0 auto', paddingBottom: '140px' }}>
      
      {/* ========================================================================= */}
      {/* 🛠️ BARRA SIMULADORA ADMIN (CONTROLES DE PRUEBA Y GENERADOR DE LINK/QR) 🛠️ */}
      {/* ========================================================================= */}
      {!isPublicView && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
          
          {/* Cabecera del Generador */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--color-cyan)', display: 'flex' }}>
                <QrCode size={20} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                  Generador de Links Reales & Código QR Dinámico
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Selecciona cualquier mesa para obtener su link directo y código QR oficial escaneable.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllQrsModal(true)}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, padding: '7px 12px', borderRadius: '10px', borderColor: 'var(--color-cyan)', color: 'var(--color-cyan)' }}
            >
              <Grid size={14} />
              <span>Ver Todos los QR ({tables.length + 1})</span>
            </button>
          </div>

          {/* Píldoras de Selección de Mesa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginRight: '4px' }}>
              Selecciona Mesa / Ubicación:
            </span>
            
            {tables.map((tbl, idx) => {
              const isSelected = selectedTableId === tbl.id && !hasNoTableMode;
              return (
                <button
                  key={tbl.id || tbl.number || `tbl-btn-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedTableId(tbl.id);
                    setIsTableLocked(true);
                    setHasNoTableMode(false);
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--color-cyan)' : '1px solid #cbd5e1',
                    background: isSelected ? 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(2,132,199,0.15) 100%)' : '#ffffff',
                    color: isSelected ? 'var(--color-cyan)' : '#475569',
                    fontSize: '12px',
                    fontWeight: isSelected ? 900 : 700,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 8px rgba(6,182,212,0.2)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🪑 {tbl.name}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setHasNoTableMode(true);
                setSelectedTableId('');
                setIsTableLocked(false);
              }}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                border: hasNoTableMode ? '2px solid #a855f7' : '1px solid #cbd5e1',
                background: hasNoTableMode ? 'rgba(168, 85, 247, 0.12)' : '#ffffff',
                color: hasNoTableMode ? '#7e22ce' : '#475569',
                fontSize: '12px',
                fontWeight: hasNoTableMode ? 900 : 700,
                cursor: 'pointer',
                boxShadow: hasNoTableMode ? '0 2px 8px rgba(168,85,247,0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🛍️ Para Llevar
            </button>
          </div>

          {/* ── TARJETA DEL LINK REAL Y CÓDIGO QR GENERADO EN TIEMPO REAL ── */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            
            {/* Imagen QR Generada de Alta Definición */}
            <div style={{
              background: '#ffffff',
              padding: '10px',
              borderRadius: '14px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(activeQrUrl)}`} 
                alt={activeQrLabel}
                style={{ width: '130px', height: '130px', borderRadius: '6px' }}
              />
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                ESCANEAR CON CELULAR
              </span>
            </div>

            {/* Información del Link Real & Acciones */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 900, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.3)', textTransform: 'uppercase' }}>
                  LINK REAL EN VIVO
                </span>
                <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>
                  {activeQrLabel}
                </span>
              </div>

              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 10px 0' }}>
                Este es el enlace exacto asignado a esta ubicación. Puedes colocar el código QR en la estampa de la mesa.
              </p>

              {/* Input de la URL */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  readOnly
                  value={activeQrUrl}
                  className="form-input"
                  style={{ flex: 1, fontSize: '11.5px', background: '#ffffff', fontFamily: 'monospace', fontWeight: 600, padding: '8px 12px', borderRadius: '8px', color: '#0f172a' }}
                />
              </div>

              {/* Botones de Acción: Copiar Link & Abrir en Pestaña Nueva */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(activeQrUrl)}
                  className="btn-primary"
                  style={{ padding: '7px 14px', fontSize: '11.5px', fontWeight: 800, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedUrl ? '¡LINK COPIADO!' : 'COPIAR LINK REAL'}</span>
                </button>

                <a
                  href={activeQrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '11.5px', fontWeight: 700, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: '#ffffff' }}
                >
                  <ExternalLink size={14} />
                  <span>ABRIR EN PESTAÑA ↗</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 📱 MARCO DE PANTALLA DE CELULAR / MARCA DE LA TIENDA CLIENTE 📱 */}
      {/* ========================================================================= */}
      <div style={{ background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
        
        {/* Cabecera de la Tienda (Identidad Personalizable con Logo & Colores) */}
        <div style={{
          background: companySettings.brand_color 
            ? `linear-gradient(135deg, ${companySettings.brand_color} 0%, #0f172a 100%)` 
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '24px 28px',
          color: '#ffffff',
          position: 'relative',
          borderBottom: `3px solid ${companySettings.accent_color || 'var(--color-cyan)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {companySettings.logo_url && (
                <img 
                  src={companySettings.logo_url} 
                  alt={companyName || 'Logo'} 
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '14px',
                    objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.25)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    flexShrink: 0
                  }}
                />
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 900, 
                    padding: '3px 10px', 
                    borderRadius: '20px', 
                    background: `${companySettings.accent_color || '#06b6d4'}25`, 
                    color: companySettings.accent_color || '#38bdf8', 
                    border: `1px solid ${companySettings.accent_color || '#06b6d4'}50`, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.04em' 
                  }}>
                    🟢 Abierto • Menú Digital QR
                  </span>
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0, letterSpacing: '-0.3px', color: '#ffffff' }}>
                  {companyName || 'Punto Nexus'}
                </h2>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px', margin: 0 }}>
                  Explora nuestra carta digital y realiza tu pedido directo al instante.
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', padding: '10px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'right' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Tasa del Día</span>
              <span style={{ fontSize: '13px', fontWeight: 900, color: companySettings.accent_color || '#38bdf8' }}>
                1 USD = {companySettings.exchange_rate || 1.0} {companySettings.currency_code || 'VES'}
              </span>
            </div>
          </div>

          {/* ── BANNER DE UBICACIÓN (REGLA DEL CLIENTE: FIJADO Y SIN ACCESO A CAMBIAR) ── */}
          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {!hasNoTableMode && selectedTableObj ? (
              /* ESTADO MESA FIJADA (READ-ONLY) */
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: '#4ade80' }} />
                  <div>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>
                      Ubicación Verificada: <strong style={{ color: '#38bdf8' }}>{selectedTableObj.name}</strong>
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>
                      🔒 Tu orden será entregada directamente a tu mesa.
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#4ade80', background: 'rgba(52, 211, 153, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                  MESA OK
                </span>
              </div>
            ) : (
              /* ESTADO PARA LLEVAR (SIN OPCIÓN DE ELEGIR MESA) */
              <div style={{
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShoppingBag size={18} style={{ color: '#c084fc' }} />
                <div>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>
                    Modalidad: <strong style={{ color: '#c084fc' }}>🛍️ Pedido Para Llevar / Retiro en Barra</strong>
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>
                    Al confirmar recibirás un código para retirar tu orden en caja.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cuerpo del Menú para el Cliente */}
        <div style={{ padding: '20px' }}>
          
          {/* Buscador & Píldoras de Categorías */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '12px', background: '#ffffff', fontSize: '13px' }}
                placeholder="Buscar en el menú (ej: hamburguesa, bebida, postre)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Categorías estilo Chips con Iconos */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`tables-category-chip ${selectedCategory === cat ? 'active' : ''}`}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {cat === 'ALL' ? '🍔 Ver Todo el Menú' : `🍴 ${cat}`}
                </button>
              ))}
          </div>
        </div>

        {/* Grid de Productos / Platillos con Fotos Gastronómicas en Alta Definición */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {filteredProducts.length === 0 ? (
              <div style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                No se encontraron productos disponibles en el menú.
              </div>
            ) : (
              filteredProducts.map((prod, idx) => {
                const inBasket = basket.find(item => getProdKey(item.part) === getProdKey(prod));
                const imageUrl = getProductImage(prod);
                const cardKey = prod.id ? `sc-prod-${prod.id}-${idx}` : `sc-prod-sku-${prod.sku || idx}-${idx}`;

                return (
                  <div 
                    key={cardKey} 
                    className="glass-panel"
                    style={{ 
                      background: '#ffffff', 
                      borderRadius: '16px',
                      overflow: 'hidden',
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Imagen Gastronómica */}
                    <div style={{ width: '100%', height: '140px', overflow: 'hidden', position: 'relative', background: '#f1f5f9' }}>
                      <img 
                        src={imageUrl} 
                        alt={prod.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      {prod.category && (
                        <span style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: '#ffffff',
                          backdropFilter: 'blur(4px)'
                        }}>
                          {prod.category}
                        </span>
                      )}
                    </div>

                    {/* Contenido de la Tarjeta */}
                    <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: '1.3' }}>
                          {prod.name}
                        </h4>
                        {prod.sku && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                            Ref: {prod.sku}
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <DualCurrencyDisplay 
                          amount={prod.sell_price} 
                          fontSize="15px" 
                          primaryColor={companySettings.price_color || companySettings.accent_color || 'var(--color-cyan)'} 
                          showSwap={false} 
                        />
                        
                        {inBasket ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', borderRadius: '8px', padding: '4px 8px', border: '1px solid #cbd5e1' }}>
                            <button onClick={() => updateBasketQty(prod, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                              <Minus size={14} />
                            </button>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', minWidth: '16px', textAlign: 'center' }}>{inBasket.cantidad}</span>
                            <button onClick={() => updateBasketQty(prod, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: companySettings.button_color || companySettings.accent_color || 'var(--color-cyan)', display: 'flex', alignItems: 'center' }}>
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => addToBasket(prod)}
                            style={{
                              padding: '7px 14px',
                              fontSize: '12px',
                              fontWeight: 800,
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: companySettings.button_color 
                                ? `linear-gradient(135deg, ${companySettings.button_color} 0%, ${companySettings.button_color}ee 100%)` 
                                : 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                              color: '#ffffff',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: `0 4px 12px ${companySettings.button_color || '#06b6d4'}35`,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Plus size={14} />
                            <span>AGREGAR</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 🛍️ BARRA FLOTANTE INFERIOR RESUMEN DEL CARRITO CLIENTE 🛍️ */}
      {/* ========================================================================= */}
      {basket.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '680px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: `1px solid ${companySettings.button_color || 'var(--color-cyan)'}`,
          borderRadius: '20px',
          padding: '14px 22px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          zIndex: 90,
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          color: '#ffffff'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px' }}>
              Resumen ({totalItemsCount} ítems) • {!hasNoTableMode && selectedTableObj ? selectedTableObj.name : 'Para Llevar'}
            </span>
            <div style={{ marginTop: '2px' }}>
              <DualCurrencyDisplay amount={totalAmount} fontSize="18px" primaryColor={companySettings.price_color || companySettings.accent_color || '#38bdf8'} showSwap={true} />
            </div>
          </div>

          <button 
            onClick={() => setIsCheckoutDrawerOpen(true)}
            style={{ 
              padding: '12px 22px', 
              fontSize: '14px', 
              fontWeight: 800, 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: 'auto',
              background: companySettings.button_color 
                ? `linear-gradient(135deg, ${companySettings.button_color} 0%, ${companySettings.button_color}ee 100%)` 
                : 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 4px 16px ${companySettings.button_color || '#06b6d4'}50`
            }}
          >
            <ShoppingBasket size={18} />
            <span>MI PEDIDO ↗</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🖼️ MODAL DE TODOS LOS CÓDIGOS QR Y ESTAMPAS DE MESAS IMPRIMIBLES 🖼️ */}
      {/* ========================================================================= */}
      {showAllQrsModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '820px', padding: '28px', background: '#ffffff', borderRadius: '24px' }}>
            
            <div className="modal-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={22} style={{ color: 'var(--color-cyan)' }} />
                  Estampas y Códigos QR del Establecimiento
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Imprime estas estampas o copia los enlaces para colocar los códigos QR en cada mesa del salón.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
                >
                  <Printer size={16} />
                  <span>Imprimir Estampas</span>
                </button>
                <button className="modal-close" onClick={() => setShowAllQrsModal(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Grid de QR Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Opción Para Llevar */}
              <div style={{ background: '#f8fafc', border: '2px dashed #a855f7', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(168, 85, 247, 0.15)', color: '#7e22ce', padding: '3px 10px', borderRadius: '99px' }}>
                  🛍️ PARA LLEVAR / BARRA
                </span>
                <div style={{ margin: '14px 0', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${baseUrl}?mode=takeaway`)}`} 
                    alt="QR Para Llevar"
                    style={{ width: '130px', height: '130px' }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', wordBreak: 'break-all' }}>
                  {baseUrl}?mode=takeaway
                </div>
                <button
                  onClick={() => handleCopyUrl(`${baseUrl}?mode=takeaway`)}
                  className="btn-secondary"
                  style={{ width: '100%', fontSize: '11px', fontWeight: 800, padding: '6px' }}
                >
                  Copiar Enlace
                </button>
              </div>

              {/* Mesas del salón */}
              {tables.map((tbl, idx) => {
                const tableUrl = `${baseUrl}?mesa=${encodeURIComponent(tbl.name)}`;
                return (
                  <div key={tbl.id || tbl.number || `tbl-qr-${idx}`} style={{ background: '#f8fafc', border: '2px solid var(--color-cyan)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)', padding: '3px 10px', borderRadius: '99px' }}>
                      🪑 {tbl.name}
                    </span>
                    <div style={{ margin: '14px 0', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(tableUrl)}`} 
                        alt={`QR ${tbl.name}`}
                        style={{ width: '130px', height: '130px' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', wordBreak: 'break-all' }}>
                      {tableUrl}
                    </div>
                    <button
                      onClick={() => handleCopyUrl(tableUrl)}
                      className="btn-secondary"
                      style={{ width: '100%', fontSize: '11px', fontWeight: 800, padding: '6px' }}
                    >
                      Copiar Enlace
                    </button>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📝 MODAL REVISIÓN DE PEDIDO 📝 */}
      {/* ========================================================================= */}
      {isCheckoutDrawerOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '480px', padding: '24px' }}>
            
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-cyan)' }}>
                <ShoppingBasket size={22} />
                <h3 className="modal-title" style={{ fontSize: '18px' }}>Confirmar Mi Pedido</h3>
              </div>
              <button className="modal-close" onClick={() => setIsCheckoutDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>Ubicación / Destino:</span>
              <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--color-cyan)' }}>
                {!hasNoTableMode && selectedTableObj ? `🍽️ ${selectedTableObj.name}` : '🛍️ Para Llevar / Caja'}
              </span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>Resumen de Consumo</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {basket.map((item, idx) => (
                  <div key={item.part?.id || item.part?.sku || `basket-item-${idx}`} style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{item.part.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        <DualCurrencyDisplay amount={item.part.sell_price} fontSize="11px" primaryColor="var(--text-muted)" showSwap={false} /> c/u
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>{item.cantidad}x</span>
                      <DualCurrencyDisplay amount={item.cantidad * item.part.sell_price} fontSize="13px" primaryColor="var(--color-cyan)" align="right" showSwap={false} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!hasNoTableMode && selectedTableObj && (
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 800 }}>👤 Nombre del Participante (¿Quién pide?)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Juan, María, Carlos..."
                  value={participantName}
                  onChange={(e) => handleParticipantNameChange(e.target.value)}
                  style={{ fontSize: '13px', fontWeight: 600, borderColor: 'var(--color-cyan)' }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Este nombre se usará en la mesa para identificar tus consumos y cobrar por separado en Caja.
                </span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Nota Especial para la Cocina (Opcional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Sin cebolla, extra salsa, papas bien crujientes..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                style={{ fontSize: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-secondary)' }}>TOTAL FINAL</span>
              <DualCurrencyDisplay amount={totalAmount} fontSize="22px" primaryColor="var(--color-cyan)" align="right" showSwap={true} />
            </div>

            <button
              onClick={handleConfirmKioskOrder}
              disabled={processingOrder}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Send size={16} />
              <span>{processingOrder ? 'Procesando...' : 'CONFIRMAR Y ENVIAR PEDIDO 🚀'}</span>
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODAL ÉXITO ORDEN A MESA 🚀 */}
      {/* ========================================================================= */}
      {kioskOrderSuccess && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '420px', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} style={{ color: 'var(--color-emerald)' }} />
            </div>
            
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>¡Orden Enviada a Cocina!</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Tu pedido fue asignado a <strong style={{ color: 'var(--color-cyan)' }}>{kioskOrderSuccess.tableName}</strong>.
            </p>

            <div style={{ background: '#f8fafc', border: '2px dashed var(--color-emerald)', borderRadius: '16px', padding: '16px', margin: '20px 0' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 800 }}>NÚMERO DE TICKET</span>
              <div style={{ fontSize: '36px', fontWeight: 900, color: 'var(--color-emerald)', marginTop: '2px' }}>
                {kioskOrderSuccess.ticket}
              </div>
            </div>

            <button 
              onClick={() => setKioskOrderSuccess(null)}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px' }}
            >
              ¡Entendido! Volver al Menú
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎟️ MODAL ÉXITO CÓDIGO (PARA LLEVAR) 🎟️ */}
      {/* ========================================================================= */}
      {generatedCode && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '420px', textAlign: 'center', padding: '32px 24px' }}>
            <CheckCircle2 size={44} style={{ color: 'var(--color-cyan)', margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>¡Código de Retiro Generado!</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Muestra este código en la caja para retirar tu pedido:
            </p>

            <div style={{ background: '#f0f9ff', border: '2px dashed var(--color-cyan)', borderRadius: '16px', padding: '16px', margin: '20px 0', fontFamily: 'monospace', fontSize: '38px', fontWeight: 900, color: 'var(--color-cyan)', letterSpacing: '4px' }}>
              {generatedCode}
            </div>

            <button 
              onClick={() => setGeneratedCode(null)}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
