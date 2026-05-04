import { useEffect, useId, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, GitBranch, Lock, Unlock } from 'lucide-react';
import { WikiToolbar, FilterPills } from '../WikiToolbar';
import { ExpandAllContext, useExpandAll } from '../TreeContext';
import type { Spell } from '../../../types/wiki';

interface Props { spells: Spell[]; }

const ELEMENT_COLORS: Record<string, string> = {
  Feu:     'bg-rose-500/15 text-rose-300 border-rose-500/30',
  Eau:     'bg-sky-500/15 text-sky-300 border-sky-500/30',
  Air:     'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  Terre:   'bg-amber-700/15 text-amber-400 border-amber-700/30',
  Lumière: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30',
  Nécro:   'bg-violet-500/15 text-violet-300 border-violet-500/30',
  Neutre:  'bg-muted text-muted-foreground border-border',
};

const norm = (s: string) => s.toLowerCase().trim();
const INDENT_PX = (depth: number) => `${Math.min(depth, 6) * 14}px`;

const Stat = ({ label, value }: { label: string; value: number }) => {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </span>
  );
};

const ElementBadge = ({ element }: { element?: string }) => {
  const el = element ?? 'Neutre';
  const cls = ELEMENT_COLORS[el] ?? 'bg-muted text-muted-foreground border-border';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${cls}`}>{el}</span>;
};

const SpellRowLabel = ({ spellName, spell, isCycle }: { spellName: string; spell?: Spell; isCycle: boolean }) => (
  <span className="min-w-0 flex-1 flex items-center flex-wrap gap-x-2 gap-y-0.5">
    <span className="font-medium text-sm text-foreground truncate">{spellName}</span>
    {spell ? (
      <>
        <span className="shrink-0 text-[10px] tabular-nums font-bold text-primary-strong bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
          niv. {spell.level}
        </span>
        <span className="hidden sm:inline-flex"><ElementBadge element={spell.element} /></span>
        {isCycle && (
          <span title="Référence circulaire — ce sort apparaît déjà plus haut dans l'arbre" className="shrink-0 text-[9px] uppercase tracking-wider text-amber-300/80 cursor-help">cycle</span>
        )}
      </>
    ) : (
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground italic">non répertorié</span>
    )}
  </span>
);

interface PrereqNodeProps {
  spellName: string;
  index: Map<string, Spell>;
  visited: Set<string>;
  depth: number;
}

const PrereqNode = ({ spellName, index, visited, depth }: PrereqNodeProps) => {
  const spell = index.get(norm(spellName));
  const cascade = useExpandAll();
  // Auto-open the first level so the immediate ancestors are visible without a click.
  const [open, setOpen] = useState(cascade ?? depth < 1);
  const childListId = useId();

  useEffect(() => {
    if (cascade !== null) setOpen(cascade);
  }, [cascade]);

  const isCycle = spell ? visited.has(norm(spell.name)) : false;
  const children = useMemo(() => (spell && !isCycle ? (spell.prereqs ?? []) : []), [spell, isCycle]);
  const nextVisited = useMemo(() => {
    if (!spell) return visited;
    const next = new Set(visited);
    next.add(norm(spell.name));
    return next;
  }, [spell, visited]);

  const expandable = !isCycle && children.length > 0;

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!expandable) return;
    if (e.key === 'ArrowRight' && !open) { e.preventDefault(); setOpen(true); }
    else if (e.key === 'ArrowLeft' && open) { e.preventDefault(); setOpen(false); }
  };

  return (
    <li className="relative">
      <div style={{ paddingLeft: INDENT_PX(depth) }}>
        {expandable ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? childListId : undefined}
            onClick={() => setOpen((v) => !v)}
            onKeyDown={onKey}
            className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/40 transition text-left"
          >
            <span aria-hidden="true" className="shrink-0 text-muted-foreground">
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <SpellRowLabel spellName={spellName} spell={spell} isCycle={false} />
          </button>
        ) : (
          <div className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md">
            <span aria-hidden="true" className="w-3.5 shrink-0" />
            <SpellRowLabel spellName={spellName} spell={spell} isCycle={isCycle} />
          </div>
        )}
      </div>
      {expandable && open && (
        <ul id={childListId} className="space-y-0.5">
          {children.map((c, i) => (
            <PrereqNode
              key={`${c}-${i}`}
              spellName={c}
              index={index}
              visited={nextVisited}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const UNLOCK_CAP = 50;

interface UnlocksListProps {
  unlocks: Spell[];
}

const UnlocksList = ({ unlocks }: UnlocksListProps) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? unlocks : unlocks.slice(0, UNLOCK_CAP);
  return (
    <div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {visible.map((s) => (
          <li key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/20 border border-border-soft/50">
            <span className="shrink-0 inline-flex items-center justify-center min-w-[2rem] h-6 px-1.5 rounded bg-primary/15 border border-primary/30 text-primary-strong text-[11px] font-bold tabular-nums">
              {s.level}
            </span>
            <span className="font-medium text-sm text-foreground truncate flex-1">{s.name}</span>
            <ElementBadge element={s.element} />
          </li>
        ))}
      </ul>
      {unlocks.length > UNLOCK_CAP && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-xs text-primary-strong hover:underline"
        >
          {showAll ? 'Voir moins' : `+ ${unlocks.length - UNLOCK_CAP} autres sorts débloqués`}
        </button>
      )}
    </div>
  );
};

interface SpellCardProps {
  spell: Spell;
  index: Map<string, Spell>;
  forwardIndex: Map<string, Spell[]>;
}

const SpellCard = ({ spell, index, forwardIndex }: SpellCardProps) => {
  const cascade = useExpandAll();
  const [open, setOpen] = useState(cascade ?? false);
  const bodyId = useId();
  useEffect(() => {
    if (cascade !== null) setOpen(cascade);
  }, [cascade]);

  const prereqs = spell.prereqs ?? [];
  const unlocks = forwardIndex.get(norm(spell.name)) ?? [];
  const hasGraph = prereqs.length > 0 || unlocks.length > 0;
  // Default to the side with content when only one side is non-empty.
  const [tab, setTab] = useState<'prereq' | 'unlocks'>(prereqs.length > 0 ? 'prereq' : 'unlocks');

  return (
    <article className="surface-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? bodyId : undefined}
        className="w-full flex items-center gap-3 p-3 md:p-4 text-left hover:bg-muted/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span aria-hidden="true" className="shrink-0 text-muted-foreground">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm md:text-base font-semibold text-foreground truncate">{spell.name}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <ElementBadge element={spell.element} />
            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-2">
              <Stat label="FOR" value={spell.for} />
              <Stat label="END" value={spell.end} />
              <Stat label="DEX" value={spell.dext} />
              <Stat label="INT" value={spell.int} />
              <Stat label="SAG" value={spell.sag} />
            </span>
            {hasGraph && (
              <span className="text-[10px] uppercase tracking-wider text-amber-400/70 inline-flex items-center gap-1">
                <GitBranch size={10} aria-hidden="true" />
                {prereqs.length > 0 && <span>{prereqs.length} prérequis</span>}
                {prereqs.length > 0 && unlocks.length > 0 && <span aria-hidden="true">·</span>}
                {unlocks.length > 0 && <span>débloque {unlocks.length}</span>}
              </span>
            )}
          </span>
        </span>
        <span className="shrink-0 inline-flex items-center justify-center min-w-[2.5rem] h-7 px-2 rounded-md bg-primary/15 border border-primary/30 text-primary-strong text-xs font-bold tabular-nums">
          {spell.level}
        </span>
      </button>

      {open && (
        <div id={bodyId} className="px-3 md:px-5 pb-4 pt-1 space-y-3">
          {spell.bonus && (
            <p className="text-sm text-muted-foreground italic">{spell.bonus}</p>
          )}
          {hasGraph ? (
            <>
              <div role="tablist" aria-label="Vue des relations" className="inline-flex gap-1 bg-card/40 border border-border-soft rounded-lg p-1">
                <button
                  role="tab"
                  type="button"
                  aria-selected={tab === 'prereq'}
                  disabled={prereqs.length === 0}
                  onClick={() => setTab('prereq')}
                  className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    tab === 'prereq' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Lock size={12} aria-hidden="true" />
                  Prérequis ({prereqs.length})
                </button>
                <button
                  role="tab"
                  type="button"
                  aria-selected={tab === 'unlocks'}
                  disabled={unlocks.length === 0}
                  onClick={() => setTab('unlocks')}
                  className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                    tab === 'unlocks' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Unlock size={12} aria-hidden="true" />
                  Débloque ({unlocks.length})
                </button>
              </div>
              <div role="tabpanel">
                {tab === 'prereq' && prereqs.length > 0 && (
                  <ul className="space-y-0.5">
                    {prereqs.map((p, i) => (
                      <PrereqNode
                        key={`${p}-${i}`}
                        spellName={p}
                        index={index}
                        visited={new Set([norm(spell.name)])}
                        depth={0}
                      />
                    ))}
                  </ul>
                )}
                {tab === 'unlocks' && unlocks.length > 0 && (
                  <UnlocksList unlocks={unlocks} />
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">Aucun prérequis, ne débloque aucun autre sort.</p>
          )}
        </div>
      )}
    </article>
  );
};

export const SpellsSection = ({ spells }: Props) => {
  const [search, setSearch] = useState('');
  const [element, setElement] = useState<string | null>(null);
  const [shamanOnly, setShamanOnly] = useState<string | null>(null);
  const [cascade, setCascade] = useState<boolean | null>(null);

  const elements = useMemo(() => Array.from(new Set(spells.map((s) => s.element).filter(Boolean))) as string[], [spells]);
  const counts = useMemo(() => ({
    elements: Object.fromEntries(elements.map((e) => [e, spells.filter((s) => s.element === e).length])),
    mage:    spells.filter((s) => !s.name.startsWith('[S]')).length,
    shaman:  spells.filter((s) =>  s.name.startsWith('[S]')).length,
  }), [spells, elements]);

  const index = useMemo(() => {
    const m = new Map<string, Spell>();
    for (const s of spells) m.set(norm(s.name), s);
    return m;
  }, [spells]);

  const forwardIndex = useMemo(() => {
    const m = new Map<string, Spell[]>();
    for (const s of spells) {
      for (const p of (s.prereqs ?? [])) {
        const key = norm(p);
        const arr = m.get(key) ?? [];
        arr.push(s);
        m.set(key, arr);
      }
    }
    for (const arr of m.values()) arr.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    return m;
  }, [spells]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return spells
      .filter((s) => {
        if (element && s.element !== element) return false;
        if (shamanOnly === 'shaman' && !s.name.startsWith('[S]')) return false;
        if (shamanOnly === 'mage' && s.name.startsWith('[S]')) return false;
        if (!needle) return true;
        return s.name.toLowerCase().includes(needle) || (s.bonus ?? '').toLowerCase().includes(needle);
      })
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [spells, search, element, shamanOnly]);

  const onCascade = (next: boolean) => {
    setCascade(next);
    setTimeout(() => setCascade(null), 0);
  };

  return (
    <ExpandAllContext.Provider value={cascade}>
      <div className="space-y-4">
        <WikiToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Rechercher un sort..."
          resultCount={filtered.length}
          totalCount={spells.length}
        >
          <FilterPills
            label="Élément"
            value={element}
            onChange={setElement}
            options={[{ value: null, label: 'Tous' }, ...elements.map((e) => ({ value: e, label: e, count: counts.elements[e] }))]}
          />
          <FilterPills
            label="Type"
            value={shamanOnly}
            onChange={setShamanOnly}
            options={[
              { value: null, label: 'Tous' },
              { value: 'mage',   label: 'Mage',   count: counts.mage },
              { value: 'shaman', label: 'Shaman', count: counts.shaman },
            ]}
          />
          <span className="ml-auto inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onCascade(true)}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border border-border-soft text-muted-foreground hover:text-foreground hover:border-border transition"
            >
              <GitBranch size={11} aria-hidden="true" />
              Tout déplier
            </button>
            <button
              type="button"
              onClick={() => onCascade(false)}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border border-border-soft text-muted-foreground hover:text-foreground hover:border-border transition"
            >
              Tout replier
            </button>
          </span>
        </WikiToolbar>

        <div className="space-y-2">
          {filtered.map((s) => (
            <SpellCard key={s.id} spell={s} index={index} forwardIndex={forwardIndex} />
          ))}
          {filtered.length === 0 && (
            <p role="status" aria-live="polite" className="text-center text-muted-foreground py-12">Aucun sort trouvé.</p>
          )}
        </div>
      </div>
    </ExpandAllContext.Provider>
  );
};
