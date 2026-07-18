import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tag, Spin, Button, Table, Modal, Form, Select, DatePicker, Input, Space, Typography } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { useTableRows } from '@features/tier2/hooks';
import { useCharterParty, useCharterOffHireEvents, useSaveCharterOffHireEvent } from './hooks';
import type { CharterOffHireEventInput } from './types';
import { useVoyages } from '../voyages/hooks';

const { Text } = Typography;

export function CharterPartyWorkspace() {
  const { id } = useParams();
  const charterPartyId = Number(id);
  const navigate = useNavigate();
  const { data: cp, isLoading } = useCharterParty(charterPartyId);

  if (isLoading || !cp) {
    return <Spin style={{ margin: 40 }} />;
  }

  return (
    <div>
      <PageHeader
        title={`Charter Party ${cp.cpReference}`}
        description={`${cp.vesselName ?? 'Vessel'} — ${cp.counterpartyName ?? ''} — ${cp.direction.replace('_', ' ')} — ${cp.status.replace(/_/g, ' ')}`}
        moduleGroup="Freight & Shipping"
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/voyage-ops/charter-parties')}>Back to Charter Parties</Button>}
      />
      <Space size="large" style={{ marginBottom: 16 }}>
        <Text type="secondary">Hire: {cp.hireRate ?? '—'} {cp.hireCurrencyCode ?? ''}</Text>
        <Text type="secondary">Demurrage/Day: {cp.demurrageRatePerDay ?? '—'}</Text>
        <Text type="secondary">Laytime Term: {cp.laytimeTermCode ?? '—'}</Text>
        <Tag>{cp.charterPartyTypeCode ?? 'N/A'}</Tag>
      </Space>
      <Tabs
        items={[
          { key: 'offhire', label: 'Off-Hire Events', children: <OffHireEventsTab charterPartyId={charterPartyId} /> },
          { key: 'voyages', label: 'Linked Voyages', children: <LinkedVoyagesTab charterPartyId={charterPartyId} /> },
        ]}
      />
    </div>
  );
}

function OffHireEventsTab({ charterPartyId }: { charterPartyId: number }) {
  const { data = [], isLoading } = useCharterOffHireEvents(charterPartyId);
  const save = useSaveCharterOffHireEvent();
  const { data: reasonTypes = [] } = useTableRows<{ offHireReasonTypeId: number; reasonCode: string }>('off_hire_reason_type');
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<CharterOffHireEventInput>();

  async function submit() {
    const v = await form.validateFields();
    const input: CharterOffHireEventInput = {
      ...v,
      charterPartyId,
      fromTs: dayjs(v.fromTs as unknown as dayjs.Dayjs).toISOString(),
      toTs: v.toTs ? dayjs(v.toTs as unknown as dayjs.Dayjs).toISOString() : null,
    };
    await save.mutateAsync({ id: null, input });
    setOpen(false);
    form.resetFields();
  }

  return (
    <div>
      <Button icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Log Off-Hire Event</Button>
      <Table
        rowKey="offHireEventId"
        loading={isLoading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: 'Reason', dataIndex: 'reasonCode', render: (v) => v ?? '—' },
          { title: 'From', dataIndex: 'fromTs', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
          { title: 'To', dataIndex: 'toTs', render: (v: string | null) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '(ongoing)' },
          { title: 'Hours', dataIndex: 'hours', render: (v) => v ?? '—' },
          { title: 'Notes', dataIndex: 'notes', render: (v) => v ?? '—' },
        ]}
      />
      <Modal title="Log Off-Hire Event" open={open} onCancel={() => setOpen(false)} onOk={() => void submit()} confirmLoading={save.isPending}>
        <Form form={form} layout="vertical">
          <Form.Item name="offHireReasonTypeId" label="Reason" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={reasonTypes.map((r) => ({ value: r.offHireReasonTypeId, label: r.reasonCode }))} />
          </Form.Item>
          <Form.Item name="fromTs" label="From" rules={[{ required: true }]}><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="toTs" label="To (leave blank if ongoing)"><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function LinkedVoyagesTab({ charterPartyId }: { charterPartyId: number }) {
  const { data = [], isLoading } = useVoyages({ charterPartyId });
  const navigate = useNavigate();
  return (
    <Table
      rowKey="voyageId"
      loading={isLoading}
      dataSource={data}
      pagination={false}
      onRow={(r) => ({ onClick: () => navigate(`/voyage-ops/voyages/${r.voyageId}`), style: { cursor: 'pointer' } })}
      columns={[
        { title: 'Voyage #', dataIndex: 'voyageNumber' },
        { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{v.replace(/_/g, ' ')}</Tag> },
        { title: 'Laycan Start', dataIndex: 'laycanStart', render: (v) => v ?? '—' },
        { title: 'Load Port', dataIndex: 'loadLocationName', render: (v) => v ?? '—' },
        { title: 'Discharge Port', dataIndex: 'dischargeLocationName', render: (v) => v ?? '—' },
      ]}
    />
  );
}
