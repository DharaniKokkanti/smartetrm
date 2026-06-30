import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, Typography, Alert } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useBrokers, useSaveBroker, useDeactivateBroker } from './hooks';
import { BROKER_TYPES, BROKER_TYPE_META, type Broker, type BrokerInput, type BrokerType } from './types';

const { Text } = Typography;

function BrokerTypeOption({ type }: { type: BrokerType }) {
  const m = BROKER_TYPE_META[type];
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</div>
      <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5, marginTop: 2 }}>{m.summary}</div>
    </div>
  );
}

export function BrokersPage() {
  const { data, isLoading, refetch } = useBrokers();
  const save = useSaveBroker();
  const deactivate = useDeactivateBroker();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Broker | null>(null);
  const [selectedType, setSelectedType] = useState<BrokerType>('VOICE');
  const [form] = Form.useForm<BrokerInput>();

  function openNew() {
    setEditing(null);
    setSelectedType('VOICE');
    form.resetFields();
    form.setFieldsValue({ brokerType: 'VOICE', isActive: true });
    setOpen(true);
  }
  function openEdit(b: Broker) {
    setEditing(b);
    setSelectedType(b.brokerType);
    form.setFieldsValue({
      brokerCode: b.brokerCode,
      brokerName: b.brokerName,
      brokerType: b.brokerType,
      description: b.description ?? undefined,
      contactName: b.contactName ?? undefined,
      contactEmail: b.contactEmail ?? undefined,
      contactPhone: b.contactPhone ?? undefined,
      website: b.website ?? undefined,
      countryCode: b.countryCode ?? undefined,
      isActive: b.isActive,
    });
    setOpen(true);
  }
  async function submit() {
    const v = await form.validateFields();
    await save.mutateAsync({ id: editing?.brokerId ?? null, input: v });
    setOpen(false);
  }

  const colDefs = useMemo<ColDef<Broker>[]>(() => [
    {
      field: 'brokerCode', headerName: 'Code', width: 120, pinned: 'left', cellClass: 'cell-mono',
      cellRenderer: (p: { value: string }) => (
        <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.value}</Tag>
      ),
    },
    { field: 'brokerName', headerName: 'Broker Name', flex: 1.5, minWidth: 200 },
    {
      field: 'brokerType', headerName: 'Type', width: 80,
      tooltipValueGetter: (p) => BROKER_TYPE_META[p.data?.brokerType as BrokerType]?.summary,
      cellRenderer: (p: { value: BrokerType }) => {
        const m = BROKER_TYPE_META[p.value];
        return m ? <Tag color={m.color}>{p.value}</Tag> : null;
      },
    },
    {
      field: 'description', headerName: 'Description', flex: 2, minWidth: 200,
      valueFormatter: (p) => p.value ?? '—',
      cellStyle: { fontSize: 12, color: '#6b7280' },
    },
    { field: 'countryCode', headerName: 'Country', width: 90, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'contactName',  headerName: 'Contact',  flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    { field: 'contactEmail', headerName: 'Email',    flex: 1.2, minWidth: 180, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Status', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Broker }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm
              title="Deactivate this broker?"
              description="Active trades referencing this broker retain the link, but it cannot be selected on new trades."
              onConfirm={() => deactivate.mutate(p.data.brokerId)}
              okText="Deactivate" okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader
        title="Brokers"
        description="Inter-dealer brokers (IDBs) — voice, electronic, and hybrid OTC matching platforms. These are fee-earning intermediaries, not trading counterparties. FCM clearing brokers and prime brokers are managed as Counterparties."
        moduleGroup="organization"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Broker"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.brokerId)}
      />

      <Drawer
        title={editing ? `Edit Broker — ${editing.brokerCode}` : 'New Broker'}
        open={open}
        onClose={() => setOpen(false)}
        width={520}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={submit} loading={save.isPending}>Save</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onValuesChange={(changed) => {
          if (changed.brokerType) setSelectedType(changed.brokerType as BrokerType);
        }}>

          <Form.Item
            name="brokerType"
            label={hint('Broker Channel', 'How this IDB executes the match — voice phone desk, electronic platform (SEF/Trayport), or hybrid. FCM and prime brokers are not managed here; create them as Counterparties instead.')}
            rules={[{ required: true }]}
          >
            <Select
              optionLabelProp="label"
              options={BROKER_TYPES.map((t) => ({
                value: t,
                label: <Tag color={BROKER_TYPE_META[t].color} style={{ margin: 0 }}>{t}</Tag>,
                children: <BrokerTypeOption type={t} />,
              }))}
              optionRender={(opt) => <BrokerTypeOption type={opt.value as BrokerType} />}
            />
          </Form.Item>

          {/* Contextual explanation of the selected type */}
          {selectedType && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 20, fontSize: 12 }}
              message={<Text strong style={{ fontSize: 12 }}>{BROKER_TYPE_META[selectedType].label}</Text>}
              description={<Text style={{ fontSize: 11 }}>{BROKER_TYPE_META[selectedType].summary}</Text>}
            />
          )}

          <Form.Item
            name="brokerCode"
            label={hint('Broker Code', 'Unique short identifier used on trade tickets, confirmations, and fee reports. Once used on a live trade it cannot be changed.', 'ICAP', 'UP TO 30 CHARS')}
            rules={[{ required: true, message: 'Broker code is required' }]}
          >
            <Input placeholder="ICAP" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item
            name="brokerName"
            label={hint('Full Legal Name', 'Full legal or trading name as it appears on fee invoices and regulatory filings.', 'ICAP Energy Ltd')}
            rules={[{ required: true, message: 'Broker name is required' }]}
          >
            <Input placeholder="ICAP Energy Ltd" />
          </Form.Item>

          <Form.Item
            name="description"
            label={hint('Description', 'Internal note — primary markets covered, regulatory authorisation (FCA/CFTC), account manager, or any special terms agreed with this broker.', 'Primary OTC crude and products voice broker. FCA authorised. OBA in place. Rate: $0.02/BBL standard.')}
          >
            <Input.TextArea rows={3} placeholder="Markets covered, regulatory status, agreed fee rates, any special terms..." />
          </Form.Item>

          <Form.Item
            name="countryCode"
            label={hint('Country Code', 'ISO 3166-1 alpha-2 country of the broker\'s primary regulatory domicile — affects KYC jurisdiction and reporting obligations.', 'GB')}
          >
            <Input placeholder="GB" maxLength={2} style={{ fontFamily: 'monospace', textTransform: 'uppercase', width: 80 }} />
          </Form.Item>

          <Form.Item
            name="contactName"
            label={hint('Primary Contact', 'Relationship manager or desk head — used for fee queries and operational escalation.')}
          >
            <Input placeholder="David Clarke" />
          </Form.Item>

          <Form.Item
            name="contactEmail"
            label={hint('Contact Email', 'Primary desk email for trade confirmations and fee invoices.')}
            rules={[{ type: 'email', message: 'Enter a valid email' }]}
          >
            <Input placeholder="trading@icap.com" />
          </Form.Item>

          <Form.Item
            name="contactPhone"
            label={hint('Contact Phone', 'Direct line for the broker desk — include country dialling code.', '+44 20 7000 0000')}
          >
            <Input placeholder="+44 20 7000 0000" />
          </Form.Item>

          <Form.Item
            name="website"
            label={hint('Website', 'Broker\'s public website — used for reference and KYC documentation.')}
          >
            <Input placeholder="https://www.icap.com" />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
