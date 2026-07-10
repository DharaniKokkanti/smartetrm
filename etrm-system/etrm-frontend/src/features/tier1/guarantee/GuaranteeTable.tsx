import { Table, Tag, Button, Space, Popconfirm, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ParentCompanyGuarantee, PcgStatus } from './types';
import { useEntityResolver } from './useEntityResolver';
import { useDeactivateGuarantee } from './hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';

const STATUS_COLOR: Record<PcgStatus, string> = {
  DRAFT: 'default',
  ISSUED: 'success',
  AMENDED: 'processing',
  EXPIRED: 'default',
  CANCELLED: 'default',
  CALLED: 'error',
};

interface Props {
  guarantees: ParentCompanyGuarantee[];
  loading?: boolean;
  onEdit: (g: ParentCompanyGuarantee) => void;
  /** Highlight which entity this table is being viewed "from" (e.g. inside
   *  a specific counterparty's form) so its role in each row is obvious at
   *  a glance rather than requiring the reader to cross-reference. */
  highlightEntityId?: number;
}

export function GuaranteeTable({ guarantees, loading, onEdit, highlightEntityId }: Props) {
  const { resolve } = useEntityResolver();
  const deactivateMutation = useDeactivateGuarantee();
  const { data: currencies = [] } = useCurrencies();

  const columns: ColumnsType<ParentCompanyGuarantee> = [
    { title: 'Reference', dataIndex: 'pcgReference', width: 140 },
    {
      title: 'Direction',
      dataIndex: 'direction',
      width: 100,
      render: (v: string) => <Tag color={v === 'RECEIVED' ? 'blue' : 'purple'}>{v}</Tag>,
    },
    {
      title: 'Guarantor',
      key: 'guarantor',
      render: (_, r) => resolve(r.guarantorEntityType, r.guarantorEntityId),
    },
    {
      title: 'Principal',
      key: 'principal',
      render: (_, r) => {
        const name = resolve(r.principalEntityType, r.principalEntityId);
        return r.principalEntityId === highlightEntityId ? <strong>{name}</strong> : name;
      },
    },
    {
      title: 'Beneficiary',
      key: 'beneficiary',
      render: (_, r) => resolve(r.beneficiaryEntityType, r.beneficiaryEntityId),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 150,
      render: (_, r) => {
        const ccy = currencies.find((c) => c.currencyId === r.currencyId)?.currencyCode ?? '';
        return `${ccy} ${r.guaranteeAmount.toLocaleString()}`;
      },
    },
    {
      title: 'Status',
      dataIndex: 'pcgStatus',
      width: 100,
      render: (v: PcgStatus) => <Tag color={STATUS_COLOR[v]}>{v}</Tag>,
    },
    {
      title: 'Expiry',
      key: 'expiry',
      width: 110,
      render: (_, r) => (r.isEvergreen ? 'Evergreen' : (r.expiryDate ?? '—')),
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_, r) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(r)} />
          {r.isActive && (
            <Popconfirm
              title="Deactivate this guarantee?"
              onConfirm={() => deactivateMutation.mutate(r.pcgId)}
            >
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table<ParentCompanyGuarantee>
      size="small"
      rowKey="pcgId"
      dataSource={guarantees}
      columns={columns}
      loading={loading}
      pagination={guarantees.length > 10 ? { pageSize: 10 } : false}
      locale={{ emptyText: <Empty description="No guarantees" /> }}
    />
  );
}
