import { useMemo, useState } from 'react';
import { Alert, Button, Empty, Form, Input, Modal, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useLegalEntityBankAccounts } from '@features/tier1/legal-entity/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import {
  useCreateSettlementInstruction,
  useRejectSettlementInstruction,
  useSettlementInstructions,
  useVerifySettlementInstruction,
} from './hooks';
import type { BankAccount, SettlementInstruction, SettlementInstructionDirection, SettlementInstructionStatus } from './types';

interface Props {
  counterpartyId: number | null;
  /** The counterparty's own bank accounts, already loaded on the parent
   *  form (useCounterpartyChildren) — reused here rather than re-fetching,
   *  needed for PAY-direction account selection. */
  counterpartyBankAccounts: BankAccount[];
}

const STATUS_COLOR: Record<SettlementInstructionStatus, string> = {
  PENDING_VERIFICATION: 'gold',
  ACTIVE: 'green',
  SUPERSEDED: 'default',
  REJECTED: 'red',
};

const VERIFICATION_METHODS = [
  { value: 'CALLBACK_CONFIRMED', label: 'Callback Confirmed' },
  { value: 'SIGNED_LETTER', label: 'Signed Letter' },
  { value: 'SWIFT_MT', label: 'SWIFT MT Message' },
  { value: 'BANK_PORTAL_CONFIRMED', label: 'Bank Portal Confirmed' },
  { value: 'OTHER', label: 'Other' },
];

export function SettlementInstructionsPanel({ counterpartyId, counterpartyBankAccounts }: Props) {
  const { data: instructions = [], isLoading } = useSettlementInstructions(counterpartyId);
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: currencies = [] } = useCurrencies();
  const create = useCreateSettlementInstruction(counterpartyId);
  const verify = useVerifySettlementInstruction(counterpartyId);
  const reject = useRejectSettlementInstruction(counterpartyId);

  const [modalOpen, setModalOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [verifyForm] = Form.useForm();
  const direction: SettlementInstructionDirection | undefined = Form.useWatch('direction', form);
  const ourEntityId: number | undefined = Form.useWatch('ourEntityId', form);

  const { data: ourEntityBankAccounts = [] } = useLegalEntityBankAccounts(ourEntityId ?? null);

  const legalEntityOptions = legalEntities.map((e) => ({ label: `${e.entityCode} — ${e.entityName}`, value: e.legalEntityId }));
  const currencyOptions = currencies.filter((c) => c.isActive).map((c) => ({ label: c.currencyCode, value: c.currencyId }));

  // PAY -> account must be the counterparty's own; RECEIVE -> must be ours;
  // BOTH -> either. Mirrors SettlementInstructionService.validateAccountOwnership.
  const bankAccountOptions = useMemo(() => {
    const cpOpts = counterpartyBankAccounts
      .filter((a) => a.bankAccountId !== null && a.isActive)
      .map((a) => ({ label: `${a.bankName} — ${a.accountName} (Counterparty)`, value: a.bankAccountId as number }));
    const ourOpts = ourEntityBankAccounts
      .filter((a) => a.isActive)
      .map((a) => ({ label: `${a.bankName} — ${a.accountName} (Ours)`, value: a.bankAccountId as number }));
    if (direction === 'PAY') return cpOpts;
    if (direction === 'RECEIVE') return ourOpts;
    return [...cpOpts, ...ourOpts];
  }, [direction, counterpartyBankAccounts, ourEntityBankAccounts]);

  const columns: ColumnsType<SettlementInstruction> = [
    { title: 'Code', dataIndex: 'instructionCode', width: 110 },
    { title: 'Direction', dataIndex: 'direction', width: 90 },
    {
      title: 'Currency', dataIndex: 'currencyId', width: 90,
      render: (v: number | null) => (v === null ? 'Any' : currencies.find((c) => c.currencyId === v)?.currencyCode ?? v),
    },
    { title: 'Valid From', dataIndex: 'validFrom', width: 110 },
    { title: 'Valid To', dataIndex: 'validTo', width: 110, render: (v: string | null) => v ?? '—' },
    {
      title: 'Status', dataIndex: 'status', width: 150,
      render: (v: SettlementInstructionStatus) => <Tag color={STATUS_COLOR[v]}>{v.replace('_', ' ')}</Tag>,
    },
    { title: 'Verified By', dataIndex: 'verifiedBy', width: 110, render: (v: string | null) => v ?? '—' },
    {
      title: '', key: 'actions', width: 160,
      render: (_, record) =>
        record.status === 'PENDING_VERIFICATION' ? (
          <Space>
            <Button size="small" type="primary" onClick={() => { setVerifyingId(record.settlementInstructionId); verifyForm.resetFields(); }}>
              Verify
            </Button>
            <Button size="small" danger onClick={() => reject.mutate({ id: record.settlementInstructionId })}>
              Reject
            </Button>
          </Space>
        ) : null,
    },
  ];

  if (counterpartyId === null) {
    return <Empty description="Save this counterparty first, then set up settlement instructions." />;
  }

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Settlement instructions must be verified by someone other than the person who created them before they become active — this is a fraud control against bank-detail-change (payment redirect) fraud, not extra process for its own sake."
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button icon={<PlusOutlined />} onClick={() => { form.resetFields(); form.setFieldsValue({ direction: 'PAY', validFrom: dayjs() }); setModalOpen(true); }}>
          Add Settlement Instruction
        </Button>
      </div>
      <Table
        rowKey="settlementInstructionId"
        loading={isLoading}
        dataSource={instructions}
        columns={columns}
        pagination={false}
      />

      <Modal
        title="New Settlement Instruction"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={create.isPending}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            create.mutate(
              {
                ourEntityId: values.ourEntityId,
                direction: values.direction,
                currencyId: values.currencyId ?? null,
                productScope: null,
                bankAccountId: values.bankAccountId,
                validFrom: values.validFrom.format('YYYY-MM-DD'),
                notes: values.notes ?? null,
              },
              { onSuccess: () => setModalOpen(false) },
            );
          }}
        >
          <Form.Item
            name="direction"
            label={hint('Direction', 'PAY = we pay the counterparty (their account). RECEIVE = the counterparty pays us (our own account). BOTH = same account either way.')}
            rules={[{ required: true }]}
          >
            <Select options={[{ value: 'PAY', label: 'PAY — we pay them' }, { value: 'RECEIVE', label: 'RECEIVE — they pay us' }, { value: 'BOTH', label: 'BOTH' }]} />
          </Form.Item>
          <Form.Item name="ourEntityId" label="Our Legal Entity" rules={[{ required: true }]}>
            <Select options={legalEntityOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="currencyId"
            label={hint('Currency', 'Leave blank to make this the default instruction across all currencies for this counterparty/direction.')}
          >
            <Select options={currencyOptions} allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="bankAccountId"
            label={hint('Bank Account', direction === 'RECEIVE' ? 'Must be one of our own legal entity\'s accounts.' : 'Must be one of the counterparty\'s own accounts.')}
            rules={[{ required: true }]}
          >
            <Select options={bankAccountOptions} showSearch optionFilterProp="label" notFoundContent={direction === 'RECEIVE' ? 'No bank accounts recorded yet for the selected legal entity.' : undefined} />
          </Form.Item>
          <Form.Item name="validFrom" label="Valid From" rules={[{ required: true }]}>
            <AppDatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Verify Settlement Instruction"
        open={verifyingId !== null}
        onCancel={() => setVerifyingId(null)}
        onOk={() => verifyForm.submit()}
        confirmLoading={verify.isPending}
        destroyOnClose
      >
        <Form
          form={verifyForm}
          layout="vertical"
          onFinish={(values) => {
            if (verifyingId === null) return;
            verify.mutate(
              { id: verifyingId, verificationMethod: values.verificationMethod },
              { onSuccess: () => setVerifyingId(null) },
            );
          }}
        >
          <Form.Item
            name="verificationMethod"
            label={hint('Verification Method', 'How the new account was independently confirmed with the counterparty — never verify from the same email/document that requested the change.')}
            rules={[{ required: true }]}
          >
            <Select options={VERIFICATION_METHODS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
