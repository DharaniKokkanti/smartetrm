import type { ReactNode } from 'react';
import { Layout, Menu, Typography, Space, Avatar, Button, Badge, Tooltip, Dropdown } from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, SwapOutlined, FundOutlined,
  SunOutlined, MoonOutlined, CodeOutlined, LogoutOutlined, UserOutlined, HomeOutlined,
  BankOutlined, ShopOutlined, ApartmentOutlined, GlobalOutlined, CalendarOutlined,
  DollarOutlined, DatabaseOutlined, TeamOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '@store/uiStore';
import { useThemeStore } from '@store/themeStore';
import { useApiLogStore } from '@store/apiLogStore';
import { useAuthStore } from '@store/authStore';
import { paletteFor } from '@theme/tokens';
import { ApiLogDrawer } from './ApiLogDrawer';

const { Header, Sider, Content } = Layout;

interface NavChild { key: string; label: string; disabled?: boolean; }
interface NavSection { key: string; icon: ReactNode; label: string; children: NavChild[]; }

const navSections: NavSection[] = [
  {
    key: 'dashboard', icon: <HomeOutlined />, label: 'Dashboard',
    children: [{ key: '/', label: 'Overview & KPIs' }],
  },
  {
    key: 'organization', icon: <ApartmentOutlined />, label: 'Organization',
    children: [
      { key: '/org/desks', label: 'Trading Desks' },
      { key: '/org/books', label: 'Books' },
      { key: '/org/traders', label: 'Traders' },
    ],
  },
  {
    key: 'counterparties', icon: <TeamOutlined />, label: 'Counterparties',
    children: [
      { key: '/tier1/legal-entity', label: 'Legal Entities' },
      { key: '/tier1/counterparty', label: 'Counterparties' },
    ],
  },
  {
    key: 'markets', icon: <ShopOutlined />, label: 'Products & Markets',
    children: [
      { key: '/markets/markets', label: 'Markets' },
      { key: '/markets/products', label: 'Products' },
      { key: '/markets/price-indices', label: 'Price Indices' },
      { key: '/markets/exchanges', label: 'Exchanges' },
    ],
  },
  {
    key: 'logistics', icon: <GlobalOutlined />, label: 'Locations & Logistics',
    children: [
      { key: '/logistics/locations', label: 'Locations' },
      { key: '/logistics/vessels', label: 'Vessels' },
      { key: '/logistics/pipelines', label: 'Pipelines' },
    ],
  },
  {
    key: 'calendar', icon: <CalendarOutlined />, label: 'Calendar & Periods',
    children: [
      { key: '/calendar/holiday-calendars', label: 'Holiday Calendars' },
      { key: '/calendar/periods', label: 'Periods' },
    ],
  },
  {
    key: 'pricing', icon: <DollarOutlined />, label: 'Pricing Config',
    children: [
      { key: '/pricing/price-sources', label: 'Price Sources' },
      { key: '/pricing/pricing-rules', label: 'Pricing Rules' },
    ],
  },
  {
    key: 'reference', icon: <DatabaseOutlined />, label: 'Reference Data',
    children: [
      { key: '/tier2', label: 'All Reference Tables' },
      { key: '/tier1', label: 'Core Entities' },
    ],
  },
  {
    key: 'trade', icon: <SwapOutlined />, label: 'Trade',
    children: [{ key: '/trade/blotter', label: 'Trade Blotter' }],
  },
  {
    key: 'position', icon: <FundOutlined />, label: 'Position',
    children: [{ key: '/position', label: 'Position & P&L', disabled: true }],
  },
];

const allNavChildren = navSections.flatMap((s) => s.children);

export function AppShell() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { mode, toggle: toggleTheme } = useThemeStore();
  const { entries, toggle: toggleApiLog } = useApiLogStore();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const color = paletteFor(mode);

  function handleLogout() { clearAuth(); navigate('/login', { replace: true }); }

  const activeKey = allNavChildren.find((c) => c.key !== '/' && location.pathname.startsWith(c.key))?.key
    ?? (location.pathname === '/' ? '/' : location.pathname);

  const openKeys = navSections.filter((s) => s.children.some((c) => c.key === activeKey)).map((s) => s.key);

  const userMenuItems = [
    { key: 'profile', label: user?.fullName ?? user?.username ?? 'User', disabled: true, style: { cursor: 'default', color: color.textSecondary, fontSize: 12 } },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', onClick: handleLogout },
  ];

  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={toggleSidebar} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <Space align="center" size={8}>
            <BankOutlined style={{ color: '#60a5fa', fontSize: 20 }} />
            <Typography.Text style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>Smart</Typography.Text>
            <Typography.Text style={{ color: '#60a5fa', fontWeight: 700, fontSize: 16 }}>ETRM</Typography.Text>
          </Space>
          <div style={{ flex: 1 }} />
          <Tooltip title="API Activity Log">
            <Badge count={entries.length} size="small" color={color.secondary} overflowCount={99}>
              <Button type="text" icon={<CodeOutlined style={{ color: '#fff', fontSize: 16 }} />} onClick={toggleApiLog} aria-label="API Activity Log" />
            </Badge>
          </Tooltip>
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <Button type="text" icon={mode === 'dark' ? <SunOutlined style={{ color: '#fff', fontSize: 16 }} /> : <MoonOutlined style={{ color: '#fff', fontSize: 16 }} />} onClick={toggleTheme} aria-label="Toggle dark mode" />
          </Tooltip>
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <Tooltip title={user?.fullName ?? 'Account'}>
              <Avatar size={30} style={{ backgroundColor: color.secondary, cursor: 'pointer' }} icon={!user?.fullName ? <UserOutlined /> : undefined}>
                {user?.fullName ? user.fullName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() : null}
              </Avatar>
            </Tooltip>
          </Dropdown>
        </Header>

        <Layout>
          <Sider collapsible collapsed={sidebarCollapsed} trigger={null} width={220} style={{ borderRight: `1px solid ${color.border}` }}>
            <Menu mode="inline" selectedKeys={[activeKey]} defaultOpenKeys={openKeys}
              style={{ borderRight: 'none', paddingTop: 4, fontSize: 13 }}
              items={navSections.map((section) => ({
                key: section.key,
                icon: section.icon,
                label: section.label,
                children: section.children.map((child) => ({ key: child.key, label: child.label, disabled: child.disabled })),
              }))}
              onClick={({ key }) => { void navigate(key); }}
            />
          </Sider>
          <Layout style={{ background: color.bg }}>
            <Content style={{ padding: 24, minHeight: 280 }}>
              <Outlet />
            </Content>
          </Layout>
        </Layout>
      </Layout>
      <ApiLogDrawer />
    </>
  );
}
