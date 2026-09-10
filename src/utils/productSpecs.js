/**
 * Utilidades para manejar especificaciones extendidas de productos
 * (Dimensiones, Materiales y Comentarios del Dueño)
 * Almacenadas con retrocompatibilidad en el campo `description`.
 */

export function parseProductSpecs(prod) {
  if (!prod) {
    return {
      description: '',
      dimensions: '',
      materials: '',
      owner_notes: '',
      images: []
    };
  }

  // 1. Si el producto ya tiene las propiedades asignadas directamente
  let baseDesc = typeof prod === 'string' ? prod : (prod.description || '');
  let dims = prod.dimensions || '';
  let mats = prod.materials || '';
  let notes = prod.owner_notes || '';
  let directImages = Array.isArray(prod.images) ? prod.images : [];

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

        return {
          description: parsed.description || parsed.text || '',
          dimensions: parsed.dimensions || dims || '',
          materials: parsed.materials || mats || '',
          owner_notes: parsed.owner_notes || parsed.notes || notes || '',
          images: Array.from(new Set(finalImages.filter(Boolean)))
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

    return {
      description: baseDesc.description || baseDesc.text || '',
      dimensions: baseDesc.dimensions || dims || '',
      materials: baseDesc.materials || mats || '',
      owner_notes: baseDesc.owner_notes || baseDesc.notes || notes || '',
      images: Array.from(new Set(finalImages.filter(Boolean)))
    };
  }

  // 4. Retornar con valores por defecto
  const finalImages = directImages.length > 0 ? directImages : fallbackImages;
  return {
    description: baseDesc || '',
    dimensions: dims || '',
    materials: mats || '',
    owner_notes: notes || '',
    images: Array.from(new Set(finalImages.filter(Boolean)))
  };
}

export function serializeProductSpecs({ description = '', dimensions = '', materials = '', owner_notes = '', images = [] }) {
  const cleanDims = String(dimensions || '').trim();
  const cleanMats = String(materials || '').trim();
  const cleanNotes = String(owner_notes || '').trim();
  const cleanDesc = String(description || '').trim();
  const cleanImages = Array.isArray(images) ? images.filter(Boolean) : [];

  // Si no hay especificaciones adicionales ni fotos múltiples, se guarda como texto plano simple
  if (!cleanDims && !cleanMats && !cleanNotes && cleanImages.length <= 1) {
    return cleanDesc;
  }

  // Si existen especificaciones estructuradas o múltiples imágenes, se serializa como JSON compacto
  return JSON.stringify({
    description: cleanDesc,
    dimensions: cleanDims,
    materials: cleanMats,
    owner_notes: cleanNotes,
    images: cleanImages
  });
}
