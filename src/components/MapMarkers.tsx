import { memo, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import type { WikiData } from '../types/wiki';
import {
  buildWorldMarkers,
  CATEGORY_COLOR,
  CATEGORY_DOT,
  type MarkerCategory,
  type MarkerGroup,
} from '../utils/mapMarkers';

const TOOLTIP_CAP = 8;

const MapMarker = memo(({ group }: { group: MarkerGroup }) => {
  const color = CATEGORY_COLOR[group.items[0].category];
  const extra = group.items.length - TOOLTIP_CAP;
  return (
    <div
      className="group/marker absolute z-30 pointer-events-auto cursor-help"
      style={{ left: group.x * 2, top: group.y, transform: 'translate(-50%, -100%)' }}
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
  data: WikiData;
  worldId: number;
  active: Set<MarkerCategory>;
}

export const MapMarkers = ({ data, worldId, active }: Props) => {
  const groups = useMemo(() => buildWorldMarkers(data, worldId, active), [data, worldId, active]);
  return (
    <>
      {groups.map((g, i) => <MapMarker key={`${g.x},${g.y}-${i}`} group={g} />)}
    </>
  );
};
