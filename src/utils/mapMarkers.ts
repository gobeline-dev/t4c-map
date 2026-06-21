import type { CoordGroup, WikiData } from '../types/wiki';

// Same convention as the live coordinate readout in MapViewer:
//   gx = pixelX / 2 ; gy = pixelY  →  pixelX = gx * 2 ; pixelY = gy
// The map images render at natural size inside the zoom/pan transform, so a
// marker placed at these pixel offsets tracks the map on pan/zoom.
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

export interface MarkerItem { label: string; category: MarkerCategory; }
export interface MarkerGroup { x: number; y: number; items: MarkerItem[]; }

interface NamedEntity { name: string; coordinates?: CoordGroup[]; }

function collect(out: { x: number; y: number; item: MarkerItem }[], entities: NamedEntity[], category: MarkerCategory, worldId: number) {
  for (const e of entities) {
    for (const group of e.coordinates ?? []) {
      for (const c of group.coords) {
        if (c.world !== worldId) continue;
        if (c.x === 0 && c.y === 0) continue;
        out.push({ x: c.x, y: c.y, item: { label: e.name, category } });
      }
    }
  }
}

export function buildWorldMarkers(data: WikiData, worldId: number, active: Set<MarkerCategory>): MarkerGroup[] {
  const raw: { x: number; y: number; item: MarkerItem }[] = [];
  if (active.has('Monstres')) collect(raw, data.monsters, 'Monstres', worldId);
  if (active.has('PNJ'))      collect(raw, data.npcs,     'PNJ',      worldId);
  if (active.has('Items'))    collect(raw, data.items,    'Items',    worldId);

  const groups = new Map<string, MarkerGroup>();
  for (const m of raw) {
    const key = `${m.x},${m.y}`;
    let g = groups.get(key);
    if (!g) { g = { x: m.x, y: m.y, items: [] }; groups.set(key, g); }
    if (!g.items.some((it) => it.label === m.item.label && it.category === m.item.category)) {
      g.items.push(m.item);
    }
  }
  return Array.from(groups.values());
}
