import { useMemo, useState } from 'react';
import { MapPin, Trophy, User, ChevronDown, ChevronUp } from 'lucide-react';
import { WikiToolbar, FilterPills } from '../WikiToolbar';
import type { Quest } from '../../../types/wiki';

interface Props { quests: Quest[]; }

const LEVEL_BUCKETS: { id: string; label: string; min: number; max: number }[] = [
  { id: '1-25',   label: 'Niv. 1-25',   min: 1,   max: 25 },
  { id: '25-50',  label: 'Niv. 25-50',  min: 25,  max: 50 },
  { id: '50-75',  label: 'Niv. 50-75',  min: 50,  max: 75 },
  { id: '75-100', label: 'Niv. 75-100', min: 75,  max: 100 },
  { id: '100-150',label: 'Niv. 100-150',min: 100, max: 150 },
  { id: '150+',   label: 'Niv. 150+',   min: 150, max: 9999 },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Facile:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Moyen:     'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Difficile: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'Épique':  'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export const QuestsSection = ({ quests }: Props) => {
  const [search, setSearch] = useState('');
  const [bucket, setBucket] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const difficulties = useMemo(() => Array.from(new Set(quests.map((q) => q.difficulty).filter(Boolean))) as string[], [quests]);
  const counts = useMemo(() => ({
    bucket: Object.fromEntries(LEVEL_BUCKETS.map((b) => [b.id, quests.filter((q) => q.level >= b.min && q.level <= b.max).length])),
    diff:   Object.fromEntries(difficulties.map((d) => [d, quests.filter((q) => q.difficulty === d).length])),
  }), [quests, difficulties]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return quests.filter((q) => {
      if (bucket) {
        const b = LEVEL_BUCKETS.find((x) => x.id === bucket);
        if (!b || q.level < b.min || q.level > b.max) return false;
      }
      if (difficulty && q.difficulty !== difficulty) return false;
      if (!needle) return true;
      const hay = [q.title, q.description, q.location, ...(q.pnj ?? []), ...(q.rewards ?? []), ...(q.steps ?? [])]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [quests, search, bucket, difficulty]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <WikiToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher une quête, un PNJ, un lieu..."
        resultCount={filtered.length}
        totalCount={quests.length}
      >
        <FilterPills
          label="Niveau"
          value={bucket}
          onChange={setBucket}
          options={[{ value: null, label: 'Tous' }, ...LEVEL_BUCKETS.map((b) => ({ value: b.id, label: b.label, count: counts.bucket[b.id] }))]}
        />
        {difficulties.length > 0 && (
          <FilterPills
            label="Difficulté"
            value={difficulty}
            onChange={setDifficulty}
            options={[{ value: null, label: 'Toutes' }, ...difficulties.map((d) => ({ value: d, label: d, count: counts.diff[d] }))]}
          />
        )}
      </WikiToolbar>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((q) => {
          const isOpen = expanded.has(q.id);
          const diffClass = q.difficulty ? DIFFICULTY_COLORS[q.difficulty] ?? 'bg-muted text-muted-foreground border-border' : '';
          return (
            <article key={q.id} className="surface-card p-4 flex flex-col gap-2">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold leading-snug text-foreground">{q.title}</h3>
                  {q.description && <p className="text-sm text-muted-foreground mt-0.5">{q.description}</p>}
                </div>
                <span className="shrink-0 inline-flex items-center justify-center min-w-[3rem] h-7 px-2 rounded-md bg-primary/15 border border-primary/30 text-primary-strong text-xs font-bold">
                  Niv. {q.level}
                </span>
              </header>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {q.difficulty && <span className={`px-2 py-0.5 rounded-full border ${diffClass}`}>{q.difficulty}</span>}
                {q.location && <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin size={12} aria-hidden="true" />{q.location}</span>}
                {q.pnj && q.pnj.length > 0 && <span className="inline-flex items-center gap-1 text-muted-foreground"><User size={12} aria-hidden="true" />{q.pnj.join(', ')}</span>}
              </div>

              {q.rewards && q.rewards.length > 0 && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Trophy size={12} aria-hidden="true" className="mt-0.5 text-primary-strong shrink-0" />
                  <span className="text-foreground/80">{q.rewards.join(' · ')}</span>
                </div>
              )}

              {q.steps && q.steps.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => toggle(q.id)}
                    aria-expanded={isOpen}
                    aria-controls={`steps-${q.id}`}
                    className="self-start inline-flex items-center gap-1 text-xs text-primary-strong hover:underline"
                  >
                    {isOpen ? <ChevronUp size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
                    {isOpen ? 'Masquer les étapes' : `Voir les ${q.steps.length} étape${q.steps.length > 1 ? 's' : ''}`}
                  </button>
                  {isOpen && (
                    <ol id={`steps-${q.id}`} className="list-decimal list-inside space-y-1 text-sm text-foreground/90 pl-1 mt-1">
                      {q.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  )}
                </>
              )}
            </article>
          );
        })}
        {filtered.length === 0 && (
          <p role="status" aria-live="polite" className="col-span-full text-center text-muted-foreground py-12">Aucune quête trouvée.</p>
        )}
      </div>
    </div>
  );
};
