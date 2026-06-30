import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Typography, Tag } from 'antd';
import {
  SafetyCertificateOutlined, DollarOutlined, BankOutlined, AlertOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@components/layout/PageHeader';

const { Text } = Typography;

interface HubCard {
  title: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  tag: string;
  tagColor: string;
}

const CARDS: HubCard[] = [
  {
    title: 'Margin Agreements',
    description: 'CSA and pledge agreements: threshold amounts, MTA, independent amounts and eligible collateral per counterparty.',
    route: '/credit/margin-agreements',
    icon: <SafetyCertificateOutlined style={{ fontSize: 28 }} />,
    tag: 'CSA / Pledge',
    tagColor: 'blue',
  },
  {
    title: 'Credit Limits',
    description: 'Pre-settlement, settlement and MTM credit limits per counterparty. Real-time utilisation tracking with breach alerts.',
    route: '/credit/limits',
    icon: <AlertOutlined style={{ fontSize: 28 }} />,
    tag: 'Exposure Limits',
    tagColor: 'orange',
  },
  {
    title: 'Letters of Credit',
    description: 'Standby and documentary LCs received as credit support. Tracks face value, drawdowns, evergreen provisions and expiry.',
    route: '/credit/letters-of-credit',
    icon: <BankOutlined style={{ fontSize: 28 }} />,
    tag: 'LC / Bank Guarantee',
    tagColor: 'purple',
  },
];

export function CreditHub() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="Credit & Risk Setup"
        description="Master data for counterparty credit management: margin agreements (CSA), credit limits and letters of credit."
        moduleGroup="credit"
      />
      <Row gutter={[16, 16]}>
        {CARDS.map((c) => (
          <Col key={c.route} xs={24} sm={12} lg={8}>
            <Card
              hoverable
              onClick={() => navigate(c.route)}
              style={{ cursor: 'pointer', height: '100%' }}
              styles={{ body: { display: 'flex', flexDirection: 'column', gap: 10 } }}
            >
              <div style={{ color: '#1677ff' }}>{c.icon}</div>
              <div>
                <Text strong style={{ fontSize: 15 }}>{c.title}</Text>
                <br />
                <Tag color={c.tagColor} style={{ marginTop: 4, fontSize: 10 }}>{c.tag}</Tag>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>{c.description}</Text>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
