import { useEffect, useMemo, useState } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Switch, InputNumber, Divider, Tag, Typography } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useSaveBook, useAddBookTrader, useRemoveBookTrader, useBooks,
  useAddBookClassification, useRemoveBookClassification } from './hooks';
import { BOOK_TYPE_LOOKUP, BOOK_ROLE_OPTIONS, type Book, type BookInput, type BookTraderView,
  type BookClassificationView } from './types';
import { COMMODITY_TYPE_LOOKUP } from '../desks/types';

// dbo.book_classification_dimension (V122) is extensible in the DB — only
// COMMODITY is seeded today. Add a dimension code here (value options for
// the "Add classification" picker) when a new dimension row is inserted.
const DIMENSION_VALUE_OPTIONS: Record<string, { label: string; value: string }[]> = {
  COMMODITY: COMMODITY_TYPE_LOOKUP.map((c) => ({ label: c.label, value: c.code })),
};
import { useCurrencies } from '@features/reference/currencies/hooks';
import { useDesks } from '../desks/hooks';
import { useTraders } from '../traders/hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useDraftValues } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';

const { Text } = Typography;

interface Props {
  open: boolean;
  editing: Book | null;
  onClose: () => void;
  onSaved?: (saved: Book) => void;  // called on Save (stay open) so parent can switch to edit mode
}

const TRADER_ROLE_OPTIONS = [
  { label: 'Primary', value: 'PRIMARY' },
  { label: 'Secondary', value: 'SECONDARY' },
  { label: 'Backup', value: 'BACKUP' },
];

/** Walks parentBookId chains to find every book that is a descendant of `rootId` — used to
 *  keep the parent-book picker from offering a cycle (a book can't become its own ancestor). */
function collectDescendants(books: Book[], rootId: number): Set<number> {
  const result = new Set<number>();
  let frontier = [rootId];
  while (frontier.length) {
    const next: number[] = [];
    for (const b of books) {
      if (b.parentBookId != null && frontier.includes(b.parentBookId) && !result.has(b.bookId)) {
        result.add(b.bookId);
        next.push(b.bookId);
      }
    }
    frontier = next;
  }
  return result;
}

// ── Book traders sub-section (only shown when editing an existing book) ───────
function BookTradersSection({ book }: { book: Book }) {
  const { data: traders = [] } = useTraders();
  const addTrader = useAddBookTrader();
  const removeTrader = useRemoveBookTrader();
  const [newTraderId, setNewTraderId] = useState<number | undefined>(undefined);
  const [newRole, setNewRole] = useState<'PRIMARY' | 'SECONDARY' | 'BACKUP'>('SECONDARY');

  const activeTraders = book.traders.filter((t) => t.isActive);
  const existingIds = new Set(activeTraders.map((t) => t.traderId));
  const availableTraders = traders.filter((t) => !existingIds.has(t.traderId));

  function handleAdd() {
    if (newTraderId == null) return;
    addTrader.mutate({ bookId: book.bookId, traderId: newTraderId, role: newRole }, {
      onSuccess: () => setNewTraderId(undefined),
    });
  }

  return (
    <>
      <Divider style={{ margin: '8px 0 12px' }}>Book Traders</Divider>
      <Space direction="vertical" style={{ width: '100%' }} size={6}>
        {activeTraders.length === 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>No traders assigned yet.</Text>
        )}
        {activeTraders.map((t: BookTraderView) => (
          <Space key={t.traderId} style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space size={6}>
              {t.role === 'PRIMARY' ? <Text strong>{t.traderName}</Text> : <Text>{t.traderName}</Text>}
              <Tag color={t.role === 'PRIMARY' ? 'blue' : 'default'}>{t.role}</Tag>
            </Space>
            <Button
              type="text" size="small" danger icon={<CloseOutlined />}
              loading={removeTrader.isPending}
              onClick={() => removeTrader.mutate({ bookId: book.bookId, traderId: t.traderId })}
            />
          </Space>
        ))}
        <Space style={{ width: '100%', marginTop: 4 }}>
          <Select
            showSearch
            placeholder="Add trader"
            optionFilterProp="label"
            style={{ width: 200 }}
            value={newTraderId}
            onChange={setNewTraderId}
            options={availableTraders.map((t) => ({ label: t.fullName, value: t.traderId }))}
          />
          <Select style={{ width: 120 }} value={newRole} onChange={setNewRole} options={TRADER_ROLE_OPTIONS} />
          <Button icon={<PlusOutlined />} disabled={newTraderId == null} loading={addTrader.isPending} onClick={handleAdd} />
        </Space>
      </Space>
    </>
  );
}

// ── Book classifications sub-section (only shown when editing an existing book) ──
function BookClassificationsSection({ book }: { book: Book }) {
  const addClassification = useAddBookClassification();
  const removeClassification = useRemoveBookClassification();
  const [dimensionCode, setDimensionCode] = useState<string>('COMMODITY');
  const [valueCode, setValueCode] = useState<string | undefined>(undefined);

  const dimensionOptions = Object.keys(DIMENSION_VALUE_OPTIONS).map((code) => ({ label: code, value: code }));
  const existingValues = new Set(
    book.classifications.filter((c) => c.dimensionCode === dimensionCode).map((c) => c.valueCode));
  const valueOptions = (DIMENSION_VALUE_OPTIONS[dimensionCode] ?? []).filter((o) => !existingValues.has(o.value));

  function handleAdd() {
    if (valueCode == null) return;
    const label = DIMENSION_VALUE_OPTIONS[dimensionCode]?.find((o) => o.value === valueCode)?.label;
    addClassification.mutate({ bookId: book.bookId, dimensionCode, valueCode, valueLabel: label }, {
      onSuccess: () => setValueCode(undefined),
    });
  }

  return (
    <>
      <Divider style={{ margin: '8px 0 12px' }}>
        {hint('Classifications', 'Decoupled tags (commodity, and future axes) — a book carries zero or more of these instead of a fixed schema column per axis.')}
      </Divider>
      <Space direction="vertical" style={{ width: '100%' }} size={6}>
        {book.classifications.length === 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>No classifications assigned yet.</Text>
        )}
        {book.classifications.map((c: BookClassificationView) => (
          <Space key={c.bookClassificationId} style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space size={6}>
              <Tag color={c.isPrimary ? 'blue' : 'default'}>{c.dimensionCode}</Tag>
              <Text>{c.valueLabel ?? c.valueCode}</Text>
            </Space>
            <Button
              type="text" size="small" danger icon={<CloseOutlined />}
              loading={removeClassification.isPending}
              onClick={() => removeClassification.mutate({ bookId: book.bookId, bookClassificationId: c.bookClassificationId })}
            />
          </Space>
        ))}
        <Space style={{ width: '100%', marginTop: 4 }}>
          <Select style={{ width: 130 }} value={dimensionCode}
            onChange={(v) => { setDimensionCode(v); setValueCode(undefined); }} options={dimensionOptions} />
          <Select
            showSearch
            placeholder="Add value"
            optionFilterProp="label"
            style={{ width: 180 }}
            value={valueCode}
            onChange={setValueCode}
            options={valueOptions}
          />
          <Button icon={<PlusOutlined />} disabled={valueCode == null} loading={addClassification.isPending} onClick={handleAdd} />
        </Space>
      </Space>
    </>
  );
}

export function BookFormDrawer({ open, editing, onClose, onSaved }: Props) {
  const [form] = Form.useForm<BookInput>();
  const save = useSaveBook();
  const skipDraftReset = useDraftValues('org-books-v', form, open, editing);
  const { data: currencies = [], isLoading: loadingCurrencies } = useCurrencies();
  const { data: desks = [] } = useDesks();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: allBooks = [] } = useBooks();
  const currencyOptions = currencies
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.currencyCode} — ${c.currencyName}`, value: c.currencyId }));

  const legalEntityId = Form.useWatch('legalEntityId', form);
  const bookRole = Form.useWatch('bookRole', form);

  const deskOptions = useMemo(() => desks
    .filter((d) => legalEntityId == null || d.legalEntityId === legalEntityId)
    .map((d) => ({ label: `${d.deskCode} — ${d.deskName}`, value: d.deskId })), [desks, legalEntityId]);

  const parentBookOptions = useMemo(() => {
    if (editing == null) {
      return allBooks
        .filter((b) => legalEntityId == null || b.legalEntityId === legalEntityId)
        .map((b) => ({ label: `${b.bookCode} — ${b.bookName}`, value: b.bookId }));
    }
    const descendants = collectDescendants(allBooks, editing.bookId);
    return allBooks
      .filter((b) => b.bookId !== editing.bookId && !descendants.has(b.bookId))
      .filter((b) => legalEntityId == null || b.legalEntityId === legalEntityId)
      .map((b) => ({ label: `${b.bookCode} — ${b.bookName}`, value: b.bookId }));
  }, [allBooks, editing, legalEntityId]);

  // Clear deskId if it no longer matches the newly-selected legal entity.
  useEffect(() => {
    const currentDeskId = form.getFieldValue('deskId');
    if (currentDeskId == null || legalEntityId == null) return;
    const desk = desks.find((d) => d.deskId === currentDeskId);
    if (desk && desk.legalEntityId !== legalEntityId) {
      form.setFieldValue('deskId', undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legalEntityId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- skipDraftReset is a useRef() from useDraftValues; the compiler cannot see refs through a custom hook boundary
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
          parentBookId:        editing.parentBookId,
          bookRole:            editing.bookRole,
          baseCurrencyId:      editing.baseCurrencyId,
          positionLimit:       editing.positionLimit,
          pnlLimit:            editing.pnlLimit,
          varLimit:            editing.varLimit,
          goLiveDate:          editing.goLiveDate ? dayjs(editing.goLiveDate) : undefined,
          description:         editing.description ?? undefined,
          isActive:            editing.isActive,
        } as unknown as BookInput);
      } else {
        form.setFieldsValue({ isActive: true, bookType: 1, baseCurrencyId: 1, bookRole: 'TRADING' });
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
          <Select options={BOOK_TYPE_LOOKUP.map((t) => ({ label: t.label, value: t.bookTypeId }))} />
        </Form.Item>
        <Form.Item
          name="legalEntityId"
          label={hint('Legal Entity', 'The booking company this book’s trades settle against.')}
          rules={[{ required: true }]}
        >
          <Select showSearch optionFilterProp="label" placeholder="Select legal entity"
            options={legalEntities.map((e) => ({ label: `${e.entityCode} — ${e.entityName}`, value: e.legalEntityId }))} />
        </Form.Item>
        <Form.Item
          name="deskId"
          label={hint('Desk', 'The trading desk this book rolls up to for desk-level P&L and risk aggregation. Optional for a Consolidation book spanning multiple desks.')}
          rules={[{ required: bookRole !== 'CONSOLIDATION' }]}
        >
          <Select allowClear={bookRole === 'CONSOLIDATION'} showSearch optionFilterProp="label" placeholder="Select desk" options={deskOptions} />
        </Form.Item>
        <Form.Item
          name="parentBookId"
          label={hint('Parent Book', 'Optional — nest this book under another for rolled-up P&L/risk reporting. Restricted to books in the same legal entity.')}
        >
          <Select allowClear showSearch optionFilterProp="label" placeholder="None (top-level book)" options={parentBookOptions} />
        </Form.Item>
        <Form.Item
          name="bookRole"
          label={hint('Book Role', 'Trading = holds direct trade bookings. Consolidation = pure rollup node over its children (e.g. all US Oil desks’ books) — carries no bookings of its own.')}
          rules={[{ required: true }]}
        >
          <Select options={BOOK_ROLE_OPTIONS} />
        </Form.Item>
        <Form.Item
          name="baseCurrencyId"
          label={hint('Base Currency', 'The functional currency this book’s P&L, positions, and limits are measured in.')}
          rules={[{ required: true }]}
        >
          <Select options={currencyOptions} loading={loadingCurrencies}
            showSearch optionFilterProp="label" placeholder="Select currency" style={{ width: 220 }} />
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

      {editing !== null && <BookTradersSection book={editing} />}
      {editing !== null && <BookClassificationsSection book={editing} />}
    </Drawer>
  );
}
