import { CreatureSection } from './CreatureSection';
import type { Monster } from '../../../types/wiki';

interface Props {
  monsters: Monster[];
}

export const MonstersSection = ({ monsters }: Props) => (
  <CreatureSection
    creatures={monsters}
    placeholder="Rechercher un monstre ou un drop..."
    emptyMessage="Aucun monstre trouvé."
  />
);
