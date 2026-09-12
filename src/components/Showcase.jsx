import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePuntoNexus, isNexusOwnerAccount } from '../context/PuntoNexusContext';
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
  Grid,
  Trash2,
  Maximize2,
  ZoomIn,
  Ruler,
  Layers,
  MessageSquare,
  Edit3,
  Save,
  Unlock,
  Package,
  ChevronLeft,
  ChevronRight,
  Upload,
  Star,
  Camera,
  Image as ImageIcon,
  MessageCircle,
  Globe,
  Truck,
  Store,
  Palette
} from 'lucide-react';
import { parseProductSpecs, serializeProductSpecs, getProductVariants, getTotalVariantsStock, hasProductVariants, getVariantStock, normalizeVariants } from '../utils/productSpecs';
import { formatShowcaseWhatsAppOrder, getOrderWhatsAppUrl } from '../utils/whatsappOrder';

export default function Showcase({ isPublicView = false }) {
  const { 
    inventory, 
    companySettings, 
    companyName, 
    formatCurrency, 
    shareCart, 
    tables, 
    addItemToTable, 
    openTable,
    updateProduct,
    user,
    verifyAdminPassword,
    branches,
    activeBranchId,
    activeBranch,
    switchBranch
  } = usePuntoNexus();

  // Giro Comercial y modalidades adaptativas
  const currentGiro = companySettings?.business_type || (companyName?.toLowerCase().includes('anubis') ? 'tienda_online' : 'gastronomia');
  const isFoodBusiness = currentGiro === 'gastronomia';
  const isOnlineStore = currentGiro === 'tienda_online' || !isFoodBusiness;

  // Estados de simulación y control de acceso del cliente
  const [selectedTableId, setSelectedTableId] = useState('');
  const [isTableLocked, setIsTableLocked] = useState(false);
  const [hasNoTableMode, setHasNoTableMode] = useState(!isFoodBusiness); // Si es tienda online o ingresó sin mesa

  // Modalidad Tienda Online (Delivery vs Retiro en Tienda)
  const [storeDeliveryMode, setStoreDeliveryMode] = useState('delivery'); // 'delivery' | 'pickup'
  const [storeLinkMode, setStoreLinkMode] = useState('catalog'); // 'catalog' | 'delivery' | 'pickup'
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('punto_nexus_customer_phone') || '');
  const [shippingAddress, setShippingAddress] = useState(() => localStorage.getItem('punto_nexus_shipping_address') || '');

  const handlePhoneChange = (val) => {
    setCustomerPhone(val);
    localStorage.setItem('punto_nexus_customer_phone', val);
  };
  const handleCustomerPhoneChange = handlePhoneChange;

  const handleAddressChange = (val) => {
    setShippingAddress(val);
    localStorage.setItem('punto_nexus_shipping_address', val);
  };
  const handleShippingAddressChange = handleAddressChange;

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
  const [copiedOrderMsg, setCopiedOrderMsg] = useState(false);

  const handleCopyOrderSummary = (msgText) => {
    if (!msgText) return;
    navigator.clipboard.writeText(msgText);
    setCopiedOrderMsg(true);
    setTimeout(() => setCopiedOrderMsg(false), 2500);
  };

  // ── ESTADOS DE VISTA AMPLIADA / FICHA DE PRODUCTO (MODO MERCADO LIBRE) ──
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [specsForm, setSpecsForm] = useState({
    dimensions: '',
    materials: '',
    description: '',
    owner_notes: '',
    images: []
  });
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');

  // Manejo de fotos directamente desde vitrina (Modo Dueño)
  const showcaseFileInputRef = useRef(null);
  const [showcaseUrlInput, setShowcaseUrlInput] = useState('');
  const [compressingShowcaseImage, setCompressingShowcaseImage] = useState(false);

  // Control de sesión y desbloqueo de dueño
  const isOwnerUser = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const name = (user.name || '').toLowerCase();
    return (
      role === 'nexusowner' ||
      role === 'nexus_owner' ||
      role === 'administrador' ||
      role === 'admin' ||
      role === 'owner' ||
      role === 'superuser' ||
      role === 'super_admin' ||
      isNexusOwnerAccount(email) ||
      isNexusOwnerAccount(name) ||
      email.includes('albenis') ||
      name.includes('albenis') ||
      email.includes('ricardo') ||
      name.includes('ricardo') ||
      email.includes('ariel') ||
      name.includes('ariel')
    );
  }, [user]);

  const [isOwnerSessionUnlocked, setIsOwnerSessionUnlocked] = useState(false);
  const isOwner = isOwnerUser || isOwnerSessionUnlocked;

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  const compressShowcaseImage = (file, maxWidth = 600, maxHeight = 600, quality = 0.75) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleShowcaseImageFileSelect = async (file) => {
    if (!file || !file.type?.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    setCompressingShowcaseImage(true);
    try {
      const dataUrl = await compressShowcaseImage(file, 600, 600, 0.75);
      setSpecsForm(prev => {
        const currentImgs = Array.isArray(prev.images) ? [...prev.images] : [];
        return { ...prev, images: [...currentImgs, dataUrl] };
      });
    } catch (e) {
      alert('No se pudo procesar la imagen.');
    } finally {
      setCompressingShowcaseImage(false);
      if (showcaseFileInputRef.current) showcaseFileInputRef.current.value = '';
    }
  };

  const handleAddShowcaseUrlImage = () => {
    const trimmed = showcaseUrlInput.trim();
    if (!trimmed) return;
    setSpecsForm(prev => {
      const current = Array.isArray(prev.images) ? [...prev.images] : [];
      if (current.includes(trimmed)) return prev;
      return { ...prev, images: [...current, trimmed] };
    });
    setShowcaseUrlInput('');
  };

  const handleRemoveShowcaseImage = (idxToRemove) => {
    setSpecsForm(prev => {
      const current = Array.isArray(prev.images) ? [...prev.images] : [];
      const nextImgs = current.filter((_, i) => i !== idxToRemove);
      return { ...prev, images: nextImgs };
    });
    setActiveImageIndex(0);
  };

  const handleSetShowcasePrimaryImage = (idxToPrimary) => {
    setSpecsForm(prev => {
      const current = Array.isArray(prev.images) ? [...prev.images] : [];
      if (idxToPrimary <= 0 || idxToPrimary >= current.length) return prev;
      const target = current[idxToPrimary];
      const rest = current.filter((_, i) => i !== idxToPrimary);
      return { ...prev, images: [target, ...rest] };
    });
    setActiveImageIndex(0);
  };

  // Helper para identificar productos y variantes de forma única
  const getProdKey = (p) => p?.id || p?.sku || p?.name;
  const getBasketItemKey = (part, variant = null) => {
    const base = getProdKey(part);
    const vId = variant?.id || (variant?.color ? `col_${variant.color}` : '');
    return vId ? `${base}__var_${vId}` : base;
  };

  // Control de stock e inventario en Tienda Online / Vitrina
  const isUnlimitedStock = (prod) => {
    if (!prod) return false;
    if (hasProductVariants(prod)) return false; // si tiene variantes, el stock se rige por cada variante
    if (prod.sku?.startsWith('SERV-') || prod.stock === 999) return true;
    if (isFoodBusiness && (prod.stock === undefined || prod.stock === null || prod.stock === '')) return true;
    return false;
  };

  const getProductStock = (prod) => {
    if (!prod) return 0;
    if (isUnlimitedStock(prod)) return Infinity;
    const vars = getProductVariants(prod);
    if (vars.length > 0) {
      return getTotalVariantsStock(vars);
    }
    return Math.max(0, Number(prod.stock || 0));
  };

  const handleOpenProductDetail = (prod) => {
    setSelectedProductDetail(prod);
    const specs = parseProductSpecs(prod);
    const prodImages = (specs.images && specs.images.length > 0)
      ? specs.images
      : (prod.image_url ? [prod.image_url] : []);
    const prodVariants = specs.variants && specs.variants.length > 0
      ? specs.variants
      : getProductVariants(prod);

    setSpecsForm({
      dimensions: specs.dimensions || '',
      materials: specs.materials || '',
      description: specs.description || '',
      owner_notes: specs.owner_notes || '',
      images: prodImages,
      variants: prodVariants
    });
    setActiveImageIndex(0);

    let activeVar = null;
    if (prodVariants.length > 0) {
      activeVar = prodVariants.find(v => Number(v.stock) > 0) || prodVariants[0];
      setSelectedVariantId(activeVar?.id || null);
    } else {
      setSelectedVariantId(null);
    }

    const isUnlim = isUnlimitedStock(prod);
    const maxStock = activeVar ? Number(activeVar.stock || 0) : getProductStock(prod);
    const targetKey = activeVar ? getBasketItemKey(prod, activeVar) : getProdKey(prod);
    const inCartQty = basket.find(i => (i.basketKey || getBasketItemKey(i.part, i.selectedVariant)) === targetKey)?.cantidad || 0;
    const canAdd = isUnlim ? 99 : Math.max(0, maxStock - inCartQty);
    setDetailQuantity(canAdd > 0 ? 1 : 0);

    setIsEditingSpecs(false);
    setSaveFeedback('');
  };

  const handleSaveSpecs = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProductDetail) return;
    setSavingSpecs(true);
    setSaveFeedback('');

    try {
      const allImgs = Array.isArray(specsForm.images) && specsForm.images.length > 0
        ? specsForm.images
        : (selectedProductDetail.image_url ? [selectedProductDetail.image_url] : []);
      const primaryPhoto = allImgs[0] || '';

      const serialized = serializeProductSpecs({
        description: specsForm.description,
        dimensions: specsForm.dimensions,
        materials: specsForm.materials,
        owner_notes: specsForm.owner_notes,
        images: allImgs,
        variants: specsForm.variants || []
      });
      const updates = {
        description: serialized,
        dimensions: specsForm.dimensions,
        materials: specsForm.materials,
        owner_notes: specsForm.owner_notes,
        images: allImgs,
        image_url: primaryPhoto,
        variants: specsForm.variants || []
      };

      const res = await updateProduct(selectedProductDetail.id, updates);
      if (res && res.error) {
        setSaveFeedback(`Error al guardar: ${res.error}`);
      } else {
        setSaveFeedback('¡Ficha y fotos guardadas con éxito!');
        setSelectedProductDetail(prev => ({
          ...prev,
          ...updates
        }));
        setTimeout(() => {
          setIsEditingSpecs(false);
          setSaveFeedback('');
        }, 1200);
      }
    } catch (err) {
      setSaveFeedback(`Error: ${err.message || err}`);
    } finally {
      setSavingSpecs(false);
    }
  };

  const handleAddDetailToBasket = () => {
    if (!selectedProductDetail) return;
    if (detailQuantity <= 0) {
      alert("Selecciona al menos 1 unidad para agregar.");
      return;
    }

    const specs = parseProductSpecs(selectedProductDetail);
    const variants = specs.variants && specs.variants.length > 0 ? specs.variants : getProductVariants(selectedProductDetail);
    const hasVars = variants.length > 0;
    const selectedVar = hasVars ? (variants.find(v => v.id === selectedVariantId) || variants[0]) : null;

    const maxStock = selectedVar ? Number(selectedVar.stock || 0) : getProductStock(selectedProductDetail);
    const isUnlimited = isUnlimitedStock(selectedProductDetail);
    const targetKey = selectedVar ? getBasketItemKey(selectedProductDetail, selectedVar) : getProdKey(selectedProductDetail);
    const inCart = basket.find(i => (i.basketKey || getBasketItemKey(i.part, i.selectedVariant)) === targetKey);
    const currentInCart = inCart ? inCart.cantidad : 0;

    if (!isUnlimited) {
      if (maxStock <= 0) {
        alert(selectedVar 
          ? `El color "${selectedVar.color}" está agotado en inventario.` 
          : `"${selectedProductDetail.name}" está agotado en inventario.`
        );
        return;
      }
      if (currentInCart + detailQuantity > maxStock) {
        const remaining = Math.max(0, maxStock - currentInCart);
        if (remaining <= 0) {
          alert(selectedVar 
            ? `Ya tienes el total disponible (${maxStock} unidades) del color "${selectedVar.color}" en tu pedido.` 
            : `Ya tienes el total disponible (${maxStock} unidades) en tu pedido.`
          );
        } else {
          alert(selectedVar 
            ? `No puedes agregar ${detailQuantity} unidades. Solo quedan ${remaining} disponibles en color "${selectedVar.color}".` 
            : `No puedes agregar ${detailQuantity} unidades. Solo quedan ${remaining} disponibles en inventario.`
          );
        }
        return;
      }
    }

    if (inCart) {
      setBasket(basket.map(item =>
        (item.basketKey || getBasketItemKey(item.part, item.selectedVariant)) === targetKey 
          ? { ...item, cantidad: item.cantidad + detailQuantity } 
          : item
      ));
    } else {
      setBasket([...basket, { 
        part: selectedProductDetail, 
        cantidad: detailQuantity,
        selectedVariant: selectedVar,
        basketKey: targetKey
      }]);
    }
    setSelectedProductDetail(null);
  };

  const handleUnlockOwner = async (e) => {
    if (e) e.preventDefault();
    if (!unlockPassword.trim()) {
      setUnlockError('Ingresa la contraseña');
      return;
    }
    const isValid = await verifyAdminPassword(unlockPassword);
    if (isValid) {
      setIsOwnerSessionUnlocked(true);
      setShowUnlockModal(false);
      setUnlockPassword('');
      setUnlockError('');
      setIsEditingSpecs(true);
    } else {
      setUnlockError('Contraseña de administrador incorrecta');
    }
  };

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

  // Detectar mesa fijada en la URL (ej: ?mesa=1) o modalidades de Tienda Online (?mode=delivery, pickup)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableQuery = urlParams.get('mesa') || urlParams.get('table') || urlParams.get('m');
    const modeQuery = urlParams.get('mode');

    if (modeQuery === 'delivery') {
      setHasNoTableMode(true);
      setStoreDeliveryMode('delivery');
      setSelectedTableId('');
      setIsTableLocked(false);
    } else if (modeQuery === 'pickup' || modeQuery === 'takeaway') {
      setHasNoTableMode(true);
      setStoreDeliveryMode('pickup');
      setSelectedTableId('');
      setIsTableLocked(false);
    } else if (isFoodBusiness && tableQuery && tables.length > 0) {
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
    } else {
      setHasNoTableMode(true);
      setSelectedTableId('');
      setIsTableLocked(false);
    }
  }, [tables, isFoodBusiness]);

  // Categorías
  const categories = useMemo(() => {
    const cats = new Set(inventory.map(p => (p.category || '').trim()).filter(Boolean));
    return ['ALL', ...Array.from(cats)];
  }, [inventory]);

  // Productos filtrados sincronizados con Inventario
  const filteredProducts = useMemo(() => {
    return inventory.filter(p => {
      const matchesCategory = selectedCategory === 'ALL' || (p.category || '').trim() === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [inventory, selectedCategory, searchQuery]);

  // Gestión de Canasta (Soporta unidades y productos a granel/peso en Kilos/Gramos)
  const addToBasket = (product, weightQtyOverride = null) => {
    if (!product) return;

    // Si tiene variantes de color, redirigir a elegir el color en la ficha
    if (hasProductVariants(product)) {
      handleOpenProductDetail(product);
      return;
    }

    const maxStock = getProductStock(product);
    const isUnlimited = isUnlimitedStock(product);

    if (!isUnlimited && maxStock <= 0) {
      alert(`El producto "${product.name}" está agotado en inventario.`);
      return;
    }

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
    const existing = basket.find(item => (item.basketKey || getBasketItemKey(item.part, item.selectedVariant)) === targetKey);
    const currentInBasket = existing ? existing.cantidad : 0;

    if (!isUnlimited && (currentInBasket + initialQty > maxStock)) {
      const remaining = maxStock - currentInBasket;
      if (remaining <= 0) {
        alert(`Ya tienes el total disponible (${maxStock} ${product.unit || 'unidades'}) de "${product.name}" en tu pedido.`);
      } else {
        alert(`Solo quedan ${remaining} ${product.unit || 'unidades'} disponibles en inventario de "${product.name}". No es posible agregar más.`);
      }
      return;
    }

    if (existing) {
      const newQty = existing.cantidad + initialQty;
      setBasket(basket.map(item =>
        (item.basketKey || getBasketItemKey(item.part, item.selectedVariant)) === targetKey ? { ...item, cantidad: Number(newQty.toFixed(3)) } : item
      ));
    } else {
      setBasket([...basket, { part: product, cantidad: Number(initialQty.toFixed(3)), basketKey: targetKey }]);
    }
  };

  const updateBasketQty = (targetProd, delta, targetVariant = null) => {
    let targetKey = '';
    if (typeof targetProd === 'string') {
      targetKey = targetProd;
    } else if (targetProd && targetProd.part) {
      targetKey = targetProd.basketKey || getBasketItemKey(targetProd.part, targetProd.selectedVariant);
    } else {
      targetKey = getBasketItemKey(targetProd, targetVariant);
    }

    const item = basket.find(i => (i.basketKey || getBasketItemKey(i.part, i.selectedVariant)) === targetKey);
    if (!item) return;

    if (delta > 0) {
      if (item.selectedVariant) {
        const maxVarStock = Number(item.selectedVariant.stock || 0);
        if (item.cantidad + delta > maxVarStock) {
          alert(`Stock insuficiente para el color "${item.selectedVariant.color}". Solo hay ${maxVarStock} unidades disponibles.`);
          return;
        }
      } else {
        const maxStock = getProductStock(item.part);
        const isUnlimited = isUnlimitedStock(item.part);
        if (!isUnlimited && item.cantidad + delta > maxStock) {
          alert(`Stock insuficiente. Solo hay ${maxStock} ${item.part.unit || 'unidades'} disponibles en inventario.`);
          return;
        }
      }
    }

    const newQty = item.cantidad + delta;
    if (newQty <= 0) {
      setBasket(basket.filter(i => (i.basketKey || getBasketItemKey(i.part, i.selectedVariant)) !== targetKey));
    } else {
      setBasket(basket.map(i => (i.basketKey || getBasketItemKey(i.part, i.selectedVariant)) === targetKey ? { ...i, cantidad: Number(newQty.toFixed(3)) } : i));
    }
  };

  const totalItemsCount = basket.reduce((sum, item) => sum + item.cantidad, 0);
  const totalAmount = basket.reduce((sum, item) => sum + item.cantidad * item.part.sell_price, 0);

  // Confirmar Pedido y Enviar a WhatsApp del Dueño
  const handleConfirmKioskOrder = async () => {
    if (basket.length === 0) return;
    setProcessingOrder(true);

    let ticketCode = '';
    let finalTableName = '';
    let orderType = 'takeaway';
    const currentBasket = [...basket];
    const currentTotal = totalAmount;
    const currentNotes = orderNotes;

    if (!isFoodBusiness) {
      orderType = storeDeliveryMode; // 'delivery' | 'pickup'
      const res = await shareCart(currentBasket);
      if (!res.error) {
        ticketCode = res.code;
      } else {
        ticketCode = `ONL-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (selectedTableId && !hasNoTableMode) {
      orderType = 'table';
      const targetTable = tables.find(t => t.id === selectedTableId) || tables[0];
      if (targetTable) {
        finalTableName = targetTable.name;
        if (targetTable.status !== 'occupied') {
          openTable(targetTable.id, 2);
        }
        const activeParticipant = participantName.trim() || 'General';
        for (const item of currentBasket) {
          addItemToTable(targetTable.id, item.part, item.cantidad, currentNotes.trim(), activeParticipant);
        }
      }

      ticketCode = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    } else {
      orderType = 'takeaway';
      const res = await shareCart(currentBasket);
      if (!res.error) {
        ticketCode = res.code;
      } else {
        alert(`Error al procesar: ${res.error}`);
        setProcessingOrder(false);
        return;
      }
    }

    // Formatear mensaje para el WhatsApp del dueño
    const ownerPhone = companySettings?.owner_whatsapp_phone || companySettings?.phone || '';
    const whatsappMsg = formatShowcaseWhatsAppOrder({
      companyName,
      activeBranch,
      participantName,
      orderType,
      tableName: finalTableName,
      ticketCode,
      basket: currentBasket,
      totalAmount: currentTotal,
      orderNotes: currentNotes,
      companySettings,
      customerPhone,
      shippingAddress,
      isOnlineStore
    });

    const whatsappUrl = getOrderWhatsAppUrl(ownerPhone, whatsappMsg);

    // Intentar abrir WhatsApp inmediatamente
    try {
      if (whatsappUrl) {
        window.open(whatsappUrl, '_blank');
      }
    } catch (e) {
      console.warn("Popup de WhatsApp bloqueado:", e);
    }

    if (orderType === 'table') {
      setKioskOrderSuccess({
        ticket: ticketCode,
        tableName: finalTableName || 'Mesa',
        itemsCount: totalItemsCount,
        total: currentTotal,
        whatsappUrl,
        whatsappMsg,
        ownerPhone
      });
    } else {
      setGeneratedCode({
        code: ticketCode,
        total: currentTotal,
        whatsappUrl,
        whatsappMsg,
        ownerPhone,
        isOnlineStore,
        orderType
      });
    }

    setProcessingOrder(false);
    setIsCheckoutDrawerOpen(false);
    setBasket([]);
    setOrderNotes('');
  };

  const selectedTableObj = tables.find(t => t.id === selectedTableId);

  // URL Base & URL Activa del QR (Incluye Identificador de la Empresa y Sucursal Activa)
  const baseUrl = window.location.origin + window.location.pathname;
  const targetBranchParam = activeBranchId && activeBranchId !== 'branch-matriz' ? `&b=${encodeURIComponent(activeBranchId)}` : '';
  const companyQuery = `empresa=${encodeURIComponent(companyName || 'Punto Nexus')}&c=${companySettings.company_id || 'd00de100-3333-4444-5555-666677778888'}${targetBranchParam}`;
  const activeBranchLabel = activeBranch?.name ? ` - Sede: ${activeBranch.name}` : '';

  let activeQrUrl = '';
  let activeQrLabel = '';
  let activeQrDesc = '';

  if (isFoodBusiness) {
    activeQrUrl = !hasNoTableMode && selectedTableObj 
      ? `${baseUrl}?${companyQuery}&mesa=${encodeURIComponent(selectedTableObj.name)}`
      : `${baseUrl}?${companyQuery}&mode=takeaway`;

    activeQrLabel = !hasNoTableMode && selectedTableObj 
      ? `QR Oficial ${selectedTableObj.name} (${companyName}${activeBranchLabel})`
      : `QR Oficial Pedido Para Llevar (${companyName}${activeBranchLabel})`;

    activeQrDesc = 'Este es el enlace exacto asignado a esta ubicación. Puedes colocar el código QR en la estampa de la mesa.';
  } else {
    // Modo Tienda Online / E-Commerce
    if (storeLinkMode === 'delivery') {
      activeQrUrl = `${baseUrl}?${companyQuery}&mode=delivery`;
      activeQrLabel = `QR Oficial Pedidos a Domicilio (${companyName}${activeBranchLabel})`;
      activeQrDesc = 'Enlace directo preconfigurado para que tus clientes pidan con envío a domicilio.';
    } else if (storeLinkMode === 'pickup') {
      activeQrUrl = `${baseUrl}?${companyQuery}&mode=pickup`;
      activeQrLabel = `QR Oficial Retiro en Tienda (${companyName}${activeBranchLabel})`;
      activeQrDesc = 'Enlace para clientes que desean hacer su pedido previo y retirar en tu local.';
    } else {
      activeQrUrl = `${baseUrl}?${companyQuery}`;
      activeQrLabel = `QR y Enlace de Tienda Online (${companyName}${activeBranchLabel})`;
      activeQrDesc = 'Enlace oficial a tu tienda web. Cópialo para tu perfil de Instagram, estados de WhatsApp o volantes.';
    }
  }

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
                  {isFoodBusiness ? 'Generador de Links Reales & Código QR Dinámico' : 'Enlace Oficial y Códigos QR de tu Tienda Online'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  {isFoodBusiness 
                    ? 'Selecciona cualquier mesa para obtener su link directo y código QR oficial escaneable.'
                    : 'Comparte estos enlaces en redes sociales o genera códigos QR para tus volantes, empaques y publicidad.'}
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
              <span>{isFoodBusiness ? `Ver Todos los QR (${tables.length + 1})` : 'Ver Todos los Enlaces y QR'}</span>
            </button>
          </div>

          {/* Selector de Sucursal en la barra de simulación (si hay más de 1 o para ver sede activa) */}
          {branches.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginRight: '4px' }}>
                Filtrar Sucursal / Sede:
              </span>
              {branches.map(b => {
                const isSelected = activeBranchId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setActiveBranchId(b.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: isSelected ? 'rgba(2, 132, 199, 0.12)' : '#ffffff',
                      color: isSelected ? '#0284c7' : '#475569',
                      fontSize: '11px',
                      fontWeight: isSelected ? 900 : 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{b.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Píldoras de Selección: Mesas para Restaurantes / Modos para Tienda Online */}
          {isFoodBusiness ? (
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
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em', marginRight: '4px' }}>
                Tipo de Enlace / Código QR:
              </span>
              
              <button
                type="button"
                onClick={() => {
                  setStoreLinkMode('catalog');
                  setStoreDeliveryMode('pickup');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: storeLinkMode === 'catalog' ? '2px solid var(--color-cyan)' : '1px solid #cbd5e1',
                  background: storeLinkMode === 'catalog' ? 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(2,132,199,0.15) 100%)' : '#ffffff',
                  color: storeLinkMode === 'catalog' ? 'var(--color-cyan)' : '#475569',
                  fontSize: '12px',
                  fontWeight: storeLinkMode === 'catalog' ? 900 : 700,
                  cursor: 'pointer',
                  boxShadow: storeLinkMode === 'catalog' ? '0 2px 8px rgba(6,182,212,0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Globe size={14} />
                <span>Catálogo Web Principal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoreLinkMode('delivery');
                  setStoreDeliveryMode('delivery');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: storeLinkMode === 'delivery' ? '2px solid #10b981' : '1px solid #cbd5e1',
                  background: storeLinkMode === 'delivery' ? 'rgba(16, 185, 129, 0.15)' : '#ffffff',
                  color: storeLinkMode === 'delivery' ? '#059669' : '#475569',
                  fontSize: '12px',
                  fontWeight: storeLinkMode === 'delivery' ? 900 : 700,
                  cursor: 'pointer',
                  boxShadow: storeLinkMode === 'delivery' ? '0 2px 8px rgba(16,185,129,0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Truck size={14} />
                <span>Pedidos con Envío a Domicilio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoreLinkMode('pickup');
                  setStoreDeliveryMode('pickup');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  border: storeLinkMode === 'pickup' ? '2px solid #a855f7' : '1px solid #cbd5e1',
                  background: storeLinkMode === 'pickup' ? 'rgba(168, 85, 247, 0.15)' : '#ffffff',
                  color: storeLinkMode === 'pickup' ? '#7e22ce' : '#475569',
                  fontSize: '12px',
                  fontWeight: storeLinkMode === 'pickup' ? 900 : 700,
                  cursor: 'pointer',
                  boxShadow: storeLinkMode === 'pickup' ? '0 2px 8px rgba(168,85,247,0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Store size={14} />
                <span>Retiro en Tienda / Local</span>
              </button>
            </div>
          )}

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
                {activeQrDesc}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
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
                    {isFoodBusiness ? '🟢 Abierto • Menú Digital QR' : '🛍️ Tienda Online Oficial'}
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 900, 
                    padding: '3px 10px', 
                    borderRadius: '20px', 
                    background: 'rgba(255,255,255,0.12)', 
                    color: '#ffffff', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.04em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    📍 {activeBranch?.name || 'Matriz Principal'}
                  </span>
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0, letterSpacing: '-0.3px', color: '#ffffff' }}>
                  {companyName || 'Punto Nexus'}
                </h2>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px', margin: 0 }}>
                  {isFoodBusiness 
                    ? 'Explora nuestra carta digital y realiza tu pedido directo al instante.'
                    : 'Explora nuestro catálogo exclusivo, haz tu pedido y recibe atención directa.'}
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

          {/* ── BANNER DE UBICACIÓN / MODALIDAD ── */}
          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {!isFoodBusiness ? (
              <div style={{
                background: storeDeliveryMode === 'delivery' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(6, 182, 212, 0.14)',
                border: `1px solid ${storeDeliveryMode === 'delivery' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(6, 182, 212, 0.35)'}`,
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {storeDeliveryMode === 'delivery' ? (
                    <Truck size={20} style={{ color: '#4ade80' }} />
                  ) : (
                    <Store size={20} style={{ color: '#38bdf8' }} />
                  )}
                  <div>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff', display: 'block' }}>
                      {storeDeliveryMode === 'delivery' ? '🛵 Pedido con Envío a Domicilio' : '🏬 Pedido con Retiro en Tienda'}
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                      {storeDeliveryMode === 'delivery'
                        ? 'Envíos directos con despacho a tu dirección.'
                        : 'Puedes retirar tu compra directamente en nuestra sede.'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setStoreDeliveryMode('delivery')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: storeDeliveryMode === 'delivery' ? '#10b981' : 'rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Truck size={12} />
                    <span>Envío</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreDeliveryMode('pickup')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: storeDeliveryMode === 'pickup' ? 'var(--color-cyan)' : 'rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Store size={12} />
                    <span>Retiro</span>
                  </button>
                </div>
              </div>
            ) : !hasNoTableMode && selectedTableObj ? (
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
          
          {/* Selector de Sede si la empresa tiene múltiples sucursales */}
          {branches && branches.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>
                🏢 Sede:
              </span>
              {branches.map(b => {
                const isSelected = b.id === activeBranchId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => switchBranch(b.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--color-cyan)' : '1px solid #cbd5e1',
                      background: isSelected ? 'rgba(6, 182, 212, 0.12)' : '#ffffff',
                      color: isSelected ? 'var(--color-cyan)' : '#475569',
                      fontSize: '11.5px',
                      fontWeight: isSelected ? 900 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{b.name}</span>
                    {b.is_main && <span style={{ fontSize: '9px', background: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>MATRIZ</span>}
                  </button>
                );
              })}
            </div>
          )}

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
                const hasVars = hasProductVariants(prod);
                const prodVariants = getProductVariants(prod);
                const inBasketCount = basket.filter(item => getProdKey(item.part) === getProdKey(prod)).reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
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
                    {/* Imagen Gastronómica (Clic para ampliar y ver ficha de producto) */}
                    <div 
                      onClick={() => handleOpenProductDetail(prod)}
                      style={{ 
                        width: '100%', 
                        height: '145px', 
                        overflow: 'hidden', 
                        position: 'relative', 
                        background: '#f1f5f9',
                        cursor: 'pointer'
                      }}
                      title="Haz clic para ver foto ampliada, materiales y dimensiones"
                    >
                      <img 
                        src={imageUrl} 
                        alt={prod.name} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} 
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; }}
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

                      {!isUnlimitedStock(prod) && getProductStock(prod) <= 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          fontSize: '9.5px',
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: '#ffffff',
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                          zIndex: 2
                        }}>
                          AGOTADO
                        </span>
                      )}

                      {(() => {
                        const count = (Array.isArray(prod.images) && prod.images.length > 0)
                          ? prod.images.length
                          : (parseProductSpecs(prod).images?.length || 0);
                        if (count <= 1) return null;
                        return (
                          <span style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '3px 7px',
                            borderRadius: '6px',
                            background: 'rgba(15, 23, 42, 0.85)',
                            color: '#38bdf8',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Camera size={11} />
                            <span>{count}</span>
                          </span>
                        );
                      })()}

                      {/* Insignia de Zoom / Ficha técnica */}
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(15, 23, 42, 0.78)',
                        color: '#ffffff',
                        borderRadius: '20px',
                        padding: '3px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        fontWeight: 750,
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}>
                        <Maximize2 size={11} />
                        <span>Ver foto y ficha</span>
                      </div>
                    </div>

                    {/* Contenido de la Tarjeta */}
                    <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 
                          onClick={() => handleOpenProductDetail(prod)}
                          style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: '1.3', cursor: 'pointer' }}
                          title="Clic para ver detalle y fotos completas"
                        >
                          {prod.name}
                        </h4>
                        {prod.sku && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                            Ref: {prod.sku}
                          </span>
                        )}

                        {/* Muestra de Colores Disponibles con Stock */}
                        {hasVars && prodVariants.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#475569', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Palette size={12} style={{ color: companySettings.accent_color || '#0284c7' }} />
                              <span>Colores disponibles ({prodVariants.length}):</span>
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {prodVariants.map(v => {
                                const vStock = Number(v.stock || 0);
                                const isOut = vStock <= 0;
                                return (
                                  <span 
                                    key={v.id} 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenProductDetail(prod);
                                      setSelectedVariantId(v.id);
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      background: isOut ? '#fee2e2' : '#f1f5f9',
                                      color: isOut ? '#b91c1c' : '#334155',
                                      border: isOut ? '1px solid #fecaca' : '1px solid #cbd5e1',
                                      cursor: 'pointer'
                                    }}
                                    title={isOut ? `Color ${v.color}: Agotado` : `Color ${v.color}: ${vStock} unidades disponibles`}
                                  >
                                    <span 
                                      style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: v.hex || '#94a3b8',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                        display: 'inline-block'
                                      }}
                                    />
                                    <span>{v.color}</span>
                                    <span style={{ fontWeight: 800, opacity: 0.85 }}>({isOut ? 'Agotado' : `${vStock} disp.`})</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Snippet de descripción y enlace directo */}
                        {(() => {
                          const specs = parseProductSpecs(prod);
                          const descText = specs.description || specs.owner_notes || (typeof prod.description === 'string' && !prod.description.startsWith('{') ? prod.description : '');
                          return (
                            <div>
                              {descText && (
                                <p style={{
                                  fontSize: '11.5px',
                                  color: '#64748b',
                                  margin: '5px 0 0 0',
                                  lineHeight: '1.35',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {descText}
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenProductDetail(prod)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  marginTop: '6px',
                                  color: companySettings.accent_color || '#0284c7',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <ZoomIn size={12} />
                                <span>Ver fotos y detalle</span>
                              </button>
                            </div>
                          );
                        })()}
                      </div>

                      <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <DualCurrencyDisplay 
                          amount={prod.sell_price} 
                          fontSize="15px" 
                          primaryColor={companySettings.price_color || companySettings.accent_color || 'var(--color-cyan)'} 
                          showSwap={false} 
                        />
                        
                        {(() => {
                          const isUnlim = isUnlimitedStock(prod);
                          const prodStock = getProductStock(prod);
                          const isOutOfStock = !isUnlim && prodStock <= 0;

                          if (isOutOfStock) {
                            return (
                              <button
                                type="button"
                                disabled
                                style={{
                                  padding: '7px 14px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  borderRadius: '8px',
                                  background: '#f1f5f9',
                                  color: '#94a3b8',
                                  border: '1px solid #e2e8f0',
                                  cursor: 'not-allowed'
                                }}
                              >
                                AGOTADO
                              </button>
                            );
                          }

                          // Si tiene variantes de color, abrimos la ficha para elegir el color
                          if (hasVars) {
                            return (
                              <button 
                                type="button"
                                onClick={() => handleOpenProductDetail(prod)}
                                style={{
                                  padding: '7px 12px',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  background: inBasketCount > 0 
                                    ? '#eff6ff' 
                                    : companySettings.button_color 
                                      ? `linear-gradient(135deg, ${companySettings.button_color} 0%, ${companySettings.button_color}ee 100%)` 
                                      : 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                                  color: inBasketCount > 0 ? '#1d4ed8' : '#ffffff',
                                  border: inBasketCount > 0 ? '1.5px solid #bfdbfe' : 'none',
                                  cursor: 'pointer',
                                  boxShadow: inBasketCount > 0 ? 'none' : `0 4px 12px ${companySettings.button_color || '#06b6d4'}35`,
                                  transition: 'all 0.2s ease'
                                }}
                                title="Elige tu color preferido"
                              >
                                <Palette size={13} />
                                <span>{inBasketCount > 0 ? `${inBasketCount} en pedido` : 'Elegir Color'}</span>
                              </button>
                            );
                          }

                          const isAtMax = !isUnlim && inBasket && inBasket.cantidad >= prodStock;

                          if (inBasket) {
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', borderRadius: '8px', padding: '4px 8px', border: '1px solid #cbd5e1' }}>
                                <button onClick={() => updateBasketQty(prod, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                  <Minus size={14} />
                                </button>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', minWidth: '16px', textAlign: 'center' }}>{inBasket.cantidad}</span>
                                <button 
                                  onClick={() => {
                                    if (isAtMax) {
                                      alert(`Stock máximo alcanzado: solo hay ${prodStock} unidades disponibles en inventario.`);
                                      return;
                                    }
                                    updateBasketQty(prod, 1);
                                  }} 
                                  disabled={isAtMax}
                                  style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: isAtMax ? 'not-allowed' : 'pointer', 
                                    opacity: isAtMax ? 0.35 : 1,
                                    color: companySettings.button_color || companySettings.accent_color || 'var(--color-cyan)', 
                                    display: 'flex', 
                                    alignItems: 'center' 
                                  }}
                                  title={isAtMax ? `Stock máximo (${prodStock})` : 'Sumar 1'}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            );
                          }

                          return (
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
                          );
                        })()}
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
              Resumen ({totalItemsCount} ítems) • {!isFoodBusiness ? (storeDeliveryMode === 'delivery' ? '🛵 Envío a Domicilio' : '🏬 Retiro en Tienda') : (!hasNoTableMode && selectedTableObj ? selectedTableObj.name : 'Para Llevar')}
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
      {/* 🖼️ MODAL DE TODOS LOS CÓDIGOS QR Y ENLACES IMPRIMIBLES 🖼️ */}
      {/* ========================================================================= */}
      {showAllQrsModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '820px', padding: '28px', background: '#ffffff', borderRadius: '24px' }}>
            
            <div className="modal-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrCode size={22} style={{ color: 'var(--color-cyan)' }} />
                  {isFoodBusiness ? 'Estampas y Códigos QR del Establecimiento' : 'Enlaces y Códigos QR de tu Tienda Online'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  {isFoodBusiness 
                    ? 'Imprime estas estampas o copia los enlaces para colocar los códigos QR en cada mesa del salón.'
                    : 'Copia los enlaces para compartir con tus clientes o imprime los códigos QR para tus folletos y empaques.'}
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
                  <span>{isFoodBusiness ? 'Imprimir Estampas' : 'Imprimir Códigos QR'}</span>
                </button>
                <button className="modal-close" onClick={() => setShowAllQrsModal(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Grid de QR Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
              {isFoodBusiness ? (
                <>
                  {/* Opción Para Llevar */}
                  <div style={{ background: '#f8fafc', border: '2px dashed #a855f7', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(168, 85, 247, 0.15)', color: '#7e22ce', padding: '3px 10px', borderRadius: '99px' }}>
                      🛍️ PARA LLEVAR / BARRA
                    </span>
                    <div style={{ margin: '14px 0', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${baseUrl}?${companyQuery}&mode=takeaway`)}`} 
                        alt="QR Para Llevar"
                        style={{ width: '130px', height: '130px' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', wordBreak: 'break-all' }}>
                      {baseUrl}?{companyQuery}&mode=takeaway
                    </div>
                    <button
                      onClick={() => handleCopyUrl(`${baseUrl}?${companyQuery}&mode=takeaway`)}
                      className="btn-secondary"
                      style={{ width: '100%', fontSize: '11px', fontWeight: 800, padding: '6px' }}
                    >
                      Copiar Enlace
                    </button>
                  </div>

                  {/* Mesas del salón */}
                  {tables.map((tbl, idx) => {
                    const tableUrl = `${baseUrl}?${companyQuery}&mesa=${encodeURIComponent(tbl.name)}`;
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
                </>
              ) : (
                <>
                  {/* Tarjeta 1: Catálogo Web Principal */}
                  <div style={{ background: '#f8fafc', border: '2px solid var(--color-cyan)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)', padding: '3px 10px', borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Globe size={13} />
                      CATÁLOGO WEB
                    </span>
                    <div style={{ margin: '14px 0', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${baseUrl}?${companyQuery}`)}`} 
                        alt="QR Catálogo Web"
                        style={{ width: '130px', height: '130px' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', wordBreak: 'break-all' }}>
                      {baseUrl}?{companyQuery}
                    </div>
                    <button
                      onClick={() => handleCopyUrl(`${baseUrl}?${companyQuery}`)}
                      className="btn-primary"
                      style={{ width: '100%', fontSize: '11px', fontWeight: 800, padding: '7px' }}
                    >
                      Copiar Enlace
                    </button>
                  </div>

                  {/* Tarjeta 2: Pedidos con Envío a Domicilio */}
                  <div style={{ background: '#f8fafc', border: '2px solid #10b981', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(16, 185, 129, 0.15)', color: '#059669', padding: '3px 10px', borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Truck size={13} />
                      ENVÍO A DOMICILIO
                    </span>
                    <div style={{ margin: '14px 0', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${baseUrl}?${companyQuery}&mode=delivery`)}`} 
                        alt="QR Envío a Domicilio"
                        style={{ width: '130px', height: '130px' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', wordBreak: 'break-all' }}>
                      {baseUrl}?{companyQuery}&mode=delivery
                    </div>
                    <button
                      onClick={() => handleCopyUrl(`${baseUrl}?${companyQuery}&mode=delivery`)}
                      className="btn-primary"
                      style={{ width: '100%', fontSize: '11px', fontWeight: 800, padding: '7px', background: '#10b981', borderColor: '#10b981' }}
                    >
                      Copiar Enlace
                    </button>
                  </div>

                  {/* Tarjeta 3: Retiro en Tienda */}
                  <div style={{ background: '#f8fafc', border: '2px solid #a855f7', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(168, 85, 247, 0.15)', color: '#7e22ce', padding: '3px 10px', borderRadius: '99px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Store size={13} />
                      RETIRO EN TIENDA
                    </span>
                    <div style={{ margin: '14px 0', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${baseUrl}?${companyQuery}&mode=pickup`)}`} 
                        alt="QR Retiro en Tienda"
                        style={{ width: '130px', height: '130px' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', wordBreak: 'break-all' }}>
                      {baseUrl}?{companyQuery}&mode=pickup
                    </div>
                    <button
                      onClick={() => handleCopyUrl(`${baseUrl}?${companyQuery}&mode=pickup`)}
                      className="btn-primary"
                      style={{ width: '100%', fontSize: '11px', fontWeight: 800, padding: '7px', background: '#a855f7', borderColor: '#a855f7' }}
                    >
                      Copiar Enlace
                    </button>
                  </div>
                </>
              )}
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

            {!isFoodBusiness ? (
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Modalidad de Entrega:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setStoreDeliveryMode('delivery')}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: storeDeliveryMode === 'delivery' ? '2px solid #10b981' : '1px solid #cbd5e1',
                      background: storeDeliveryMode === 'delivery' ? 'rgba(16, 185, 129, 0.12)' : '#ffffff',
                      color: storeDeliveryMode === 'delivery' ? '#059669' : '#475569',
                      fontWeight: storeDeliveryMode === 'delivery' ? 900 : 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Truck size={15} />
                    <span>Envío a Domicilio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreDeliveryMode('pickup')}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: storeDeliveryMode === 'pickup' ? '2px solid var(--color-cyan)' : '1px solid #cbd5e1',
                      background: storeDeliveryMode === 'pickup' ? 'rgba(6, 182, 212, 0.12)' : '#ffffff',
                      color: storeDeliveryMode === 'pickup' ? 'var(--color-cyan)' : '#475569',
                      fontWeight: storeDeliveryMode === 'pickup' ? 900 : 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Store size={15} />
                    <span>Retiro en Tienda</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>Ubicación / Destino:</span>
                <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--color-cyan)' }}>
                  {!hasNoTableMode && selectedTableObj ? `🍽️ ${selectedTableObj.name}` : '🛍️ Para Llevar / Caja'}
                </span>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ marginBottom: '8px' }}>Resumen de Consumo</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {basket.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
                    Tu carrito está vacío.
                  </div>
                ) : (
                  basket.map((item, idx) => {
                    const itemKey = item.basketKey || getBasketItemKey(item.part, item.selectedVariant) || `basket-item-${idx}`;
                    const isUnlim = isUnlimitedStock(item.part);
                    const maxStock = item.selectedVariant ? Number(item.selectedVariant.stock || 0) : getProductStock(item.part);
                    const isAtMax = !isUnlim && item.cantidad >= maxStock;

                    return (
                      <div key={itemKey} style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.part.name}</div>
                          
                          {/* Badge de Variante de Color Seleccionado */}
                          {item.selectedVariant && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '3px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '1px 6px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.selectedVariant.hex || '#64748b', border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block' }} />
                              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#1e40af' }}>
                                Color: {item.selectedVariant.color}
                              </span>
                            </div>
                          )}

                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <DualCurrencyDisplay amount={item.part.sell_price} fontSize="11px" primaryColor="var(--text-muted)" showSwap={false} /> c/u
                            {!isUnlim && (
                              <span style={{ fontSize: '10px', color: isAtMax ? '#ef4444' : '#64748b', fontWeight: isAtMax ? 800 : 500 }}>
                                • {item.selectedVariant ? `Disp color: ${maxStock}` : `Disp: ${maxStock}`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controles de Cantidad y Eliminar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => updateBasketQty(item, -1)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0
                            }}
                            title="Restar 1"
                          >
                            <Minus size={12} />
                          </button>
                          
                          <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', minWidth: '20px', textAlign: 'center' }}>
                            {item.cantidad}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (isAtMax) {
                                alert(item.selectedVariant 
                                  ? `Stock máximo alcanzado: solo hay ${maxStock} unidades disponibles en color "${item.selectedVariant.color}".`
                                  : `Stock máximo alcanzado: solo hay ${maxStock} unidades disponibles en inventario.`
                                );
                                return;
                              }
                              updateBasketQty(item, 1);
                            }}
                            disabled={isAtMax}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: isAtMax ? '#94a3b8' : '#475569',
                              opacity: isAtMax ? 0.35 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: isAtMax ? 'not-allowed' : 'pointer',
                              padding: 0
                            }}
                            title={isAtMax ? `Stock máximo (${maxStock})` : 'Sumar 1'}
                          >
                            <Plus size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => updateBasketQty(item, -item.cantidad)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0,
                              marginLeft: '2px'
                            }}
                            title="Eliminar del pedido"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div style={{ minWidth: '65px', textAlign: 'right' }}>
                          <DualCurrencyDisplay amount={item.cantidad * item.part.sell_price} fontSize="13px" primaryColor="var(--color-cyan)" align="right" showSwap={false} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {!isFoodBusiness ? (
              <>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>👤 Nombre Completo del Cliente (*)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Carlos Mendoza"
                    value={participantName}
                    onChange={(e) => handleParticipantNameChange(e.target.value)}
                    style={{ fontSize: '13px', fontWeight: 600, borderColor: 'var(--color-cyan)' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>📱 Teléfono / WhatsApp de Contacto (*)</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Ej: 0414-1234567"
                    value={customerPhone}
                    onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                    style={{ fontSize: '13px', fontWeight: 600, borderColor: 'var(--color-cyan)' }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Te contactaremos a este número para coordinar el pago y entrega.
                  </span>
                </div>

                {storeDeliveryMode === 'delivery' && (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>📍 Dirección Exacta de Entrega & Punto de Referencia (*)</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Ej: Av. 5 de Julio, Edf. Rosalba, Piso 3, Apto 3B. Al lado de la panadería..."
                      value={shippingAddress}
                      onChange={(e) => handleShippingAddressChange(e.target.value)}
                      style={{ fontSize: '12.5px', resize: 'vertical' }}
                    />
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">📝 Notas Adicionales del Pedido (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Envolver para regalo, entregar después de las 3pm..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}

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
                gap: '8px',
                background: !isFoodBusiness ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : undefined,
                boxShadow: !isFoodBusiness ? '0 4px 16px rgba(22, 163, 74, 0.35)' : undefined
              }}
            >
              {!isFoodBusiness ? <MessageSquare size={18} /> : <Send size={16} />}
              <span>
                {processingOrder 
                  ? 'Procesando...' 
                  : (!isFoodBusiness ? 'CONFIRMAR Y ENVIAR POR WHATSAPP 🚀' : 'CONFIRMAR Y ENVIAR PEDIDO 🚀')}
              </span>
            </button>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 🚀 MODAL ÉXITO ORDEN A MESA 🚀 */}
      {/* ========================================================================= */}
      {kioskOrderSuccess && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '440px', textAlign: 'center', padding: '30px 24px', background: '#ffffff' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <CheckCircle2 size={34} style={{ color: 'var(--color-emerald)' }} />
            </div>
            
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>¡Orden Enviada con Éxito!</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Asignado a <strong style={{ color: 'var(--color-cyan)' }}>{kioskOrderSuccess.tableName}</strong>.
            </p>

            <div style={{ background: '#f8fafc', border: '2px dashed var(--color-emerald)', borderRadius: '16px', padding: '14px', margin: '16px 0' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 800 }}>NÚMERO DE TICKET</span>
              <div style={{ fontSize: '34px', fontWeight: 900, color: 'var(--color-emerald)', marginTop: '2px' }}>
                {kioskOrderSuccess.ticket}
              </div>
            </div>

            {/* Acción de WhatsApp para el Dueño */}
            {kioskOrderSuccess.whatsappUrl && (
              <a 
                href={kioskOrderSuccess.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#16a34a',
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '13px',
                  marginBottom: '10px',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageSquare size={16} />
                <span>📲 Abrir WhatsApp para Concretar Venta</span>
              </a>
            )}

            {kioskOrderSuccess.whatsappMsg && (
              <button
                type="button"
                onClick={() => handleCopyOrderSummary(kioskOrderSuccess.whatsappMsg)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              >
                {copiedOrderMsg ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
                <span>{copiedOrderMsg ? '¡Resumen Copiado al Portapapeles!' : 'Copiar Resumen del Pedido 📋'}</span>
              </button>
            )}

            <button 
              onClick={() => setKioskOrderSuccess(null)}
              className="btn-primary"
              style={{ width: '100%', padding: '11px', borderRadius: '10px', fontSize: '13px' }}
            >
              ¡Entendido! Volver al Menú
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎟️ MODAL ÉXITO CÓDIGO (PARA LLEVAR / RETIRO) 🎟️ */}
      {/* ========================================================================= */}
      {generatedCode && (() => {
        const codeStr = typeof generatedCode === 'object' ? generatedCode.code : generatedCode;
        const codeWhatsappUrl = typeof generatedCode === 'object' ? generatedCode.whatsappUrl : null;
        const codeWhatsappMsg = typeof generatedCode === 'object' ? generatedCode.whatsappMsg : null;
        const isOnline = typeof generatedCode === 'object' ? generatedCode.isOnlineStore : false;
        const genOrderType = typeof generatedCode === 'object' ? generatedCode.orderType : 'takeaway';

        return (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content glass-panel" style={{ maxWidth: '440px', textAlign: 'center', padding: '30px 24px', background: '#ffffff' }}>
              <CheckCircle2 size={40} style={{ color: isOnline ? '#16a34a' : 'var(--color-cyan)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {isOnline ? '¡Pedido Registrado con Éxito!' : '¡Código de Retiro Generado!'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {isOnline
                  ? (genOrderType === 'delivery'
                      ? 'Tu pedido con despacho a domicilio está listo. Coordina el pago y entrega por WhatsApp:'
                      : 'Tu pedido para retiro en tienda está listo. Coordina el pago y entrega por WhatsApp:')
                  : 'Tu orden ha sido registrada. Muestra este código o envíalo por WhatsApp:'}
              </p>

              <div style={{ background: isOnline ? '#f0fdf4' : '#f0f9ff', border: `2px dashed ${isOnline ? '#16a34a' : 'var(--color-cyan)'}`, borderRadius: '16px', padding: '14px', margin: '16px 0', fontFamily: 'monospace', fontSize: '34px', fontWeight: 900, color: isOnline ? '#16a34a' : 'var(--color-cyan)', letterSpacing: '3px' }}>
                {codeStr}
              </div>

              {/* Botón Principal WhatsApp para Concretar Venta */}
              {codeWhatsappUrl && (
                <a 
                  href={codeWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#16a34a',
                    color: '#ffffff',
                    textDecoration: 'none',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '13px',
                    marginBottom: '10px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MessageSquare size={16} />
                  <span>📲 Abrir WhatsApp para Concretar Venta</span>
                </a>
              )}

              {codeWhatsappMsg && (
                <button
                  type="button"
                  onClick={() => handleCopyOrderSummary(codeWhatsappMsg)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    marginBottom: '12px'
                  }}
                >
                  {copiedOrderMsg ? <Check size={14} style={{ color: '#16a34a' }} /> : <Copy size={14} />}
                  <span>{copiedOrderMsg ? '¡Resumen Copiado al Portapapeles!' : 'Copiar Resumen del Pedido 📋'}</span>
                </button>
              )}

              <button 
                onClick={() => setGeneratedCode(null)}
                className="btn-primary"
                style={{ width: '100%', padding: '11px', borderRadius: '10px', fontSize: '13px' }}
              >
                {isOnline ? '¡Entendido! Volver a la Tienda' : '¡Entendido! Volver al Menú'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 🔍 MODAL VISTA AMPLIADA Y FICHA DE PRODUCTO (ESTILO MERCADO LIBRE) 🔍 */}
      {/* ========================================================================= */}
      {selectedProductDetail && (() => {
        const modalSpecs = parseProductSpecs(selectedProductDetail);
        const modalVariants = modalSpecs.variants && modalSpecs.variants.length > 0
          ? modalSpecs.variants
          : getProductVariants(selectedProductDetail);
        const hasModalVars = modalVariants.length > 0;
        const activeVariant = hasModalVars
          ? (modalVariants.find(v => v.id === selectedVariantId) || modalVariants[0])
          : null;

        const modalStock = activeVariant
          ? Number(activeVariant.stock || 0)
          : getProductStock(selectedProductDetail);
        const modalIsUnlimited = activeVariant ? false : isUnlimitedStock(selectedProductDetail);
        const targetBasketKey = activeVariant
          ? getBasketItemKey(selectedProductDetail, activeVariant)
          : getProdKey(selectedProductDetail);
        const modalInBasket = basket.find(item => (item.basketKey || getBasketItemKey(item.part, item.selectedVariant)) === targetBasketKey)?.cantidad || 0;
        const modalAvailableToAdd = modalIsUnlimited ? Infinity : Math.max(0, modalStock - modalInBasket);
        const modalIsOutOfStock = !modalIsUnlimited && modalStock <= 0;
        const modalIsMaxInBasket = !modalIsUnlimited && !modalIsOutOfStock && modalAvailableToAdd <= 0;

        return (
          <div 
            className="modal-overlay" 
          style={{ 
            zIndex: 10000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setSelectedProductDetail(null)}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxWidth: '880px', 
              width: '100%', 
              maxHeight: '90vh', 
              background: '#ffffff', 
              borderRadius: '24px', 
              overflowY: 'auto', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', 
              border: '1px solid #cbd5e1', 
              position: 'relative',
              padding: 0
            }}
          >
            {/* Botón de Cierre Flotante */}
            <button
              onClick={() => setSelectedProductDetail(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(241, 245, 249, 0.9)',
                border: '1px solid #cbd5e1',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(241, 245, 249, 0.9)'; e.currentTarget.style.color = '#475569'; }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', padding: '24px' }}>
              {/* ── COLUMNA IZQUIERDA: GALERÍA MULTI-FOTO EN ALTA DEFINICIÓN ── */}
              {(() => {
                const modalImages = (() => {
                  if (isEditingSpecs) {
                    return Array.isArray(specsForm.images) && specsForm.images.length > 0
                      ? specsForm.images
                      : (selectedProductDetail.image_url ? [selectedProductDetail.image_url] : []);
                  }
                  const parsed = parseProductSpecs(selectedProductDetail);
                  if (parsed.images && parsed.images.length > 0) return parsed.images;
                  if (Array.isArray(selectedProductDetail.images) && selectedProductDetail.images.length > 0) return selectedProductDetail.images;
                  return selectedProductDetail.image_url ? [selectedProductDetail.image_url] : [];
                })();

                const safeActiveIndex = Math.min(activeImageIndex, Math.max(0, modalImages.length - 1));
                const currentMainImg = modalImages[safeActiveIndex] || getProductImage(selectedProductDetail);

                const handlePrevPhoto = (e) => {
                  e.stopPropagation();
                  setActiveImageIndex(prev => (prev > 0 ? prev - 1 : modalImages.length - 1));
                };

                const handleNextPhoto = (e) => {
                  e.stopPropagation();
                  setActiveImageIndex(prev => (prev < modalImages.length - 1 ? prev + 1 : 0));
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Contenedor Principal de la Foto */}
                    <div style={{ 
                      width: '100%', 
                      height: '360px', 
                      borderRadius: '18px', 
                      overflow: 'hidden', 
                      position: 'relative', 
                      background: '#0f172a',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img 
                        src={currentMainImg} 
                        alt={selectedProductDetail.name} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'contain'
                        }} 
                      />

                      {/* Insignia de Agotado en Foto Principal */}
                      {modalIsOutOfStock && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(15, 23, 42, 0.65)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 4,
                          backdropFilter: 'blur(3px)'
                        }}>
                          <span style={{
                            background: '#ef4444',
                            color: '#ffffff',
                            fontWeight: 900,
                            fontSize: '16px',
                            padding: '8px 18px',
                            borderRadius: '12px',
                            letterSpacing: '1.5px',
                            boxShadow: '0 6px 20px rgba(239, 68, 68, 0.5)',
                            textTransform: 'uppercase'
                          }}>
                            AGOTADO
                          </span>
                        </div>
                      )}

                      {/* Categoría */}
                      {selectedProductDetail.category && (
                        <span style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.82)',
                          color: '#ffffff',
                          backdropFilter: 'blur(6px)',
                          letterSpacing: '0.3px',
                          zIndex: 2
                        }}>
                          {selectedProductDetail.category}
                        </span>
                      )}

                      {/* Contador de Fotos */}
                      {modalImages.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.82)',
                          color: '#38bdf8',
                          backdropFilter: 'blur(6px)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          zIndex: 2
                        }}>
                          <Camera size={13} />
                          <span>{safeActiveIndex + 1} / {modalImages.length} fotos</span>
                        </div>
                      )}

                      {/* Flechas de Navegación si hay más de 1 foto */}
                      {modalImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={handlePrevPhoto}
                            style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'rgba(15, 23, 42, 0.75)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 3,
                              transition: 'all 0.2s ease'
                            }}
                            title="Foto anterior"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextPhoto}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'rgba(15, 23, 42, 0.75)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 3,
                              transition: 'all 0.2s ease'
                            }}
                            title="Siguiente foto"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Tira de Miniaturas (Thumbnails) */}
                    {modalImages.length > 1 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        overflowX: 'auto',
                        padding: '6px 2px',
                        scrollbarWidth: 'thin'
                      }}>
                        {modalImages.map((imgSrc, imgIdx) => {
                          const isSelected = imgIdx === safeActiveIndex;
                          return (
                            <div
                              key={`modal-thumb-${imgIdx}`}
                              onClick={() => setActiveImageIndex(imgIdx)}
                              style={{
                                position: 'relative',
                                width: '58px',
                                height: '58px',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                cursor: 'pointer',
                                border: isSelected ? '2.5px solid var(--color-cyan)' : '1px solid #cbd5e1',
                                boxShadow: isSelected ? '0 0 0 2px rgba(6,182,212,0.3)' : 'none',
                                opacity: isSelected ? 1 : 0.7,
                                transition: 'all 0.15s ease',
                                background: '#0f172a'
                              }}
                            >
                              <img 
                                src={imgSrc} 
                                alt={`Miniatura ${imgIdx + 1}`} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                              {isEditingSpecs && imgIdx === 0 && (
                                <span style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  fontSize: '8px',
                                  fontWeight: 900,
                                  background: 'rgba(15,23,42,0.85)',
                                  color: '#38bdf8',
                                  textAlign: 'center'
                                }}>
                                  PORTADA
                                </span>
                              )}
                              {isEditingSpecs && imgIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetShowcasePrimaryImage(imgIdx);
                                  }}
                                  title="Hacer Portada"
                                  style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    left: '2px',
                                    background: 'rgba(15,23,42,0.8)',
                                    color: '#fbbf24',
                                    border: 'none',
                                    borderRadius: '3px',
                                    width: '16px',
                                    height: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                >
                                  <Star size={9} />
                                </button>
                              )}
                              {isEditingSpecs && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveShowcaseImage(imgIdx);
                                  }}
                                  title="Quitar foto"
                                  style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
                                    background: 'rgba(239,68,68,0.9)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '15px',
                                    height: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                >
                                  <X size={9} strokeWidth={3} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Controles de Subida Rápida en Modo Dueño */}
                    {isEditingSpecs && (
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ImageIcon size={13} />
                            <span>Añadir Fotos a la Ficha ({specsForm.images?.length || 0})</span>
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="file"
                            ref={showcaseFileInputRef}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleShowcaseImageFileSelect(e.target.files[0]);
                              }
                            }}
                            accept="image/*"
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => showcaseFileInputRef.current && showcaseFileInputRef.current.click()}
                            disabled={compressingShowcaseImage}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Upload size={12} />
                            <span>{compressingShowcaseImage ? 'Comprimiendo...' : 'Subir Foto'}</span>
                          </button>

                          <input
                            type="url"
                            className="form-input"
                            placeholder="o URL: https://..."
                            value={showcaseUrlInput}
                            onChange={(e) => setShowcaseUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddShowcaseUrlImage();
                              }
                            }}
                            style={{ fontSize: '11px', padding: '5px 8px', flex: 1, background: '#ffffff', borderColor: '#86efac', color: '#0f172a' }}
                          />
                          <button
                            type="button"
                            onClick={handleAddShowcaseUrlImage}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              background: '#ffffff',
                              border: '1px solid #86efac',
                              color: '#166534',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            + URL
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Insignias de Disponibilidad y Estado */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: modalIsOutOfStock ? '#ef4444' : modalIsMaxInBasket ? '#f59e0b' : '#10b981',
                          display: 'inline-block'
                        }} />
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: 700, 
                          color: modalIsOutOfStock ? '#ef4444' : modalIsMaxInBasket ? '#b45309' : '#334155' 
                        }}>
                          {hasModalVars ? (
                            activeVariant ? (
                              modalIsOutOfStock 
                                ? `Color "${activeVariant.color}": Agotado` 
                                : modalIsMaxInBasket 
                                  ? `Stock máximo en "${activeVariant.color}" (${modalInBasket} en pedido)` 
                                  : `Color "${activeVariant.color}": ${modalStock} disponibles`
                            ) : 'Selecciona un color'
                          ) : (
                            modalIsUnlimited 
                              ? 'Disponible' 
                              : modalIsOutOfStock 
                                ? 'Agotado (Sin stock en inventario)' 
                                : modalIsMaxInBasket 
                                  ? `Stock máximo alcanzado (${modalInBasket} en tu pedido)` 
                                  : `Disponible (${modalStock} ${selectedProductDetail.unit || 'unidades'})`
                          )}
                          {!modalIsUnlimited && !modalIsOutOfStock && !modalIsMaxInBasket && modalInBasket > 0 && (
                            <span style={{ color: '#0284c7', marginLeft: '6px', fontWeight: 600 }}>
                              • {modalInBasket} en tu pedido
                            </span>
                          )}
                        </span>
                      </div>
                      {selectedProductDetail.sku && (
                        <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                          CÓD: {selectedProductDetail.sku}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── COLUMNA DERECHA: INFORMACIÓN COMERCIAL, ESPECIFICACIONES Y MODO DUEÑO ── */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: companySettings.accent_color || '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {companyName || 'Solago'} • Producto Oficial
                  </span>

                  <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '4px 0 14px 0', lineHeight: '1.25' }}>
                    {selectedProductDetail.name}
                  </h2>

                  {/* Tarjeta de Precio Dual */}
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                        Precio de Venta
                      </span>
                      <DualCurrencyDisplay 
                        amount={selectedProductDetail.sell_price} 
                        fontSize="22px" 
                        primaryColor={companySettings.price_color || companySettings.accent_color || '#0284c7'} 
                        showSwap={true} 
                      />
                    </div>
                  </div>

                  {/* ── 🎨 SELECTOR DE VARIANTES DE COLOR CON STOCK INDEPENDIENTE ── */}
                  {hasModalVars && modalVariants.length > 0 && (
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '14px',
                      border: '1.5px solid #e2e8f0',
                      padding: '12px 14px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Palette size={14} style={{ color: companySettings.accent_color || '#0284c7' }} />
                          <span>Colores Disponibles: <strong style={{ color: '#0f172a' }}>{activeVariant?.color || 'Elegir'}</strong></span>
                        </span>
                        {activeVariant && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: Number(activeVariant.stock) > 0 ? '#dcfce7' : '#fee2e2',
                            color: Number(activeVariant.stock) > 0 ? '#166534' : '#b91c1c'
                          }}>
                            {Number(activeVariant.stock) > 0 ? `${activeVariant.stock} disponibles` : 'Agotado'}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {modalVariants.map(variant => {
                          const isSelected = activeVariant?.id === variant.id;
                          const varStock = Number(variant.stock || 0);
                          const isOutOfStock = varStock <= 0;
                          const varBasketKey = getBasketItemKey(selectedProductDetail, variant);
                          const varInCart = basket.find(item => (item.basketKey || getBasketItemKey(item.part, item.selectedVariant)) === varBasketKey)?.cantidad || 0;

                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => {
                                setSelectedVariantId(variant.id);
                                const available = Math.max(0, varStock - varInCart);
                                setDetailQuantity(available > 0 ? 1 : 0);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '7px',
                                padding: '6px 12px',
                                borderRadius: '10px',
                                border: isSelected 
                                  ? `2px solid ${companySettings.accent_color || '#0284c7'}` 
                                  : '1.5px solid #cbd5e1',
                                background: isSelected ? '#eff6ff' : '#ffffff',
                                cursor: 'pointer',
                                opacity: isOutOfStock ? 0.55 : 1,
                                boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.2)' : 'none',
                                transition: 'all 0.15s ease'
                              }}
                              title={isOutOfStock ? `Color ${variant.color} agotado` : `${variant.color}: ${varStock} disponibles`}
                            >
                              <span 
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  background: variant.hex || '#64748b',
                                  border: '1.5px solid #ffffff',
                                  boxShadow: '0 0 0 1px #cbd5e1',
                                  flexShrink: 0
                                }}
                              />
                              <span style={{ fontSize: '12px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#1e40af' : '#1e293b' }}>
                                {variant.color}
                              </span>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                color: isOutOfStock ? '#ef4444' : '#64748b'
                              }}>
                                ({varStock})
                              </span>
                              {varInCart > 0 && (
                                <span style={{
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  background: '#dbeafe',
                                  color: '#1e40af',
                                  padding: '1px 5px',
                                  borderRadius: '4px'
                                }}>
                                  {varInCart} en pedido
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── SECCIÓN FICHA TÉCNICA (ESTILO MERCADO LIBRE) ── */}
                  {!isEditingSpecs ? (
                    <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                        <h3 style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#1e293b', letterSpacing: '0.4px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Package size={16} style={{ color: companySettings.accent_color || '#0284c7' }} />
                          Características y Especificaciones
                        </h3>

                        {isOwner && (
                          <button
                            onClick={() => { setIsEditingSpecs(true); setSaveFeedback(''); }}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              fontSize: '11.5px',
                              fontWeight: 750,
                              padding: '4px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <Edit3 size={13} />
                            <span>Editar Ficha y Fotos (Dueño)</span>
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* 📄 Descripción Detallada del Producto */}
                        {specsForm.description && (
                          <div style={{ paddingBottom: '10px', borderBottom: (specsForm.dimensions || specsForm.materials || specsForm.owner_notes) ? '1px dashed #e2e8f0' : 'none' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                              <Info size={13} style={{ color: companySettings.accent_color || '#0284c7' }} />
                              <span>Descripción del Producto</span>
                            </span>
                            <p style={{ fontSize: '13px', color: '#1e293b', margin: 0, lineHeight: '1.55', whiteSpace: 'pre-line' }}>
                              {specsForm.description}
                            </p>
                          </div>
                        )}

                        {/* 📏 Dimensiones / Medidas */}
                        {specsForm.dimensions && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0, marginTop: '2px' }}>
                              <Ruler size={15} />
                            </div>
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Dimensiones / Medidas</span>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', display: 'block', marginTop: '1px' }}>
                                {specsForm.dimensions}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 🧱 Materiales / Composición */}
                        {specsForm.materials && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0, marginTop: '2px' }}>
                              <Layers size={15} />
                            </div>
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Materiales / Ingredientes</span>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', display: 'block', marginTop: '1px' }}>
                                {specsForm.materials}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 💬 Recomendaciones y Notas del Vendedor */}
                        {specsForm.owner_notes && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingTop: '6px', borderTop: '1px dashed #e2e8f0' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0, marginTop: '2px' }}>
                              <MessageSquare size={15} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Recomendaciones del Vendedor</span>
                              <p style={{ fontSize: '12.5px', color: '#334155', margin: '2px 0 0 0', lineHeight: '1.45', whiteSpace: 'pre-line' }}>
                                {specsForm.owner_notes}
                              </p>
                            </div>
                          </div>
                        )}

                        {!specsForm.description && !specsForm.dimensions && !specsForm.materials && !specsForm.owner_notes && (
                          <div style={{ padding: '8px 0', color: '#64748b', fontSize: '12.5px', fontStyle: 'italic' }}>
                            Producto oficial de alta calidad disponible en {companyName || 'Solago'}.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ── FORMULARIO DE EDICIÓN DE FICHA (MODO DUEÑO) ── */
                    <form onSubmit={handleSaveSpecs} style={{ background: '#f0fdf4', borderRadius: '16px', border: '1.5px solid #86efac', padding: '16px', marginBottom: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #bbf7d0', paddingBottom: '8px' }}>
                        <h4 style={{ fontSize: '12.5px', fontWeight: 800, color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Edit3 size={15} />
                          Editar Ficha Técnica y Fotos (Modo Dueño)
                        </h4>
                        <span style={{ fontSize: '10px', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
                          Visible en vitrina
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '3px' }}>
                            📄 Descripción Detallada del Producto (para el cliente):
                          </label>
                          <textarea
                            className="form-input"
                            rows={3}
                            style={{ background: '#ffffff', borderColor: '#86efac', color: '#0f172a', fontSize: '12px', resize: 'vertical', padding: '7px 10px' }}
                            placeholder="Descripción comercial atractiva del producto, ingredientes, sabor o atributos principales..."
                            value={specsForm.description}
                            onChange={(e) => setSpecsForm({ ...specsForm, description: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '3px' }}>
                            📏 Dimensiones / Medidas:
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ background: '#ffffff', borderColor: '#86efac', color: '#0f172a', fontSize: '12px', padding: '7px 10px' }}
                            placeholder="Ej: 30 x 20 x 15 cm / Peso: 450g / Talla M..."
                            value={specsForm.dimensions}
                            onChange={(e) => setSpecsForm({ ...specsForm, dimensions: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '3px' }}>
                            🧱 Materiales / Ingredientes:
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ background: '#ffffff', borderColor: '#86efac', color: '#0f172a', fontSize: '12px', padding: '7px 10px' }}
                            placeholder="Ej: Acero inoxidable, Cuero genuino / Pan brioche, 100% res..."
                            value={specsForm.materials}
                            onChange={(e) => setSpecsForm({ ...specsForm, materials: e.target.value })}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: '#166534', display: 'block', marginBottom: '3px' }}>
                            💬 Recomendaciones y Notas del Vendedor:
                          </label>
                          <textarea
                            className="form-input"
                            rows={2}
                            style={{ background: '#ffffff', borderColor: '#86efac', color: '#0f172a', fontSize: '12px', resize: 'vertical', padding: '7px 10px' }}
                            placeholder="Añade notas comerciales, recomendaciones de preparación o sugerencias especiales..."
                            value={specsForm.owner_notes}
                            onChange={(e) => setSpecsForm({ ...specsForm, owner_notes: e.target.value })}
                          />
                        </div>

                        {saveFeedback && (
                          <div style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: saveFeedback.includes('Error') ? '#fee2e2' : '#dcfce7',
                            color: saveFeedback.includes('Error') ? '#b91c1c' : '#15803d'
                          }}>
                            {saveFeedback}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button
                            type="submit"
                            disabled={savingSpecs}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: savingSpecs ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Save size={13} />
                            <span>{savingSpecs ? 'Guardando...' : 'Guardar Cambios'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setIsEditingSpecs(false); setSaveFeedback(''); }}
                            style={{
                              padding: '8px 12px',
                              background: '#ffffff',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

                {/* ── BARRA DE COMPRA DEL CLIENTE ── */}
                <div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', borderRadius: '10px', padding: '6px 10px', border: '1px solid #cbd5e1' }}>
                      <button
                        type="button"
                        onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                        disabled={modalIsOutOfStock || modalIsMaxInBasket || detailQuantity <= 1}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: (modalIsOutOfStock || modalIsMaxInBasket || detailQuantity <= 1) ? 'not-allowed' : 'pointer', 
                          color: (modalIsOutOfStock || modalIsMaxInBasket || detailQuantity <= 1) ? '#94a3b8' : '#475569', 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: 0 
                        }}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: (modalIsOutOfStock || modalIsMaxInBasket) ? '#94a3b8' : '#0f172a', minWidth: '24px', textAlign: 'center' }}>
                        {modalIsOutOfStock || modalIsMaxInBasket ? 0 : detailQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (modalIsUnlimited || detailQuantity < modalAvailableToAdd) {
                            setDetailQuantity(prev => prev + 1);
                          }
                        }}
                        disabled={modalIsOutOfStock || modalIsMaxInBasket || (!modalIsUnlimited && detailQuantity >= modalAvailableToAdd)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: (modalIsOutOfStock || modalIsMaxInBasket || (!modalIsUnlimited && detailQuantity >= modalAvailableToAdd)) ? 'not-allowed' : 'pointer', 
                          color: (modalIsOutOfStock || modalIsMaxInBasket || (!modalIsUnlimited && detailQuantity >= modalAvailableToAdd)) ? '#94a3b8' : (companySettings.button_color || '#0284c7'), 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: 0 
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddDetailToBasket}
                      disabled={modalIsOutOfStock || modalIsMaxInBasket}
                      style={{
                        flex: 1,
                        padding: '12px 18px',
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        background: (modalIsOutOfStock || modalIsMaxInBasket)
                          ? '#cbd5e1'
                          : companySettings.button_color 
                            ? `linear-gradient(135deg, ${companySettings.button_color} 0%, ${companySettings.button_color}ee 100%)` 
                            : 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                        color: (modalIsOutOfStock || modalIsMaxInBasket) ? '#64748b' : '#ffffff',
                        border: 'none',
                        cursor: (modalIsOutOfStock || modalIsMaxInBasket) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: (modalIsOutOfStock || modalIsMaxInBasket) ? 'none' : `0 4px 14px ${companySettings.button_color || '#06b6d4'}40`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ShoppingBag size={17} />
                      <span>
                        {modalIsOutOfStock 
                          ? (activeVariant ? `COLOR "${activeVariant.color.toUpperCase()}" AGOTADO` : 'PRODUCTO AGOTADO') 
                          : modalIsMaxInBasket 
                            ? (activeVariant ? `LÍMITE MÁXIMO EN "${activeVariant.color.toUpperCase()}"` : 'LÍMITE MÁXIMO ALCANZADO') 
                            : activeVariant
                              ? `AGREGAR (${activeVariant.color} • ${detailQuantity})`
                              : `AGREGAR AL PEDIDO (${detailQuantity})`}
                      </span>
                    </button>
                  </div>

                  {/* Acceso Rápido de Dueño si no está autenticado */}
                  {!isOwner && (
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setShowUnlockModal(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '11px',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Lock size={12} />
                        <span>¿Eres el dueño? Editar dimensiones y materiales</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      );
    })()}

      {/* ========================================================================= */}
      {/* 🔒 MODAL DESBLOQUEO RÁPIDO PARA EL DUEÑO 🔒 */}
      {/* ========================================================================= */}
      {showUnlockModal && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)' }}
          onClick={() => { setShowUnlockModal(false); setUnlockPassword(''); setUnlockError(''); }}
        >
          <div 
            className="modal-content glass-panel" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '380px', width: '90%', padding: '24px', background: '#0f172a', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                <Lock size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Acceso de Propietario</h4>
                <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Ingresa la clave de administrador</span>
              </div>
            </div>

            <form onSubmit={handleUnlockOwner}>
              <input
                type="password"
                className="form-input"
                placeholder="Clave de Administrador"
                autoFocus
                value={unlockPassword}
                onChange={(e) => { setUnlockPassword(e.target.value); setUnlockError(''); }}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#1e293b', border: '1px solid #334155', color: '#ffffff', marginBottom: '10px', fontSize: '13px' }}
              />

              {unlockError && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '10px', fontWeight: 600 }}>
                  {unlockError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setShowUnlockModal(false); setUnlockPassword(''); setUnlockError(''); }}
                  style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#0284c7', border: 'none', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                >
                  Verificar y Editar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
