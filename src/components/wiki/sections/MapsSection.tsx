import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { WikiToolbar } from '../WikiToolbar';
import type { MapEntry, MapImage } from '../../../types/wiki';

interface Props { maps: MapEntry[]; }

// Map images are mirrored locally under public/images/maps/ at extract time.
// Only allow paths under /images/maps/ so that arbitrary upstream values can
// never inject another origin or path-traverse out of the assets folder.
const isSafeImagePath = (s: string | undefined): s is string =>
  !!s && /^\/images\/maps\/[\w.-]+\.(png|jpe?g|webp|svg)$/i.test(s) && !s.includes('..');

const safeUrl = (img: MapImage): string | null => {
  if (!isSafeImagePath(img.src)) return null;
  // Strip the leading slash and resolve against Vite's base URL.
  return `${import.meta.env.BASE_URL}${img.src.replace(/^\//, '')}`;
};

export const MapsSection = ({ maps }: Props) => {
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<{ entry: MapEntry; idx: number } | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return maps;
    return maps.filter((m) => m.name.toLowerCase().includes(needle) || m.images.some((i) => (i.legend ?? '').toLowerCase().includes(needle)));
  }, [maps, search]);

  // Modal lifecycle: scroll lock, focus management, Esc-to-close.
  useEffect(() => {
    if (!active) return;
    lastFocused.current = (document.activeElement as HTMLElement) ?? null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      lastFocused.current?.focus?.();
    };
  }, [active]);

  return (
    <div className="space-y-4">
      <WikiToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Rechercher une carte ou une zone..."
        resultCount={filtered.length}
        totalCount={maps.length}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((m) => (
          <section key={m.id} className="surface-card p-4 flex flex-col gap-3">
            <header className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">{m.name}</h3>
              <span className="text-xs text-muted-foreground">{m.images.length} carte{m.images.length > 1 ? 's' : ''}</span>
            </header>
            <div className={`grid gap-2 ${m.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {m.images.map((img, i) => {
                const url = safeUrl(img);
                if (!url) return null;
                const alt = img.legend ?? (m.images.length > 1 ? `${m.name} — vue ${i + 1}` : m.name);
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setActive({ entry: m, idx: i })}
                    className="group relative overflow-hidden rounded-md border border-border-soft hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition aspect-video bg-muted/40"
                    aria-label={`Agrandir : ${alt}`}
                  >
                    <img
                      src={url}
                      alt={alt}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {img.legend && (
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white px-2 py-1 text-left line-clamp-2">
                        {img.legend.split('|')[0].trim()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {filtered.length === 0 && (
          <p role="status" aria-live="polite" className="col-span-full text-center text-muted-foreground py-12">Aucune carte trouvée.</p>
        )}
      </div>

      {active && (() => {
        const url = safeUrl(active.entry.images[active.idx]);
        if (!url) return null;
        const titleId = `lightbox-title-${active.entry.id}-${active.idx}`;
        const legend = active.entry.images[active.idx].legend;
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
            onClick={() => setActive(null)}
          >
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setActive(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-card/80 hover:bg-card text-foreground border border-border-soft focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              aria-label="Fermer la carte agrandie"
            >
              <X size={20} aria-hidden="true" />
            </button>
            <div className="max-w-6xl max-h-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <img
                src={url}
                alt={legend ?? active.entry.name}
                className="max-w-full max-h-[calc(100vh-8rem)] object-contain rounded-md shadow-2xl"
              />
              <div className="text-center">
                <h4 id={titleId} className="text-lg font-semibold text-foreground">{active.entry.name}</h4>
                {legend && (
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl whitespace-pre-line">
                    {legend.replaceAll('|', '\n')}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
