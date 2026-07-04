import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, InputNumber, Select, Tooltip, Popconfirm, Alert } from 'antd';
import { PlusOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import { useCounterparties } from '@features/trade/hooks';
import { useRinFuelCategories } from '@features/rins/fuel-categories/hooks';
import { useRinAccounts } from '@features/rins/rin-accounts/hooks';
import { useRinObligations } from '@features/rins/rin-obligations/hooks';
import { useRinTransactions, useCreateRinTransaction, useVoidRinTransaction } from './hooks';
import type { RinTransaction, RinTransactionInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import dayjs, { type Dayjs } from 'dayjs';

const TX_TYPE_COLOR: Record<string, string> = {
  GENERATE: 'green', SEPARATE: 'cyan', TRANSFER_BUY: 'blue', TRANSFER_SELL: 'orange', RETIRE: 'purple',
};
const TX_TYPE_OPTS = [
  { value: 'GENERATE',      label: 'Generate (produce RINs with fuel batch)' },
  { value: 'SEPARATE',      label: 'Separate (detach RINs from fuel)' },
  { value: 'TRANSFER_BUY',  label: 'Transfer — Buy (purchase separated RINs)' },
  { value: 'TRANSFER_SELL', label: 'Transfer — Sell (sell separated RINs)' },
  { value: 'RETIRE',        label: 'Retire (surrender to EPA for compliance)' },
];
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'default', SUBMITTED: 'processing', CONFIRMED: 'success', VOID: 'error',
};
const D_CODE_COLOR: Record<string, string> = { D3: 'purple', D4: 'blue', D5: 'green', D6: 'orange', D7: 'cyan' };
const NEEDS_PRICE = new Set(['TRANSFER_BUY', 'TRANSFER_SELL']);
const NEEDS_COUNTERPARTY = new Set(['TRANSFER_BUY', 'TRANSFER_SELL']);
const NEEDS_BATCH = new Set(['GENERATE']);
const NEEDS_OBLIGATION = new Set(['RETIRE']);
const NEEDS_EPA_TXN = new Set(['RETIRE', 'GENERATE']);

export function RinTransactionsPage() {
  const { data = [], isLoading, refetch } = useRinTransactions();
  const create = useCreateRinTransaction();
  const voidTx = useVoidRinTransaction();
  const { data: fuelCats = [] }    = useRinFuelCategories();
  const { data: accounts = [] }    = useRinAccounts();
  const { data: counterparties = [] } = useCounterparties();
  const { data: obligations = [] } = useRinObligations();

  const [open, setOpen]       = useState(false);
  const [txType, setTxType]   = useState<string>('TRANSFER_BUY');
  const [form]                = Form.useForm<RinTransactionInput>();
  useFormDraft('rins-transactions', { form, open, setOpen });

  const dCodeOpts = useMemo(
    () => (fuelCats as { categoryId: number; dCode: string; fuelName: string; equivalenceValue: number }[])
      .filter((c) => c.categoryId)
      .map((c) => ({ value: c.dCode, label: `${c.dCode} — ${c.fuelName} (${c.equivalenceValue} RINs/gal)` })),
    [fuelCats],
  );
  const accountOpts = useMemo(
    () => (accounts as { accountId: number; accountCode: string; accountName: string }[])
      .map((a) => ({ value: a.accountId, label: `${a.accountCode} — ${a.accountName}` })),
    [accounts],
  );
  const cpOpts = useMemo(
    () => (counterparties as { counterpartyId: number; counterpartyCode: string; name: string }[])
      .map((c) => ({ value: c.counterpartyId, label: `${c.counterpartyCode} — ${c.name}` })),
    [counterparties],
  );
  const obligationOpts = useMemo(
    () => (obligations as { obligationId: number; complianceYear: number; dCode: string; entityName: string; status: string }[])
      .filter((o) => o.status === 'OPEN' || o.status === 'PARTIALLY_SATISFIED')
      .map((o) => ({ value: o.obligationId, label: `${o.entityName} — ${o.dCode} ${o.complianceYear}` })),
    [obligations],
  );

  const vintageOpts = useMemo(() => {
    const yr = new Date().getFullYear();
    return [yr, yr - 1, yr - 2].map((y) => ({ value: y, label: String(y) }));
  }, []);

  function openNew() {
    form.resetFields();
    form.setFieldsValue({ transactionDate: dayjs(), status: 'CONFIRMED', vintageYear: new Date().getFullYear() } as unknown as RinTransactionInput);
    setTxType('TRANSFER_BUY');
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const txDate = (v as unknown as { transactionDate?: Dayjs }).transactionDate;
    const qty = v.quantity ?? 0;
    const price = v.pricePerRin ?? null;
    await create.mutateAsync({
      ...v,
      transactionDate: txDate ? txDate.format('YYYY-MM-DD') : v.transactionDate,
      totalValue: price != null ? qty * price : null,
      pricePerRin: price,
      counterpartyId: v.counterpartyId ?? null,
      tradeReference: v.tradeReference ?? null,
      batchNumber: v.batchNumber ?? null,
      epaTransactionId: v.epaTransactionId ?? null,
      obligationId: v.obligationId ?? null,
      notes: v.notes ?? null,
    });
    if (closeAfter) setOpen(false); else form.resetFields();
  }

  const colDefs = useMemo<ColDef<RinTransaction>[]>(() => [
    { field: 'transactionDate', headerName: 'Date',   width: 105, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'transactionType', headerName: 'Type',   width: 145,
      cellRenderer: (p: { value: string }) => {
        const short = { GENERATE: 'GENERATE', SEPARATE: 'SEPARATE', TRANSFER_BUY: 'BUY', TRANSFER_SELL: 'SELL', RETIRE: 'RETIRE' }[p.value] ?? p.value;
        return <Tag color={TX_TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10, fontWeight: 700 }}>{short}</Tag>;
      } },
    { field: 'dCode',       headerName: 'D-Code',  width: 85,
      cellRenderer: (p: { value: string }) => <Tag color={D_CODE_COLOR[p.value] ?? 'default'} style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>{p.value}</Tag> },
    { field: 'vintageYear', headerName: 'Vintage', width: 85,  cellClass: 'cell-mono' },
    { field: 'quantity',    headerName: 'RINs',    width: 120, type: 'numericColumn',
      cellRenderer: (p: { value: number; data: RinTransaction }) => {
        const sign = p.data.transactionType === 'TRANSFER_SELL' || p.data.transactionType === 'RETIRE' ? '-' : '+';
        const color = sign === '-' ? '#ef4444' : '#22c55e';
        return <span style={{ fontFamily: 'monospace', fontWeight: 600, color }}>{sign}{p.value.toLocaleString()}</span>;
      } },
    { field: 'pricePerRin', headerName: 'Price/RIN', width: 110, type: 'numericColumn',
      valueFormatter: (p) => p.value != null ? `$${Number(p.value).toFixed(4)}` : '—' },
    { field: 'totalValue',  headerName: 'Total Value', width: 120, type: 'numericColumn',
      valueFormatter: (p) => p.value != null ? `$${Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—' },
    { field: 'counterpartyName', headerName: 'Counterparty',   flex: 1, minWidth: 160, valueFormatter: (p) => p.value ?? '—' },
    { field: 'accountName',      headerName: 'Account',        flex: 1, minWidth: 160 },
    { field: 'tradeReference',   headerName: 'Trade Ref',      width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'batchNumber',      headerName: 'Batch #',        width: 165, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'status', headerName: 'Status', width: 105,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    { headerName: '', width: 65, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: RinTransaction }) =>
        p.data.status === 'PENDING' ? (
          <Popconfirm title="Void this transaction?" onConfirm={() => voidTx.mutate(p.data.transactionId)} okText="Void" okButtonProps={{ danger: true }}>
            <Tooltip title="Void"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
          </Popconfirm>
        ) : null },
  ], [voidTx]);

  const totalBought = data.filter((t) => t.transactionType === 'TRANSFER_BUY' && t.status !== 'VOID').reduce((s, t) => s + t.quantity, 0);
  const totalRetired = data.filter((t) => t.transactionType === 'RETIRE' && t.status !== 'VOID').reduce((s, t) => s + t.quantity, 0);

  return (
    <>
      <PageHeader
        title="RIN Transactions"
        description="Append-only ledger of all RIN movements: generation, separation, buy/sell transfers, and EPA EMTS retirements. Each transaction updates inventory position and, for RETIRE events, applies toward the annual RVO obligation."
        moduleGroup="rins"
        extra={
          <Space>
            <Tag color="blue">Bought: {totalBought.toLocaleString()} RINs</Tag>
            <Tag color="purple">Retired: {totalRetired.toLocaleString()} RINs</Tag>
          </Space>
        }
      />
      <SmartGrid
        columnDefs={colDefs} rowData={data} loading={isLoading}
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.transactionId)}
        extraToolbar={
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={openNew}>New Transaction</Button>
        }
      />
      <Drawer mask={false} forceRender
        title="New RIN Transaction"
        open={open} onClose={() => setOpen(false)} width={560}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={create.isPending}>Record & Next</Button><Button type="primary" onClick={() => { void submit(true); }} loading={create.isPending}>Record & Close</Button></Space>}
      >
        <Form form={form} layout="vertical" size="small" onValuesChange={(changed) => { if (changed.transactionType) setTxType(changed.transactionType as string); }}>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="transactionDate" label="Date" rules={[{ required: true }]} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="transactionType" label="Transaction Type" rules={[{ required: true }]} style={{ flex: 2 }}>
              <Select options={TX_TYPE_OPTS} />
            </Form.Item>
          </Space>

          <Form.Item name="accountId" label={hint('RIN Account', 'Our EPA EMTS account performing this transaction.')} rules={[{ required: true }]}>
            <Select options={accountOpts} showSearch optionFilterProp="label" placeholder="Select account" />
          </Form.Item>

          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="dCode" label={hint('D-Code', 'Fuel category determines how many RINs per gallon (equivalence value).')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={dCodeOpts} showSearch optionFilterProp="label" placeholder="D-Code" />
            </Form.Item>
            <Form.Item name="vintageYear" label={hint('Vintage Year', 'Year in which the RINs were originally generated. Prior-year RINs (limited to 20% of obligation).')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={vintageOpts} />
            </Form.Item>
          </Space>

          <Form.Item name="quantity" label={hint('Quantity (RINs)', 'Number of RINs — always a positive integer, regardless of buy/sell direction.')} rules={[{ required: true }]}>
            <InputNumber<number> style={{ width: '100%' }} min={1} placeholder="500000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
          </Form.Item>

          {NEEDS_PRICE.has(txType) && (
            <Space style={{ width: '100%' }} size={12}>
              <Form.Item name="pricePerRin" label="Price (USD / RIN)" rules={[{ required: true }]} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} precision={4} placeholder="0.8500" addonBefore="$" />
              </Form.Item>
              <Form.Item name="tradeReference" label={hint('Trade Reference', 'Internal trade ID or broker confirmation number.')} style={{ flex: 1 }}>
                <Input placeholder="TRD-20250115-001" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Space>
          )}

          {NEEDS_COUNTERPARTY.has(txType) && (
            <Form.Item name="counterpartyId" label="Counterparty" rules={[{ required: true }]}>
              <Select options={cpOpts} showSearch optionFilterProp="label" placeholder="Select counterparty" />
            </Form.Item>
          )}

          {NEEDS_BATCH.has(txType) && (
            <Space style={{ width: '100%' }} size={12}>
              <Form.Item name="batchNumber" label={hint('Batch Number', 'EPA batch number format: YYYYMM-XXXXX-NNNNN. Generated automatically by EMTS on submission.')} style={{ flex: 1 }}>
                <Input placeholder="202501-12345-67890" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
              <Form.Item name="tradeReference" label={hint('Trade Reference', 'Physical fuel cargo or plant run ID this generation is linked to.')} style={{ flex: 1 }}>
                <Input placeholder="CARGO-2025-001" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Space>
          )}

          {NEEDS_OBLIGATION.has(txType) && (
            <Form.Item name="obligationId" label={hint('RVO Obligation', 'Link this retirement to an annual compliance obligation. Updates the satisfied quantity automatically.')}>
              <Select options={obligationOpts} showSearch optionFilterProp="label" allowClear placeholder="Link to obligation (optional)" />
            </Form.Item>
          )}

          {NEEDS_EPA_TXN.has(txType) && (
            <Form.Item name="epaTransactionId" label={hint('EPA EMTS Transaction ID', 'Confirmation number from EPA EMTS after the transaction is submitted and accepted.')}>
              <Input placeholder="EMTS-2025-0001234" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          )}

          <Form.Item name="status" label={hint('Status', 'CONFIRMED for transactions already accepted by EPA EMTS. PENDING for transactions staged but not yet submitted.')}>
            <Select options={[{ value: 'PENDING', label: 'Pending' }, { value: 'SUBMITTED', label: 'Submitted to EPA' }, { value: 'CONFIRMED', label: 'Confirmed by EPA EMTS' }]} />
          </Form.Item>

          {txType === 'RETIRE' && (
            <Alert message="Retiring RINs is irreversible once accepted by EPA EMTS. Ensure quantity and D-code match your compliance obligation before submitting." type="warning" showIcon style={{ marginBottom: 12 }} />
          )}
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Broker, EMTS reference, compliance period, any other context..." />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
