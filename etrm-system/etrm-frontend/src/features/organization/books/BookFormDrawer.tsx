import { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Switch, InputNumber } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useSaveBook } from './hooks';
import { BOOK_TYPES, type Book, type BookInput } from './types';
import { COMMODITY_TYPE_LOOKUP } from '../desks/types';
import { useDraftValues } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';

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
        <Form.Item name="bookCode" label="Book Code" rules={[{ required: true }]}>
          <Input placeholder="OIL-CRUDE-01" style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item name="bookName" label="Book Name" rules={[{ required: true }]}>
          <Input placeholder="Crude Oil Physical Book" />
        </Form.Item>
        <Form.Item name="bookType" label="Book Type" rules={[{ required: true }]}>
          <Select options={BOOK_TYPES.map((t) => ({ label: t, value: t }))} />
        </Form.Item>
        <Form.Item name="deskId" label="Desk (ID)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} placeholder="Desk ID" />
        </Form.Item>
        <Form.Item name="legalEntityId" label="Legal Entity (ID)" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} placeholder="Legal Entity ID (1=SETRM-LTD, 2=SETRM-NL, 3=SETRM-SG)" />
        </Form.Item>
        <Form.Item name="commodityType" label="Commodity Type">
          <Select allowClear placeholder="Leave blank for multi-commodity"
            options={COMMODITY_TYPE_LOOKUP.map((l) => ({ label: l.label, value: l.lookupId }))} />
        </Form.Item>
        <Form.Item name="currencyCode" label="Base Currency" rules={[{ required: true }]}>
          <Select options={['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'SGD'].map((c) => ({ label: c, value: c }))}
            placeholder="USD" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="responsibleTraderId" label="Responsible Trader (ID)">
          <InputNumber style={{ width: '100%' }} placeholder="Trader ID (optional)" />
        </Form.Item>
        <Form.Item name="positionLimit" label="Position Limit (MT/BBL)">
          <InputNumber style={{ width: '100%' }} placeholder="500000"
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
        </Form.Item>
        <Form.Item name="pnlLimit" label="P&L Limit (USD)">
          <InputNumber style={{ width: '100%' }} placeholder="10000000"
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
        </Form.Item>
        <Form.Item name="varLimit" label="VaR Limit (USD)">
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
