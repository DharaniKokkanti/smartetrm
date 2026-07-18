import type { CSSProperties, ReactNode } from 'react';
import { Typography, Space } from 'antd';
import { color, moduleColor } from '@theme/tokens';

interface PageHeaderProps {
  title: string;
  description?: string;
  descriptionStyle?: CSSProperties;
  moduleGroup?: string;
  extra?: ReactNode;
}

/**
 * The one signature device used throughout the app: a thin colored rail on
 * the left edge of every page header, colored by moduleGroup. With 135
 * master data tables split across many modules, this gives a constant,
 * low-effort visual answer to "which part of the system am I in" — the same
 * job color does in the schema reference docs, carried into the live app.
 */
export function PageHeader({ title, description, descriptionStyle, moduleGroup, extra }: PageHeaderProps) {
  const railColor = moduleGroup ? moduleColor(moduleGroup) : color.primary;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderLeft: `3px solid ${railColor}`,
        paddingLeft: 16,
        marginBottom: 24,
      }}
    >
      <div>
        <Space align="center" size={10}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
        </Space>
        {description && (
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, ...descriptionStyle }}>
            {description}
          </Typography.Text>
        )}
      </div>
      {extra}
    </div>
  );
}
