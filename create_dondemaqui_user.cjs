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

const companyId = 'd00de100-3333-4444-5555-666677778888';

const sql = `
-- Insertar el usuario dondemaqui@smartlean.cl en punto_nexus.users
INSERT INTO punto_nexus.users (email, password, full_name, role, company_id)
VALUES ('dondemaqui@smartlean.cl', 'nexus123', 'Don Maqui', 'Administrador', '${companyId}')
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

console.log('Insertando usuario dondemaqui@smartlean.cl...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('USUARIO dondemaqui@smartlean.cl CREADO EXITOSAMENTE');
    } else {
      console.error('ERROR AL CREAR EL USUARIO');
    }
  });
});

req.on('error', (err) => {
  console.error('Error en la solicitud HTTPS:', err);
});

req.write(body);
req.end();
