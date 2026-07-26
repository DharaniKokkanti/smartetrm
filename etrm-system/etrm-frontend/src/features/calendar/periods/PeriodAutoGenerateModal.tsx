import { useMemo } from 'react';
import { Modal, Form, Select, InputNumber, Alert } from 'antd';
import { hint } from '@components/smart/FieldHint';
import { useAutoGeneratePeriods } from './hooks';
import { AUTO_GENERATE_PERIOD_TYPES } from './types';
import type { MarketProductLinkOption, Period } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  marketProducts: MarketProductLinkOption[];
  periods: Period[];
}

interface FormValues {
  marketProductLinkId: number;
  anchorPeriodId: number | null;
  iterations: number;
}

export function PeriodAutoGenerateModal({ open, onClose, marketProducts, periods }: Props) {
  const [form] = Form.useForm<FormValues>();
  const autoGenerate = useAutoGeneratePeriods();
  const watchedMarketProductId = Form.useWatch('marketProductLinkId', form);

  const candidateAnchors = useMemo(
    () =>
      periods
        .filter((p) => p.marketProductLinkId === watchedMarketProductId && (AUTO_GENERATE_PERIOD_TYPES as readonly string[]).includes(p.periodType))
        .sort((a, b) => (a.startDate < b.startDate ? 1 : -1)),
    [periods, watchedMarketProductId],
  );

  async function handleOk() {
    const v = await form.validateFields();
    await autoGenerate.mutateAsync({
      marketProductLinkId: v.marketProductLinkId,
      anchorPeriodId: v.anchorPeriodId ?? null,
      iterations: v.iterations,
    });
    form.resetFields();
    onClose();
  }

  return (
    <Modal mask={false} forceRender
      title="Auto-Generate Periods"
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
        message="Takes the latest existing period for the selected market product (or a chosen anchor) and rolls forward one calendar step at a time — e.g. MONTH periods roll month by month. Only MONTH/QUARTER/HALF_YEAR/YEAR/WEEK/DAY are supported; other period types don't have an unambiguous next-period convention."
      />
      <Form form={form} layout="vertical">
        <Form.Item name="marketProductLinkId" label={hint('Market Product', 'Which market + product to generate the next periods for.')} rules={[{ required: true, message: 'Required' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={marketProducts.map((m) => ({ value: m.marketProductLinkId, label: `${m.marketCode ?? '—'} / ${m.productCode ?? '—'}` }))}
          />
        </Form.Item>
        <Form.Item name="anchorPeriodId" label={hint('Anchor Period', 'Roll forward from this period. Leave blank to use the latest existing period (by start date) for this market product.')}>
          <Select
            allowClear
            disabled={!watchedMarketProductId}
            placeholder="Latest existing period"
            options={candidateAnchors.map((p) => ({ value: p.periodId, label: `${p.periodCode} (${p.startDate})` }))}
          />
        </Form.Item>
        <Form.Item name="iterations" label={hint('Iterations', 'How many new periods to generate, rolling forward one at a time from the anchor.', '12')} rules={[{ required: true, message: 'Required' }]} initialValue={12}>
          <InputNumber style={{ width: '100%' }} min={1} max={120} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
