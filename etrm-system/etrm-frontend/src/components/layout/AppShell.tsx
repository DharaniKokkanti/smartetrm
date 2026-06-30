import { Layout, Menu, Typography, Space, Avatar, Button, Badge, Tooltip, Dropdown } from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, SwapOutlined, FundOutlined,
  SunOutlined, MoonOutlined, CodeOutlined, LogoutOutlined, UserOutlined, HomeOutlined,
  BankOutlined, AppstoreOutlined, TableOutlined, TeamOutlined, SafetyCertificateOutlined,
  ControlOutlined, AlertOutlined, DollarOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '@store/uiStore';
import { useThemeStore } from '@store/themeStore';
import { useApiLogStore } from '@store/apiLogStore';
import { useAuthStore } from '@store/authStore';
import { paletteFor } from '@theme/tokens';
import { ApiLogDrawer } from './ApiLogDrawer';

const { Header, Sider, Content } = Layout;

const NAV_ITEMS = [
  { key: '/',               icon: <HomeOutlined />,       label: 'Dashboard' },
  { key: '/trade/blotter',  icon: <SwapOutlined />,       label: 'Trade Blotter' },
  { key: '/position',       icon: <FundOutlined />,       label: 'Position & P&L' },
  { type: 'divider' as const },
  {
    type: 'group' as const,
    label: <span style={{ fontSize: 10, letterSpacing: 1, fontWeight: 700, color: '#6b7280' }}>MASTER DATA</span>,
    children: [
      { key: '/master-data', icon: <AppstoreOutlined />, label: 'Master Data Hub' },
      { key: '/static-data', icon: <TableOutlined />,    label: 'Static Data' },
    ],
  },
  { type: 'divider' as const },
  {
    type: 'group' as const,
    label: <span style={{ fontSize: 10, letterSpacing: 1, fontWeight: 700, color: '#6b7280' }}>CREDIT & RISK</span>,
    children: [
      { key: '/credit',                     icon: <SafetyCertificateOutlined />, label: 'Credit Hub' },
      { key: '/credit/margin-agreements',   icon: <DollarOutlined />,            label: 'Margin Agreements' },
      { key: '/credit/limits',              icon: <AlertOutlined />,             label: 'Credit Limits' },
      { key: '/credit/letters-of-credit',   icon: <BankOutlined />,              label: 'Letters of Credit' },
    ],
  },
  { type: 'divider' as const },
  {
    type: 'group' as const,
    label: <span style={{ fontSize: 10, letterSpacing: 1, fontWeight: 700, color: '#6b7280' }}>ADMIN</span>,
    children: [
      { key: '/admin/users',              icon: <TeamOutlined />,                label: 'Users' },
      { key: '/admin/roles',              icon: <SafetyCertificateOutlined />,   label: 'Roles & Permissions' },
      { key: '/admin/field-permissions',  icon: <ControlOutlined />,             label: 'Field Permissions' },
    ],
  },
];

const ALL_KEYS = [
  '/', '/trade/blotter', '/position', '/static-data', '/master-data',
  '/credit/margin-agreements', '/credit/limits', '/credit/letters-of-credit', '/credit',
  '/admin/users', '/admin/roles', '/admin/field-permissions',
];

export function AppShell() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { mode, toggle: toggleTheme } = useThemeStore();
  const { entries, toggle: toggleApiLog } = useApiLogStore();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const color = paletteFor(mode);

  function handleLogout() { clearAuth(); navigate('/login', { replace: true }); }

  const activeKey =
    ALL_KEYS.find((k) => k !== '/' && location.pathname.startsWith(k)) ??
    (location.pathname === '/' ? '/' : '/master-data');

  const userMenuItems = [
    {
      key: 'profile', label: user?.fullName ?? user?.username ?? 'User',
      disabled: true, style: { cursor: 'default', color: color.textSecondary, fontSize: 12 },
    },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', onClick: handleLogout },
  ];

  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
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
            <Button
              type="text"
              icon={mode === 'dark'
                ? <SunOutlined style={{ color: '#fff', fontSize: 16 }} />
                : <MoonOutlined style={{ color: '#fff', fontSize: 16 }} />}
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            />
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
          <Sider collapsible collapsed={sidebarCollapsed} trigger={null} width={210} style={{ borderRight: `1px solid ${color.border}` }}>
            <Menu
              mode="inline"
              selectedKeys={[activeKey]}
              style={{ borderRight: 'none', paddingTop: 4, fontSize: 13 }}
              items={NAV_ITEMS}
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
