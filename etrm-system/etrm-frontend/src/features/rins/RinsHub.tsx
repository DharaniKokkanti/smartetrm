import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Typography, Tag } from 'antd';
import { TagsOutlined, IdcardOutlined, SwapOutlined, InboxOutlined, AuditOutlined } from '@ant-design/icons';
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
    title: 'Fuel Categories (D-Codes)',
    description: 'EPA D-code master table: D3 Cellulosic (3.0 RINs/gal), D4 Biomass Diesel (1.5), D5 Advanced (1.5), D6 Conventional Ethanol (1.0), D7 Cellulosic Diesel (1.7). Drives RIN generation volume calculations.',
    route: '/rins/fuel-categories',
    icon: <TagsOutlined style={{ fontSize: 28 }} />,
    tag: '40 CFR Part 80',
    tagColor: 'purple',
  },
  {
    title: 'RIN Accounts',
    description: 'EPA EMTS (Moderated Transaction System) accounts per legal entity. Company-level accounts for obligated parties; facility-level accounts for renewable fuel producers registering RIN generation.',
    route: '/rins/accounts',
    icon: <IdcardOutlined style={{ fontSize: 28 }} />,
    tag: 'EPA EMTS',
    tagColor: 'blue',
  },
  {
    title: 'RIN Transactions',
    description: 'Append-only transaction ledger: Generate, Separate, Transfer (Buy/Sell), and Retire. Each entry records D-code, vintage year, quantity, price, counterparty, and EPA EMTS confirmation ID.',
    route: '/rins/transactions',
    icon: <SwapOutlined style={{ fontSize: 28 }} />,
    tag: 'Generate / Transfer / Retire',
    tagColor: 'green',
  },
  {
    title: 'RIN Inventory',
    description: 'Current RIN position by D-code, vintage year, and account — derived from all confirmed transactions. Shows average cost basis and total mark-to-market value.',
    route: '/rins/inventory',
    icon: <InboxOutlined style={{ fontSize: 28 }} />,
    tag: 'Position View',
    tagColor: 'cyan',
  },
  {
    title: 'RVO Obligations',
    description: 'Annual Renewable Volume Obligations per legal entity and D-code. Tracks required vs. retired RINs, shortfall, and compliance deadline. Alerts on overdue and near-deadline positions.',
    route: '/rins/obligations',
    icon: <AuditOutlined style={{ fontSize: 28 }} />,
    tag: 'RVO / Compliance',
    tagColor: 'orange',
  },
];

export function RinsHub() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="RINs — Renewable Fuel Standard"
        description="US EPA RFS2 compliance module. Manage D-code fuel categories, EPA EMTS accounts, RIN transactions (generate/separate/transfer/retire), current inventory position, and annual Renewable Volume Obligation (RVO) tracking."
        moduleGroup="rins"
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
