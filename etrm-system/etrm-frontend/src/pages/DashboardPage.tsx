import { Card, Col, Row, Typography } from 'antd';
import { PageHeader } from '@components/layout/PageHeader';

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="ETRM"
        description="Master data, trade, and risk — build in progress against a live SQL Server backend."
      />
      <Row gutter={16}>
        <Col span={8}>
          <Card title="Master Data" bordered>
            <Typography.Paragraph type="secondary">
              302 tables across 17 segments. Tier 1 (core entities) and Tier 2
              (generic reference data) screens land here.
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Trade" bordered>
            <Typography.Paragraph type="secondary">
              Trade Blotter and order/item capture are built.
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Position & P&L" bordered>
            <Typography.Paragraph type="secondary">
              Position by commodity is built. P&amp;L is not yet built.
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>
    </>
  );
}
