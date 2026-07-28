import { useMemo } from 'react';
import { Modal, Form, Select, InputNumber, Alert } from 'antd';
import { hint } from '@components/smart/FieldHint';
import { useAutoGenerateTickerMappings } from './hooks';
import type { TickerMapping } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  tickerMappings: TickerMapping[];
}

interface FormValues {
  anchorTickerMappingId: number;
  count: number;
}

export function TickerMappingAutoGenerateModal({ open, onClose, tickerMappings }: Props) {
  const [form] = Form.useForm<FormValues>();
  const autoGenerate = useAutoGenerateTickerMappings();

  const anchorOptions = useMemo(
    () => tickerMappings
      .filter((t) => t.periodId != null)
      .map((t) => ({
        value: t.tickerMappingId,
        label: `${t.priceIndexCode} / ${t.sourceCode} / ${t.periodCode ?? '—'} (${t.settleTicker ?? t.openTicker ?? t.highTicker ?? t.lowTicker ?? t.avgTicker ?? t.promptTicker ?? t.bidTicker ?? t.askTicker ?? t.midTicker ?? 'no ticker set'})`,
      })),
    [tickerMappings],
  );

  async function handleOk() {
    const v = await form.validateFields();
    await autoGenerate.mutateAsync({ anchorTickerMappingId: v.anchorTickerMappingId, count: v.count });
    form.resetFields();
    onClose();
  }

  return (
    <Modal mask={false} forceRender
      title="Auto-Generate Ticker Mappings"
      open={open}
      onCancel={onClose}
      onOk={() => { void handleOk(); }}
      okText="Generate"
      confirmLoading={autoGenerate.isPending}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Rolls an anchor ticker mapping forward onto the next N Periods that already exist for the same listing (Periods aren't created here — use Period auto-generate first if you need more). Only ticker fields that follow a root + month-code + year convention (e.g. CLG26) can be rolled; fields like Platts assessment codes are left blank on the generated rows."
      />
      <Form form={form} layout="vertical">
        <Form.Item
          name="anchorTickerMappingId"
          label={hint('Anchor Ticker Mapping', 'Roll forward from this ticker mapping — must have a Period set (a rolling/continuous ticker with no fixed tenor can’t be auto-rolled).')}
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select showSearch optionFilterProp="label" options={anchorOptions} placeholder="Select an anchor" />
        </Form.Item>
        <Form.Item name="count" label={hint('Count', 'How many new ticker mappings to generate, rolling forward one tenor at a time from the anchor.', '12')} rules={[{ required: true, message: 'Required' }]} initialValue={12}>
          <InputNumber style={{ width: '100%' }} min={1} max={36} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
