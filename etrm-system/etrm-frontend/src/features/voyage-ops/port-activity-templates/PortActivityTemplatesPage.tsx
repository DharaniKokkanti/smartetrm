import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Tag, Drawer, Form, Select, InputNumber, Input, Space, Typography, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { PageHeader } from '@components/layout/PageHeader';
import { useTableRows } from '@features/tier2/hooks';
import {
  usePortActivityTemplateSteps, useSavePortActivityTemplateStep, useDeletePortActivityTemplateStep,
} from './hooks';
import type { PortActivityTemplateStepInput } from './types';

const { Text } = Typography;

interface TemplateRow {
  templateId: number;
  templateCode: string;
  templateName: string;
  portLocationId: number | null;
  commodityTypeId: number | null;
  isActive: boolean;
}

export function PortActivityTemplatesPage() {
  const { data: rows = [], isLoading } = useTableRows<TemplateRow>('port_activity_template');
  const navigate = useNavigate();
  const [stepsFor, setStepsFor] = useState<TemplateRow | null>(null);

  return (
    <div>
      <PageHeader
        title="Port Activity Templates"
        description="Standard, ordered sequences of expected SOF events per port (or generic) — used to pre-populate SOF logging instead of starting blank. Add/edit templates themselves via Static Data; manage their steps here."
        moduleGroup="Freight & Shipping"
        extra={<Button onClick={() => navigate('/static-data/port_activity_template')}>Manage Templates</Button>}
      />
      <Table
        rowKey="templateId"
        loading={isLoading}
        dataSource={rows}
        pagination={false}
        columns={[
          { title: 'Code', dataIndex: 'templateCode' },
          { title: 'Name', dataIndex: 'templateName' },
          { title: 'Active', dataIndex: 'isActive', render: (v: boolean) => <Tag color={v ? 'success' : 'default'}>{v ? 'Yes' : 'No'}</Tag> },
          {
            title: '', key: 'actions',
            render: (_, r) => <Button icon={<UnorderedListOutlined />} onClick={() => setStepsFor(r)}>Manage Steps</Button>,
          },
        ]}
      />
      {stepsFor && (
        <StepsDrawer template={stepsFor} onClose={() => setStepsFor(null)} />
      )}
    </div>
  );
}

function StepsDrawer({ template, onClose }: { template: TemplateRow; onClose: () => void }) {
  const { data = [], isLoading } = usePortActivityTemplateSteps(template.templateId);
  const save = useSavePortActivityTemplateStep();
  const del = useDeletePortActivityTemplateStep();
  const { data: eventTypes = [] } = useTableRows<{ sofEventTypeId: number; eventCode: string }>('sof_event_type');
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<PortActivityTemplateStepInput>();

  async function submit() {
    const v = await form.validateFields();
    await save.mutateAsync({ id: null, input: { ...v, templateId: template.templateId } });
    setOpen(false);
    form.resetFields();
  }

  return (
    <Drawer title={`Steps — ${template.templateCode}`} open onClose={onClose} width={520}>
      <Space style={{ marginBottom: 12 }}>
        <Text type="secondary">{template.templateName}</Text>
      </Space>
      <Button icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ marginBottom: 12, display: 'block' }}>Add Step</Button>
      <Table
        rowKey="stepId"
        loading={isLoading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: '#', dataIndex: 'stepSequence', width: 50 },
          { title: 'Event', dataIndex: 'eventCode', render: (v) => v ?? '—' },
          { title: 'Typical Duration (hrs)', dataIndex: 'typicalDurationHours', render: (v) => v ?? '—' },
          { title: 'Notes', dataIndex: 'notes', render: (v) => v ?? '—' },
          {
            title: '', key: 'actions',
            render: (_, r: { stepId: number }) => (
              <Popconfirm title="Remove this step?" onConfirm={() => del.mutate(r.stepId)}>
                <Button danger size="small" icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]}
      />
      <Drawer title="Add Step" open={open} onClose={() => setOpen(false)} width={400}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="primary" onClick={() => void submit()} loading={save.isPending}>Save</Button>
        </Space>}>
        <Form form={form} layout="vertical" initialValues={{ stepSequence: (data.length ?? 0) + 1 }}>
          <Form.Item name="sofEventTypeId" label="Event" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={eventTypes.map((t) => ({ value: t.sofEventTypeId, label: t.eventCode }))} />
          </Form.Item>
          <Form.Item name="stepSequence" label="Step #" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
          <Form.Item name="typicalDurationHours" label="Typical Duration (hrs)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Drawer>
    </Drawer>
  );
}
