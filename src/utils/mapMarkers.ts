import type { CoordGroup } from '../types/wiki';

// Conversion coordonnée de jeu ↔ pixel : voir PX_PER_GX / PX_PER_GY dans
// src/config/maps.ts (cartes HD : pixelX = gx * 8 ; pixelY = gy * 4).
export type MarkerCategory = 'Monstres' | 'PNJ' | 'Items';

export const MARKER_CATEGORIES: MarkerCategory[] = ['Monstres', 'PNJ', 'Items'];

export const CATEGORY_COLOR: Record<MarkerCategory, string> = {
  Monstres: 'text-rose-400',
  PNJ:      'text-orange-400',
  Items:    'text-violet-400',
};

export const CATEGORY_DOT: Record<MarkerCategory, string> = {
  Monstres: 'bg-rose-400',
  PNJ:      'bg-orange-400',
  Items:    'bg-violet-400',
};

export interface NamedEntity { name: string; coordinates?: CoordGroup[]; }

// Accent-insensitive normaliser for the search box.
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(DIACRITICS, '').trim();

// Lazy, cached per-category module loading. The map stays light until the user
// opens the marker search and picks a category — only that module is fetched
// (e.g. the 1.4 MB equipment chunk loads only if the user browses "Items").
const cache: Partial<Record<MarkerCategory, NamedEntity[]>> = {};
export async function loadCategoryEntities(cat: MarkerCategory): Promise<NamedEntity[]> {
  const cached = cache[cat];
  if (cached) return cached;
  let arr: NamedEntity[];
  if (cat === 'Monstres')   arr = (await import('../../public/data/monster')).legacyMonsters;
  else if (cat === 'PNJ')   arr = (await import('../../public/data/npcs')).npcs;
  else                      arr = (await import('../../public/data/equipment')).equipment;
  cache[cat] = arr;
  return arr;
}

export const entityKey = (cat: MarkerCategory, name: string) => `${cat}::${name}`;
export const parseKey = (key: string): { category: MarkerCategory; name: string } => {
  const i = key.indexOf('::');
  return { category: key.slice(0, i) as MarkerCategory, name: key.slice(i + 2) };
};

export interface EntityListItem {
  key: string;
  name: string;
  category: MarkerCategory;
  count: number;
  first: { x: number; y: number }; // first spawn on the world — used to center the camera
}

// Entities of a category that have at least one usable coordinate on the world,
// de-duplicated by name (spawn counts summed). Sorted by name for the picker.
export function listWorldEntities(entities: NamedEntity[], cat: MarkerCategory, worldId: number): EntityListItem[] {
  const byKey = new Map<string, EntityListItem>();
  for (const e of entities) {
    let count = 0;
    let first: { x: number; y: number } | null = null;
    for (const g of e.coordinates ?? [])
      for (const c of g.coords)
        if (c.world === worldId && !(c.x === 0 && c.y === 0)) {
          count++;
          if (!first) first = { x: c.x, y: c.y };
        }
    if (count === 0 || !first) continue;
    const key = entityKey(cat, e.name);
    const prev = byKey.get(key);
    if (prev) prev.count += count;
    else byKey.set(key, { key, name: e.name, category: cat, count, first });
  }
  return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export interface MarkerItem { label: string; category: MarkerCategory; }
export interface MarkerGroup { x: number; y: number; items: MarkerItem[]; }

// Build grouped markers for the currently selected entities on a world.
// Only the selected names are scanned, so the marker count stays small.
export function buildMarkersFromSelection(
  selectedKeys: Set<string>,
  loaded: Partial<Record<MarkerCategory, NamedEntity[]>>,
  worldId: number,
): MarkerGroup[] {
  const namesByCat = new Map<MarkerCategory, Set<string>>();
  for (const key of selectedKeys) {
    const { category, name } = parseKey(key);
    let set = namesByCat.get(category);
    if (!set) { set = new Set(); namesByCat.set(category, set); }
    set.add(name);
  }

  const groups = new Map<string, MarkerGroup>();
  for (const [cat, names] of namesByCat) {
    const entities = loaded[cat];
    if (!entities) continue;
    for (const e of entities) {
      if (!names.has(e.name)) continue;
      for (const g of e.coordinates ?? []) {
        for (const c of g.coords) {
          if (c.world !== worldId || (c.x === 0 && c.y === 0)) continue;
          const k = `${c.x},${c.y}`;
          let grp = groups.get(k);
          if (!grp) { grp = { x: c.x, y: c.y, items: [] }; groups.set(k, grp); }
          if (!grp.items.some((it) => it.label === e.name && it.category === cat)) {
            grp.items.push({ label: e.name, category: cat });
          }
        }
      }
    }
  }
  return Array.from(groups.values());
}
