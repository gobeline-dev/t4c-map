// Extracts T4C wiki data embedded in the upstream Next.js page chunk and
// writes typed JSON files into public/data/. The chunk URL is the only piece
// of upstream-specific configuration; everything else is generic.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
// Override either via env (`WIKI_CHUNK_URL=...`) or by editing this default.
// Pinned to a specific Next.js chunk hash; bump when the upstream redeploys.
const CHUNK_URL = process.env.WIKI_CHUNK_URL
  ?? 'https://t4c-nefast-serv.vercel.app/_next/static/chunks/app/wiki/page-67fcc8b913b02ecf.js';
const OUT_DIR = resolve(REPO_ROOT, 'public', 'data');
const TMP_DIR = resolve(REPO_ROOT, 'scripts', '.cache');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

async function fetchChunk() {
  const cached = resolve(TMP_DIR, 'wiki_page.js');
  if (existsSync(cached) && !process.env.WIKI_REFRESH) {
    return readFileSync(cached, 'utf8');
  }
  console.log('Fetching wiki chunk...');
  const res = await fetch(CHUNK_URL);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const ct = res.headers.get('content-type') ?? '';
  if (!/javascript|text/.test(ct)) {
    throw new Error(`unexpected content-type from upstream: ${ct}`);
  }
  const text = await res.text();
  if (text.length < 50_000) {
    // Real chunk is ~370 KB. Anything under 50 KB is almost certainly an HTML
    // error page or a stub deploy: refuse to overwrite trusted JSON.
    throw new Error(`upstream chunk too small (${text.length} bytes) — refusing to extract`);
  }
  writeFileSync(cached, text, 'utf8');
  return text;
}

// Locate `<varName>=[` then walk the chars to find the matching `]`,
// respecting strings, regex literals, parentheses and braces.
function extractArrayLiteral(src, startIdx) {
  const open = src.indexOf('[', startIdx);
  if (open < 0) throw new Error(`no opening [ near ${startIdx}`);
  let i = open;
  let depthSquare = 0;
  let depthCurly = 0;
  let depthParen = 0;
  let inStr = null; // '"' | "'" | '`'
  let inRegex = false;
  let prev = '';
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === '\\') {
        prev = ch;
        i++; // skip escaped char
        continue;
      }
      if (ch === inStr) inStr = null;
      prev = ch;
      continue;
    }
    if (inRegex) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === '/') inRegex = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      prev = ch;
      continue;
    }
    if (ch === '/' && (prev === '=' || prev === '(' || prev === ',' || prev === '!' || prev === '&' || prev === '|' || prev === ':')) {
      inRegex = true;
      continue;
    }
    if (ch === '[') depthSquare++;
    else if (ch === ']') {
      depthSquare--;
      if (depthSquare === 0 && depthCurly === 0 && depthParen === 0) {
        return src.slice(open, i + 1);
      }
    } else if (ch === '{') depthCurly++;
    else if (ch === '}') depthCurly--;
    else if (ch === '(') depthParen++;
    else if (ch === ')') depthParen--;
    if (!/\s/.test(ch)) prev = ch;
  }
  throw new Error('unterminated array');
}

// Find a variable assignment of the form `,<var>=[` or `;<var>=[`
function findAssignment(src, varName) {
  const re = new RegExp(`[,;\\s\\{\\(]${varName}=\\[`, 'g');
  const m = re.exec(src);
  if (!m) throw new Error(`assignment not found for ${varName}`);
  return m.index + 1; // position of var name
}

function evalArray(literal) {
  // Replace (0,c.A)() and similar id helpers with auto-incrementing strings.
  let counter = 0;
  const cleaned = literal.replace(/\(0,[a-zA-Z_$][\w$]*\.[A-Za-z_$][\w$]*\)\(\)/g, () => {
    counter++;
    return `"auto-${counter}"`;
  });
  // Replace any remaining bare identifier references like F.A, y.A used as icon refs
  // by null so JSON-ish data still evaluates.
  const finalSrc = cleaned.replace(/\b([A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*)\b(?=,|\}|\])/g, (match) => {
    // Keep numeric-looking, true/false, null, undefined as-is
    if (/^(true|false|null|undefined|NaN|Infinity)$/.test(match)) return match;
    return 'null';
  });
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${finalSrc});`)();
}

function dump(name, data) {
  const out = resolve(OUT_DIR, `${name}.json`);
  writeFileSync(out, JSON.stringify(data, null, 2), 'utf8');
  const count = Array.isArray(data) ? data.length : Object.keys(data).length;
  console.log(`  ${name}.json -> ${count} entries`);
}

async function main() {
  const src = await fetchChunk();

  const targets = [
    { name: 'monsters_extra',   varName: 'u' },
    { name: 'monsters_classic', varName: 'l' },
    { name: 'crafts',           varName: 'm' },
    { name: 'items',            varName: 'p' },
    { name: 'quests',           varName: 'g' },
    { name: 'spells',           varName: 'h' },
    { name: 'maps',             varName: 'x' },
    { name: 'sections',         varName: 'j' },
    { name: 'tabs',             varName: 'G' },
  ];

  // Required targets must all succeed before we touch public/data/. Optional
  // ones (sections, tabs metadata) can fail without poisoning the dataset.
  const REQUIRED = new Set(['quests', 'spells', 'items', 'crafts', 'monsters_classic', 'monsters_extra', 'maps']);

  console.log('Extracting arrays:');
  const extracted = [];
  const failures = [];
  for (const t of targets) {
    try {
      const idx = findAssignment(src, t.varName);
      const literal = extractArrayLiteral(src, idx);
      const data = evalArray(literal);
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`empty or non-array result (got ${typeof data})`);
      }
      extracted.push({ target: t, data });
    } catch (err) {
      failures.push({ target: t, error: err.message });
    }
  }

  const requiredFailures = failures.filter((f) => REQUIRED.has(f.target.name));
  if (requiredFailures.length > 0) {
    console.error('Required targets failed — aborting without writing JSON:');
    for (const f of requiredFailures) console.error(`  ${f.target.name} (${f.target.varName}): ${f.error}`);
    process.exit(2);
  }

  for (const { target, data } of extracted) dump(target.name, data);
  for (const f of failures) console.warn(`  ${f.target.name} (${f.target.varName}) skipped: ${f.error}`);

  const manifest = {
    chunk: CHUNK_URL,
    extractedAt: new Date().toISOString(),
    files: extracted.map(({ target }) => `${target.name}.json`),
    skipped: failures.map((f) => f.target.name),
  };
  writeFileSync(resolve(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
