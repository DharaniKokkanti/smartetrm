import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Typography, Tag } from 'antd';
import { ApartmentOutlined, GlobalOutlined, BankOutlined, FileProtectOutlined } from '@ant-design/icons';
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
    title: 'Emission Schemes',
    description: 'Cap-and-trade and voluntary carbon schemes — EU ETS, UK ETS, California Cap-and-Trade, RGGI, VCS, Gold Standard. Parent reference for environmental products and surrender obligations.',
    route: '/environmental/schemes',
    icon: <ApartmentOutlined style={{ fontSize: 28 }} />,
    tag: 'Compliance / Voluntary',
    tagColor: 'blue',
  },
  {
    title: 'Environmental Products',
    description: 'Tradeable environmental instruments: EUAs, UKAs, CCAs (allowances), RECs, GOs (certificates), VCUs, CERs (offsets). Each linked to its issuing scheme and registry.',
    route: '/environmental/products',
    icon: <GlobalOutlined style={{ fontSize: 28 }} />,
    tag: 'Allowances / RECs / Offsets',
    tagColor: 'green',
  },
  {
    title: 'Carbon Registries',
    description: 'Registries where environmental instruments are issued, held, and cancelled — EU Union Registry, UK Registry, Verra, Gold Standard, American Carbon Registry.',
    route: '/environmental/registries',
    icon: <BankOutlined style={{ fontSize: 28 }} />,
    tag: 'Compliance / Voluntary',
    tagColor: 'purple',
  },
  {
    title: 'Emission Obligations',
    description: 'Surrender obligations per legal entity per scheme year. Tracks verified emissions, allowances held, shortfall units and surrender deadlines for compliance reporting.',
    route: '/environmental/obligations',
    icon: <FileProtectOutlined style={{ fontSize: 28 }} />,
    tag: 'Surrender / Compliance',
    tagColor: 'orange',
  },
];

export function EnvironmentalHub() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title="Carbon & Environmental"
        description="Master data for environmental commodity trading: emission schemes, tradeable instruments, carbon registries and annual surrender obligations."
        moduleGroup="environmental"
      />
      <Row gutter={[16, 16]}>
        {CARDS.map((c) => (
          <Col key={c.route} xs={24} sm={12} lg={12}>
            <Card
              hoverable
              onClick={() => navigate(c.route)}
              style={{ cursor: 'pointer', height: '100%' }}
              styles={{ body: { display: 'flex', flexDirection: 'column', gap: 10 } }}
            >
              <div style={{ color: '#166534' }}>{c.icon}</div>
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
