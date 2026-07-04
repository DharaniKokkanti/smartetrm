import type { ReactNode } from 'react';
import { Tooltip, Typography, Space } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

interface FieldHintProps {
  label: string;
  hint: string;
  example?: string;
  format?: string;
  required?: boolean;
}

/**
 * Wraps any form label with an inline info icon that opens a tooltip
 * explaining the ETRM-specific meaning of the field — its industry context,
 * accepted format, and a concrete example from the domain. This is the key
 * UX differentiator for a Noname ETRM vs a traditional data-entry form.
 */
export function FieldHint({ label, hint, example, format, required }: FieldHintProps) {
  const content = (
    <div style={{ maxWidth: 280 }}>
      <Typography.Text style={{ color: '#fff', fontSize: 12 }}>{hint}</Typography.Text>
      {format && (
        <div style={{ marginTop: 6 }}>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
            Format: <span style={{ fontFamily: 'monospace', color: '#7EC8E3' }}>{format}</span>
          </Typography.Text>
        </div>
      )}
      {example && (
        <div style={{ marginTop: 4 }}>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
            Example: <span style={{ fontFamily: 'monospace', color: '#98E098' }}>{example}</span>
          </Typography.Text>
        </div>
      )}
    </div>
  );

  return (
    <Space size={4} align="center">
      {required && <span style={{ color: '#ff4d4f', fontSize: 12, lineHeight: 1 }}>*</span>}
      <span>{label}</span>
      <Tooltip title={content} color="#1a1a2e" overlayInnerStyle={{ padding: '8px 12px' }}>
        <InfoCircleOutlined style={{ fontSize: 12, opacity: 0.45, cursor: 'help' }} />
      </Tooltip>
    </Space>
  );
}

export function hint(label: string, hintText: string, example?: string, format?: string): ReactNode {
  return <FieldHint label={label} hint={hintText} example={example} format={format} />;
}
