import { Tag } from 'antd';

type StatusPreset =
  | 'ACTIVE' | 'INACTIVE'
  | 'APPROVED' | 'PENDING' | 'REVIEW' | 'SUSPENDED' | 'REJECTED'
  | 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'CLOSED' | 'MATURED'
  | 'IN_SERVICE' | 'MAINTENANCE' | 'OUTAGE' | 'DECOMMISSIONED'
  | 'ISSUED' | 'EXPIRED' | 'DRAWN' | 'AMENDED'
  | 'PHYSICAL' | 'FINANCIAL' | 'OPTIONS' | 'SWAP'
  | 'TRADING' | 'HEDGING' | 'ARBITRAGE' | 'PROP' | 'CLIENT'
  | string;

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'success',
  APPROVED: 'success',
  CONFIRMED: 'success',
  IN_SERVICE: 'success',
  ISSUED: 'success',
  PASSED: 'success',

  PENDING: 'processing',
  REVIEW: 'processing',
  DRAFT: 'processing',
  FIXING_IN_PROGRESS: 'processing',
  TRIGGER_SET: 'processing',

  SUSPENDED: 'warning',
  CONDITIONAL: 'warning',
  MAINTENANCE: 'warning',
  REDUCED_CAPACITY: 'warning',
  WATCH: 'warning',

  REJECTED: 'error',
  CANCELLED: 'error',
  FAILED: 'error',
  EXPIRED: 'error',
  DECOMMISSIONED: 'error',
  BREACH: 'error',
  OUTAGE: 'error',
  RESTRICTED: 'error',

  INACTIVE: 'default',
  CLOSED: 'default',
  MATURED: 'default',
  DRAWN: 'default',
  MOTHBALLED: 'default',
};

export function StatusTag({ value }: { value: StatusPreset }) {
  const display = value.replace(/_/g, ' ');
  return <Tag color={STATUS_COLOR[value] ?? 'default'}>{display}</Tag>;
}

export function ActiveTag({ active }: { active: boolean }) {
  return <Tag color={active ? 'success' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>;
}
