// Mirrors map images referenced in public/data/maps.json from the upstream
// host into public/images/maps/. Lets the app serve images locally.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const HOST = process.env.WIKI_IMAGE_HOST ?? 'https://t4c-nefast-serv.vercel.app';
const MAPS_JSON = resolve(REPO_ROOT, 'public', 'data', 'maps.json');
const OUT_DIR = resolve(REPO_ROOT, 'public', 'images', 'maps');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const maps = JSON.parse(readFileSync(MAPS_JSON, 'utf8'));
const paths = new Set();
for (const m of maps) for (const img of m.images ?? []) {
  if (typeof img.src === 'string' && img.src.startsWith('/images/maps/')) paths.add(img.src);
}

let ok = 0;
let skipped = 0;
let failed = 0;
for (const p of paths) {
  const filename = p.split('/').pop();
  const out = resolve(OUT_DIR, filename);
  if (existsSync(out) && !process.env.FORCE) {
    skipped++;
    continue;
  }
  const url = `${HOST}${p}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) throw new Error(`suspiciously small (${buf.length}B)`);
    writeFileSync(out, buf);
    console.log(`  ${filename} (${(buf.length / 1024).toFixed(0)} KB)`);
    ok++;
  } catch (e) {
    console.error(`  ${filename}: ${e.message}`);
    failed++;
  }
}
console.log(`Done. downloaded=${ok}, skipped=${skipped}, failed=${failed}`);
if (failed > 0) process.exit(1);
