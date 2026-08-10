const fs = require('fs');
const path = require('path');
const https = require('https');

// Ruta del vault
const vaultPath = 'c:\\Users\\LENOVO\\Desktop\\Proyectos\\.agent\\skills\\nexus-credentials-vault\\resources\\vault.env.local';

// Leer el vault para obtener el token
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

const sql = `
-- 1. Crear el esquema punto_nexus
CREATE SCHEMA IF NOT EXISTS punto_nexus;

-- 2. Crear tabla de usuarios de punto_nexus (independiente de garage)
CREATE TABLE IF NOT EXISTS punto_nexus.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Cajero',
  company_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Crear tabla de inventario de punto_nexus
CREATE TABLE IF NOT EXISTS punto_nexus.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  cost_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  sell_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pn_inventory_company ON punto_nexus.inventory(company_id);

-- 4. Crear tabla de ventas de punto_nexus
CREATE TABLE IF NOT EXISTS punto_nexus.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  items JSONB NOT NULL,
  total_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_sell NUMERIC(15,2) NOT NULL DEFAULT 0,
  profit NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'Boleta',
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pn_sales_company_date ON punto_nexus.sales(company_id, sold_at DESC);

-- 5. Insertar usuarios de prueba para el Almacén de Punto Nexus
INSERT INTO punto_nexus.users (email, password, full_name, role, company_id)
VALUES 
  ('almacen@smartlean.cl', 'nexus123', 'Don Maqui', 'Administrador', '550e8400-e29b-41d4-a716-446655440000'),
  ('cajero@smartlean.cl', 'nexus123', 'Cajero Almacén', 'Cajero', '126366f1-3f4a-4690-ac9d-aafe141bd46f')
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, full_name = EXCLUDED.full_name, role = EXCLUDED.role, company_id = EXCLUDED.company_id;
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

console.log('Creando esquema e insertando usuarios para Punto Nexus...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('MIGRACIÓN DE ESQUEMA INDEPENDIENTE COMPLETADA');
    } else {
      console.error('ERROR AL APLICAR LA MIGRACIÓN');
    }
  });
});

req.on('error', (err) => {
  console.error('Error en la solicitud HTTPS:', err);
});

req.write(body);
req.end();
