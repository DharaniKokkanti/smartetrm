import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, Select, InputNumber } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { AuditInfo } from '@components/smart/AuditInfo';
import { useVessels } from '@features/logistics/vessels/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useVesselPerformanceCurves, useSaveVesselPerformanceCurve } from './hooks';
import { VESSEL_CONDITIONS, type VesselPerformanceCurve, type VesselPerformanceCurveInput } from './types';

export function VesselPerformanceCurvesPage() {
  const { data = [], isLoading, refetch } = useVesselPerformanceCurves();
  const save = useSaveVesselPerformanceCurve();
  const { data: vessels = [] } = useVessels();
  const { data: fuelGrades = [] } = useTableRows<{ fuelGradeId: number; gradeCode: string }>('bunker_fuel_grade');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VesselPerformanceCurve | null>(null);
  const [form] = Form.useForm<VesselPerformanceCurveInput>();

  const vesselOptions = vessels.map((v) => ({ value: v.vesselId, label: v.vesselName }));
  const fuelGradeOptions = fuelGrades.map((f) => ({ value: f.fuelGradeId, label: f.gradeCode }));

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldValue('condition', 'LADEN');
    form.setFieldValue('isActive', true);
    setOpen(true);
  }

  function openEdit(r: VesselPerformanceCurve) {
    setEditing(r);
    form.setFieldsValue({
      vesselId: r.vesselId, condition: r.condition, speedKnots: r.speedKnots,
      mainEngineConsumptionMtPerDay: r.mainEngineConsumptionMtPerDay, auxEngineConsumptionMtPerDay: r.auxEngineConsumptionMtPerDay ?? undefined,
      fuelGradeId: r.fuelGradeId ?? undefined,
      effectiveFrom: r.effectiveFrom ? (dayjs(r.effectiveFrom) as unknown as string) : undefined,
      notes: r.notes ?? undefined, isActive: r.isActive,
    });
    setOpen(true);
  }

  async function submit() {
    const v = await form.validateFields();
    const input: VesselPerformanceCurveInput = {
      ...v,
      effectiveFrom: v.effectiveFrom ? dayjs(v.effectiveFrom as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
    };
    await save.mutateAsync({ id: editing?.curveId ?? null, input });
    setOpen(false);
  }

  const colDefs = useMemo<ColDef<VesselPerformanceCurve>[]>(() => [
    { field: 'vesselName', headerName: 'Vessel', flex: 1, minWidth: 160, pinned: 'left' },
    { field: 'condition', headerName: 'Condition', width: 110, cellRenderer: (p: { value: string }) => <Tag color={p.value === 'LADEN' ? 'blue' : 'default'}>{p.value}</Tag> },
    { field: 'speedKnots', headerName: 'Speed (kn)', width: 110, cellClass: 'cell-mono' },
    { field: 'mainEngineConsumptionMtPerDay', headerName: 'M/E Consumption (MT/day)', width: 190, cellClass: 'cell-mono' },
    { field: 'auxEngineConsumptionMtPerDay', headerName: 'A/E Consumption (MT/day)', width: 190, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'fuelGradeCode', headerName: 'Fuel Grade', width: 110, valueFormatter: (p) => p.value ?? '—' },
    { field: 'effectiveFrom', headerName: 'Effective From', width: 130, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: VesselPerformanceCurve }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Vessel Performance Curves"
        description="Per-vessel laden/ballast speed vs. fuel-consumption matrix — used for voyage estimating and bunker planning."
        moduleGroup="Logistics & Delivery"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Performance Curve"
        onRefresh={() => void refetch()}
        getRowId={(p) => String(p.data.curveId)}
      />
      <Drawer title={editing ? 'Edit Performance Curve' : 'New Performance Curve'} open={open} onClose={() => setOpen(false)} width={440}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="primary" onClick={() => void submit()} loading={save.isPending}>Save</Button>
        </Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="vesselId" label="Vessel" rules={[{ required: true }]}><Select options={vesselOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="condition" label="Condition" rules={[{ required: true }]}>
            <Select options={VESSEL_CONDITIONS.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="speedKnots" label="Speed (knots)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="mainEngineConsumptionMtPerDay" label="Main Engine Consumption (MT/day)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="auxEngineConsumptionMtPerDay" label="Aux Engine Consumption (MT/day)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="fuelGradeId" label="Fuel Grade"><Select allowClear showSearch optionFilterProp="label" options={fuelGradeOptions} /></Form.Item>
          <Form.Item name="effectiveFrom" label="Effective From"><AppDatePicker /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="isActive" hidden initialValue={true}><Input /></Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} createdBy={editing?.createdBy} updatedAt={editing?.updatedAt} updatedBy={editing?.updatedBy} />
      </Drawer>
    </>
  );
}
