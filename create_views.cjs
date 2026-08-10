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
-- Crear vistas en el esquema public apuntando a punto_nexus para PostgREST
CREATE OR REPLACE VIEW public.punto_nexus_users AS 
SELECT * FROM punto_nexus.users;

CREATE OR REPLACE VIEW public.punto_nexus_inventory AS 
SELECT * FROM punto_nexus.inventory;

CREATE OR REPLACE VIEW public.punto_nexus_sales AS 
SELECT * FROM punto_nexus.sales;

-- Otorgar permisos a los roles anon y authenticated para interactuar con las vistas
GRANT ALL ON TABLE public.punto_nexus_users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.punto_nexus_inventory TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.punto_nexus_sales TO anon, authenticated, service_role;
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

console.log('Creando vistas public.punto_nexus_*...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('VISTAS PUBLICAS CREADAS EXITOSAMENTE');
    } else {
      console.error('ERROR AL CREAR LAS VISTAS');
    }
  });
});

req.on('error', (err) => {
  console.error('Error en la solicitud HTTPS:', err);
});

req.write(body);
req.end();
