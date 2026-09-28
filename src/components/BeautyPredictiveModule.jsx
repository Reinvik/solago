import React, { useState, useEffect, useMemo } from 'react';
import { usePuntoNexus } from '../context/PuntoNexusContext';
import { 
  Sparkles, Scissors, Crown, Users, Calendar, Clock, MessageSquare, AlertTriangle, 
  CheckCircle2, Plus, Search, Filter, RefreshCw, ShieldAlert, Award, TrendingUp, 
  DollarSign, Package, ChevronRight, Zap, Check, X, Phone, UserCheck, Flame, HeartHandshake, Eye
} from 'lucide-react';
import DualCurrencyDisplay from './DualCurrencyDisplay';
import { playSound } from '../utils/soundEffects';
import { cleanWhatsAppNumber } from '../utils/shiftExport';

// Presets demo inspirados en Youzan Meiye para barberías y salones de alta rotación
const DEFAULT_BEAUTY_CLIENTS = [
  {
    id: 'cli-1',
    name: 'Camila Soto',
    phone: '+56987654321',
    service: 'Balayage Rubio Cenizo & Matiz',
    stylist: 'Valentina Colorista',
    lastVisit: '2026-08-25', // Hace 33 días
    cycleDays: 35, // Cada 35 días
    notes: 'Cabello decolorado nivel 9, matiz cenizo, café con leche de avena',
    totalVisits: 8,
    activePass: {
      planName: 'Bono Glamour Balayage & Mantenimiento',
      totalSessions: 3,
      remainingSessions: 2,
      expiresAt: '2026-11-20'
    }
  },
  {
    id: 'cli-2',
    name: 'Mateo González',
    phone: '+56991234567',
    service: 'Corte Fade Degradé & Barba',
    stylist: 'Carlos Master Barber',
    lastVisit: '2026-09-13', // Hace 14 días
    cycleDays: 15, // Cada 15 días
    notes: 'Degradé al cero en los costados, perfilado de barba con navaja',
    totalVisits: 14,
    activePass: {
      planName: 'Pase Mensual Barbería: 4 Cortes',
      totalSessions: 4,
      remainingSessions: 1,
      expiresAt: '2026-10-05'
    }
  },
  {
    id: 'cli-3',
    name: 'Sofía Valenzuela',
    phone: '+584121234567',
    service: 'Uñas Acrílicas Esculpidas & Esmaltado',
    stylist: 'Andrea Nail Artist',
    lastVisit: '2026-08-10', // Hace 48 días (En riesgo de fuga)
    cycleDays: 21, // Cada 21 días
    notes: 'Diseños almendrados, prefiere tonos nude y glitter',
    totalVisits: 5,
    activePass: null
  },
  {
    id: 'cli-4',
    name: 'Alejandro Ramos',
    phone: '+584249876543',
    service: 'Corte Clásico & Lavado Spa',
    stylist: 'Carlos Master Barber',
    lastVisit: '2026-09-24', // Hace 3 días (Reciente)
    cycleDays: 20,
    notes: 'Peinado hacia el lado, tijera en la parte superior',
    totalVisits: 3,
    activePass: null
  },
  {
    id: 'cli-5',
    name: 'Daniela Morales',
    phone: '+56977889900',
    service: 'Alisado Keratina Brasileña & Botox',
    stylist: 'Valentina Colorista',
    lastVisit: '2026-07-20', // Hace 69 días (Ventana ideal para retoque)
    cycleDays: 75,
    notes: 'Cabello con frizz moderado, necesita secador caliente para activación',
    totalVisits: 4,
    activePass: null
  }
];

const DEFAULT_MEMBERSHIP_PLANS = [
  {
    id: 'plan-1',
    name: 'Pase 4 Cortes al Mes (Barbería VIP)',
    category: 'Barbería',
    service: 'Corte Fade / Clásico',
    sessions: 4,
    regularPrice: 60000,
    prepaidPrice: 45000,
    validityDays: 30,
    description: 'En vez de pagar $15.000 por corte suelto, el cliente compra 4 cortes por $45.000. Flujo garantizado por adelantado.',
    popular: true
  },
  {
    id: 'plan-2',
    name: 'Bono Barba & Pelo Premium (3 Sesiones)',
    category: 'Barbería',
    service: 'Corte + Barba + Toalla Caliente',
    sessions: 3,
    regularPrice: 48000,
    prepaidPrice: 38000,
    validityDays: 45,
    description: 'Pack completo para el cuidado masculino recurrente con toalla caliente y perfilado.',
    popular: false
  },
  {
    id: 'plan-3',
    name: 'Bono Glamour: 3 Sesiones Balayage / Mantenimiento',
    category: 'Salón de Belleza',
    service: 'Coloración / Balayage / Matiz',
    sessions: 3,
    regularPrice: 120000,
    prepaidPrice: 95000,
    validityDays: 90,
    description: 'Mantenimiento de color, nutrición profunda y matiz para rubios y morenas iluminadas.',
    popular: true
  },
  {
    id: 'plan-4',
    name: 'Pack 4 Manicuras Rusas & Esmaltado Permanente',
    category: 'Nails & Estética',
    service: 'Manicura Rusa',
    sessions: 4,
    regularPrice: 56000,
    prepaidPrice: 42000,
    validityDays: 60,
    description: 'Uñas impecables durante todo el mes con retiro y esmaltado incluido.',
    popular: false
  }
];

const DEFAULT_TECHNICAL_RECIPES = [
  {
    id: 'rec-1',
    service: 'Balayage / Decoloración Completa',
    category: 'Coloración',
    supplies: [
      { name: 'Polvo Decolorante Premium', standardAmount: 60, unit: 'g' },
      { name: 'Oxidante 20 Volúmenes', standardAmount: 90, unit: 'ml' },
      { name: 'Tratamiento Plex Protector', standardAmount: 20, unit: 'ml' }
    ]
  },
  {
    id: 'rec-2',
    service: 'Coloración Global Tubo 1:1',
    category: 'Coloración',
    supplies: [
      { name: 'Tinte Profesional Tubo 60g', standardAmount: 60, unit: 'g' },
      { name: 'Oxidante 20 Volúmenes', standardAmount: 60, unit: 'ml' }
    ]
  },
  {
    id: 'rec-3',
    service: 'Alisado Keratina Brasileña',
    category: 'Tratamientos',
    supplies: [
      { name: 'Crema Alisadora Keratina', standardAmount: 75, unit: 'ml' },
      { name: 'Shampoo Anti-residuos', standardAmount: 30, unit: 'ml' }
    ]
  },
  {
    id: 'rec-4',
    service: 'Afeitado Toalla Caliente & Barba',
    category: 'Barbería',
    supplies: [
      { name: 'Aceite Pre-Shave Esencial', standardAmount: 10, unit: 'ml' },
      { name: 'Espuma / Gel de Afeitar', standardAmount: 25, unit: 'ml' },
      { name: 'Hoja de Navaja Platinum', standardAmount: 1, unit: 'unidades' }
    ]
  }
];

const DEFAULT_STYLISTS = [
  {
    id: 'sty-1',
    name: 'Carlos Mendoza',
    nickname: 'Carlos Master Barber',
    specialty: 'Barbería & Degradés',
    commissionPct: 50,
    monthlyServices: 84,
    retainedClientsCount: 42,
    efficiencyScore: 98
  },
  {
    id: 'sty-2',
    name: 'Valentina Morales',
    nickname: 'Valentina Colorista',
    specialty: 'Balayage, Rubios & Alisados',
    commissionPct: 45,
    monthlyServices: 52,
    retainedClientsCount: 38,
    efficiencyScore: 94
  },
  {
    id: 'sty-3',
    name: 'Andrea Pinto',
    nickname: 'Andrea Nail Artist',
    specialty: 'Uñas Acrílicas & Rusa',
    commissionPct: 50,
    monthlyServices: 68,
    retainedClientsCount: 31,
    efficiencyScore: 96
  }
];

export default function BeautyPredictiveModule({ setActiveTab: setAppTab } = {}) {
  const { 
    companySettings, 
    companyName, 
    activeBranch, 
    companyId, 
    inventory = [], 
    updateProduct, 
    formatCurrency 
  } = usePuntoNexus();

  const [activeTab, setActiveTab] = useState('predictive'); // 'predictive' | 'memberships' | 'supplies' | 'stylists'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'golden' | 'risk' | 'recent' | 'passes'

  // Persistencia de Clientes y Ciclos
  const clientsStorageKey = `punto_nexus_beauty_clients_${companyId || 'default'}`;
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem(clientsStorageKey);
    return saved ? JSON.parse(saved) : DEFAULT_BEAUTY_CLIENTS;
  });

  // Persistencia de Planes de Membresía
  const plansStorageKey = `punto_nexus_beauty_plans_${companyId || 'default'}`;
  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem(plansStorageKey);
    return saved ? JSON.parse(saved) : DEFAULT_MEMBERSHIP_PLANS;
  });

  // Persistencia de Recetas Técnicas
  const recipesStorageKey = `punto_nexus_beauty_recipes_${companyId || 'default'}`;
  const [recipes, setRecipes] = useState(() => {
    const saved = localStorage.getItem(recipesStorageKey);
    return saved ? JSON.parse(saved) : DEFAULT_TECHNICAL_RECIPES;
  });

  // Persistencia de Estilistas
  const stylistsStorageKey = `punto_nexus_beauty_stylists_${companyId || 'default'}`;
  const [stylists, setStylists] = useState(() => {
    const saved = localStorage.getItem(stylistsStorageKey);
    return saved ? JSON.parse(saved) : DEFAULT_STYLISTS;
  });

  // Historial de Consumos de Insumos por Profesional
  const suppliesLogKey = `punto_nexus_beauty_supplies_log_${companyId || 'default'}`;
  const [suppliesLog, setSuppliesLog] = useState(() => {
    const saved = localStorage.getItem(suppliesLogKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Guardar en LocalStorage cada vez que cambien
  useEffect(() => {
    localStorage.setItem(clientsStorageKey, JSON.stringify(clients));
  }, [clients, clientsStorageKey]);

  useEffect(() => {
    localStorage.setItem(plansStorageKey, JSON.stringify(plans));
  }, [plans, plansStorageKey]);

  useEffect(() => {
    localStorage.setItem(recipesStorageKey, JSON.stringify(recipes));
  }, [recipes, recipesStorageKey]);

  useEffect(() => {
    localStorage.setItem(stylistsStorageKey, JSON.stringify(stylists));
  }, [stylists, stylistsStorageKey]);

  useEffect(() => {
    localStorage.setItem(suppliesLogKey, JSON.stringify(suppliesLog));
  }, [suppliesLog, suppliesLogKey]);

  // Modales
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showSellPassModal, setShowSellPassModal] = useState(null); // client or null
  const [showRedeemPassModal, setShowRedeemPassModal] = useState(null); // client or null
  const [showRecordSupplyModal, setShowRecordSupplyModal] = useState(false);
  const [showAddStylistModal, setShowAddStylistModal] = useState(false);

  // Estados de Formularios
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    service: 'Corte Fade Degradé & Barba',
    stylist: stylists[0]?.name || 'Carlos Master Barber',
    cycleDays: 15,
    lastVisit: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    category: 'Barbería',
    service: 'Corte de Cabello',
    sessions: 4,
    regularPrice: 60000,
    prepaidPrice: 45000,
    validityDays: 30,
    description: ''
  });

  const [selectedPlanForClient, setSelectedPlanForClient] = useState('');
  const [redeemStylist, setRedeemStylist] = useState(stylists[0]?.name || '');

  // Formulario Consumo de Insumo por Profesional
  const [supplyForm, setSupplyForm] = useState({
    stylist: stylists[0]?.name || '',
    serviceRecipeId: recipes[0]?.id || '',
    clientName: '',
    actualAmountUsed: ''
  });

  // Helper para calcular días transcurridos y estado del semáforo Youzan
  const getClientCycleStatus = (client) => {
    if (!client.lastVisit) return { daysAgo: 999, status: 'risk', statusLabel: 'Sin registro', badgeColor: '#ef4444' };
    const lastDate = new Date(client.lastVisit);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const cycle = Number(client.cycleDays || 30);

    // Ventana Dorada Youzan Meiye: cuando faltan 4 días para el ciclo o pasaron hasta 5 días después
    const goldenStart = cycle - 4;
    const goldenEnd = cycle + 5;

    if (daysAgo >= goldenStart && daysAgo <= goldenEnd) {
      return {
        daysAgo,
        cycle,
        status: 'golden',
        statusLabel: '🟢 Ventana Dorada (Listo para Recompra)',
        badgeColor: '#10b981',
        urgency: 'high'
      };
    } else if (daysAgo > goldenEnd) {
      return {
        daysAgo,
        cycle,
        status: 'risk',
        statusLabel: `🔴 Riesgo de Fuga (${daysAgo - cycle}d de atraso)`,
        badgeColor: '#ef4444',
        urgency: 'critical'
      };
    } else if (daysAgo >= cycle - 7 && daysAgo < goldenStart) {
      return {
        daysAgo,
        cycle,
        status: 'imminent',
        statusLabel: '🟡 Próximo a vencer ciclo',
        badgeColor: '#f59e0b',
        urgency: 'medium'
      };
    } else {
      return {
        daysAgo,
        cycle,
        status: 'recent',
        statusLabel: '⚪ Al día / Atendido reciente',
        badgeColor: '#64748b',
        urgency: 'low'
      };
    }
  };

  // Generador de Mensaje IA Personalizado para WhatsApp
  const generateWhatsAppPredictiveMessage = (client) => {
    const cycleInfo = getClientCycleStatus(client);
    const comp = companyName || 'SoLago Barber & Beauty';
    const clientName = client.name || 'Cliente';
    const serviceName = client.service || 'tu servicio de belleza';
    const stylistName = client.stylist || 'tu estilista habitual';
    const weeksAgo = Math.max(1, Math.round(cycleInfo.daysAgo / 7));

    if (cycleInfo.status === 'risk') {
      return `¡Hola ${clientName}! ✨ Te extrañamos mucho en ${comp}. Han pasado ${weeksAgo} semanas desde tu último ${serviceName}. Queremos consentirte: si agendas tu hora esta semana con ${stylistName}, tienes un tratamiento de hidratación profunda o perfilado de cortesía 🎁. ¿Qué día y horario te acomoda más? 💇‍♀️`;
    }

    if (client.service?.toLowerCase().includes('corte') || client.service?.toLowerCase().includes('barba')) {
      return `¡Hola ${clientName}! ✂️ Han pasado ${cycleInfo.daysAgo} días desde tu último ${serviceName} con ${stylistName} en ${comp}. Para mantener tu degradé y estilo impecable, tenemos cupos disponibles esta semana. ¿Te reservo tu horario habitual? ¡Saludos! 💈`;
    }

    return `¡Hola ${clientName}! ✨ Han pasado ${weeksAgo} semanas desde tu último ${serviceName} con ${stylistName} en ${comp}. ¡Es el momento perfecto para retocar y mantener el brillo y salud de tu cabello! Te guardamos un espacio preferencial este jueves o viernes. ¿Deseas que te reservemos tu hora? 💖`;
  };

  // Enviar mensaje directo por WhatsApp
  const handleSendWhatsAppPredictive = (client) => {
    const msg = generateWhatsAppPredictiveMessage(client);
    const cleanPhone = cleanWhatsAppNumber(client.phone, companySettings?.country || 'VE');
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Marcar visita atendida hoy (resetea el ciclo)
  const handleMarkVisitToday = (clientId) => {
    playSound('payment');
    const todayStr = new Date().toISOString().split('T')[0];
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          lastVisit: todayStr,
          totalVisits: (c.totalVisits || 0) + 1
        };
      }
      return c;
    }));
    alert('✅ Visita registrada con éxito. El ciclo predictivo se ha reiniciado para la próxima fecha dorada.');
  };

  // Canjear 1 sesión del pase prepago
  const handleRedeemPassSession = (e) => {
    e.preventDefault();
    if (!showRedeemPassModal) return;
    playSound('payment');
    const client = showRedeemPassModal;
    const remaining = (client.activePass?.remainingSessions || 1) - 1;
    const todayStr = new Date().toISOString().split('T')[0];

    setClients(prev => prev.map(c => {
      if (c.id === client.id) {
        return {
          ...c,
          lastVisit: todayStr,
          totalVisits: (c.totalVisits || 0) + 1,
          activePass: remaining > 0 ? {
            ...c.activePass,
            remainingSessions: remaining
          } : null
        };
      }
      return c;
    }));

    // Mensaje automático de confirmación de sesión al cliente
    const cleanPhone = cleanWhatsAppNumber(client.phone, companySettings?.country || 'VE');
    const comp = companyName || 'SoLago';
    const confirmMsg = `¡Hola ${client.name}! ✂️ Se ha canjeado exitosamente 1 sesión de tu *${client.activePass?.planName}* en ${comp} con ${redeemStylist}.\n\n📊 *Saldo restante:* Te quedan ${remaining} ${remaining === 1 ? 'sesión disponible' : 'sesiones disponibles'}.\n¡Muchas gracias por tu visita y preferencia!`;
    const shareUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(confirmMsg)}`;

    setShowRedeemPassModal(null);
    if (window.confirm(`✅ Sesión canjeada con éxito. Saldo restante: ${remaining} sesiones.\n\n¿Deseas enviar el comprobante de saldo restante por WhatsApp al cliente?`)) {
      window.open(shareUrl, '_blank');
    }
  };

  // Vender un nuevo plan de membresía prepago al cliente
  const handleSellPassToClient = (e) => {
    e.preventDefault();
    if (!showSellPassModal || !selectedPlanForClient) return;
    const plan = plans.find(p => p.id === selectedPlanForClient);
    if (!plan) return;

    playSound('payment');
    const client = showSellPassModal;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (plan.validityDays || 30));
    const expiryStr = expiryDate.toISOString().split('T')[0];

    const newPass = {
      planName: plan.name,
      totalSessions: plan.sessions,
      remainingSessions: plan.sessions,
      expiresAt: expiryStr,
      boughtAt: new Date().toISOString().split('T')[0],
      price: plan.prepaidPrice
    };

    setClients(prev => prev.map(c => {
      if (c.id === client.id) {
        return {
          ...c,
          activePass: newPass
        };
      }
      return c;
    }));

    setShowSellPassModal(null);
    setSelectedPlanForClient('');

    const cleanPhone = cleanWhatsAppNumber(client.phone, companySettings?.country || 'VE');
    const comp = companyName || 'SoLago';
    const welcomeMsg = `🎉 ¡Felicitaciones ${client.name}! Has activado tu *${plan.name}* en ${comp}.\n\n🎟️ *Sesiones prepagadas:* ${plan.sessions} sesiones\n📅 *Válido hasta:* ${expiryStr}\n💰 *Ahorro total:* Prepago exclusivo activado.\n\n¡Te esperamos en tu próxima visita!`;
    const shareUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(welcomeMsg)}`;

    if (window.confirm(`✅ Membresía "${plan.name}" activada para ${client.name}.\n\n¿Deseas enviar la tarjeta digital de bienvenida por WhatsApp al cliente?`)) {
      window.open(shareUrl, '_blank');
    }
  };

  // Registrar consumo de insumo por profesional con cálculo de sobregasto
  const handleRecordSupplyUsage = (e) => {
    e.preventDefault();
    if (!supplyForm.actualAmountUsed || isNaN(Number(supplyForm.actualAmountUsed))) {
      alert("Por favor ingresa la cantidad utilizada.");
      return;
    }

    const recipe = recipes.find(r => r.id === supplyForm.serviceRecipeId);
    if (!recipe) return;

    const usedVal = Number(supplyForm.actualAmountUsed);
    const standardMainSupply = recipe.supplies[0];
    const stdVal = standardMainSupply?.standardAmount || 60;
    const deviationPct = Math.round(((usedVal - stdVal) / stdVal) * 100);

    const logEntry = {
      id: 'log-' + Date.now(),
      date: new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }),
      stylist: supplyForm.stylist,
      service: recipe.service,
      clientName: supplyForm.clientName || 'Cliente Salón',
      supplyName: standardMainSupply?.name,
      standardAmount: stdVal,
      actualAmount: usedVal,
      unit: standardMainSupply?.unit || 'g',
      deviationPct: deviationPct
    };

    setSuppliesLog(prev => [logEntry, ...prev]);
    setShowRecordSupplyModal(false);
    setSupplyForm({
      stylist: stylists[0]?.name || '',
      serviceRecipeId: recipes[0]?.id || '',
      clientName: '',
      actualAmountUsed: ''
    });

    if (deviationPct > 20) {
      playSound('error');
      alert(`⚠️ Consumo registrado. Advertencia: Se detectó un sobregasto de +${deviationPct}% respecto a la receta estándar (${usedVal} vs ${stdVal}${standardMainSupply?.unit}).`);
    } else {
      playSound('scan');
      alert(`✅ Consumo registrado correctamente (${usedVal} ${standardMainSupply?.unit}). Rendimiento óptimo.`);
    }
  };

  // Métricas Youzan Meiye para la cabecera
  const predictiveMetrics = useMemo(() => {
    let goldenCount = 0;
    let riskCount = 0;
    let totalWithPass = 0;
    let estimatedRevenueToRecover = 0;

    clients.forEach(c => {
      const cycleInfo = getClientCycleStatus(c);
      if (cycleInfo.status === 'golden') goldenCount++;
      if (cycleInfo.status === 'risk') {
        riskCount++;
        estimatedRevenueToRecover += 25000; // Estimación promedio por servicio
      }
      if (c.activePass && c.activePass.remainingSessions > 0) totalWithPass++;
    });

    return {
      goldenCount,
      riskCount,
      totalWithPass,
      estimatedRevenueToRecover,
      totalClients: clients.length
    };
  }, [clients]);

  // Clientes filtrados
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const cycleInfo = getClientCycleStatus(c);
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.stylist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.phone?.includes(searchTerm);
      if (!matchesSearch) return false;

      if (filterStatus === 'golden') return cycleInfo.status === 'golden';
      if (filterStatus === 'risk') return cycleInfo.status === 'risk';
      if (filterStatus === 'recent') return cycleInfo.status === 'recent';
      if (filterStatus === 'passes') return c.activePass && c.activePass.remainingSessions > 0;
      return true;
    });
  }, [clients, searchTerm, filterStatus]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ─── CABECERA PREMIUM YOUZAN MEIYE ─── */}
      <div className="glass-panel" style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1px solid rgba(236, 72, 153, 0.25)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(236, 72, 153, 0.35)',
            flexShrink: 0
          }}>
            <Scissors size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Barbería, Salones & Estética Predictiva
              </h2>
              <span style={{ fontSize: '10.5px', fontWeight: 900, background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', padding: '3px 10px', borderRadius: '99px', letterSpacing: '0.04em' }}>
                YOUZAN MEIYE (有赞美业)
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', margin: 0 }}>
              Retención predictiva por WhatsApp, pases de membresía prepago garantizados y control de insumos por profesional.
            </p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowAddClientModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
            }}
          >
            <Plus size={15} />
            <span>+ Nuevo Cliente / Ciclo</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRecordSupplyModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            <Package size={15} style={{ color: '#ec4899' }} />
            <span>Medir Insumos</span>
          </button>

          {setAppTab && (
            <button
              type="button"
              onClick={() => setAppTab('pos')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
              title="Ir al Terminal de Punto de Venta"
            >
              <DollarSign size={15} style={{ color: '#10b981' }} />
              <span>Ir al POS</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── PESTAÑAS DEL MÓDULO ─── */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        padding: '6px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        {[
          { id: 'predictive', label: '🔮 IA de Recompra Predictiva', badge: `${predictiveMetrics.goldenCount} en ventana` },
          { id: 'memberships', label: '💳 Membresías & Pases Prepago', badge: `${predictiveMetrics.totalWithPass} activos` },
          { id: 'supplies', label: '🧪 Control de Insumos & Recetas', badge: `${recipes.length} recetas` },
          { id: 'stylists', label: '💈 Profesionales & Estilistas', badge: `${stylists.length}` }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '12px',
                border: isActive ? '1.5px solid #ec4899' : '1.5px solid transparent',
                background: isActive ? 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.06))' : 'transparent',
                color: isActive ? '#be185d' : '#64748b',
                fontWeight: isActive ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: isActive ? '#ec4899' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 🔮 SUB-TAB 1: IA DE RECOMPRA PREDICTIVA                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'predictive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tarjetas de Métricas Predictivas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '18px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>VENTANA DORADA DE CONTACTO</span>
                <span style={{ padding: '3px 8px', borderRadius: '99px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontSize: '11px', fontWeight: 800 }}>Hoy / Esta Semana</span>
              </div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', margin: '6px 0 2px 0' }}>
                {predictiveMetrics.goldenCount}
              </div>
              <p style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 700, margin: 0 }}>
                Clientes que deben recibir mensaje hoy antes de ir a otro salón
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '18px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>EN RIESGO DE FUGA</span>
                <span style={{ padding: '3px 8px', borderRadius: '99px', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', fontSize: '11px', fontWeight: 800 }}>Atraso Crítico</span>
              </div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#dc2626', margin: '6px 0 2px 0' }}>
                {predictiveMetrics.riskCount}
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                Clientes inactivos que requieren cupón o incentivo de retorno
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '18px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', borderLeft: '4px solid #ec4899' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>CON PASES PREPAGO ACTIVOS</span>
                <Crown size={16} style={{ color: '#ec4899' }} />
              </div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#be185d', margin: '6px 0 2px 0' }}>
                {predictiveMetrics.totalWithPass}
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                Clientes con saldo de sesiones pagadas por adelantado
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '18px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TOTAL CLIENTES MONITOREADOS</span>
                <Users size={16} style={{ color: '#8b5cf6' }} />
              </div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#6d28d9', margin: '6px 0 2px 0' }}>
                {predictiveMetrics.totalClients}
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                Base de datos con ciclos automáticos por estilista
              </p>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '8px 14px', flex: '1 1 300px' }}>
              <Search size={16} style={{ color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Buscar por cliente, servicio, estilista o WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'golden', label: '🟢 Ventana Dorada' },
                { id: 'risk', label: '🔴 En Riesgo' },
                { id: 'recent', label: '⚪ Al Día' },
                { id: 'passes', label: '🎟️ Con Pases' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '99px',
                    border: filterStatus === f.id ? '1.5px solid #ec4899' : '1px solid #cbd5e1',
                    background: filterStatus === f.id ? '#ec4899' : '#ffffff',
                    color: filterStatus === f.id ? '#ffffff' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Clientes con Semáforo Predictivo e IA WhatsApp */}
          <div className="glass-panel" style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '14px 18px' }}>Cliente / WhatsApp</th>
                    <th style={{ padding: '14px 18px' }}>Servicio & Estilista</th>
                    <th style={{ padding: '14px 18px' }}>Última Visita</th>
                    <th style={{ padding: '14px 18px' }}>Ciclo & Semáforo Youzan</th>
                    <th style={{ padding: '14px 18px' }}>Membresía / Pase</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Acción Inteligente</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        No se encontraron clientes con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map(client => {
                      const cycle = getClientCycleStatus(client);
                      return (
                        <tr key={client.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{client.name}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Phone size={11} />
                              <span>{client.phone}</span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: '#334155' }}>{client.service}</div>
                            <div style={{ fontSize: '11.5px', color: '#ec4899', fontWeight: 700, marginTop: '2px' }}>
                              💇 {client.stylist}
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('es-VE') : 'N/A'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              Hace {cycle.daysAgo} días
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '99px',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              background: `${cycle.badgeColor}15`,
                              color: cycle.badgeColor,
                              border: `1px solid ${cycle.badgeColor}35`
                            }}>
                              {cycle.statusLabel}
                            </span>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                              Ciclo normal: cada {client.cycleDays} días
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            {client.activePass ? (
                              <div style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.2)', padding: '6px 10px', borderRadius: '10px' }}>
                                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#be185d' }}>
                                  {client.activePass.planName}
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                                  {client.activePass.remainingSessions} de {client.activePass.totalSessions} sesiones disponibles
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowSellPassModal(client);
                                  setSelectedPlanForClient(plans[0]?.id || '');
                                }}
                                style={{
                                  background: '#f8fafc',
                                  border: '1px dashed #cbd5e1',
                                  color: '#64748b',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                + Vender Pase
                              </button>
                            )}
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              {client.activePass && client.activePass.remainingSessions > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowRedeemPassModal(client);
                                    setRedeemStylist(client.stylist || stylists[0]?.name || '');
                                  }}
                                  style={{
                                    background: '#10b981',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '11.5px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Canjear y descontar 1 sesión de su membresía"
                                >
                                  <Scissors size={12} />
                                  <span>Canjear</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppPredictive(client)}
                                style={{
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                                }}
                                title="Abrir WhatsApp con mensaje personalizado de recompra"
                              >
                                <MessageSquare size={13} />
                                <span>WhatsApp IA</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMarkVisitToday(client.id)}
                                style={{
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  color: '#475569',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Registrar que vino hoy y reiniciar su ciclo"
                              >
                                Atendido Hoy
                              </button>
                            </div>
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 💳 SUB-TAB 2: MEMBRESÍAS & PASES PREPAGO                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'memberships' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Catálogo de Planes de Membresía Prepago (次卡)
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px', margin: 0 }}>
                Asegura el flujo de caja cobrando 3, 4 o más sesiones por adelantado con descuento para el cliente.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPlanModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Plus size={15} />
              <span>+ Crear Nuevo Plan</span>
            </button>
          </div>

          {/* Grid de Planes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            {plans.map(plan => {
              const savings = plan.regularPrice - plan.prepaidPrice;
              const savingsPct = Math.round((savings / plan.regularPrice) * 100);

              return (
                <div 
                  key={plan.id}
                  className="glass-panel"
                  style={{
                    padding: '22px',
                    borderRadius: '18px',
                    background: '#ffffff',
                    border: plan.popular ? '2px solid #ec4899' : '1px solid #e2e8f0',
                    boxShadow: plan.popular ? '0 8px 24px rgba(236, 72, 153, 0.15)' : '0 2px 8px rgba(15,23,42,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {plan.popular && (
                    <span style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '20px',
                      background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 900,
                      padding: '3px 10px',
                      borderRadius: '99px',
                      boxShadow: '0 2px 8px rgba(236,72,153,0.4)',
                      letterSpacing: '0.04em'
                    }}>
                      MÁS POPULAR ⭐
                    </span>
                  )}

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#ec4899', textTransform: 'uppercase' }}>
                      {plan.category}
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '4px 0 8px 0' }}>
                      {plan.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4', margin: '0 0 14px 0' }}>
                      {plan.description}
                    </p>

                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                          Regular: {formatCurrency(plan.regularPrice)}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981' }}>
                          Ahorra {savingsPct}% ({formatCurrency(savings)})
                        </span>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                        {formatCurrency(plan.prepaidPrice)}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                        🎟️ Incluye <strong>{plan.sessions} sesiones</strong> • Válido por {plan.validityDays} días
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlanForClient(plan.id);
                      setShowSellPassModal(clients[0] || null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Crown size={14} />
                    <span>Asignar / Vender Pase</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 🧪 SUB-TAB 3: CONTROL DE INSUMOS & RECETAS TÉCNICAS                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'supplies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Recetas Técnicas & Rendimiento de Insumos (配方与耗材)
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px', margin: 0 }}>
                Establece el estándar de gramaje/ml por servicio para evitar fugas de producto y sobrecostos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRecordSupplyModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
              }}
            >
              <Package size={15} />
              <span>+ Registrar Gasto en Atención</span>
            </button>
          </div>

          {/* Grid de Recetas Técnicas Estándar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {recipes.map(rec => (
              <div key={rec.id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#ec4899', textTransform: 'uppercase' }}>
                  {rec.category}
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '4px 0 12px 0' }}>
                  {rec.service}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rec.supplies.map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px' }}>
                      <span style={{ color: '#475569' }}>{s.name}</span>
                      <strong style={{ color: '#0f172a' }}>{s.standardAmount} {s.unit}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Historial de Consumos Registrados */}
          <div className="glass-panel" style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px 0' }}>
              Historial de Consumo por Profesional & Desviaciones
            </h4>

            {suppliesLog.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
                No hay consumos registrados aún. Haz clic en "Medir Insumos" para registrar la primera atención.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 14px' }}>Fecha</th>
                      <th style={{ padding: '10px 14px' }}>Profesional</th>
                      <th style={{ padding: '10px 14px' }}>Servicio / Cliente</th>
                      <th style={{ padding: '10px 14px' }}>Insumo</th>
                      <th style={{ padding: '10px 14px' }}>Estándar</th>
                      <th style={{ padding: '10px 14px' }}>Real Usado</th>
                      <th style={{ padding: '10px 14px' }}>Desviación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliesLog.map(item => {
                      const isHighWaste = item.deviationPct > 15;
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.date}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{item.stylist}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ color: '#334155', fontWeight: 600 }}>{item.service}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.clientName}</div>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#475569' }}>{item.supplyName}</td>
                          <td style={{ padding: '10px 14px' }}>{item.standardAmount} {item.unit}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800 }}>{item.actualAmount} {item.unit}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '99px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: isHighWaste ? '#fee2e2' : '#dcfce7',
                              color: isHighWaste ? '#dc2626' : '#15803d'
                            }}>
                              {item.deviationPct > 0 ? `+${item.deviationPct}%` : `${item.deviationPct}%`}
                              {isHighWaste ? ' (Sobrecosto)' : ' (Óptimo)'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 💈 SUB-TAB 4: EQUIPO DE PROFESIONALES / ESTILISTAS                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'stylists' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Equipo de Estilistas & Barberos (技师团队)
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px', margin: 0 }}>
                Comisiones por servicio, retención de clientes leales y rendimiento por profesional.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddStylistModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              <span>+ Nuevo Profesional</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
            {stylists.map(sty => (
              <div key={sty.id} className="glass-panel" style={{ padding: '22px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))',
                    color: '#be185d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '18px'
                  }}>
                    {sty.name.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{sty.name}</h4>
                    <span style={{ fontSize: '11.5px', color: '#ec4899', fontWeight: 700 }}>{sty.specialty}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Comisión Base</span>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{sty.commissionPct}%</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Clientes Leales</span>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>{sty.retainedClientsCount}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Servicios / Mes</span>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{sty.monthlyServices}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Eficiencia Insumos</span>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#8b5cf6' }}>{sty.efficiencyScore}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 🛑 MODAL: REGISTRAR NUEVO CLIENTE / CICLO                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showAddClientModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '480px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Registrar Cliente & Ciclo Predictivo
              </h3>
              <button onClick={() => setShowAddClientModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!clientForm.name.trim() || !clientForm.phone.trim()) {
                alert("Nombre y teléfono son obligatorios.");
                return;
              }
              const newC = {
                id: 'cli-' + Date.now(),
                name: clientForm.name.trim(),
                phone: clientForm.phone.trim(),
                service: clientForm.service,
                stylist: clientForm.stylist,
                cycleDays: Number(clientForm.cycleDays || 30),
                lastVisit: clientForm.lastVisit || new Date().toISOString().split('T')[0],
                notes: clientForm.notes,
                totalVisits: 1,
                activePass: null
              };
              setClients(prev => [newC, ...prev]);
              setShowAddClientModal(false);
              setClientForm({
                name: '',
                phone: '',
                service: 'Corte Fade Degradé & Barba',
                stylist: stylists[0]?.name || 'Carlos Master Barber',
                cycleDays: 15,
                lastVisit: new Date().toISOString().split('T')[0],
                notes: ''
              });
              playSound('scan');
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Nombre del Cliente *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: Camila Soto o Carlos Silva"
                    value={clientForm.name}
                    onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: +56987654321 o 04121234567"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Servicio Habitual</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Balayage, Corte, Barba"
                      value={clientForm.service}
                      onChange={(e) => setClientForm(prev => ({ ...prev, service: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Estilista / Barbero</label>
                    <select
                      className="form-input"
                      value={clientForm.stylist}
                      onChange={(e) => setClientForm(prev => ({ ...prev, stylist: e.target.value }))}
                    >
                      {stylists.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Ciclo de Servicio (Días)</label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      className="form-input"
                      value={clientForm.cycleDays}
                      onChange={(e) => setClientForm(prev => ({ ...prev, cycleDays: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Fecha Última Visita</label>
                    <input
                      type="date"
                      className="form-input"
                      value={clientForm.lastVisit}
                      onChange={(e) => setClientForm(prev => ({ ...prev, lastVisit: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Preferencias / Ficha Técnica</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    placeholder="Ej: Tono cenizo 9.1, no cortar mucho arriba, alérgica al amoníaco..."
                    value={clientForm.notes}
                    onChange={(e) => setClientForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddClientModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ background: '#ec4899' }}>
                    Guardar Cliente
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛑 MODAL: VENDER PLAN DE MEMBRESÍA PREPAGO */}
      {showSellPassModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '440px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Vender Membresía Prepago a Cliente
              </h3>
              <button onClick={() => setShowSellPassModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSellPassToClient}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '12.5px' }}>
                  <div style={{ color: '#64748b' }}>Cliente Receptor:</div>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{showSellPassModal.name}</strong> ({showSellPassModal.phone})
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Selecciona el Plan de Membresía *</label>
                  <select
                    className="form-input"
                    value={selectedPlanForClient}
                    onChange={(e) => setSelectedPlanForClient(e.target.value)}
                    required
                  >
                    <option value="">-- Elige un Plan --</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sessions} sesiones) - {formatCurrency(p.prepaidPrice)}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowSellPassModal(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ background: '#10b981' }}>
                    Confirmar Cobro y Activar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛑 MODAL: CANJEAR SESIÓN DE MEMBRESÍA */}
      {showRedeemPassModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '440px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Canjear 1 Sesión de Membresía
              </h3>
              <button onClick={() => setShowRedeemPassModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRedeemPassSession}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.2)', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#be185d', fontWeight: 800 }}>MEMBRESÍA ACTIVA</div>
                  <strong style={{ fontSize: '15px', color: '#0f172a' }}>{showRedeemPassModal.activePass?.planName}</strong>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                    Saldo actual: {showRedeemPassModal.activePass?.remainingSessions} de {showRedeemPassModal.activePass?.totalSessions} sesiones
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Profesional / Estilista que atiende *</label>
                  <select
                    className="form-input"
                    value={redeemStylist}
                    onChange={(e) => setRedeemStylist(e.target.value)}
                    required
                  >
                    {stylists.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.specialty})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowRedeemPassModal(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ background: '#ec4899' }}>
                    ✂️ Descontar 1 Sesión
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛑 MODAL: MEDIR Y REGISTRAR INSUMO POR PROFESIONAL */}
      {showRecordSupplyModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '460px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Control de Insumos por Profesional (Medición)
              </h3>
              <button onClick={() => setShowRecordSupplyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordSupplyUsage}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Estilista / Barbero Responsable *</label>
                  <select
                    className="form-input"
                    value={supplyForm.stylist}
                    onChange={(e) => setSupplyForm(prev => ({ ...prev, stylist: e.target.value }))}
                    required
                  >
                    {stylists.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Servicio / Receta Estándar *</label>
                  <select
                    className="form-input"
                    value={supplyForm.serviceRecipeId}
                    onChange={(e) => setSupplyForm(prev => ({ ...prev, serviceRecipeId: e.target.value }))}
                    required
                  >
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.service} ({r.supplies[0]?.name}: {r.supplies[0]?.standardAmount} {r.supplies[0]?.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Cliente Atendido (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Camila Soto"
                    value={supplyForm.clientName}
                    onChange={(e) => setSupplyForm(prev => ({ ...prev, clientName: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Cantidad Real Utilizada en Báscula *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="form-input"
                    placeholder="Ej: 65 (gramos o ml reales)"
                    value={supplyForm.actualAmountUsed}
                    onChange={(e) => setSupplyForm(prev => ({ ...prev, actualAmountUsed: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowRecordSupplyModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ background: '#ec4899' }}>
                    Registrar y Evaluar Desviación
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛑 MODAL: CREAR PLAN DE MEMBRESÍA */}
      {showAddPlanModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '460px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Crear Plan de Membresía Prepago
              </h3>
              <button onClick={() => setShowAddPlanModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!planForm.name.trim()) return;
              const newPlan = {
                id: 'plan-' + Date.now(),
                name: planForm.name.trim(),
                category: planForm.category,
                service: planForm.service,
                sessions: Number(planForm.sessions || 4),
                regularPrice: Number(planForm.regularPrice || 0),
                prepaidPrice: Number(planForm.prepaidPrice || 0),
                validityDays: Number(planForm.validityDays || 30),
                description: planForm.description,
                popular: false
              };
              setPlans(prev => [...prev, newPlan]);
              setShowAddPlanModal(false);
              playSound('scan');
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Nombre del Plan *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: Pase 4 Cortes al Mes"
                    value={planForm.name}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Categoría</label>
                    <select
                      className="form-input"
                      value={planForm.category}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Barbería">Barbería</option>
                      <option value="Salón de Belleza">Salón de Belleza</option>
                      <option value="Nails & Estética">Nails & Estética</option>
                      <option value="Spa & Masajes">Spa & Masajes</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>N° de Sesiones</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      className="form-input"
                      value={planForm.sessions}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, sessions: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Precio Regular Suelto</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="60000"
                      value={planForm.regularPrice}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, regularPrice: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Precio Prepago Plan</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="45000"
                      value={planForm.prepaidPrice}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, prepaidPrice: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Vigencia en Días</label>
                  <input
                    type="number"
                    className="form-input"
                    value={planForm.validityDays}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, validityDays: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Descripción Comercial</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    placeholder="Beneficios exclusivos del pase..."
                    value={planForm.description}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddPlanModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ background: '#10b981' }}>
                    Guardar Plan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛑 MODAL: AGREGAR ESTILISTA */}
      {showAddStylistModal && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '440px', padding: '24px', background: '#ffffff', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Registrar Profesional / Estilista
              </h3>
              <button onClick={() => setShowAddStylistModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const name = form.st_name.value.trim();
              const spec = form.st_spec.value.trim();
              const comm = Number(form.st_comm.value || 50);

              if (!name) return;
              const newSty = {
                id: 'sty-' + Date.now(),
                name,
                nickname: name,
                specialty: spec || 'Estilista Integral',
                commissionPct: comm,
                monthlyServices: 0,
                retainedClientsCount: 0,
                efficiencyScore: 100
              };
              setStylists(prev => [...prev, newSty]);
              setShowAddStylistModal(false);
              playSound('scan');
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Nombre Completo *</label>
                  <input name="st_name" required type="text" className="form-input" placeholder="Ej: Marcela Gómez" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>Especialidad Principal</label>
                  <input name="st_spec" type="text" className="form-input" placeholder="Ej: Colorista Senior / Barbería Fade" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>% Comisión por Servicio</label>
                  <input name="st_comm" type="number" defaultValue="50" min="0" max="100" className="form-input" />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddStylistModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ background: '#8b5cf6' }}>
                    Guardar Profesional
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
