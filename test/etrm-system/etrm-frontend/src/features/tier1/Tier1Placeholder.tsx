import { Empty } from 'antd';
import { PageHeader } from '@components/layout/PageHeader';

export function Tier1Placeholder() {
  return (
    <>
      <PageHeader
        title="Core Entities"
        description="Legal entity, counterparty, trader, book, product, and similar — custom screens, one per entity."
        moduleGroup="trade"
      />
      <Empty description="No entity screens built yet — this is scaffold only." />
    </>
  );
}
