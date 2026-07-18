import { useState } from 'react';
import { Layout, Menu, Typography, Space, Avatar, Button, Badge, Tooltip, Dropdown } from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, SwapOutlined, FundOutlined,
  SunOutlined, MoonOutlined, CodeOutlined, LogoutOutlined, UserOutlined, HomeOutlined,
  BankOutlined, AppstoreOutlined, TableOutlined, TeamOutlined, SafetyCertificateOutlined,
  ControlOutlined, AlertOutlined, DollarOutlined, CloudOutlined, ApartmentOutlined,
  GlobalOutlined, FileProtectOutlined, AccountBookOutlined,
  AuditOutlined, TagsOutlined, IdcardOutlined, InboxOutlined,
  LineChartOutlined, StockOutlined, ScheduleOutlined, ReconciliationOutlined, CalendarOutlined,
  DatabaseOutlined, SettingOutlined, DoubleLeftOutlined, DoubleRightOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '@store/uiStore';
import { useThemeStore } from '@store/themeStore';
import { useApiLogStore } from '@store/apiLogStore';
import { useAuthStore } from '@store/authStore';
import { paletteFor } from '@theme/tokens';
import { ApiLogDrawer } from './ApiLogDrawer';
import { MinimizedDraftsDock } from './MinimizedDraftsDock';

const { Header, Sider, Content } = Layout;

// Hub groups render as collapsible submenus — all collapsed by default,
// accordion behaviour (opening one closes the others).
const NAV_ITEMS = [
  { key: '/',               icon: <HomeOutlined />,       label: 'Dashboard' },
  { key: '/trade/blotter',  icon: <SwapOutlined />,       label: 'Trade Blotter' },
  { key: '/position',       icon: <FundOutlined />,       label: 'Position & P&L' },
  { type: 'divider' as const },
  {
    key: 'g-master-data', icon: <DatabaseOutlined />, label: 'Master Data',
    children: [
      { key: '/master-data',         icon: <AppstoreOutlined />,    label: 'Master Data Hub' },
      { key: '/static-data',         icon: <TableOutlined />,       label: 'Static Data' },
      { key: '/finance/gl-accounts', icon: <AccountBookOutlined />, label: 'GL Accounts' },
    ],
  },
  {
    key: 'g-books', icon: <AccountBookOutlined />, label: 'Book Manager',
    children: [
      { key: '/org/books', icon: <AccountBookOutlined />, label: 'P&L Books' },
      { key: '/org/books/hierarchy', icon: <ApartmentOutlined />, label: 'Book Hierarchy' },
    ],
  },
  {
    key: 'g-credit', icon: <SafetyCertificateOutlined />, label: 'Credit & Risk',
    children: [
      { key: '/credit/margin-agreements',   icon: <DollarOutlined />,            label: 'Margin Agreements' },
      { key: '/credit/limits',              icon: <AlertOutlined />,             label: 'Credit Limits' },
      { key: '/credit/letters-of-credit',   icon: <BankOutlined />,              label: 'Letters of Credit' },
    ],
  },
  {
    key: 'g-pricing', icon: <LineChartOutlined />, label: 'Pricing',
    children: [
      { key: '/pricing/pricing-rules',     icon: <DollarOutlined />,      label: 'Pricing Rules' },
      { key: '/pricing/price-sources',    icon: <LineChartOutlined />,   label: 'Price Sources' },
      { key: '/pricing/settlement-prices',icon: <ScheduleOutlined />,    label: 'Settlement Prices' },
      { key: '/pricing/tas',              icon: <StockOutlined />,       label: 'TAS Dashboard' },
      { key: '/pricing/balmo-products',   icon: <CalendarOutlined />,    label: 'BALMO Products' },
      { key: '/pricing/balmo',            icon: <LineChartOutlined />,   label: 'BALMO Dashboard' },
    ],
  },
  {
    key: 'g-operations', icon: <ReconciliationOutlined />, label: 'Operations',
    children: [
      { key: '/bolmo', icon: <ReconciliationOutlined />, label: 'BOLMO / Book-Outs' },
    ],
  },
  {
    key: 'g-regulatory', icon: <AuditOutlined />, label: 'Regulatory',
    children: [
      { key: '/rins/fuel-categories',  icon: <TagsOutlined />,          label: 'Fuel Categories' },
      { key: '/rins/accounts',         icon: <IdcardOutlined />,        label: 'RIN Accounts' },
      { key: '/rins/transactions',     icon: <SwapOutlined />,          label: 'RIN Transactions' },
      { key: '/rins/inventory',        icon: <InboxOutlined />,         label: 'RIN Inventory' },
      { key: '/rins/obligations',      icon: <FileProtectOutlined />,   label: 'RVO Obligations' },
    ],
  },
  {
    key: 'g-environmental', icon: <CloudOutlined />, label: 'Environmental',
    children: [
      { key: '/environmental/schemes',     icon: <ApartmentOutlined />,     label: 'Emission Schemes' },
      { key: '/environmental/products',    icon: <GlobalOutlined />,        label: 'Env. Products' },
      { key: '/environmental/registries',  icon: <BankOutlined />,          label: 'Carbon Registries' },
      { key: '/environmental/obligations', icon: <FileProtectOutlined />,   label: 'Emission Obligations' },
    ],
  },
  {
    key: 'g-admin', icon: <SettingOutlined />, label: 'Admin',
    children: [
      { key: '/admin/users',              icon: <TeamOutlined />,                label: 'Users' },
      { key: '/admin/roles',              icon: <SafetyCertificateOutlined />,   label: 'Roles & Permissions' },
      { key: '/admin/field-permissions',  icon: <ControlOutlined />,             label: 'Field Permissions' },
    ],
  },
];

const ALL_KEYS = [
  '/', '/trade/blotter', '/position', '/static-data', '/master-data',
  '/org/books/hierarchy', '/org/books',
  '/credit/margin-agreements', '/credit/limits', '/credit/letters-of-credit',
  '/pricing/settlement-prices', '/pricing/tas', '/pricing/pricing-rules', '/pricing/price-sources',
  '/pricing/balmo-products', '/pricing/balmo',
  '/bolmo',
  '/rins/fuel-categories', '/rins/accounts', '/rins/transactions', '/rins/inventory', '/rins/obligations',
  '/environmental/schemes', '/environmental/products', '/environmental/registries', '/environmental/obligations',
  '/finance/gl-accounts',
  '/admin/users', '/admin/roles', '/admin/field-permissions',
];

// route prefix → submenu group key (used to auto-open the group of the current page)
function groupKeyFor(pathname: string): string[] {
  if (pathname.startsWith('/master-data') || pathname.startsWith('/static-data') || pathname.startsWith('/finance')) return ['g-master-data'];
  if (pathname.startsWith('/org/books')) return ['g-books'];
  if (pathname.startsWith('/credit')) return ['g-credit'];
  if (pathname.startsWith('/pricing')) return ['g-pricing'];
  if (pathname.startsWith('/bolmo')) return ['g-operations'];
  if (pathname.startsWith('/rins')) return ['g-regulatory'];
  if (pathname.startsWith('/environmental')) return ['g-environmental'];
  if (pathname.startsWith('/finance')) return ['g-finance'];
  if (pathname.startsWith('/admin')) return ['g-admin'];
  return [];
}

export function AppShell() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { mode, toggle: toggleTheme } = useThemeStore();
  const { entries, toggle: toggleApiLog } = useApiLogStore();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const color = paletteFor(mode);

  // All hub groups start collapsed; the group owning the current route opens.
  // Accordion: opening a group closes the previously open one.
  const [openKeys, setOpenKeys] = useState<string[]>(() => groupKeyFor(location.pathname));
  function handleOpenChange(keys: string[]) {
    const latest = keys.find((k) => !openKeys.includes(k));
    setOpenKeys(latest ? [latest] : []);
  }

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
            <Typography.Text style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>Noname</Typography.Text>
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
          <Sider collapsible collapsed={sidebarCollapsed} trigger={null} width={210} style={{
            borderRight: `1px solid ${color.border}`, overflowY: 'auto', height: 'calc(100vh - 64px)',
            position: 'sticky', top: 64, display: 'flex', flexDirection: 'column',
          }}>
            <Menu
              mode="inline"
              selectedKeys={[activeKey]}
              // openKeys must not be controlled while the sider is collapsed (antd popup mode)
              {...(!sidebarCollapsed ? { openKeys, onOpenChange: handleOpenChange } : {})}
              style={{ borderRight: 'none', paddingTop: 4, fontSize: 13, flex: 1 }}
              items={NAV_ITEMS}
              onClick={({ key }) => { void navigate(key); }}
            />
            {/* Same collapse state/store as the header hamburger button above —
                this is just a second, more discoverable affordance for it,
                anchored to the sidebar itself (matching the edge-tab pattern
                used for the Book Hierarchy tree panel). */}
            <div style={{
              borderTop: `1px solid ${color.border}`, padding: '6px',
              display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
            }}>
              <Tooltip title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
                <Button
                  type="text" size="small"
                  icon={sidebarCollapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
                  onClick={toggleSidebar}
                />
              </Tooltip>
            </div>
          </Sider>
          <Layout style={{ background: color.bg }}>
            <Content style={{ padding: 24, minHeight: 280 }}>
              <Outlet />
            </Content>
          </Layout>
        </Layout>
      </Layout>
      <ApiLogDrawer />
      <MinimizedDraftsDock />
    </>
  );
}
