import { useMemo, useState } from 'react';
import { Shield, Sword, MapPin } from 'lucide-react';
import { WikiToolbar, FilterPills } from '../WikiToolbar';
import { ObtainList } from '../ObtainList';
import { getItemSources, type ObtainIndex } from '../../../utils/wikiObtain';
import type { Item } from '../../../types/wiki';

interface Props { items: Item[]; obtain: ObtainIndex; }

const RARITY_COLORS: Record<string, string> = {
  Commun:    'bg-slate-500/15 text-slate-300 border-slate-500/30',
  Rare:      'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'Épique':  'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Légendaire': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const Stat = ({ label, value }: { label: string; value: number | undefined }) => {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </span>
  );
};

const PAGE_SIZE = 30;

const countBy = <K extends string>(items: Item[], key: (i: Item) => K | undefined) => {
  const map: Record<string, number> = {};
  for (const it of items) {
    const v = key(it);
    if (v) map[v] = (map[v] ?? 0) + 1;
  }
  return map;
};

export const ItemsSection = ({ items, obtain }: Props) => {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [rarity, setRarity] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const facetCounts = useMemo(() => ({
    type:     countBy(items, (i) => i.type),
    rarity:   countBy(items, (i) => i.rarity),
    location: countBy(items, (i) => i.location),
  }), [items]);

  const types     = useMemo(() => Object.keys(facetCounts.type).sort(), [facetCounts.type]);
  const rarities  = useMemo(() => Object.keys(facetCounts.rarity), [facetCounts.rarity]);
  const locations = useMemo(() => Object.keys(facetCounts.location).sort(), [facetCounts.location]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items
      .filter((i) => {
        if (type && i.type !== type) return false;
        if (rarity && i.rarity !== rarity) return false;
        if (location && i.location !== location) return false;
        if (!needle) return true;
        return (
          i.name.toLowerCase().includes(needle) ||
          (i.bonus ?? []).some((b) => typeof b === 'string' && b.toLowerCase().includes(needle))
        );
      });
  }, [items, search, type, rarity, location]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetAndSet = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <WikiToolbar
        search={search}
        onSearchChange={resetAndSet(setSearch)}
        placeholder="Rechercher un item ou un bonus..."
        resultCount={filtered.length}
        totalCount={items.length}
      >
        <FilterPills
          label="Type"
          value={type}
          onChange={resetAndSet(setType)}
          options={[{ value: null, label: 'Tous' }, ...types.map((t) => ({ value: t, label: t, count: facetCounts.type[t] }))]}
        />
        <FilterPills
          label="Rareté"
          value={rarity}
          onChange={resetAndSet(setRarity)}
          options={[{ value: null, label: 'Toutes' }, ...rarities.map((r) => ({ value: r, label: r, count: facetCounts.rarity[r] }))]}
        />
        <FilterPills
          label="Lieu"
          value={location}
          onChange={resetAndSet(setLocation)}
          options={[{ value: null, label: 'Tous' }, ...locations.map((l) => ({ value: l, label: l, count: facetCounts.location[l] }))]}
        />
      </WikiToolbar>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {visible.map((it) => {
          const rarityClass = it.rarity ? RARITY_COLORS[it.rarity] ?? 'bg-muted text-muted-foreground border-border' : '';
          const isWeapon = it.deg && it.deg !== '0 - 0';
          const bonuses = (it.bonus ?? []).filter((b): b is string => typeof b === 'string' && b.length > 0);
          return (
            <article key={it.id} className="surface-card p-4 flex flex-col gap-2">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground leading-snug">{it.name}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    {it.type && <span className="px-1.5 py-0.5 rounded bg-muted/60">{it.type}</span>}
                    {it.location && <span className="inline-flex items-center gap-1"><MapPin size={11} aria-hidden="true" />{it.location}</span>}
                  </div>
                </div>
                {it.rarity && <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border ${rarityClass}`}>{it.rarity}</span>}
              </header>

              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <Stat label="FOR" value={it.for} />
                <Stat label="END" value={it.end} />
                <Stat label="DEX" value={it.dext} />
                <Stat label="INT" value={it.int} />
                <Stat label="SAG" value={it.sag} />
              </div>

              {(isWeapon || (it.ca !== undefined && it.ca > 0)) && (
                <div className="flex flex-wrap gap-3 text-xs">
                  {isWeapon && (
                    <span className="inline-flex items-center gap-1">
                      <Sword size={12} aria-hidden="true" className="text-rose-400" />
                      <span className="text-muted-foreground">Dégâts</span>
                      <span className="font-semibold text-foreground tabular-nums">{it.deg}</span>
                    </span>
                  )}
                  {it.ca !== undefined && it.ca > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Shield size={12} aria-hidden="true" className="text-sky-400" />
                      <span className="text-muted-foreground">CA</span>
                      <span className="font-semibold text-foreground tabular-nums">{it.ca}</span>
                    </span>
                  )}
                </div>
              )}

              {bonuses.length > 0 && (
                <ul className="text-xs text-foreground/85 space-y-0.5 border-t border-border-soft pt-2 mt-1">
                  {bonuses.map((b, i) => <li key={i} className="leading-snug">• {b}</li>)}
                </ul>
              )}

              <ObtainList sources={getItemSources(obtain, it.name)} />
            </article>
          );
        })}
        {filtered.length === 0 && (
          <p role="status" aria-live="polite" className="col-span-full text-center text-muted-foreground py-12">Aucun item trouvé.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Page précédente"
            className="px-3 h-9 rounded-md border border-border-soft text-sm disabled:opacity-40 hover:bg-muted/40 transition"
          >Précédent</button>
          <span role="status" aria-live="polite" className="text-sm text-muted-foreground tabular-nums">Page {currentPage} / {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Page suivante"
            className="px-3 h-9 rounded-md border border-border-soft text-sm disabled:opacity-40 hover:bg-muted/40 transition"
          >Suivant</button>
        </div>
      )}
    </div>
  );
};
