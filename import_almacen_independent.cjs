const fs = require('fs');
const path = require('path');
const https = require('https');
const XLSX = require('xlsx');

// 1. Cargar el token de Supabase desde el vault
const vaultPath = 'c:\\Users\\LENOVO\\Desktop\\Proyectos\\.agent\\skills\\nexus-credentials-vault\\resources\\vault.env.local';

let supabaseToken = '';
try {
  const content = fs.readFileSync(vaultPath, 'utf8');
  const match = content.match(/^SUPABASE_ACCESS_TOKEN=(.+)$/m);
  if (match) {
    supabaseToken = match[1].trim();
  }
} catch (err) {
  console.error('Error al leer el vault:', err);
  process.exit(1);
}

if (!supabaseToken) {
  console.error('No se encontró SUPABASE_ACCESS_TOKEN en el vault.');
  process.exit(1);
}

const excelPath = path.join(__dirname, 'ALMACEN.xlsx');
console.log('Cargando Excel:', excelPath);

// Compañías objetivo
const TARGET_COMPANIES = [
  '550e8400-e29b-41d4-a716-446655440000', // Shaddai Garage
  '126366f1-3f4a-4690-ac9d-aafe141bd46f'  // Roma Center Test
];

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);
  
  const productsToInsert = [];
  
  for (let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    
    const sku = String(row['LISTA DE PRECIOS ALMACEN DONDE MAQUI'] || '').trim();
    const prodName = String(row['__EMPTY'] || '').trim();
    
    if (!sku || !prodName || sku.toLowerCase() === 'codigo' || prodName.toLowerCase() === 'productos') {
      continue;
    }
    
    const format = String(row['__EMPTY_1'] || '').trim();
    const brand = String(row['__EMPTY_2'] || '').trim();
    
    let fullName = prodName;
    if (format) fullName += ` ${format}`;
    if (brand) fullName += ` ${brand}`;
    fullName = fullName.replace(/\s+/g, ' ').trim();
    
    const costPrice = Math.round(Number(row['__EMPTY_4']) || Number(row['__EMPTY_3']) * 1.19 || 0);
    const sellPrice = Math.round(Number(row['__EMPTY_7']) || 0);
    
    if (sellPrice === 0) continue;
    
    TARGET_COMPANIES.forEach(companyId => {
      productsToInsert.push({
        company_id: companyId,
        name: fullName,
        sku: sku,
        cost_price: costPrice,
        sell_price: sellPrice,
        stock: 30,
        min_stock: 5
      });
    });
  }
  
  console.log(`Total registros preparados para punto_nexus.inventory: ${productsToInsert.length}`);
  
  if (productsToInsert.length === 0) {
    console.log('No hay registros válidos.');
    process.exit(0);
  }
  
  // Limpiar antes de insertar para evitar duplicados
  const deleteSql = `DELETE FROM punto_nexus.inventory;`;
  
  const CHUNK_SIZE = 100;
  let successCount = 0;
  
  async function insertChunks(index) {
    if (index >= productsToInsert.length) {
      console.log(`\n=== IMPORTACIÓN EN punto_nexus.inventory COMPLETADA: Se insertaron ${successCount} filas ===`);
      process.exit(0);
    }
    
    const chunk = productsToInsert.slice(index, index + CHUNK_SIZE);
    
    const valuesSql = chunk.map(p => 
      `('${p.company_id}', '${p.name.replace(/'/g, "''")}', '${p.sku.replace(/'/g, "''")}', ${p.cost_price}, ${p.sell_price}, ${p.stock}, ${p.min_stock})`
    ).join(',\n');
    
    const sql = `
    INSERT INTO punto_nexus.inventory (company_id, name, sku, cost_price, sell_price, stock, min_stock)
    VALUES 
    ${valuesSql};
    `;
    
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: '/v1/projects/qtzpzgwyjptbnipvyjdu/database/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${supabaseToken}`
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          successCount += chunk.length;
          process.stdout.write(`.`);
          setTimeout(() => insertChunks(index + CHUNK_SIZE), 100);
        } else {
          console.error(`\nError en chunk ${index}:`, data);
          setTimeout(() => insertChunks(index + CHUNK_SIZE), 500);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`\nError de red:`, err);
      setTimeout(() => insertChunks(index + CHUNK_SIZE), 1000);
    });
    
    req.write(body);
    req.end();
  }
  
  // Primero borrar, luego iniciar la importación
  console.log('Limpiando registros antiguos de punto_nexus.inventory...');
  const reqDel = https.request({
    hostname: 'api.supabase.com',
    path: '/v1/projects/qtzpzgwyjptbnipvyjdu/database/query',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify({ query: deleteSql })),
      'Authorization': `Bearer ${supabaseToken}`
    }
  }, (res) => {
    res.on('data', () => {});
    res.on('end', () => {
      console.log('Limpieza completada. Iniciando inserciones...');
      insertChunks(0);
    });
  });
  reqDel.write(JSON.stringify({ query: deleteSql }));
  reqDel.end();
  
} catch (err) {
  console.error(err);
}
