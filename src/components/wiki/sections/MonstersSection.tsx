import { useMemo, useState } from 'react';
import { Heart, Star, Package } from 'lucide-react';
import { WikiToolbar, FilterPills } from '../WikiToolbar';
import type { Monster, MonsterCategory } from '../../../types/wiki';

interface Props {
  classic: Monster[];
  extra: Monster[];
}

type SourceFilter = 'all' | MonsterCategory;
type TaggedMonster = Monster & { source: MonsterCategory };

const SOURCE_LABEL: Record<MonsterCategory, string> = {
  classic: 'Originaux',
  extra:   'Inédits',
};

const HP_BUCKETS: { id: string; label: string; min: number; max: number }[] = [
  { id: 'low',     label: '< 1k HP',     min: 0,      max: 999 },
  { id: 'mid',     label: '1k-10k HP',   min: 1000,   max: 9999 },
  { id: 'high',    label: '10k-100k HP', min: 10000,  max: 99999 },
  { id: 'boss',    label: '> 100k HP',   min: 100000, max: Number.POSITIVE_INFINITY },
];

const fmtNumber = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`
    : String(n);

export const MonstersSection = ({ classic, extra }: Props) => {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [hpBucket, setHpBucket] = useState<string | null>(null);

  const tagged = useMemo<TaggedMonster[]>(() => {
    const tag = (m: Monster, s: MonsterCategory): TaggedMonster => ({ ...m, source: s });
    if (source === 'classic') return classic.map((m) => tag(m, 'classic'));
    if (source === 'extra')   return extra.map((m) => tag(m, 'extra'));
    return [...classic.map((m) => tag(m, 'classic')), ...extra.map((m) => tag(m, 'extra'))];
  }, [classic, extra, source]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return tagged
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
  }, [tagged, search, hpBucket]);

  return (
    <div className="space-y-4">
      <WikiToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher un monstre ou un drop..."
        resultCount={filtered.length}
        totalCount={classic.length + extra.length}
      >
        <FilterPills
          label="Source"
          value={source}
          onChange={(v) => setSource(v ?? 'all')}
          options={[
            { value: 'all',     label: 'Tout',                 count: classic.length + extra.length },
            { value: 'classic', label: SOURCE_LABEL.classic,   count: classic.length },
            { value: 'extra',   label: SOURCE_LABEL.extra,     count: extra.length },
          ]}
        />
        <FilterPills
          label="HP"
          value={hpBucket}
          onChange={setHpBucket}
          options={[{ value: null, label: 'Tous' }, ...HP_BUCKETS.map((b) => ({ value: b.id, label: b.label }))]}
        />
      </WikiToolbar>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((m) => (
          <article key={`${m.source}-${m.id}`} className="surface-card p-4 flex flex-col gap-2">
            <header className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground leading-snug">{m.name}</h3>
              <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${m.source === 'extra' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-sky-500/15 text-sky-300 border-sky-500/30'}`}>
                {SOURCE_LABEL[m.source]}
              </span>
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
        ))}
        {filtered.length === 0 && (
          <p role="status" aria-live="polite" className="col-span-full text-center text-muted-foreground py-12">Aucun monstre trouvé.</p>
        )}
      </div>
    </div>
  );
};
