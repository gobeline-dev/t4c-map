import { memo, useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  buildMarkersFromSelection,
  loadCategoryEntities,
  parseKey,
  CATEGORY_COLOR,
  CATEGORY_DOT,
  type MarkerCategory,
  type MarkerGroup,
  type NamedEntity,
} from '../utils/mapMarkers';
import { PX_PER_GX, PX_PER_GY } from '../config/maps';

const TOOLTIP_CAP = 8;

const MapMarker = memo(({ group }: { group: MarkerGroup }) => {
  const color = CATEGORY_COLOR[group.items[0].category];
  const extra = group.items.length - TOOLTIP_CAP;
  return (
    <div
      className="group/marker absolute z-30 pointer-events-auto cursor-help"
      style={{ left: group.x * PX_PER_GX, top: group.y * PX_PER_GY, transform: 'translate(-50%, -100%)' }}
    >
      <MapPin size={26} className={`${color} drop-shadow-[0_0_6px_rgba(0,0,0,0.9)]`} aria-hidden="true" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/marker:block z-50 min-w-max max-w-[240px] px-2.5 py-1.5 rounded-lg shadow-xl text-[11px] font-medium text-white" style={{ background: 'hsl(222 22% 8% / 0.96)', border: '1px solid hsl(0 0% 100% / 0.15)' }}>
        {group.items.slice(0, TOOLTIP_CAP).map((it, i) => (
          <div key={i} className="flex items-center gap-1.5 leading-snug">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${CATEGORY_DOT[it.category]}`} />
            {it.label}
          </div>
        ))}
        {extra > 0 && <div className="text-white/60 mt-0.5">+ {extra} autre{extra > 1 ? 's' : ''}…</div>}
      </div>
    </div>
  );
});

interface Props {
  worldId: number;
  selectedKeys: Set<string>;
}

export const MapMarkers = ({ worldId, selectedKeys }: Props) => {
  const [loaded, setLoaded] = useState<Partial<Record<MarkerCategory, NamedEntity[]>>>({});

  const neededCats = useMemo(() => {
    const s = new Set<MarkerCategory>();
    for (const key of selectedKeys) s.add(parseKey(key).category);
    return s;
  }, [selectedKeys]);

  // Load the entity modules for whatever categories are currently selected.
  useEffect(() => {
    let alive = true;
    const missing = Array.from(neededCats).filter((c) => !loaded[c]);
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
  }, [neededCats, loaded]);

  const groups = useMemo(
    () => buildMarkersFromSelection(selectedKeys, loaded, worldId),
    [selectedKeys, loaded, worldId],
  );

  return (
    <>
      {groups.map((g, i) => <MapMarker key={`${g.x},${g.y}-${i}`} group={g} />)}
    </>
  );
};
