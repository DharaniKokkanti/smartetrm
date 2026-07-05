import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { useFormDraft } from '@components/smart/formDraft';
import dayjs, { type Dayjs } from 'dayjs';
import { useVessels } from '@features/logistics/vessels/hooks';
import { useVesselCertificates, useSaveVesselCertificate } from './hooks';
import { CERT_TYPES, type VesselCertificate, type VesselCertificateInput } from './types';

export function VesselCertificatesPage() {
  const { data = [], isLoading, refetch } = useVesselCertificates();
  const save = useSaveVesselCertificate();
  const { data: vessels = [] } = useVessels();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VesselCertificate | null>(null);
  const [form] = Form.useForm<VesselCertificateInput>();
  useFormDraft('vessel-certificates', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ certType: 'SIRE', isCurrent: true } as unknown as VesselCertificateInput);
    setOpen(true);
  }

  function openEdit(r: VesselCertificate) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      issueDate: r.issueDate ? dayjs(r.issueDate) : undefined,
      expiryDate: r.expiryDate ? dayjs(r.expiryDate) : undefined,
    } as unknown as VesselCertificateInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: VesselCertificateInput = {
      ...values,
      issueDate: v.issueDate ? v.issueDate.format('YYYY-MM-DD') : null,
      expiryDate: v.expiryDate ? v.expiryDate.format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.certId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const vesselOpts = useMemo(
    () => (vessels as { vesselId: number; vesselName: string }[]).map((v) => ({ value: v.vesselId, label: v.vesselName })),
    [vessels],
  );

  const colDefs = useMemo<ColDef<VesselCertificate>[]>(() => [
    { field: 'vesselName', headerName: 'Vessel', flex: 1, minWidth: 150, pinned: 'left' },
    { field: 'certType', headerName: 'Certificate', width: 130, cellRenderer: (p: { value: string }) => <Tag>{p.value}</Tag> },
    { field: 'certNumber', headerName: 'Cert Number', width: 150, valueFormatter: (p) => p.value ?? '—' },
    { field: 'issuingBody', headerName: 'Issuing Body', flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    { field: 'issueDate', headerName: 'Issued', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'expiryDate', headerName: 'Expiry', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'isCurrent', headerName: 'Current', width: 90,
      cellRenderer: (p: { value: boolean }) => <Tag color={p.value ? 'success' : 'default'}>{p.value ? 'Yes' : 'No'}</Tag>,
    },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: VesselCertificate }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Vessel Certificates"
        description="SOLAS, MARPOL, ISM, ISSC, and class society certificates tracked per vessel with expiry dates — SIRE/CDI vetting, P&I/Hull insurance, and flag-state approvals."
        moduleGroup="freight"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Certificate"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.certId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Vessel Certificate' : 'New Vessel Certificate'}
        open={open}
        onClose={() => setOpen(false)}
        width={440}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="vesselId" label="Vessel" rules={[{ required: true }]}>
            <Select options={vesselOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="certType" label="Certificate Type" rules={[{ required: true }]}>
            <Select options={CERT_TYPES.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="certNumber" label="Certificate Number">
            <Input style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="issuingBody" label="Issuing Body">
            <Input placeholder="e.g. Lloyd's Register, ABS, DNV" />
          </Form.Item>
          <Form.Item name="issueDate" label="Issue Date">
            <AppDatePicker />
          </Form.Item>
          <Form.Item
            name="expiryDate"
            dependencies={['issueDate']}
            label="Expiry Date"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const iss = getFieldValue('issueDate');
                  if (!value || !iss || !value.isBefore(iss)) return Promise.resolve();
                  return Promise.reject(new Error('Expiry date must be on or after the issue date'));
                },
              }),
            ]}
          >
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="isCurrent" label="Current" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
