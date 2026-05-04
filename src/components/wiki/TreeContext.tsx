import { createContext, useContext } from 'react';

/**
 * Drives the "Tout déplier / Tout replier" cascade across nested tree nodes.
 * `null` = no cascade in effect, every node owns its open state.
 * `true`/`false` = cascade override; nodes sync their state to this on change.
 */
export const ExpandAllContext = createContext<boolean | null>(null);

export const useExpandAll = () => useContext(ExpandAllContext);
