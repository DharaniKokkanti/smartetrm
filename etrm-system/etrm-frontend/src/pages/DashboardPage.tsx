import { Card, Col, Row, Typography } from 'antd';
import { PageHeader } from '@components/layout/PageHeader';

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="ETRM"
        description="Master data, trade, and risk — scaffold build, no live data yet."
      />
      <Row gutter={16}>
        <Col span={8}>
          <Card title="Master Data" bordered>
            <Typography.Paragraph type="secondary">
              135 tables across 10 segments. Tier 1 (core entities) and Tier 2
              (generic reference data) screens land here.
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Trade" bordered>
            <Typography.Paragraph type="secondary">Not yet built.</Typography.Paragraph>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Position & P&L" bordered>
            <Typography.Paragraph type="secondary">Not yet built.</Typography.Paragraph>
          </Card>
        </Col>
      </Row>
    </>
  );
}
