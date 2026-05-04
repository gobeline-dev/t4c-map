import { useEffect, useState } from 'react';
import type { WikiData, MapEntry, MapImage } from '../types/wiki';

const BASE = `${import.meta.env.BASE_URL}data/`;

const FILES = [
  { key: 'quests',          file: 'quests.json' },
  { key: 'spells',          file: 'spells.json' },
  { key: 'monstersClassic', file: 'monsters_classic.json' },
  { key: 'monstersExtra',   file: 'monsters_extra.json' },
  { key: 'items',           file: 'items.json' },
  { key: 'crafts',          file: 'crafts.json' },
  { key: 'maps',            file: 'maps.json' },
] as const;

// Locally curated additions that aren't in the upstream wiki bundle.
// Same shape as `maps.json` but only id + images are merged (id new = append entry).
const EXTRA_FILES = [
  { key: 'mapsExtra', file: 'maps_extra.json' },
] as const;

function mergeMapsExtras(maps: MapEntry[], extras: Partial<MapEntry>[]): MapEntry[] {
  const byId = new Map(maps.map((m) => [m.id, { ...m, images: [...m.images] }]));
  for (const ex of extras) {
    if (!ex.id) continue;
    const existing = byId.get(ex.id);
    if (existing) {
      const have = new Set(existing.images.map((i) => i.src));
      for (const img of (ex.images ?? []) as MapImage[]) {
        if (!have.has(img.src)) existing.images.push(img);
      }
    } else if (ex.name && ex.images) {
      byId.set(ex.id, { id: ex.id, name: ex.name, images: ex.images });
    }
  }
  return Array.from(byId.values());
}

let cache: WikiData | null = null;
let inflight: Promise<WikiData> | null = null;

async function loadAll(): Promise<WikiData> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const allFiles = [...FILES, ...EXTRA_FILES] as const;
    const results = await Promise.allSettled(
      allFiles.map(({ file }) => fetch(`${BASE}${file}`).then((r) => {
        if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
        return r.json();
      })),
    );
    const data = {} as Record<string, unknown[]>;
    results.forEach((res, i) => {
      const key = allFiles[i].key;
      if (res.status === 'fulfilled') {
        data[key] = Array.isArray(res.value) ? res.value : [];
      } else {
        // Extras are optional: only warn loudly for the upstream-required files.
        if (i < FILES.length) console.warn(`[wiki] failed to load ${allFiles[i].file}:`, res.reason);
        data[key] = [];
      }
    });
    const maps = data.maps as MapEntry[];
    const extras = (data.mapsExtra as Partial<MapEntry>[]) ?? [];
    delete data.mapsExtra;
    data.maps = mergeMapsExtras(maps, extras);
    cache = data as unknown as WikiData;
    return cache;
  })();
  return inflight;
}

interface State {
  data: WikiData | null;
  loading: boolean;
  error: string | null;
}

export function useWikiData(): State {
  const [state, setState] = useState<State>({ data: cache, loading: !cache, error: null });

  useEffect(() => {
    if (cache) {
      setState({ data: cache, loading: false, error: null });
      return;
    }
    let alive = true;
    loadAll()
      .then((d) => alive && setState({ data: d, loading: false, error: null }))
      .catch((e) => alive && setState({ data: null, loading: false, error: String(e?.message ?? e) }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
