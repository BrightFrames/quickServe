import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('routes/orders.js', 'utf8');

// Remove requireTenant from all routes
content = content.replace(/,\s*requireTenant/g, '');
content = content.replace(/requireTenant,\s*/g, '');
content = content.replace(/requireTenant/g, '');

// Remove tenant model destructuring lines
content = content.replace(/const \{ Order: TenantOrder, MenuItem: TenantMenuItem, Table: TenantTable \} = req\.tenant\.models;/g, '');
content = content.replace(/const \{ Order: TenantOrder[^\}]+\} = req\.tenant\.models;/g, '');

// Replace tenant model names with regular ones
content = content.replace(/TenantOrder/g, 'Order');
content = content.replace(/TenantMenuItem/g, 'MenuItem');
content = content.replace(/TenantTable/g, 'Table');

// Replace tenant references
content = content.replace(/req\.tenant\.slug/g, '"single-tenant"');
content = content.replace(/req\.tenant\.restaurant\.id/g, '1');

writeFileSync('routes/orders.js', content);
console.log('✓ Fixed orders.js');
