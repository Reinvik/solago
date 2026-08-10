const fs = require('fs');
const https = require('https');

const vaultPath = 'c:\\Users\\LENOVO\\Desktop\\Proyectos\\.agent\\skills\\nexus-credentials-vault\\resources\\vault.env.local';
let token = '';
try {
  const content = fs.readFileSync(vaultPath, 'utf8');
  const match = content.match(/^SUPABASE_ACCESS_TOKEN=(.+)$/m);
  if (match) token = match[1].trim();
} catch (err) {
  console.error('Error vault:', err);
  process.exit(1);
}

const sql = `
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema IN ('public', 'punto_nexus') AND table_name LIKE '%inventory%';

ALTER TABLE punto_nexus.inventory ADD COLUMN IF NOT EXISTS is_exempt BOOLEAN DEFAULT FALSE;
ALTER TABLE punto_nexus.inventory ADD COLUMN IF NOT EXISTS is_tax_exempt BOOLEAN DEFAULT FALSE;
`;

const body = JSON.stringify({ query: sql });

const req = https.request({
  hostname: 'api.supabase.com',
  path: '/v1/projects/qtzpzgwyjptbnipvyjdu/database/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Authorization': 'Bearer ' + token
  }
}, (res) => {
  let d = '';
  res.on('data', chunk => d += chunk);
  res.on('end', () => console.log('Inventory Columns Result:', d));
});
req.write(body);
req.end();
