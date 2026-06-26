import { useMemo } from 'react';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useCounterparties } from '@features/tier1/counterparty/hooks';
import type { PolymorphicEntityType } from '@features/tier1/counterparty/types';

export function useEntityResolver() {
  const { data: legalEntities } = useLegalEntities();
  const { data: counterparties } = useCounterparties();

  return useMemo(() => {
    const resolve = (type: PolymorphicEntityType, id: number): string => {
      if (type === 'LEGAL_ENTITY') {
        const e = legalEntities?.find((le) => le.legalEntityId === id);
        return e ? `${e.entityCode} — ${e.entityName}` : `Legal Entity #${id}`;
      }
      const c = counterparties?.find((cp) => cp.counterpartyId === id);
      return c ? `${c.cpCode} — ${c.legalName}` : `Counterparty #${id}`;
    };
    return { resolve };
  }, [legalEntities, counterparties]);
}
