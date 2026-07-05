import { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Switch, InputNumber } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useSaveBook } from './hooks';
import { BOOK_TYPES, type Book, type BookInput } from './types';
import { COMMODITY_TYPE_LOOKUP } from '../desks/types';
import { useDraftValues } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';

interface Props {
  open: boolean;
  editing: Book | null;
  onClose: () => void;
  onSaved?: (saved: Book) => void;  // called on Save (stay open) so parent can switch to edit mode
}

export function BookFormDrawer({ open, editing, onClose, onSaved }: Props) {
  const [form] = Form.useForm<BookInput>();
  const save = useSaveBook();
  const skipDraftReset = useDraftValues('org-books-v', form, open, editing);

  useEffect(() => {
    if (skipDraftReset.current) { if (open) skipDraftReset.current = false; return; }
    if (open) {
      form.resetFields();
      if (editing) {
        form.setFieldsValue({
          bookCode:            editing.bookCode,
          bookName:            editing.bookName,
          bookType:            editing.bookType,
          deskId:              editing.deskId,
          legalEntityId:       editing.legalEntityId,
          responsibleTraderId: editing.responsibleTraderId,
          commodityType:       editing.commodityType,
          currencyCode:        editing.currencyCode,
          positionLimit:       editing.positionLimit,
          pnlLimit:            editing.pnlLimit,
          varLimit:            editing.varLimit,
          goLiveDate:          editing.goLiveDate ? dayjs(editing.goLiveDate) : undefined,
          description:         editing.description ?? undefined,
          isActive:            editing.isActive,
        } as unknown as BookInput);
      } else {
        form.setFieldsValue({ isActive: true, bookType: 'TRADING', currencyCode: 'USD' });
      }
    }
  }, [open, editing, form]);

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: BookInput = {
      ...values,
      goLiveDate: v.goLiveDate ? v.goLiveDate.format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.bookId ?? null, input });
    if (closeAfter) onClose(); else onSaved?.(saved);
  }

  return (
    <Drawer mask={false} forceRender
      title={editing ? `Edit Book — ${editing.bookCode}` : 'New P&L Book'}
      open={open}
      onClose={onClose}
      width={520}
      footer={
        <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
          <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="bookCode"
          label={hint('Book Code', 'Short unique identifier for this P&L book — used in position and risk reporting.', 'OIL-CRUDE-01')}
          rules={[{ required: true }]}
        >
          <Input placeholder="OIL-CRUDE-01" style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item name="bookName" label="Book Name" rules={[{ required: true }]}>
          <Input placeholder="Crude Oil Physical Book" />
        </Form.Item>
        <Form.Item
          name="bookType"
          label={hint('Book Type', 'TRADING = active risk-taking book. HEDGE = offsets exposure from other books. FLAT/HOUSE/PROP — see book type reference for the full distinction.')}
          rules={[{ required: true }]}
        >
          <Select options={BOOK_TYPES.map((t) => ({ label: t, value: t }))} />
        </Form.Item>
        <Form.Item
          name="deskId"
          label={hint('Desk (ID)', 'The trading desk this book rolls up to for desk-level P&L and risk aggregation.')}
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: '100%' }} placeholder="Desk ID" />
        </Form.Item>
        <Form.Item
          name="legalEntityId"
          label={hint('Legal Entity (ID)', 'The booking company this book’s trades settle against.', '1=SETRM-LTD, 2=SETRM-NL, 3=SETRM-SG')}
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: '100%' }} placeholder="Legal Entity ID (1=SETRM-LTD, 2=SETRM-NL, 3=SETRM-SG)" />
        </Form.Item>
        <Form.Item
          name="commodityType"
          label={hint('Commodity Type', 'Restricts this book to one commodity for position/limit segregation. Leave blank for a multi-commodity book.')}
        >
          <Select allowClear placeholder="Leave blank for multi-commodity"
            options={COMMODITY_TYPE_LOOKUP.map((l) => ({ label: l.label, value: l.lookupId }))} />
        </Form.Item>
        <Form.Item
          name="currencyCode"
          label={hint('Base Currency', 'The functional currency this book’s P&L, positions, and limits are measured in.')}
          rules={[{ required: true }]}
        >
          <Select options={['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'SGD'].map((c) => ({ label: c, value: c }))}
            placeholder="USD" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item
          name="responsibleTraderId"
          label={hint('Responsible Trader (ID)', 'The trader accountable for this book’s daily risk and P&L. Optional.')}
        >
          <InputNumber style={{ width: '100%' }} placeholder="Trader ID (optional)" />
        </Form.Item>
        <Form.Item
          name="positionLimit"
          label={hint('Position Limit (MT/BBL)', 'Maximum net open position allowed in this book before a limit breach is triggered.', '500000')}
        >
          <InputNumber style={{ width: '100%' }} placeholder="500000"
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
        </Form.Item>
        <Form.Item
          name="pnlLimit"
          label={hint('P&L Limit (USD)', 'Daily or cumulative loss threshold for this book — breaching it should trigger a risk alert.', '10000000')}
        >
          <InputNumber style={{ width: '100%' }} placeholder="10000000"
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
        </Form.Item>
        <Form.Item
          name="varLimit"
          label={hint('VaR Limit (USD)', 'Value-at-Risk ceiling for this book, typically at a 95% or 99% confidence interval over a 1-day horizon.', '500000')}
        >
          <InputNumber style={{ width: '100%' }} placeholder="500000"
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
        </Form.Item>
        <Form.Item name="goLiveDate" label="Go-Live Date">
          <AppDatePicker style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Internal description or notes for this book" />
        </Form.Item>
        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
