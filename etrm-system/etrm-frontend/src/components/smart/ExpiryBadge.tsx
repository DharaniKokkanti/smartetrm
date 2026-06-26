import { Tag, Tooltip } from 'antd';
import { WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface ExpiryBadgeProps {
  expiryDate: string | null | undefined;
  label?: string;
}

export function ExpiryBadge({ expiryDate, label }: ExpiryBadgeProps) {
  if (!expiryDate) return <Tag color="default">—</Tag>;

  const today = dayjs();
  const expiry = dayjs(expiryDate);
  const daysLeft = expiry.diff(today, 'day');

  if (daysLeft < 0) {
    return (
      <Tooltip title={`Expired ${Math.abs(daysLeft)} days ago`}>
        <Tag color="error" icon={<WarningOutlined />}>
          EXPIRED
        </Tag>
      </Tooltip>
    );
  }

  if (daysLeft <= 7) {
    return (
      <Tooltip title={`Expires ${expiry.format('DD MMM YYYY')} — ${daysLeft} day(s) left`}>
        <Tag color="error" icon={<WarningOutlined />}>
          {daysLeft}d
        </Tag>
      </Tooltip>
    );
  }

  if (daysLeft <= 30) {
    return (
      <Tooltip title={`Expires ${expiry.format('DD MMM YYYY')} — ${daysLeft} days left`}>
        <Tag color="warning" icon={<ClockCircleOutlined />}>
          {daysLeft}d
        </Tag>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={label ?? expiryDate}>
      <Tag color="success">{expiry.format('DD MMM YY')}</Tag>
    </Tooltip>
  );
}
