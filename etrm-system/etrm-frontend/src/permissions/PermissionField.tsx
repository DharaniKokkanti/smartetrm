import type { ReactNode } from 'react';
import { Tooltip, Typography } from 'antd';
import { LockOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import type { FieldPermissionMap } from './types';

const { Text } = Typography;

interface PermissionFieldProps {
  fieldKey: string;
  permissions: FieldPermissionMap;
  /** Current display value shown when field is VIEW-only (pass the formatted string). */
  readValue?: ReactNode;
  /** Tooltip shown when the field is VIEW due to a Layer 1 lock. */
  lockReason?: string;
  children: ReactNode;
}

/**
 * Wraps any form field and enforces the effective permission for that field.
 *
 *   EDIT   → renders children as-is (fully interactive)
 *   VIEW   → renders readValue (or children as disabled) with a lock icon if Layer 1 locked
 *   HIDDEN → renders nothing
 *
 * Usage:
 *   <PermissionField fieldKey="price" permissions={permissions} readValue={trade.price}>
 *     <InputNumber ... />
 *   </PermissionField>
 */
export function PermissionField({
  fieldKey,
  permissions,
  readValue,
  lockReason,
  children,
}: PermissionFieldProps) {
  const level = permissions[fieldKey] ?? 'EDIT';

  if (level === 'HIDDEN') return null;

  if (level === 'VIEW') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 32 }}>
        <Text style={{ flex: 1 }}>
          {readValue ?? <Text type="secondary">—</Text>}
        </Text>
        {lockReason ? (
          <Tooltip title={lockReason}>
            <LockOutlined style={{ color: '#faad14', fontSize: 13 }} />
          </Tooltip>
        ) : (
          <Tooltip title="View only — your role does not have edit access to this field">
            <EyeInvisibleOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
          </Tooltip>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
