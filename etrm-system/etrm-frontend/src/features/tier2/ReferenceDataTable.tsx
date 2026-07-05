import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  Button,
  Space,
  Table as AntTable,
  Tag,
  Popconfirm,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
    Empty,
  Spin,
  Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { RegistryEntry, ColumnMetadata, ReferenceDataRow } from '@models/referenceData';
import { useTableMetadata, useTableRows, useSaveRow, useDeleteRow } from './hooks';
import { referenceDataApi } from './api';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';

/** Column-name fragments that count as a "code/short-name" field — always
 *  stored uppercase, even if the user types lowercase. Codes with a stricter
 *  ISO format (currency, country) get their own pattern validation below on
 *  top of this. */
function isCodeColumn(name: string): boolean {
  return /code$/i.test(name);
}

/** Builds a human-readable option label for a foreign-key row without a
 *  per-table label-column convention hardcoded anywhere — looks for the
 *  target table's own `*Code`/`*Name` columns (the near-universal pattern
 *  across this app's reference tables) and falls back to the row's id. */
function fkOptionLabel(row: ReferenceDataRow, fallbackId: number): string {
  const nameKey = Object.keys(row).find((k) => /name$/i.test(k));
  const codeKey = Object.keys(row).find((k) => /code$/i.test(k));
  const name = nameKey ? row[nameKey] : undefined;
  const code = codeKey ? row[codeKey] : undefined;
  if (code != null && name != null) return `${code} — ${name}`;
  if (name != null) return String(name);
  if (code != null) return String(code);
  return `#${fallbackId}`;
}

/** Every table in this app follows `<camelCase table name>Id` for its own
 *  primary key (commodityId, commodityFamilyId, reportingGroupId, ...) — used
 *  here to read a FK target row's id without a second metadata fetch. */
function primaryKeyFieldFor(tableName: string): string {
  return tableName.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase()) + 'Id';
}

interface Props {
  table: RegistryEntry;
}

/** Columns that must follow ISO 4217 (3-letter uppercase) */
const ISO_4217_COLS = new Set(['currencyCode']);
/** Columns that must follow ISO 3166-1 alpha-2 (2-letter uppercase) */
const ISO_3166_COLS = new Set(['countryCode', 'jurisdictionCode', 'incorporationCountry']);

/** Extra validation rules injected for globally-standardised codes */
function isoRules(col: ColumnMetadata) {
  if (ISO_4217_COLS.has(col.name)) {
    return [
      { len: 3, message: 'Must be exactly 3 characters (ISO 4217)' },
      { pattern: /^[A-Z]{3}$/, message: 'Must be 3 uppercase letters (ISO 4217)' },
    ];
  }
  if (ISO_3166_COLS.has(col.name)) {
    return [
      { len: 2, message: 'Must be exactly 2 characters (ISO 3166-1)' },
      { pattern: /^[A-Z]{2}$/, message: 'Must be 2 uppercase letters (ISO 3166-1)' },
    ];
  }
  return [];
}

/** Renders the right input control for a column purely from its metadata
 *  kind — this is the mechanism that lets one component cover every Tier 2
 *  table instead of hand-writing a form per table. `fkOptions` carries the
 *  already-fetched target-table rows for any `foreign_key` column, keyed by
 *  the column's `foreignKeyTable`. */
function fieldControl(col: ColumnMetadata, fkOptions: Record<string, { value: number; label: string }[]>) {
  switch (col.kind) {
    case 'boolean':
      return <Switch />;
    case 'number':
      return <InputNumber style={{ width: '100%' }} />;
    case 'foreign_key': {
      const options = col.foreignKeyTable ? fkOptions[col.foreignKeyTable] ?? [] : [];
      return (
        <Select
          showSearch
          optionFilterProp="label"
          options={options}
          placeholder={`Select ${col.label.toLowerCase()}…`}
        />
      );
    }
    case 'date':
      return <AppDatePicker />;
    case 'enum':
      return <Select options={(col.enumValues ?? []).map((v) => ({ label: v, value: v }))} />;
    default: {
      const isCodeCol = ISO_4217_COLS.has(col.name) || ISO_3166_COLS.has(col.name) || isCodeColumn(col.name);
      return (
        <Input
          maxLength={col.maxLength ?? undefined}
          style={isCodeCol ? { textTransform: 'uppercase', fontFamily: 'monospace' } : undefined}
          onChange={isCodeCol ? (e) => {
            e.target.value = e.target.value.toUpperCase();
          } : undefined}
        />
      );
    }
  }
}

export function ReferenceDataTable({ table }: Props) {
  const { data: metadata, isLoading: loadingMeta } = useTableMetadata(table.tableName);
  const { data: rows, isLoading: loadingRows } = useTableRows(table.tableName);
  const saveRow = useSaveRow(table.tableName);
  const deleteRow = useDeleteRow(table.tableName);

  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  useFormDraft(`tier2-${table.tableName}`, {
    form, open: modalOpen, setOpen: setModalOpen, editing: editingId, setEditing: setEditingId,
    meta: () => ({ route: `/static-data/${table.tableName}`, label: table.displayName.replace(/s$/, '') }),
  });

  // ── Move / minimize / maximize the capture modal ──────────────────────────
  const [maximized, setMaximized] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0 });

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      if (!draggingRef.current) return;
      const { mouseX, mouseY, x, y } = dragStartRef.current;
      setDragPos({ x: x + (e.clientX - mouseX), y: y + (e.clientY - mouseY) });
    }
    function handleUp() { draggingRef.current = false; }
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  function onTitleBarMouseDown(e: ReactMouseEvent) {
    if (maximized) return;
    draggingRef.current = true;
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, x: dragPos.x, y: dragPos.y };
  }

  function resetWindowState() {
    setMaximized(false);
    setMinimized(false);
    setDragPos({ x: 0, y: 0 });
  }

  const editableColumns = useMemo(
    () =>
      (metadata?.columns ?? []).filter(
        (c) =>
          !c.isPrimaryKey &&
          !['created_at', 'created_by', 'updated_at', 'updated_by'].includes(c.name),
      ),
    [metadata],
  );

  // FK columns render as a searchable Select, not a raw id input — fetch
  // every distinct target table referenced by this table's FK columns in one
  // batch (useQueries handles the variable-length list safely; this
  // component remounts per table via Tier2HomePage's `key`, so the list is
  // stable for the component's lifetime).
  const fkTables = useMemo(
    () => Array.from(new Set(editableColumns.filter((c) => c.kind === 'foreign_key' && c.foreignKeyTable).map((c) => c.foreignKeyTable as string))),
    [editableColumns],
  );
  const fkResults = useQueries({
    queries: fkTables.map((t) => ({
      queryKey: ['reference-data', t, 'rows'],
      queryFn: () => referenceDataApi.listRows(t),
    })),
  });
  // Fetch each FK target's own metadata too — its primaryKeyColumn isn't
  // always <camelCase table name>Id (e.g. lookup_value's PK is lookupId, not
  // lookupValueId), so read the real value rather than guessing.
  const fkMetaResults = useQueries({
    queries: fkTables.map((t) => ({
      queryKey: ['reference-data', t, 'metadata'],
      queryFn: () => referenceDataApi.getMetadata(t),
      staleTime: 10 * 60_000,
    })),
  });
  const fkOptions = useMemo(() => {
    const map: Record<string, { value: number; label: string }[]> = {};
    fkTables.forEach((t, i) => {
      const targetRows = (fkResults[i]?.data ?? []) as ReferenceDataRow[];
      const pkField = fkMetaResults[i]?.data?.primaryKeyColumn ?? primaryKeyFieldFor(t);
      map[t] = targetRows.map((r) => ({ value: r[pkField] as number, label: fkOptionLabel(r, r[pkField] as number) }));
    });
    return map;
  }, [fkTables, fkResults, fkMetaResults]);

  if (loadingMeta) return <Spin />;
  if (!metadata) {
    return <Alert type="error" message="Could not load table metadata." showIcon />;
  }

  const pk = metadata.primaryKeyColumn;

  function openAdd() {
    setEditingId(null);
    form.resetFields();
    resetWindowState();
    setModalOpen(true);
  }

  function openEdit(row: ReferenceDataRow) {
    setEditingId(row[pk] as number);
    const values: Record<string, unknown> = { ...row };
    // Dates arrive as ISO strings from the API but DatePicker needs dayjs objects
    for (const col of editableColumns) {
      if (col.kind === 'date' && typeof values[col.name] === 'string') {
        values[col.name] = dayjs(values[col.name] as string);
      }
    }
    form.setFieldsValue(values);
    resetWindowState();
    setModalOpen(true);
  }

  async function handleSave(closeAfter = true) {
    const values = await form.validateFields();
    const payload: ReferenceDataRow = { ...values };
    for (const col of editableColumns) {
      const v = payload[col.name];
      if (col.kind === 'date' && v && typeof v === 'object' && 'format' in v) {
        payload[col.name] = (v as dayjs.Dayjs).format('YYYY-MM-DD');
      }
      // Defensive uppercase at save time, not just on keystroke — covers
      // paste, IME input, and any other path that bypasses onChange.
      if (typeof v === 'string' && (ISO_4217_COLS.has(col.name) || ISO_3166_COLS.has(col.name) || isCodeColumn(col.name))) {
        payload[col.name] = v.toUpperCase();
      }
    }
    await saveRow.mutateAsync({ id: editingId, row: payload });
    if (closeAfter) { setModalOpen(false); } else { form.resetFields(); setEditingId(null); }
  }

  const columns: ColumnsType<ReferenceDataRow> = [
    ...editableColumns.slice(0, 6).map((col) => ({
      title: col.label,
      dataIndex: col.name,
      key: col.name,
      render: (value: string | number | boolean | null) => {
        if (col.kind === 'boolean')
          return <Tag color={value ? 'success' : 'default'}>{value ? 'Yes' : 'No'}</Tag>;
        if (value === null || value === undefined || value === '') return '—';
        if (col.kind === 'foreign_key' && col.foreignKeyTable) {
          const opt = fkOptions[col.foreignKeyTable]?.find((o) => o.value === value);
          return opt ? opt.label : String(value);
        }
        return String(value);
      },
    })),
    {
      title: '',
      key: '_actions',
      width: 90,
      render: (_, row) => (
        <Space size={4}>
          {table.allowEdit && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(row)}
            />
          )}
          {table.allowDelete && (
            <Popconfirm
              title="Delete this row?"
              onConfirm={() => deleteRow.mutate(row[pk] as number)}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {table.allowCreate && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Add {table.displayName.replace(/s$/, '')}
          </Button>
        </div>
      )}
      <AntTable<ReferenceDataRow>
        size="small"
        rowKey={pk}
        dataSource={rows ?? []}
        columns={columns}
        loading={loadingRows}
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: <Empty description="No rows yet" /> }}
      />
      <Modal mask={false} forceRender
        title={
          <div
            onMouseDown={onTitleBarMouseDown}
            style={{
              cursor: maximized ? 'default' : 'move',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingRight: 44,
              userSelect: 'none',
            }}
          >
            <span>{editingId === null ? `New ${table.displayName.replace(/s$/, '')}` : `Edit row`}</span>
            <Space size={2} onMouseDown={(e) => e.stopPropagation()}>
              <Button type="text" size="small" icon={<MinusOutlined />} onClick={() => setMinimized(true)} aria-label="Minimize" />
              <Button
                type="text"
                size="small"
                icon={maximized ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => { setMaximized((m) => !m); setDragPos({ x: 0, y: 0 }); }}
                aria-label={maximized ? 'Restore' : 'Maximize'}
              />
            </Space>
          </div>
        }
        open={modalOpen}
        onCancel={() => { setModalOpen(false); resetWindowState(); }}
        onOk={() => { void handleSave(true); }}
        okText="Save & Close"
        confirmLoading={saveRow.isPending}
        footer={(_, { OkBtn, CancelBtn }) => (
          <><CancelBtn /><Button loading={saveRow.isPending} onClick={() => { void handleSave(false); }}>Save & Next</Button><OkBtn /></>
        )}
        destroyOnHidden
        width={maximized ? 'calc(100vw - 48px)' : undefined}
        style={maximized ? { top: 16 } : undefined}
        styles={maximized ? {
          content: { maxHeight: 'calc(100vh - 32px)' },
          body: { maxHeight: 'calc(100vh - 180px)' },
        } : undefined}
        modalRender={(node) => (
          <div style={{
            transform: `translate(${dragPos.x}px, ${dragPos.y}px)`,
            display: minimized ? 'none' : undefined,
          }}>
            {node}
          </div>
        )}
      >
        <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
          {editableColumns.map((col) => (
            <Form.Item
              key={col.name}
              name={col.name}
              label={col.label}
              valuePropName={col.kind === 'boolean' ? 'checked' : 'value'}
              rules={[
                { required: !col.nullable, message: `${col.label} is required` },
                ...isoRules(col),
              ]}
            >
              {fieldControl(col, fkOptions)}
            </Form.Item>
          ))}
        </Form>
      </Modal>

      {minimized && modalOpen && (
        <div
          onClick={() => setMinimized(false)}
          role="button"
          tabIndex={0}
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1050,
            background: '#1677ff',
            color: '#fff',
            padding: '9px 16px',
            borderRadius: 20,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.28)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
          }}
        >
          <span>{editingId === null ? `New ${table.displayName.replace(/s$/, '')}` : 'Editing row'} (minimized)</span>
          <ExpandOutlined />
        </div>
      )}
    </div>
  );
}
