import { useParams, useNavigate } from 'react-router-dom';
import { Scroll, Sparkles, Skull, Package, Hammer, Map as MapIcon } from 'lucide-react';
import { useWikiData } from '../hooks/useWikiData';
import { QuestsSection } from '../components/wiki/sections/QuestsSection';
import { SpellsSection } from '../components/wiki/sections/SpellsSection';
import { MonstersSection } from '../components/wiki/sections/MonstersSection';
import { ItemsSection } from '../components/wiki/sections/ItemsSection';
import { CraftsSection } from '../components/wiki/sections/CraftsSection';
import { MapsSection } from '../components/wiki/sections/MapsSection';
import type { WikiSectionId } from '../types/wiki';

const TABS: { id: WikiSectionId; label: string; icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>; color: string }[] = [
  { id: 'quests',   label: 'Quêtes',   icon: Scroll,    color: 'text-amber-400' },
  { id: 'spells',   label: 'Sorts',    icon: Sparkles,  color: 'text-sky-400' },
  { id: 'monsters', label: 'Monstres', icon: Skull,     color: 'text-rose-400' },
  { id: 'items',    label: 'Items',    icon: Package,   color: 'text-violet-400' },
  { id: 'crafts',   label: 'Crafts',   icon: Hammer,    color: 'text-emerald-400' },
  { id: 'cartes',   label: 'Cartes',   icon: MapIcon,   color: 'text-cyan-400' },
];

const Wiki = () => {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useWikiData();

  const current = (TABS.find((t) => t.id === section)?.id ?? 'quests') as WikiSectionId;

  return (
    <div className="space-y-6 pb-12">
      <header className="glass-card rounded-2xl p-6 md:p-10 relative overflow-hidden hero-gradient">
        <span aria-hidden="true" className="blob blob-primary  w-72 h-72 -top-20 -right-20 animate-blob-drift" />
        <span aria-hidden="true" className="blob blob-accent-2 w-64 h-64 -bottom-24 -left-24 animate-blob-drift-slow" />
        <span aria-hidden="true" className="blob blob-accent   w-40 h-40 top-1/2 left-1/3 opacity-40 animate-blob-drift" />
        <div className="relative space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">Wiki T4C</p>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] text-gradient">
              Encyclopédie complète
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Quêtes, sorts, monstres, items, crafts et cartes — un compagnon visuel et complet pour explorer Althéa.
            </p>
          </div>

          <nav aria-label="Sections du wiki" className="flex flex-wrap gap-1.5 bg-background-soft/60 backdrop-blur-md border border-border-soft rounded-xl p-1.5 shadow-inner">
            {TABS.map((t) => {
              const active = t.id === current;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate(`/wiki/${t.id}`)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex items-center gap-2 px-3 md:px-4 h-10 rounded-lg text-sm font-semibold transition ${
                    active
                      ? 'text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  style={active ? { background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent-2) / 0.85))' } : undefined}
                >
                  <Icon size={15} aria-hidden={true} className={active ? '' : t.color} />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {loading && (
        <div className="surface-card p-12 flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
          <div className="w-8 h-8 rounded-full animate-spin border-2 border-border border-t-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Chargement des données du wiki...</p>
        </div>
      )}

      {error && (
        <div className="surface-card p-6 border-rose-500/30 bg-rose-500/5" role="alert">
          <h3 className="text-sm font-semibold text-rose-300">Erreur de chargement</h3>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      )}

      {data && (
        <section>
          {current === 'quests'   && <QuestsSection   quests={data.quests} />}
          {current === 'spells'   && <SpellsSection   spells={data.spells} obtain={data.obtain} />}
          {current === 'monsters' && <MonstersSection classic={data.monstersClassic} extra={data.monstersExtra} />}
          {current === 'items'    && <ItemsSection    items={data.items} obtain={data.obtain} />}
          {current === 'crafts'   && <CraftsSection   crafts={data.crafts} />}
          {current === 'cartes'   && <MapsSection     maps={data.maps} />}
        </section>
      )}
    </div>
  );
};

export default Wiki;
