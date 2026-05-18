import * as React from 'react';

import { apiAsyncNode } from '~/common/util/trpc.client';

import { applySystemPersonaRows, getSystemPersonaCatalog, SystemPersonaCatalog } from './system-personas.catalog';

export function useSystemPersonaCatalog(): SystemPersonaCatalog {
  const [catalog, setCatalog] = React.useState<SystemPersonaCatalog>(() => getSystemPersonaCatalog());

  React.useEffect(() => {
    let cancelled = false;

    apiAsyncNode.admin.listActiveSystemPersonas
      .query()
      .then((rows) => {
        const nextCatalog = applySystemPersonaRows(rows);
        if (!cancelled) setCatalog(nextCatalog);
      })
      .catch(() => {
        if (!cancelled) setCatalog(getSystemPersonaCatalog());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return catalog;
}
