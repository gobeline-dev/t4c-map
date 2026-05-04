// Types matching the JSON files in public/data/, themselves extracted from
// the upstream T4C wiki bundle.

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
}

export interface Monster {
  id: number | string;
  name: string;
  hp: number;
  xp: number;
  drops?: string[];
}

export type MonsterCategory = 'classic' | 'extra';

export interface MonsterGroup {
  source: MonsterCategory;
  monsters: Monster[];
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
}

export interface Craft {
  id: string;
  name: string;
  requiredItems: string[];
  metier: string;
  requiredWorkLevel: number;
}

export interface MapImage {
  src: string;
  legend?: string;
}

export interface MapEntry {
  id: string;
  name: string;
  images: MapImage[];
}

export interface WikiData {
  quests: Quest[];
  spells: Spell[];
  monstersClassic: Monster[];
  monstersExtra: Monster[];
  items: Item[];
  crafts: Craft[];
  maps: MapEntry[];
}

export type WikiSectionId = 'quests' | 'spells' | 'monsters' | 'items' | 'crafts' | 'cartes';
