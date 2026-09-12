/**
 * Utilidades para manejar especificaciones extendidas y variantes de productos
 * (Dimensiones, Materiales, Comentarios del Dueño y Variantes de Color con Stock)
 * Almacenadas con retrocompatibilidad en el campo `description`.
 */

export function normalizeVariants(rawVariants) {
  if (!Array.isArray(rawVariants)) return [];
  return rawVariants
    .map((v, idx) => {
      if (!v) return null;
      const colorName = String(v.color || v.name || '').trim();
      if (!colorName) return null;
      return {
        id: String(v.id || `var-${idx + 1}-${colorName.toLowerCase().replace(/[^a-z0-9]/g, '')}`),
        color: colorName,
        stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
        hex: String(v.hex || '#64748b').trim(),
        sku: String(v.sku || '').trim(),
        image_url: String(v.image_url || '').trim()
      };
    })
    .filter(Boolean);
}

export function parseProductSpecs(prod) {
  if (!prod) {
    return {
      description: '',
      dimensions: '',
      materials: '',
      owner_notes: '',
      images: [],
      variants: []
    };
  }

  // 1. Si el producto ya tiene las propiedades asignadas directamente
  let baseDesc = typeof prod === 'string' ? prod : (prod.description || '');
  let dims = prod.dimensions || '';
  let mats = prod.materials || '';
  let notes = prod.owner_notes || '';
  let directImages = Array.isArray(prod.images) ? prod.images : [];
  let directVariants = normalizeVariants(prod.variants);

  // Fallback a image_url principal
  const fallbackImages = prod.image_url ? [prod.image_url] : [];

  // 2. Si la descripción es un JSON estructurado
  if (typeof baseDesc === 'string' && baseDesc.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(baseDesc);
      if (parsed && typeof parsed === 'object') {
        const parsedImages = Array.isArray(parsed.images) ? parsed.images : [];
        const finalImages = parsedImages.length > 0 
          ? parsedImages 
          : (directImages.length > 0 ? directImages : fallbackImages);

        const parsedVariants = normalizeVariants(parsed.variants);
        const finalVariants = parsedVariants.length > 0 ? parsedVariants : directVariants;

        return {
          description: parsed.description || parsed.text || '',
          dimensions: parsed.dimensions || dims || '',
          materials: parsed.materials || mats || '',
          owner_notes: parsed.owner_notes || parsed.notes || notes || '',
          images: Array.from(new Set(finalImages.filter(Boolean))),
          variants: finalVariants
        };
      }
    } catch (e) {
      // Si falla el parseo JSON, se usa como texto plano
    }
  }

  // 3. Si la descripción es un objeto directamente
  if (typeof baseDesc === 'object' && baseDesc !== null) {
    const objImages = Array.isArray(baseDesc.images) ? baseDesc.images : [];
    const finalImages = objImages.length > 0 
      ? objImages 
      : (directImages.length > 0 ? directImages : fallbackImages);

    const objVariants = normalizeVariants(baseDesc.variants);
    const finalVariants = objVariants.length > 0 ? objVariants : directVariants;

    return {
      description: baseDesc.description || baseDesc.text || '',
      dimensions: baseDesc.dimensions || dims || '',
      materials: baseDesc.materials || mats || '',
      owner_notes: baseDesc.owner_notes || baseDesc.notes || notes || '',
      images: Array.from(new Set(finalImages.filter(Boolean))),
      variants: finalVariants
    };
  }

  // 4. Retornar con valores por defecto
  const finalImages = directImages.length > 0 ? directImages : fallbackImages;
  return {
    description: baseDesc || '',
    dimensions: dims || '',
    materials: mats || '',
    owner_notes: notes || '',
    images: Array.from(new Set(finalImages.filter(Boolean))),
    variants: directVariants
  };
}

export function serializeProductSpecs({ description = '', dimensions = '', materials = '', owner_notes = '', images = [], variants = [] }) {
  const cleanDims = String(dimensions || '').trim();
  const cleanMats = String(materials || '').trim();
  const cleanNotes = String(owner_notes || '').trim();
  const cleanDesc = String(description || '').trim();
  const cleanImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const cleanVariants = normalizeVariants(variants);

  // Si no hay especificaciones adicionales, ni fotos múltiples, ni variantes, se guarda como texto plano simple
  if (!cleanDims && !cleanMats && !cleanNotes && cleanImages.length <= 1 && cleanVariants.length === 0) {
    return cleanDesc;
  }

  // Si existen especificaciones estructuradas, fotos múltiples o variantes, se serializa como JSON compacto
  return JSON.stringify({
    description: cleanDesc,
    dimensions: cleanDims,
    materials: cleanMats,
    owner_notes: cleanNotes,
    images: cleanImages,
    variants: cleanVariants
  });
}

export function getProductVariants(prod) {
  if (!prod) return [];
  if (Array.isArray(prod.variants) && prod.variants.length > 0) {
    return normalizeVariants(prod.variants);
  }
  const specs = parseProductSpecs(prod);
  return normalizeVariants(specs.variants);
}

export function hasProductVariants(prod) {
  return getProductVariants(prod).length > 0;
}

export function getTotalVariantsStock(variants) {
  if (!Array.isArray(variants)) return 0;
  return variants.reduce((sum, v) => sum + Math.max(0, Math.floor(Number(v?.stock) || 0)), 0);
}

export function getVariantStock(prod, variantIdOrColor) {
  const variants = getProductVariants(prod);
  if (variants.length === 0) return Number(prod?.stock || 0);
  const found = variants.find(v => v.id === variantIdOrColor || v.color?.toLowerCase() === String(variantIdOrColor).toLowerCase());
  return found ? Math.max(0, Math.floor(Number(found.stock) || 0)) : 0;
}
