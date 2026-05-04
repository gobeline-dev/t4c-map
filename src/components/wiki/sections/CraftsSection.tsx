import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Hammer, Package, Sparkles, ChevronDown, ChevronRight, Calculator } from 'lucide-react';
import { WikiToolbar, FilterPills } from '../WikiToolbar';
import { ExpandAllContext, useExpandAll } from '../TreeContext';
import type { Craft } from '../../../types/wiki';

interface Props { crafts: Craft[]; }

interface Ingredient {
  name: string;
  quantity: number;
}

const LEVEL_BUCKETS: { id: string; label: string; min: number; max: number }[] = [
  { id: '0',     label: 'Niv. 0',      min: 0,   max: 0 },
  { id: '1-15',  label: 'Niv. 1-15',   min: 1,   max: 15 },
  { id: '16-25', label: 'Niv. 16-25',  min: 16,  max: 25 },
  { id: '26-50', label: 'Niv. 26-50',  min: 26,  max: 50 },
  { id: '50+',   label: 'Niv. 50+',    min: 51,  max: 9999 },
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const norm = (s: string) => s.toLowerCase().trim();

const parseIngredient = (raw: string): Ingredient => {
  const m = raw.match(/^(\d+)\s*x\s+(.+)$/i);
  return m ? { quantity: parseInt(m[1], 10), name: m[2].trim() } : { quantity: 1, name: raw.trim() };
};

/**
 * Walk the tree and accumulate raw materials, but stop descending into a
 * craftable subtree as soon as its path is NOT in `expandedPaths`. That way
 * the totals reflect exactly what the user has unfolded — collapse a sub-craft
 * and its components disappear; expand it and they show up.
 */
const computeRawMaterials = (
  craft: Craft,
  multiplier: number,
  pathPrefix: string,
  expandedPaths: Set<string>,
  index: Map<string, Craft>,
  totals: Record<string, number>,
  visited: Set<string>,
  depth = 0,
) => {
  for (const ing of craft.requiredItems.map(parseIngredient)) {
    const sub = index.get(norm(ing.name));
    const totalQty = ing.quantity * multiplier;
    const childPath = pathPrefix ? `${pathPrefix}>${norm(ing.name)}` : norm(ing.name);
    const canDescend = !!sub && depth < 12 && !visited.has(norm(sub.name)) && expandedPaths.has(childPath);
    if (canDescend) {
      const next = new Set(visited);
      next.add(norm(sub!.name));
      computeRawMaterials(sub!, totalQty, childPath, expandedPaths, index, totals, next, depth + 1);
    } else {
      // Either a leaf, a collapsed craftable, a cycle, or too deep → counts as
      // an indivisible unit at this level.
      totals[ing.name] = (totals[ing.name] ?? 0) + totalQty;
    }
  }
};

interface TreeNodeProps {
  ingredient: Ingredient;
  multiplier: number;
  index: Map<string, Craft>;
  visited: Set<string>;
  depth: number;
  /** Path from the root to this node (joined normalized names). */
  path: string;
  expandedPaths: Set<string>;
  setExpanded: (path: string, open: boolean) => void;
}

const INDENT_PX = (depth: number) => `${Math.min(depth, 6) * 14}px`;

const NodeLabel = ({ ingredient, totalQty, sub, isCycle }: { ingredient: Ingredient; totalQty: number; sub?: Craft; isCycle: boolean }) => (
  <span className="min-w-0 flex-1 flex items-center flex-wrap gap-x-2 gap-y-0.5">
    <span className="font-medium text-sm text-foreground truncate">{ingredient.name}</span>
    <span className="shrink-0 text-[10px] tabular-nums font-bold text-primary-strong bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
      x{totalQty}
    </span>
    {sub ? (
      isCycle ? (
        <span title="Référence circulaire — cet ingrédient est déjà visité plus haut dans l'arbre" className="shrink-0 text-[9px] uppercase tracking-wider text-amber-300/80 cursor-help">cycle</span>
      ) : (
        <span className="hidden sm:inline-flex shrink-0 text-[9px] uppercase tracking-wider text-amber-400/80 items-center gap-1">
          <Hammer size={9} aria-hidden="true" />
          {sub.metier}{sub.requiredWorkLevel > 0 ? ` · niv. ${sub.requiredWorkLevel}` : ''}
        </span>
      )
    ) : (
      <span className="hidden sm:inline-flex shrink-0 text-[9px] uppercase tracking-wider text-emerald-400/70 items-center gap-1">
        <Package size={9} aria-hidden="true" />
        base
      </span>
    )}
  </span>
);

const TreeNode = ({ ingredient, multiplier, index, visited, depth, path, expandedPaths, setExpanded }: TreeNodeProps) => {
  const sub = index.get(norm(ingredient.name));
  const isCraftable = !!sub;
  const isCycle = !!sub && visited.has(norm(sub.name));
  const totalQty = ingredient.quantity * multiplier;
  const childListId = useId();

  // Listen to the expand-all cascade. When it fires, push every reachable
  // craftable path into the parent's expanded set. When it fires false, clear
  // every path under this node.
  const cascade = useExpandAll();
  const expandable = isCraftable && !isCycle;
  const open = expandable && expandedPaths.has(path);

  useEffect(() => {
    if (cascade === null || !expandable) return;
    setExpanded(path, cascade);
  }, [cascade, expandable, path, setExpanded]);

  const subIngredients = useMemo(
    () => (sub && !isCycle ? sub.requiredItems.map(parseIngredient) : []),
    [sub, isCycle],
  );
  const nextVisited = useMemo(() => {
    if (!sub) return visited;
    const next = new Set(visited);
    next.add(norm(sub.name));
    return next;
  }, [sub, visited]);

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!expandable) return;
    if (e.key === 'ArrowRight' && !open) { e.preventDefault(); setExpanded(path, true); }
    else if (e.key === 'ArrowLeft' && open) { e.preventDefault(); setExpanded(path, false); }
  };

  return (
    <li className="relative">
      <div style={{ paddingLeft: INDENT_PX(depth) }}>
        {expandable ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? childListId : undefined}
            onClick={() => setExpanded(path, !open)}
            onKeyDown={onKey}
            className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/40 transition text-left"
          >
            <span aria-hidden="true" className="shrink-0 text-muted-foreground">
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <NodeLabel ingredient={ingredient} totalQty={totalQty} sub={sub} isCycle={false} />
          </button>
        ) : (
          <div className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md">
            <span aria-hidden="true" className="w-3.5 shrink-0" />
            <NodeLabel ingredient={ingredient} totalQty={totalQty} sub={sub} isCycle={isCycle} />
          </div>
        )}
      </div>
      {expandable && open && subIngredients.length > 0 && (
        <ul id={childListId} className="space-y-0.5">
          {subIngredients.map((ing, i) => (
            <TreeNode
              key={`${ing.name}-${i}`}
              ingredient={ing}
              multiplier={totalQty}
              index={index}
              visited={nextVisited}
              depth={depth + 1}
              path={`${path}>${norm(ing.name)}`}
              expandedPaths={expandedPaths}
              setExpanded={setExpanded}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

interface RecipeCardProps {
  craft: Craft;
  index: Map<string, Craft>;
}

const RecipeCard = ({ craft, index }: RecipeCardProps) => {
  const cascade = useExpandAll();
  const [open, setOpen] = useState(cascade ?? false);
  const bodyId = useId();
  // Tracks every PATH (root-relative, normalized) currently expanded in this
  // card's tree. The same Set drives both rendering and totals computation,
  // so totals stay in sync with whatever the user has unfolded.
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (cascade !== null) setOpen(cascade);
    if (cascade === false) setExpandedPaths(new Set());
  }, [cascade]);

  const setExpanded = useCallback((path: string, isOpen: boolean) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (isOpen) {
        next.add(path);
      } else {
        // Collapse this node and every descendant so a re-expand starts cleanly.
        for (const p of next) if (p === path || p.startsWith(`${path}>`)) next.delete(p);
      }
      return next;
    });
  }, []);

  const ingredients = useMemo(() => craft.requiredItems.map(parseIngredient), [craft]);

  const totals = useMemo(() => {
    if (!open) return [] as [string, number][];
    const t: Record<string, number> = {};
    computeRawMaterials(craft, 1, '', expandedPaths, index, t, new Set([norm(craft.name)]));
    return Object.entries(t).sort((a, b) => a[0].localeCompare(b[0]));
  }, [craft, index, open, expandedPaths]);

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
          <span className="block text-sm md:text-base font-semibold text-foreground truncate">{craft.name}</span>
          <span className="block text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Hammer size={11} aria-hidden="true" className="text-amber-400" />
              <span className="capitalize">{craft.metier}</span>
              <span aria-hidden="true">·</span>
              <span>{craft.requiredItems.length} ingrédient{craft.requiredItems.length > 1 ? 's' : ''}</span>
            </span>
          </span>
        </span>
        <span className="shrink-0 inline-flex items-center justify-center min-w-[2.5rem] h-7 px-2 rounded-md bg-primary/15 border border-primary/30 text-primary-strong text-xs font-bold tabular-nums">
          {craft.requiredWorkLevel}
        </span>
      </button>

      {open && (
        <div id={bodyId} className="px-3 md:px-5 pb-4 pt-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Arborescence</h4>
            <ul className="space-y-0.5">
              {ingredients.map((ing, i) => (
                <TreeNode
                  key={`${ing.name}-${i}`}
                  ingredient={ing}
                  multiplier={1}
                  index={index}
                  visited={new Set([norm(craft.name)])}
                  depth={0}
                  path={norm(ing.name)}
                  expandedPaths={expandedPaths}
                  setExpanded={setExpanded}
                />
              ))}
            </ul>
          </div>
          <aside className="lg:col-span-1 surface-card p-3 bg-muted/10">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1">
              <Calculator size={11} aria-hidden="true" /> Total ressources
              <span className="text-[9px] normal-case text-muted-foreground/70">(suit ce qui est déplié)</span>
            </h4>
            {totals.length > 0 ? (
              <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {totals.map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between text-xs gap-2 py-1 border-b border-border-soft/60 last:border-0">
                    <span className="text-foreground/85 truncate">{name}</span>
                    <span className="shrink-0 font-mono font-bold text-primary-strong tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">Matière première directe.</p>
            )}
          </aside>
        </div>
      )}
    </article>
  );
};

export const CraftsSection = ({ crafts }: Props) => {
  const [search, setSearch] = useState('');
  const [metier, setMetier] = useState<string | null>(null);
  const [bucket, setBucket] = useState<string | null>(null);
  const [cascade, setCascade] = useState<boolean | null>(null);

  const metierCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of crafts) m[c.metier] = (m[c.metier] ?? 0) + 1;
    return m;
  }, [crafts]);
  const metiers = useMemo(() => Object.keys(metierCounts).sort(), [metierCounts]);

  const index = useMemo(() => {
    const m = new Map<string, Craft>();
    for (const c of crafts) m.set(norm(c.name), c);
    return m;
  }, [crafts]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return crafts
      .filter((c) => {
        if (metier && c.metier !== metier) return false;
        if (bucket) {
          const b = LEVEL_BUCKETS.find((x) => x.id === bucket);
          if (!b || c.requiredWorkLevel < b.min || c.requiredWorkLevel > b.max) return false;
        }
        if (!needle) return true;
        return c.name.toLowerCase().includes(needle) || c.requiredItems.some((i) => i.toLowerCase().includes(needle));
      })
      .sort((a, b) => a.requiredWorkLevel - b.requiredWorkLevel || a.name.localeCompare(b.name));
  }, [crafts, search, metier, bucket]);

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
          placeholder="Rechercher une recette ou un ingrédient..."
          resultCount={filtered.length}
          totalCount={crafts.length}
        >
          <FilterPills
            label="Métier"
            value={metier}
            onChange={setMetier}
            options={[{ value: null, label: 'Tous' }, ...metiers.map((m) => ({ value: m, label: cap(m), count: metierCounts[m] }))]}
          />
          <FilterPills
            label="Niveau"
            value={bucket}
            onChange={setBucket}
            options={[{ value: null, label: 'Tous' }, ...LEVEL_BUCKETS.map((b) => ({ value: b.id, label: b.label }))]}
          />
          <span className="ml-auto inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onCascade(true)}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border border-border-soft text-muted-foreground hover:text-foreground hover:border-border transition"
            >
              <Sparkles size={11} aria-hidden="true" />
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
          {filtered.map((c) => (
            <RecipeCard key={c.id} craft={c} index={index} />
          ))}
          {filtered.length === 0 && (
            <p role="status" aria-live="polite" className="text-center text-muted-foreground py-12">Aucune recette trouvée.</p>
          )}
        </div>
      </div>
    </ExpandAllContext.Provider>
  );
};
