import { useState } from 'react';
import { Select, Table, Tag, Space } from 'antd';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { useVessels } from '@features/logistics/vessels/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useBunkerRobLedger } from './hooks';
import type { RobEventType } from './types';

const EVENT_COLOR: Record<RobEventType, string> = { STEM: 'green', CONSUMPTION: 'orange', TRANSFER: 'blue' };

export function BunkerRobLedgerPage() {
  const [vesselId, setVesselId] = useState<number | undefined>();
  const [fuelGradeId, setFuelGradeId] = useState<number | undefined>();
  const { data: vessels = [] } = useVessels();
  const { data: fuelGrades = [] } = useTableRows<{ fuelGradeId: number; gradeCode: string }>('bunker_fuel_grade');
  const { data = [], isLoading } = useBunkerRobLedger({ vesselId, fuelGradeId });

  return (
    <div>
      <PageHeader
        title="Bunker ROB Ledger"
        description="Event-sourced, append-only remaining-on-board ledger — every stem, consumption, and transfer is an immutable entry. Tracked per vessel across all voyages, never edited or deleted."
        moduleGroup="Freight & Shipping"
      />
      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear placeholder="Filter by vessel" style={{ width: 220 }} showSearch optionFilterProp="label"
          value={vesselId} onChange={setVesselId}
          options={vessels.map((v) => ({ value: v.vesselId, label: v.vesselName }))}
        />
        <Select
          allowClear placeholder="Filter by fuel grade" style={{ width: 200 }} showSearch optionFilterProp="label"
          value={fuelGradeId} onChange={setFuelGradeId}
          options={fuelGrades.map((f) => ({ value: f.fuelGradeId, label: f.gradeCode }))}
        />
      </Space>
      <Table
        rowKey="robLedgerId"
        loading={isLoading}
        dataSource={data}
        pagination={{ pageSize: 50 }}
        columns={[
          { title: 'Vessel', dataIndex: 'vesselName', render: (v) => v ?? '—' },
          { title: 'Fuel Grade', dataIndex: 'fuelGradeCode', render: (v) => v ?? '—' },
          { title: 'Event', dataIndex: 'eventType', render: (v: RobEventType) => <Tag color={EVENT_COLOR[v]}>{v}</Tag> },
          { title: 'Time', dataIndex: 'eventTime', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
          { title: 'Qty Change (MT)', dataIndex: 'quantityChangeMt', render: (v: number) => (v > 0 ? '+' : '') + Number(v).toLocaleString() },
          { title: 'ROB After (MT)', dataIndex: 'robAfterMt', render: (v: number) => Number(v).toLocaleString() },
          { title: 'Leg', dataIndex: 'voyageLeg', render: (v) => v ?? '—' },
          { title: 'Engine', dataIndex: 'engineType', render: (v) => v ?? '—' },
          { title: 'Notes', dataIndex: 'notes', render: (v) => v ?? '—' },
        ]}
      />
    </div>
  );
}
