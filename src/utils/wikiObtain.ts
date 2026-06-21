import type { Craft, Item, Monster, Npc, Quest, Spell } from '../types/wiki';

// Source describing how a given item or spell can be obtained, derived by
// cross-referencing the wiki data we already have. The upstream chunk has no
// dedicated "loot table" or "trainer" field, so this is a best-effort
// reconstruction from quest rewards, craft outputs and monster drops.
export type ObtainSource =
  | { kind: 'quest';  questId: string;          questTitle: string; location?: string; pnj?: string[]; level?: number }
  | { kind: 'craft';  craftId: string;          metier: string;     level: number;     ingredients: string[] }
  | { kind: 'drop';   monsterId: number | string; monsterName: string; hp: number;     chance?: number }
  | { kind: 'shop';   location: string };

export interface ObtainIndex {
  // Keys are lowercased + accent-preserved item / spell names.
  // Spell keys are also stored with the [S]/[A] prefix stripped.
  byItem:  Map<string, ObtainSource[]>;
  bySpell: Map<string, ObtainSource[]>;
}

export const norm = (s: string) => s.toLowerCase().trim();

// Spell display names sometimes carry a tag like "[S]" (shaman) or "[A]" (aura).
// Strip those before comparing against quest reward strings, which use the bare name.
export const stripSpellTag = (n: string) => n.replace(/^\s*\[[A-Z]+\]\s*/, '').trim();

// Drops look like "Plume de corbeau 1.50%" — extract name + chance.
const DROP_PCT_RE = /\s+(\d+(?:\.\d+)?)\s*%\s*$/;
const parseDrop = (raw: string): { name: string; chance?: number } => {
  const m = raw.match(DROP_PCT_RE);
  if (!m) return { name: raw.trim() };
  return {
    name: raw.slice(0, m.index).trim(),
    chance: Number(m[1]),
  };
};

// Substring match between a reward string and a known name, with two safeguards:
// - skip names shorter than 4 chars (too noisy: "or", "œuf", etc.)
// - require word-boundary on the left to avoid "Anneau" matching "Granneau"
const MIN_NAME_LEN = 4;
const matchesName = (rewardLower: string, nameLower: string): boolean => {
  if (nameLower.length < MIN_NAME_LEN) return false;
  if (rewardLower === nameLower) return true;
  const idx = rewardLower.indexOf(nameLower);
  if (idx < 0) return false;
  const before = idx === 0 ? '' : rewardLower[idx - 1];
  return before === '' || /[^a-zà-ÿ0-9]/i.test(before);
};

interface BuildArgs {
  items: Item[];
  spells: Spell[];
  quests: Quest[];
  crafts: Craft[];
  monsters: Monster[];
  npcs?: Npc[];
}

export function buildObtainIndex(args: BuildArgs): ObtainIndex {
  const byItem  = new Map<string, ObtainSource[]>();
  const bySpell = new Map<string, ObtainSource[]>();

  const push = (map: Map<string, ObtainSource[]>, key: string, src: ObtainSource) => {
    const arr = map.get(key) ?? [];
    arr.push(src);
    map.set(key, arr);
  };

  // Pre-build name → key tables once so the quest scan stays O(quests * items).
  const itemKeys  = args.items .map((it) => ({ ref: it, key: norm(it.name) }));
  const spellKeys = args.spells.map((sp) => {
    const cleaned = stripSpellTag(sp.name);
    return { ref: sp, key: norm(sp.name), cleanKey: norm(cleaned) };
  });

  // 1. Monster and NPC drops
  const droppers: (Monster | Npc)[] = [...args.monsters, ...(args.npcs ?? [])];
  for (const m of droppers) {
    for (const raw of m.drops ?? []) {
      const { name, chance } = parseDrop(raw);
      const k = norm(name);
      // We don't try to fuzzy-match drops to items: drops use the canonical
      // item name, so an exact normalized lookup is correct.
      const itemRef = itemKeys.find((it) => it.key === k);
      if (!itemRef) continue;
      push(byItem, itemRef.key, {
        kind: 'drop',
        monsterId: m.id,
        monsterName: m.name,
        hp: m.hp,
        chance,
      });
    }
  }

  // 2. Crafts: craft.name === produced item name.
  for (const c of args.crafts) {
    const k = norm(c.name);
    const itemRef = itemKeys.find((it) => it.key === k);
    if (!itemRef) continue;
    push(byItem, itemRef.key, {
      kind: 'craft',
      craftId: c.id,
      metier: c.metier,
      level: c.requiredWorkLevel,
      ingredients: c.requiredItems,
    });
  }

  // 3. Quest rewards: any reward string that contains a known item or spell name.
  for (const q of args.quests) {
    const seenItems  = new Set<string>();
    const seenSpells = new Set<string>();
    for (const r of q.rewards ?? []) {
      const rNorm = norm(r);
      for (const { ref, key } of itemKeys) {
        if (seenItems.has(key)) continue;
        if (matchesName(rNorm, key)) {
          push(byItem, key, {
            kind: 'quest',
            questId: q.id,
            questTitle: q.title,
            location: q.location,
            pnj: q.pnj,
            level: q.level,
          });
          seenItems.add(key);
          // Use the ref to avoid an unused-binding lint
          void ref;
        }
      }
      for (const { ref, key, cleanKey } of spellKeys) {
        if (seenSpells.has(key)) continue;
        if (matchesName(rNorm, cleanKey)) {
          push(bySpell, key, {
            kind: 'quest',
            questId: q.id,
            questTitle: q.title,
            location: q.location,
            pnj: q.pnj,
            level: q.level,
          });
          seenSpells.add(key);
          void ref;
        }
      }
    }
  }

  // 4. Default fallback for items: if no derived source AND a city is listed,
  // assume it's sold by a vendor in that city.
  for (const { ref, key } of itemKeys) {
    if (byItem.has(key)) continue;
    if (ref.location) {
      push(byItem, key, { kind: 'shop', location: ref.location });
    }
  }

  // Sort sources for stable display.
  const sortKind: Record<ObtainSource['kind'], number> = { quest: 0, craft: 1, drop: 2, shop: 3 };
  for (const arr of byItem.values()) {
    arr.sort((a, b) => sortKind[a.kind] - sortKind[b.kind]);
  }
  for (const arr of bySpell.values()) {
    arr.sort((a, b) => sortKind[a.kind] - sortKind[b.kind]);
  }

  return { byItem, bySpell };
}

export const getItemSources  = (idx: ObtainIndex, name: string): ObtainSource[] => idx.byItem .get(norm(name)) ?? [];
export const getSpellSources = (idx: ObtainIndex, name: string): ObtainSource[] => idx.bySpell.get(norm(name)) ?? [];
