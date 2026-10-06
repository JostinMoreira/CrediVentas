import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = process.argv[2];
if (target !== 'public' && target !== 'admin') {
  console.error('Uso: node scripts/prepare-vercel.mjs public|admin');
  process.exit(1);
}

const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
if (target === 'admin') delete config.routes;
const destination = join('dist', 'crediventas-app', 'browser', 'vercel.json');
writeFileSync(destination, JSON.stringify(config, null, 2) + '\n');
console.log(`Configuración ${target} preparada en ${destination}`);
