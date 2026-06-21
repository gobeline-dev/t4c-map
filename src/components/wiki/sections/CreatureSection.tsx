import { useMemo, useState } from 'react';
import { Heart, Star, Package, MapPin } from 'lucide-react';
import { WikiToolbar, FilterPills } from '../WikiToolbar';
import type { Creature } from '../../../types/wiki';

interface Props {
  creatures: Creature[];
  placeholder: string;
  emptyMessage: string;
}

const HP_BUCKETS: { id: string; label: string; min: number; max: number }[] = [
  { id: 'low',  label: '< 1k HP',     min: 0,      max: 999 },
  { id: 'mid',  label: '1k-10k HP',   min: 1000,   max: 9999 },
  { id: 'high', label: '10k-100k HP', min: 10000,  max: 99999 },
  { id: 'boss', label: '> 100k HP',   min: 100000, max: Number.POSITIVE_INFINITY },
];

const fmtNumber = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`
    : String(n);

const firstCoord = (c: Creature): string | null => {
  const group = c.coordinates?.find((g) => g.coords.length > 0);
  if (!group) return null;
  const { x, y, world } = group.coords[0];
  return `${x}.${y}.${world}`;
};

export const CreatureSection = ({ creatures, placeholder, emptyMessage }: Props) => {
  const [search, setSearch] = useState('');
  const [hpBucket, setHpBucket] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return creatures
      .filter((m) => {
        if (hpBucket) {
          const b = HP_BUCKETS.find((x) => x.id === hpBucket);
          if (!b || m.hp < b.min || m.hp > b.max) return false;
        }
        if (!needle) return true;
        return (
          m.name.toLowerCase().includes(needle) ||
          (m.drops ?? []).some((d) => d.toLowerCase().includes(needle))
        );
      })
      .sort((a, b) => a.hp - b.hp);
  }, [creatures, search, hpBucket]);

  return (
    <div className="space-y-4">
      <WikiToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder={placeholder}
        resultCount={filtered.length}
        totalCount={creatures.length}
      >
        <FilterPills
          label="HP"
          value={hpBucket}
          onChange={setHpBucket}
          options={[{ value: null, label: 'Tous' }, ...HP_BUCKETS.map((b) => ({ value: b.id, label: b.label }))]}
        />
      </WikiToolbar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((m) => {
          const coord = firstCoord(m);
          return (
            <article key={String(m.id)} className="surface-card p-4 flex flex-col gap-2">
              <header className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-foreground leading-snug">{m.name}</h3>
                {coord && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <MapPin size={11} aria-hidden="true" className="text-primary-strong" />{coord}
                  </span>
                )}
              </header>

              <div className="flex flex-wrap gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Heart size={12} aria-hidden="true" className="text-rose-400" />
                  <span className="font-semibold text-foreground tabular-nums">{fmtNumber(m.hp)}</span> HP
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Star size={12} aria-hidden="true" className="text-amber-400" />
                  <span className="font-semibold text-foreground tabular-nums">{fmtNumber(Math.round(m.xp))}</span> XP
                </span>
              </div>

              {m.drops && m.drops.length > 0 && (
                <div className="mt-1 border-t border-border-soft pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    <Package size={10} aria-hidden="true" /> Drops ({m.drops.length})
                  </div>
                  <ul className="space-y-0.5 max-h-40 overflow-y-auto pr-1 text-xs text-foreground/85">
                    {m.drops.map((d, i) => <li key={i} className="leading-snug">• {d}</li>)}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
        {filtered.length === 0 && (
          <p role="status" aria-live="polite" className="col-span-full text-center text-muted-foreground py-12">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
};
