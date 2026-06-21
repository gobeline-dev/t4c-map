import { useEffect, useState } from 'react';
import type { WikiData, Quest, Spell, Monster, Npc, Item, Craft } from '../types/wiki';
import { buildObtainIndex } from '../utils/wikiObtain';

// The wiki data now lives as curated TypeScript modules under public/data/.
// We import them dynamically so each large module (equipment.ts is ~2 MB) is
// code-split and only fetched when the wiki is first opened, instead of being
// bundled into the initial chunk.
let cache: WikiData | null = null;
let inflight: Promise<WikiData> | null = null;

async function loadAll(): Promise<WikiData> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const [equipment, monster, npcs, quetes, sorts, crafts] = await Promise.all([
      import('../../public/data/equipment'),
      import('../../public/data/monster'),
      import('../../public/data/npcs'),
      import('../../public/data/quetes'),
      import('../../public/data/sorts'),
      import('../../public/data/crafts'),
    ]);

    const items: Item[] = equipment.equipment;
    const monsters: Monster[] = monster.legacyMonsters;
    const npcList: Npc[] = npcs.npcs;
    const quests: Quest[] = quetes.quests;
    const spells: Spell[] = sorts.spellList;
    const craftList: Craft[] = crafts.crafts;

    const obtain = buildObtainIndex({
      items,
      spells,
      quests,
      crafts: craftList,
      monsters,
      npcs: npcList,
    });

    cache = { quests, spells, monsters, npcs: npcList, items, crafts: craftList, obtain };
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
    // When the cache is already populated, the initial state above already
    // reflects it — no synchronous setState needed (and none allowed in effects).
    if (cache) return;
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
