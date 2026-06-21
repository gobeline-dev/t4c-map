import { CreatureSection } from './CreatureSection';
import type { Npc } from '../../../types/wiki';

interface Props {
  npcs: Npc[];
}

export const NpcsSection = ({ npcs }: Props) => (
  <CreatureSection
    creatures={npcs}
    placeholder="Rechercher un PNJ ou un drop..."
    emptyMessage="Aucun PNJ trouvé."
  />
);
