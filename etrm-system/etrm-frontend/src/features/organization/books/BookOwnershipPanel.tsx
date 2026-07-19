import { useMemo } from 'react';
import { OwnershipPanel } from '@components/smart/OwnershipPanel';
import { useOwnershipForBook, useAddBookOwnership, useRemoveBookOwnership } from './hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useCounterparties } from '@features/tier1/counterparty/hooks';
import type { BookOwnership } from './types';

interface Props {
  bookId: number | null;
}

export function BookOwnershipPanel({ bookId }: Props) {
  const { data, isLoading } = useOwnershipForBook(bookId);
  const { data: entities = [] } = useLegalEntities();
  const { data: counterparties = [] } = useCounterparties();
  const addOwnership = useAddBookOwnership(bookId);
  const removeOwnership = useRemoveBookOwnership(bookId);

  const legalEntityOptions = useMemo(
    () => entities.map((e) => ({ label: `${e.entityCode} — ${e.entityName}`, value: e.legalEntityId })),
    [entities],
  );
  const counterpartyOptions = useMemo(
    () => counterparties.map((c) => ({ label: c.legalName, value: c.counterpartyId })),
    [counterparties],
  );

  return (
    <OwnershipPanel<BookOwnership>
      parentId={bookId}
      emptyBeforeSaveMessage="Save this book first, then add ownership."
      rows={data?.rows}
      totalActiveOwnershipPct={data?.totalActiveOwnershipPct}
      isLoading={isLoading}
      rowKey={(r) => r.bookOwnershipId}
      onAdd={(input) => addOwnership.mutateAsync(input)}
      addPending={addOwnership.isPending}
      onRemove={(r) => removeOwnership.mutate(r.bookOwnershipId)}
      removePending={removeOwnership.isPending}
      legalEntityOptions={legalEntityOptions}
      counterpartyOptions={counterpartyOptions}
    />
  );
}
