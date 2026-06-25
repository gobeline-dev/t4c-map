import { useEffect, useMemo, useState } from 'react';
import { Search, X, Loader2, Trash2, MapPin, ChevronDown } from 'lucide-react';
import {
  listWorldEntities,
  loadCategoryEntities,
  norm,
  parseKey,
  MARKER_CATEGORIES,
  CATEGORY_COLOR,
  CATEGORY_DOT,
  type MarkerCategory,
  type EntityListItem,
  type NamedEntity,
} from '../utils/mapMarkers';

// Cap the rendered list (per category) so a 4000+ item category never floods
// the DOM; the search box is the way to narrow down to what you want.
const RESULT_CAP = 60;

interface Props {
  worldId: number;
  selectedKeys: Set<string>;
  onToggleKey: (key: string) => void;
  onFocus: (gx: number, gy: number) => void;
  onClear: () => void;
  onClose: () => void;
}

type OpenState = Record<MarkerCategory, boolean>;

export const MapMarkerPanel = ({ worldId, selectedKeys, onToggleKey, onFocus, onClear, onClose }: Props) => {
  const [search, setSearch] = useState('');
  // Toutes les catégories dépliées par défaut, repliables individuellement.
  const [open, setOpen] = useState<OpenState>({ Monstres: true, PNJ: true, Items: true });
  const [loaded, setLoaded] = useState<Partial<Record<MarkerCategory, NamedEntity[]>>>({});

  // Charge le module de chaque catégorie dépliée qui ne l'est pas encore.
  // Une catégorie repliée n'est jamais fetchée tant qu'on ne la déplie pas.
  useEffect(() => {
    let alive = true;
    const missing = MARKER_CATEGORIES.filter((c) => open[c] && !loaded[c]);
    if (missing.length === 0) return;
    Promise.all(missing.map(async (c) => [c, await loadCategoryEntities(c)] as const)).then((pairs) => {
      if (!alive) return;
      setLoaded((prev) => {
        const next = { ...prev };
        for (const [c, arr] of pairs) next[c] = arr;
        return next;
      });
    });
    return () => { alive = false; };
  }, [open, loaded]);

  // Liste filtrée par catégorie (recherche globale, insensible aux accents).
  const lists = useMemo(() => {
    const n = norm(search);
    const out = {} as Record<MarkerCategory, EntityListItem[]>;
    for (const cat of MARKER_CATEGORIES) {
      const ents = loaded[cat];
      if (!ents) { out[cat] = []; continue; }
      let arr = listWorldEntities(ents, cat, worldId);
      if (n) arr = arr.filter((e) => norm(e.name).includes(n));
      out[cat] = arr;
    }
    return out;
  }, [loaded, worldId, search]);

  // Nombre de marqueurs sélectionnés par catégorie (pour les badges des sections).
  const selByCat = useMemo(() => {
    const m: Record<MarkerCategory, number> = { Monstres: 0, PNJ: 0, Items: 0 };
    for (const key of selectedKeys) {
      const { category } = parseKey(key);
      if (category in m) m[category]++;
    }
    return m;
  }, [selectedKeys]);

  const toggleSection = (cat: MarkerCategory) => setOpen((p) => ({ ...p, [cat]: !p[cat] }));

  return (
    <div className="absolute top-3 left-3 z-40 w-80 max-w-[calc(100%-1.5rem)] rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.45)', boxShadow: '0 10px 40px -8px hsl(var(--primary) / 0.35), 0 4px 16px hsl(0 0% 0% / 0.4)', maxHeight: 'min(80%, 560px)' }}>
      {/* En-tête bien visible, teinté par la couleur primaire. */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b" style={{ borderColor: 'hsl(var(--primary) / 0.3)', background: 'hsl(var(--primary) / 0.12)' }}>
        <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
          <MapPin size={16} className="text-primary-strong" />
          Marqueurs
        </span>
        <div className="flex items-center gap-1">
          {selectedKeys.size > 0 && (
            <button onClick={onClear} className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[11px] font-semibold transition-colors" style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--foreground))' }} title="Tout désélectionner">
              <Trash2 size={13} /> {selectedKeys.size}
            </button>
          )}
          <button onClick={onClose} className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground transition-colors" aria-label="Fermer le panneau marqueurs">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Recherche globale sur les trois catégories. */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un monstre, PNJ, item…"
            className="w-full h-9 pl-8 pr-2 rounded-md text-sm bg-background-soft/60 border outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
            style={{ borderColor: 'hsl(var(--border) / 0.6)' }}
          />
        </div>
      </div>

      {/* Sections par catégorie, chacune repliable. */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {MARKER_CATEGORIES.map((cat) => {
          const isOpen = open[cat];
          const items = lists[cat];
          const sectionLoading = isOpen && !loaded[cat];
          const shown = items.slice(0, RESULT_CAP);
          const sel = selByCat[cat];
          return (
            <div key={cat} className="border-b last:border-b-0" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
              <button
                onClick={() => toggleSection(cat)}
                className="w-full flex items-center gap-2 px-3 py-2 transition-colors hover:bg-muted/30"
                style={{ background: 'hsl(var(--muted) / 0.25)' }}
                aria-expanded={isOpen}
              >
                <ChevronDown size={15} className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[cat]}`} />
                <span className={`text-sm font-bold ${CATEGORY_COLOR[cat]}`}>{cat}</span>
                {sel > 0 && (
                  <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>{sel}</span>
                )}
                <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                  {sectionLoading ? '' : items.length}
                </span>
              </button>

              {isOpen && (
                <div className="px-2 pb-2">
                  {sectionLoading ? (
                    <div className="flex items-center justify-center gap-2 py-5 text-muted-foreground text-xs">
                      <Loader2 size={15} className="animate-spin" /> Chargement…
                    </div>
                  ) : items.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      {search ? 'Aucun résultat.' : 'Aucune entrée sur cette carte.'}
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
                      {items.length > RESULT_CAP && (
                        <p className="text-center text-[11px] text-muted-foreground py-1.5">
                          {items.length} résultats — affinez la recherche.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
