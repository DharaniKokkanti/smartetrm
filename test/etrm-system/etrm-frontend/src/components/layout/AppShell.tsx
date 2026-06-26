import type { ReactNode } from 'react';
import { Layout, Menu, Typography, Space, Avatar, Button, Badge, Tooltip, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  SwapOutlined,
  FundOutlined,
  SunOutlined,
  MoonOutlined,
  CodeOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUiStore } from '@store/uiStore';
import { useThemeStore } from '@store/themeStore';
import { useApiLogStore } from '@store/apiLogStore';
import { useAuthStore } from '@store/authStore';
import { paletteFor } from '@theme/tokens';
import { ApiLogDrawer } from './ApiLogDrawer';

const { Header, Sider, Content } = Layout;

interface NavChild {
  key: string;
  label: string;
  disabled?: boolean;
}

interface NavSection {
  key: string;
  icon: ReactNode;
  label: string;
  children: NavChild[];
}

const navSections: NavSection[] = [
  {
    key: 'master-data',
    icon: <DatabaseOutlined />,
    label: 'Master Data',
    children: [
      { key: '/tier1/legal-entity', label: 'Legal Entities' },
      { key: '/tier1/counterparty', label: 'Counterparties' },
      { key: '/tier1', label: 'All Core Entities' },
      { key: '/tier2', label: 'Reference Data (Tier 2)' },
    ],
  },
  {
    key: 'trade',
    icon: <SwapOutlined />,
    label: 'Trade',
    children: [{ key: '/trade', label: 'Trade Blotter', disabled: true }],
  },
  {
    key: 'position',
    icon: <FundOutlined />,
    label: 'Position',
    children: [{ key: '/position', label: 'Position & P&L', disabled: true }],
  },
];

export function AppShell() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { mode, toggle: toggleTheme } = useThemeStore();
  const { entries, toggle: toggleApiLog } = useApiLogStore();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const color = paletteFor(mode);

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  const userMenuItems = [
    {
      key: 'profile',
      label: user?.fullName ?? user?.username ?? 'User',
      disabled: true,
      style: { cursor: 'default', color: color.textSecondary, fontSize: 12 },
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign out',
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 16,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <Space align="center" size={10}>
            <AppstoreOutlined style={{ color: '#fff', fontSize: 18 }} />
            <Typography.Text style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
              ETRM
            </Typography.Text>
          </Space>
          <div style={{ flex: 1 }} />
          <Tooltip title="API Activity Log">
            <Badge count={entries.length} size="small" color={color.secondary} overflowCount={99}>
              <Button
                type="text"
                icon={<CodeOutlined style={{ color: '#fff', fontSize: 16 }} />}
                onClick={toggleApiLog}
                aria-label="API Activity Log"
              />
            </Badge>
          </Tooltip>
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <Button
              type="text"
              icon={
                mode === 'dark' ? (
                  <SunOutlined style={{ color: '#fff', fontSize: 16 }} />
                ) : (
                  <MoonOutlined style={{ color: '#fff', fontSize: 16 }} />
                )
              }
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
            />
          </Tooltip>
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <Tooltip title={user?.fullName ?? 'Account'}>
              <Avatar
                size={30}
                style={{ backgroundColor: color.secondary, cursor: 'pointer' }}
                icon={!user?.fullName ? <UserOutlined /> : undefined}
              >
                {user?.fullName
                  ? user.fullName
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : null}
              </Avatar>
            </Tooltip>
          </Dropdown>
        </Header>
        <Layout>
          <Sider
            collapsible
            collapsed={sidebarCollapsed}
            trigger={null}
            width={232}
            style={{ borderRight: `1px solid ${color.border}` }}
          >
            <Menu
              mode="inline"
              selectedKeys={[
                navSections
                  .flatMap((s) => s.children)
                  .find((c) => location.pathname.startsWith(c.key))?.key ?? location.pathname,
              ]}
              defaultOpenKeys={navSections.map((s) => s.key)}
              style={{ borderRight: 'none', paddingTop: 8 }}
              items={navSections.map((section) => ({
                key: section.key,
                icon: section.icon,
                label: section.label,
                children: section.children.map((child) => ({
                  key: child.key,
                  label: child.label,
                  disabled: child.disabled,
                })),
              }))}
              onClick={({ key }) => navigate(key)}
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
