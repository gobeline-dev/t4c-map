import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface WikiToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
  children?: ReactNode;
}

export const WikiToolbar = ({ search, onSearchChange, placeholder, resultCount, totalCount, children }: WikiToolbarProps) => {
  const label = placeholder ?? 'Rechercher';
  return (
    <div className="glass-card rounded-lg p-3 md:p-4 flex flex-col gap-3 sticky top-16 z-30 backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={label}
            aria-label={label}
            className="w-full pl-10 pr-9 h-10 rounded-md bg-card border border-border-soft text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition"
              aria-label="Effacer la recherche"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        {resultCount !== undefined && (
          <span className="text-xs text-muted-foreground whitespace-nowrap" role="status" aria-live="polite">
            {resultCount}{totalCount !== undefined ? ` / ${totalCount}` : ''} résultat{resultCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
};

interface FilterPillsProps<T extends string | null> {
  label?: string;
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
}

export function FilterPills<T extends string | null>({ label, value, options, onChange }: FilterPillsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {label && <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">{label}</span>}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value ?? '__all__')}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border transition-colors ${
              active
                ? 'bg-primary text-primary-foreground border-primary/60'
                : 'bg-card/40 text-muted-foreground hover:text-foreground border-border-soft hover:border-border'
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-full ${active ? 'bg-primary-foreground/20' : 'bg-muted/60'}`}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
