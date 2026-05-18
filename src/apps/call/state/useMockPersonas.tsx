import * as React from 'react';

import { usePurposeStore } from '../../chat/components/persona-selector/store-purposes';

import { SystemPurposeData, SystemPurposeId } from '../../../data';
import { useSystemPersonaCatalog } from '~/modules/persona/useSystemPersonaCatalog';

/**
 * This is a 'mock' persona because Soon we'll have real personas definitions
 * and stores. Until then, we just mimic a reactive system here.
 */
export interface MockPersona extends SystemPurposeData {
  personaId: SystemPurposeId;
}

export function useMockPersonas(): { personas: MockPersona[]; personaIDs: SystemPurposeId[] } {
  // only react to hiddenPurposeIDs changes
  const hiddenPurposeIDs = usePurposeStore((state) => state.hiddenPurposeIDs);
  const systemPersonaCatalog = useSystemPersonaCatalog();

  return React.useMemo(() => {
    const personaIDs = Object.keys(systemPersonaCatalog) as SystemPurposeId[];
    const personas = personaIDs
      .filter((key) => !hiddenPurposeIDs.includes(key))
      .map((key) => ({
        ...systemPersonaCatalog[key],
        personaId: key as SystemPurposeId,
      }));
    return { personas, personaIDs };
  }, [hiddenPurposeIDs, systemPersonaCatalog]);
}
