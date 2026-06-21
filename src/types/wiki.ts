// Types matching the curated TypeScript modules in public/data/
// (equipment.ts, monster.ts, npcs.ts, quetes.ts, sorts.ts, crafts.ts),
// themselves extracted from the T4C game data (WDA).

// Shared geo helpers used by several entities (monster spawns, NPC positions,
// teacher locations, item drop spots).
export interface CoordPoint {
  x: number;
  y: number;
  world: number;
}

export interface CoordGroup {
  type: string;
  name: string;
  coords: CoordPoint[];
}

export interface LocationRef {
  type: string;
  name: string;
  dropRate?: string;
}

export interface Quest {
  id: string;
  title: string;
  description?: string;
  level: number;
  difficulty?: 'Facile' | 'Moyen' | 'Difficile' | 'Épique' | string;
  rewards?: string[];
  location?: string;
  pnj?: string[];
  steps?: string[];
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  for: number;
  end: number;
  dext: number;
  int: number;
  sag: number;
  prereqs?: string[];
  element?: string;
  bonus?: string;
  location?: string;
  locations?: LocationRef[];
  coordinates?: CoordGroup[];
}

// Monsters and NPCs share the same shape; NPCs just use string ids.
export interface Creature {
  id: number | string;
  name: string;
  hp: number;
  xp: number;
  drops?: string[];
  coordinates?: CoordGroup[];
}

export type Monster = Creature;
export interface Npc extends Creature {
  id: string;
}

export interface Item {
  id: string;
  name: string;
  type?: string;
  for?: number;
  end?: number;
  dext?: number;
  int?: number;
  sag?: number;
  deg?: string;
  ca?: number;
  bonus?: string[];
  rarity?: string;
  location?: string;
  locations?: LocationRef[];
  coordinates?: CoordGroup[];
}

export interface Craft {
  id: string;
  name: string;
  requiredItems: string[];
  metier: string;
  requiredWorkLevel: number;
  locations?: LocationRef[];
  coordinates?: CoordGroup[];
}

export interface WikiData {
  quests: Quest[];
  spells: Spell[];
  monsters: Monster[];
  npcs: Npc[];
  items: Item[];
  crafts: Craft[];
  obtain: import('../utils/wikiObtain').ObtainIndex;
}

export type WikiSectionId =
  | 'quests'
  | 'spells'
  | 'monsters'
  | 'npcs'
  | 'items'
  | 'crafts'
  | 'carte';
