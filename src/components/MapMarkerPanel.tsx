import { useEffect, useMemo, useState } from 'react';
import { Search, X, Loader2, Trash2 } from 'lucide-react';
import {
  listWorldEntities,
  loadCategoryEntities,
  norm,
  MARKER_CATEGORIES,
  CATEGORY_COLOR,
  CATEGORY_DOT,
  type MarkerCategory,
  type EntityListItem,
  type NamedEntity,
} from '../utils/mapMarkers';

// Cap the rendered list so a 4000+ item category never floods the DOM; the
// search box is the way to narrow down to what you want.
const RESULT_CAP = 60;

interface Props {
  worldId: number;
  selectedKeys: Set<string>;
  onToggleKey: (key: string) => void;
  onFocus: (gx: number, gy: number) => void;
  onClear: () => void;
  onClose: () => void;
}

export const MapMarkerPanel = ({ worldId, selectedKeys, onToggleKey, onFocus, onClear, onClose }: Props) => {
  const [category, setCategory] = useState<MarkerCategory>('Monstres');
  const [entities, setEntities] = useState<NamedEntity[]>([]);
  const [loadedFor, setLoadedFor] = useState<MarkerCategory | null>(null);
  const [search, setSearch] = useState('');

  // Lazy-load the active category's module (only this one is fetched). Both
  // setState calls run inside the async callback, never synchronously.
  useEffect(() => {
    let alive = true;
    loadCategoryEntities(category).then((e) => {
      if (!alive) return;
      setEntities(e);
      setLoadedFor(category);
    });
    return () => { alive = false; };
  }, [category]);

  const loading = loadedFor !== category;

  const all = useMemo<EntityListItem[]>(
    () => (loadedFor === category ? listWorldEntities(entities, category, worldId) : []),
    [entities, category, worldId, loadedFor],
  );

  const filtered = useMemo(() => {
    const n = norm(search);
    return n ? all.filter((e) => norm(e.name).includes(n)) : all;
  }, [all, search]);

  const shown = filtered.slice(0, RESULT_CAP);

  return (
    <div className="absolute top-3 left-3 z-40 w-72 max-w-[calc(100%-1.5rem)] rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.7)', maxHeight: 'min(70%, 460px)' }}>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
        <span className="text-sm font-semibold text-foreground">Marqueurs</span>
        <div className="flex items-center gap-1">
          {selectedKeys.size > 0 && (
            <button onClick={onClear} className="inline-flex items-center gap-1 px-1.5 h-7 rounded-md text-[11px] text-muted-foreground hover:text-foreground transition-colors" title="Tout désélectionner">
              <Trash2 size={13} /> {selectedKeys.size}
            </button>
          )}
          <button onClick={onClose} className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground transition-colors" aria-label="Fermer le panneau marqueurs">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 px-3 pt-2.5">
        {MARKER_CATEGORIES.map((cat) => {
          const active = cat === category;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors"
              style={active
                ? { background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.4)', color: 'hsl(var(--foreground))' }
                : { background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.5)', color: 'hsl(var(--muted-foreground))' }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[cat]}`} />
              {cat}
            </button>
          );
        })}
      </div>

      <div className="px-3 py-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Rechercher un ${category === 'Items' ? 'item' : category === 'PNJ' ? 'PNJ' : 'monstre'}...`}
            className="w-full h-9 pl-8 pr-2 rounded-md text-sm bg-background-soft/60 border outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
            style={{ borderColor: 'hsl(var(--border) / 0.6)' }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-xs">
            <Loader2 size={16} className="animate-spin" /> Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            {all.length === 0 ? 'Aucune entrée localisée sur cette carte.' : 'Aucun résultat.'}
          </p>
        ) : (
          <>
            <ul className="space-y-0.5">
              {shown.map((item) => {
                const checked = selectedKeys.has(item.key);
                return (
                  <li key={item.key}>
                    <label className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          onToggleKey(item.key);
                          if (!checked) onFocus(item.first.x, item.first.y); // center camera on the marker just placed
                        }}
                        className="shrink-0 accent-current"
                        style={{ color: 'hsl(var(--primary))' }}
                      />
                      <span className="flex-1 min-w-0 truncate text-sm text-foreground">{item.name}</span>
                      <span className={`shrink-0 text-[10px] tabular-nums px-1.5 py-0.5 rounded-full ${CATEGORY_COLOR[item.category]}`} style={{ background: 'hsl(var(--muted) / 0.5)' }}>{item.count}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {filtered.length > RESULT_CAP && (
              <p className="text-center text-[11px] text-muted-foreground py-2">
                {filtered.length} résultats — affinez la recherche pour en voir plus.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
