import { useState } from 'react';
import { Button, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { GuaranteeTable } from './GuaranteeTable';
import { GuaranteeFormDrawer, type PcgPrefill } from './GuaranteeFormDrawer';
import { useGuaranteesForEntity } from './hooks';
import type { ParentCompanyGuarantee } from './types';
import type { PolymorphicEntityType } from '@features/tier1/counterparty/types';
import { useDraftState } from '@components/smart/formDraft';

interface Props {
  entityType: PolymorphicEntityType;
  entityId: number | null;
  /** Which role this entity most commonly plays when adding a NEW guarantee
   *  from its own form — e.g. a counterparty's own form defaults to "this
   *  counterparty is the principal" (RECEIVED direction), since that's the
   *  far more common case than the counterparty acting as guarantor for
   *  someone else. Always editable afterward in the drawer regardless. */
  defaultRole: 'guarantor' | 'principal' | 'beneficiary';
}

export function EntityGuaranteesPanel({ entityType, entityId, defaultRole }: Props) {
  const { data: guarantees, isLoading } = useGuaranteesForEntity(entityType, entityId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ParentCompanyGuarantee | null>(null);
  useDraftState('guarantee', { open: drawerOpen, setOpen: setDrawerOpen, editing, setEditing });

  if (entityId === null) {
    return <Empty description="Save this record first, then add guarantees against it." />;
  }

  const prefill: PcgPrefill = { role: defaultRole, entityType, entityId };

  function openAdd() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(g: ParentCompanyGuarantee) {
    setEditing(g);
    setDrawerOpen(true);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button icon={<PlusOutlined />} onClick={openAdd}>
          Add Guarantee
        </Button>
      </div>
      <GuaranteeTable
        guarantees={(guarantees ?? []).filter((g) => g.isActive)}
        loading={isLoading}
        onEdit={openEdit}
        highlightEntityId={entityId}
      />
      <GuaranteeFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        editing={editing}
        prefill={editing ? undefined : prefill}
      />
    </div>
  );
}
