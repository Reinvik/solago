const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, 'ALMACEN.xlsx');

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Filas brutas en Excel: ${rawData.length}`);
  
  let emptySku = 0;
  let emptyProd = 0;
  let skippedHeader = 0;
  let validCount = 0;
  
  const skippedSamples = [];
  
  for (let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    const sku = String(row['LISTA DE PRECIOS ALMACEN DONDE MAQUI'] || '').trim();
    const prodName = String(row['__EMPTY'] || '').trim();
    
    if (!sku) {
      emptySku++;
      if (skippedSamples.length < 5) skippedSamples.push({ index: i, reason: 'Empty SKU', row });
      continue;
    }
    if (!prodName) {
      emptyProd++;
      if (skippedSamples.length < 5) skippedSamples.push({ index: i, reason: 'Empty Product Name', row });
      continue;
    }
    if (sku.toLowerCase() === 'codigo' || prodName.toLowerCase() === 'productos') {
      skippedHeader++;
      continue;
    }
    
    validCount++;
  }
  
  console.log(`Valores analizados:`);
  console.log(`- Válidos: ${validCount}`);
  console.log(`- SKU vacío: ${emptySku}`);
  console.log(`- Producto vacío: ${emptyProd}`);
  console.log(`- Cabecera omitida: ${skippedHeader}`);
  console.log(`Muestras omitidas:`, JSON.stringify(skippedSamples, null, 2));
  
} catch (err) {
  console.error(err);
}
