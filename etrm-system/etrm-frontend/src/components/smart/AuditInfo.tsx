import { Typography } from 'antd';
import dayjs from 'dayjs';

interface AuditInfoProps {
  createdAt?: string | null;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

/**
 * Read-only "who/when" footer for an edit Drawer/Modal — created_at/by and
 * updated_at/by are real, server-populated columns on every AuditableEntity
 * table (never user-editable, so never a Form.Item), but were previously
 * fetched and then silently dropped by every dedicated master-data page,
 * leaving users with no way to see who touched a record or when.
 * Renders nothing for a brand-new (unsaved) record.
 */
export function AuditInfo({ createdAt, createdBy, updatedAt, updatedBy }: AuditInfoProps) {
  if (!createdAt) return null;
  const fmt = (v: string) => dayjs(v).format('DD MMM YYYY HH:mm');
  return (
    <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Created {fmt(createdAt)}{createdBy ? ` by ${createdBy}` : ''}
        {updatedAt && updatedAt !== createdAt && (
          <> · Updated {fmt(updatedAt)}{updatedBy ? ` by ${updatedBy}` : ''}</>
        )}
      </Typography.Text>
    </div>
  );
}
