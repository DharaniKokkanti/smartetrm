import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, InputNumber } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { usePipelines, useSavePipeline, useDeactivatePipeline } from './hooks';
import { PIPELINE_TYPES, PIPELINE_STATUS_CODES, type Pipeline, type PipelineInput, type PipelineType, type PipelineStatusCode } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AuditInfo } from '@components/smart/AuditInfo';

const TYPE_COLOR: Record<PipelineType, string> = {
  CRUDE_OIL: 'blue', REFINED_PRODUCTS: 'green', NATURAL_GAS: 'orange', LNG: 'gold',
  NGL: 'purple', HYDROGEN: 'cyan', CO2: 'default', MULTI_PRODUCT: 'geekblue',
};

const STATUS_COLOR: Record<PipelineStatusCode, string> = {
  OPERATIONAL: 'success', UNDER_CONSTRUCTION: 'processing', SUSPENDED: 'warning', DECOMMISSIONED: 'error',
};

export function PipelinesPage() {
  const { data, isLoading, refetch } = usePipelines();
  const save = useSavePipeline();
  const deactivate = useDeactivatePipeline();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pipeline | null>(null);
  const [form] = Form.useForm<PipelineInput>();
  useFormDraft('logistics-pipelines', { form, open, setOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); form.setFieldValue('statusCode', 'OPERATIONAL'); setOpen(true); }
  function openEdit(p: Pipeline) {
    setEditing(p);
    form.setFieldsValue({
      pipelineCode: p.pipelineCode, pipelineName: p.pipelineName, pipelineType: p.pipelineType,
      originLocationId: p.originLocationId, destinationLocationId: p.destinationLocationId,
      lengthKm: p.lengthKm, diameterInch: p.diameterInch,
      capacityPerDay: p.capacityPerDay, capacityUomCode: p.capacityUomCode ?? undefined,
      tso: p.tso ?? undefined, regulatoryBody: p.regulatoryBody ?? undefined,
      tariffCurrencyCode: p.tariffCurrencyCode ?? undefined, statusCode: p.statusCode, isActive: p.isActive,
    });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.pipelineId ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<Pipeline>[]>(() => [
    { field: 'pipelineCode', headerName: 'Code', cellClass: 'cell-mono', width: 130, pinned: 'left' },
    { field: 'pipelineName', headerName: 'Pipeline', flex: 1.4, minWidth: 200 },
    { field: 'pipelineType', headerName: 'Type', width: 160, cellRenderer: (p: { value: PipelineType }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'originLocationCode', headerName: 'Origin', width: 120, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'destinationLocationCode', headerName: 'Destination', width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'lengthKm', headerName: 'Length (km)', width: 115, cellClass: 'cell-mono', valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '—' },
    { field: 'capacityPerDay', headerName: 'Capacity/Day', width: 130, cellClass: 'cell-mono',
      valueFormatter: (p) => p.value != null ? `${Number(p.value).toLocaleString()} ${p.data?.capacityUomCode ?? ''}` : '—',
      tooltipValueGetter: () => 'Daily throughput capacity — used for scheduling nominations and allocation calculations' },
    { field: 'tso', headerName: 'TSO/Operator', width: 160, valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Transmission System Operator — regulated entity responsible for pipeline access and balancing' },
    { field: 'regulatoryBody', headerName: 'Regulator', width: 120, valueFormatter: (p) => p.value ?? '—' },
    { field: 'statusCode', headerName: 'Status', width: 140,
      cellRenderer: (p: { value: PipelineStatusCode }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Pipeline }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate pipeline?" onConfirm={() => deactivate.mutate(p.data.pipelineId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Pipelines" description="Pipeline infrastructure — crude, products, gas, LNG, NGL networks with TSO and regulatory mapping." moduleGroup="logistics" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Pipeline" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.pipelineId)} />

      <Drawer mask={false} forceRender title={editing ? `Edit Pipeline — ${editing.pipelineCode}` : 'New Pipeline'} open={open} onClose={() => setOpen(false)} width={540}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="pipelineCode" label={hint('Pipeline Code', 'Industry-standard or internal code. Gas pipelines often follow TSO nomination codes. Examples: TANAP (Trans-Anatolian), EUGAL (European Gas Link), GNS (Greet Northern System).', 'TANAP-GAS')} rules={[{ required: true }]}>
            <Input placeholder="TANAP-GAS" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="pipelineName" label="Pipeline Name" rules={[{ required: true }]}>
            <Input placeholder="Trans-Anatolian Natural Gas Pipeline" />
          </Form.Item>
          <Form.Item name="pipelineType" label={hint('Pipeline Type', 'CRUDE_OIL: raw crude from wellhead or terminal. REFINED_PRODUCTS: gasoline, diesel, jet fuel. NATURAL_GAS: gas from production/LNG. NGL: ethane, propane, butane mix. HYDROGEN: H₂ pipeline (emerging). CO2: carbon capture transport.', 'NATURAL_GAS')} rules={[{ required: true }]}>
            <Select options={PIPELINE_TYPES.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="lengthKm" label={hint('Length (km)', 'Total pipeline length in kilometers. Relevant for transit time calculations and tariff distance-based components.', '1850')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="1850" />
            </Form.Item>
            <Form.Item name="diameterInch" label={hint('Diameter (inches)', 'Internal pipe diameter. 36" and 42" are common for long-distance gas. Smaller diameters for distribution. Determines max throughput velocity.', '36')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="36" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="capacityPerDay" label={hint('Capacity/Day', 'Maximum daily throughput. Gas: MMSCFD or MMCM/d. Crude/products: kbd (thousand barrels/day) or MT/d.', '16000000')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="16000000" />
            </Form.Item>
            <Form.Item name="capacityUomCode" label="Capacity UoM" style={{ flex: 1 }}>
              <Input placeholder="MMSCFD" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Form.Item name="tso" label={hint('TSO / Operator', 'Transmission System Operator — regulated entity managing third-party access and balancing. EU Gas Directive requires unbundling of TSO from supply. Nominations go through TSO portals.', 'BOTAŞ, National Grid, Gaz de France Réseau Transport')}>
            <Input placeholder="BOTAŞ" />
          </Form.Item>
          <Form.Item name="regulatoryBody" label={hint('Regulatory Body', 'Energy regulator overseeing pipeline access and tariffs. Ofgem (UK), BNetzA (Germany), FERC (US), ACER (EU cross-border).', 'FERC, Ofgem, BNetzA')}>
            <Input placeholder="Ofgem" />
          </Form.Item>
          <Form.Item name="tariffCurrencyCode" label={hint('Tariff Currency', '3-letter ISO currency code for pipeline tariffs. Most EU pipelines quote in EUR/MWh or EUR/MBtu. US pipelines in USD/MMBTU.', 'USD')}>
            <Input placeholder="USD" maxLength={3} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="statusCode" label="Status" rules={[{ required: true }]}>
            <Select options={PIPELINE_STATUS_CODES.map((s) => ({ label: s.replace(/_/g, ' '), value: s }))} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} />
      </Drawer>
    </>
  );
}
