import { useState } from 'react';
import { ScrollText, Hammer, Skull, Store, MapPin, User } from 'lucide-react';
import type { ObtainSource } from '../../utils/wikiObtain';

const fmtNumber = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`
    : String(n);

const KIND_META: Record<ObtainSource['kind'], { label: string; icon: typeof ScrollText; tone: string }> = {
  quest: { label: 'Quête',    icon: ScrollText, tone: 'text-amber-300'    },
  craft: { label: 'Craft',    icon: Hammer,     tone: 'text-emerald-300'  },
  drop:  { label: 'Drop',     icon: Skull,      tone: 'text-rose-300'     },
  shop:  { label: 'Marchand', icon: Store,      tone: 'text-sky-300'      },
};

const SourceLine = ({ src }: { src: ObtainSource }) => {
  const meta = KIND_META[src.kind];
  const Icon = meta.icon;
  return (
    <li className="flex items-start gap-2 text-xs leading-snug">
      <Icon size={13} aria-hidden="true" className={`mt-0.5 shrink-0 ${meta.tone}`} />
      <span className="min-w-0 flex-1">
        {src.kind === 'quest' && (
          <>
            <span className="text-foreground/90">Récompense de </span>
            <span className="font-medium text-foreground">« {src.questTitle} »</span>
            {src.level !== undefined && <span className="text-muted-foreground"> · niv. {src.level}</span>}
            <span className="block text-muted-foreground mt-0.5">
              {src.location && (<><MapPin size={10} aria-hidden="true" className="inline mr-1" />{src.location}</>)}
              {src.location && src.pnj && src.pnj.length > 0 && <span className="mx-1.5">·</span>}
              {src.pnj && src.pnj.length > 0 && (<><User size={10} aria-hidden="true" className="inline mr-1" />{src.pnj.join(', ')}</>)}
            </span>
          </>
        )}
        {src.kind === 'craft' && (
          <>
            <span className="text-foreground/90">Craft </span>
            <span className="font-medium text-foreground">{src.metier}</span>
            <span className="text-muted-foreground"> · niv. métier {src.level}</span>
            <span className="block text-muted-foreground mt-0.5 truncate" title={src.ingredients.join(' + ')}>
              {src.ingredients.join(' + ')}
            </span>
          </>
        )}
        {src.kind === 'drop' && (
          <>
            <span className="text-foreground/90">Drop de </span>
            <span className="font-medium text-foreground">{src.monsterName}</span>
            <span className="text-muted-foreground"> · {fmtNumber(src.hp)} HP</span>
            {src.chance !== undefined && (
              <span className="ml-1.5 text-[10px] tabular-nums text-amber-300/90">{src.chance}%</span>
            )}
          </>
        )}
        {src.kind === 'shop' && (
          <>
            <span className="text-foreground/90">Vendu en boutique à </span>
            <span className="font-medium text-foreground">{src.location}</span>
          </>
        )}
      </span>
    </li>
  );
};

interface ObtainListProps {
  sources: ObtainSource[];
  emptyMessage?: string;
  title?: string;
}

const COLLAPSE_THRESHOLD = 4;

export const ObtainList = ({ sources, emptyMessage, title = "Comment l'obtenir" }: ObtainListProps) => {
  const [showAll, setShowAll] = useState(false);

  if (sources.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div className="border-t border-border-soft pt-2 mt-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{title}</div>
        <p className="text-[11px] text-muted-foreground/80 italic">{emptyMessage}</p>
      </div>
    );
  }

  const visible = showAll ? sources : sources.slice(0, COLLAPSE_THRESHOLD);
  const remaining = sources.length - COLLAPSE_THRESHOLD;

  return (
    <div className="border-t border-border-soft pt-2 mt-1">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="text-[10px] tabular-nums text-muted-foreground/70">{sources.length} source{sources.length > 1 ? 's' : ''}</div>
      </div>
      <ul className="space-y-1.5">
        {visible.map((s, i) => <SourceLine key={i} src={s} />)}
      </ul>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-1.5 text-[11px] text-primary-strong hover:underline"
        >
          {showAll ? 'Voir moins' : `+ ${remaining} autre${remaining > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  );
};
