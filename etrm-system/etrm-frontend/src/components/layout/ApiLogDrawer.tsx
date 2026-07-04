import { Drawer, Table, Tag, Button, Typography, Empty, Space } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useApiLogStore, type ApiLogEntry } from '@store/apiLogStore';

const METHOD_COLOR: Record<string, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'gold',
  PATCH: 'purple',
  DELETE: 'red',
};

function statusColor(status: number | null): string {
  if (status === null) return 'default';
  if (status < 300) return 'success';
  if (status < 400) return 'processing';
  if (status < 500) return 'warning';
  return 'error';
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
      <pre
        style={{
          margin: '4px 0 0',
          padding: 10,
          background: 'var(--etrm-code-bg)',
          borderRadius: 6,
          fontSize: 12,
          fontFamily: "'IBM Plex Mono', monospace",
          maxHeight: 220,
          overflow: 'auto',
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export function ApiLogDrawer() {
  const { entries, isOpen, close, clear } = useApiLogStore();

  const columns: ColumnsType<ApiLogEntry> = [
    {
      title: 'Method',
      dataIndex: 'method',
      width: 90,
      render: (m: string) => <Tag color={METHOD_COLOR[m] ?? 'default'}>{m}</Tag>,
    },
    { title: 'Endpoint', dataIndex: 'url', render: (v) => <Typography.Text code>{v}</Typography.Text> },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 90,
      render: (status: number | null) => <Tag color={statusColor(status)}>{status ?? 'Failed'}</Tag>,
    },
    {
      title: 'Time',
      dataIndex: 'durationMs',
      width: 80,
      render: (ms: number | null) => (ms === null ? '—' : `${ms} ms`),
    },
    {
      title: 'When',
      dataIndex: 'startedAt',
      width: 90,
      render: (iso: string) => new Date(iso).toLocaleTimeString(),
    },
  ];

  return (
    <Drawer mask={false} forceRender
      title={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>API Activity Log</span>
          <Button size="small" icon={<ClearOutlined />} onClick={clear} disabled={entries.length === 0}>
            Clear
          </Button>
        </Space>
      }
      open={isOpen}
      onClose={close}
      width={620}
      styles={{ body: { padding: 0 } }}
    >
      {entries.length === 0 ? (
        <Empty
          description="No API calls yet — they'll show up here live as you use the app."
          style={{ marginTop: 80 }}
        />
      ) : (
        <Table<ApiLogEntry>
          size="small"
          rowKey="id"
          dataSource={entries}
          columns={columns}
          pagination={{ pageSize: 20 }}
          expandable={{
            expandedRowRender: (entry) => (
              <div style={{ padding: '8px 0' }}>
                {entry.error && (
                  <Typography.Text type="danger" style={{ display: 'block', marginBottom: 8 }}>
                    {entry.error}
                  </Typography.Text>
                )}
                <JsonBlock label="Request body" value={entry.requestBody} />
                <JsonBlock label="Response body" value={entry.responseBody} />
              </div>
            ),
          }}
        />
      )}
    </Drawer>
  );
}
