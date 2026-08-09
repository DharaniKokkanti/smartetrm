import { type ReactNode } from 'react';
import { Layout, Typography, Space, Avatar, Button, Badge, Tooltip, Dropdown, Popover } from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, SwapOutlined, FundOutlined, EditOutlined,
  SunOutlined, MoonOutlined, BgColorsOutlined, CodeOutlined, LogoutOutlined, UserOutlined, HomeOutlined,
  BankOutlined, AppstoreOutlined, TableOutlined, TeamOutlined, SafetyCertificateOutlined,
  ControlOutlined, AlertOutlined, DollarOutlined, CloudOutlined, ApartmentOutlined,
  GlobalOutlined, FileProtectOutlined, AccountBookOutlined,
  AuditOutlined, TagsOutlined, IdcardOutlined, InboxOutlined,
  LineChartOutlined, StockOutlined, ScheduleOutlined, ReconciliationOutlined, CalendarOutlined,
  DatabaseOutlined, SettingOutlined, DoubleLeftOutlined, DoubleRightOutlined, ShopOutlined,
  PercentageOutlined,
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

// Hub groups reveal their children via a hover-triggered flyout (see
// NavGroupRow below) instead of a click-to-expand accordion.
const NAV_ITEMS: NavEntry[] = [
  { key: '/',               icon: <HomeOutlined />,       label: 'Dashboard' },
  {
    key: 'g-trade', icon: <SwapOutlined />, label: 'Trade Management',
    children: [
      { key: '/trade/capture', icon: <EditOutlined />, label: 'Trade Capture' },
      { key: '/trade/blotter', icon: <SwapOutlined />, label: 'Trade Blotter' },
    ],
  },
  { key: '/position',       icon: <FundOutlined />,       label: 'Position & P&L' },
  { type: 'divider' as const },
  {
    key: 'g-counterparties', icon: <TeamOutlined />, label: 'Counterparties & Legal',
    children: [
      { key: '/tier1/counterparty',  icon: <TeamOutlined />,   label: 'Counterparties' },
      { key: '/tier1/legal-entity',  icon: <IdcardOutlined />, label: 'Legal Entities' },
    ],
  },
  {
    key: 'g-markets', icon: <ShopOutlined />, label: 'Products & Markets',
    children: [
      { key: '/markets/products', icon: <TagsOutlined />,   label: 'Products' },
      { key: '/markets/markets',  icon: <GlobalOutlined />, label: 'Markets' },
    ],
  },
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
    key: 'g-credit', icon: <SafetyCertificateOutlined />, label: 'Credit, Risk & Margin Management',
    children: [
      { key: '/credit/margin-agreements',      icon: <DollarOutlined />,            label: 'Margin Agreements' },
      { key: '/credit/limits',                 icon: <AlertOutlined />,             label: 'Credit Limits' },
      { key: '/credit/letters-of-credit',      icon: <BankOutlined />,              label: 'Letters of Credit' },
      { key: '/credit/clearing-accounts',      icon: <BankOutlined />,              label: 'Clearing Accounts' },
      { key: '/credit/margin-accounts',        icon: <PercentageOutlined />,        label: 'Margin Accounts' },
      { key: '/credit/contract-margin-rates',  icon: <PercentageOutlined />,        label: 'Contract Margin Rates' },
      { key: '/credit/margin-offset-rules',    icon: <SwapOutlined />,              label: 'Margin Offset Rules' },
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
  '/', '/trade/capture', '/trade/blotter', '/position', '/static-data', '/master-data',
  '/tier1/counterparty', '/tier1/legal-entity',
  '/markets/products', '/markets/markets',
  '/org/books/hierarchy', '/org/books',
  '/credit/margin-agreements', '/credit/limits', '/credit/letters-of-credit',
  '/credit/clearing-accounts', '/credit/margin-accounts', '/credit/contract-margin-rates', '/credit/margin-offset-rules',
  '/pricing/settlement-prices', '/pricing/tas', '/pricing/pricing-rules', '/pricing/price-sources',
  '/pricing/balmo-products', '/pricing/balmo',
  '/bolmo',
  '/rins/fuel-categories', '/rins/accounts', '/rins/transactions', '/rins/inventory', '/rins/obligations',
  '/environmental/schemes', '/environmental/products', '/environmental/registries', '/environmental/obligations',
  '/finance/gl-accounts',
  '/admin/users', '/admin/roles', '/admin/field-permissions',
];

type NavLeaf = { key: string; icon: ReactNode; label: string };
type NavGroup = { key: string; icon: ReactNode; label: string; children: NavLeaf[] };
type NavDivider = { type: 'divider' };
type NavEntry = NavLeaf | NavGroup | NavDivider;

// Row shared by both leaf items and the clickable rows inside a group's flyout.
function NavItemRow({
  icon, label, active, collapsed, onClick, hoverBg, selectedBg, selectedColor, textColor,
}: {
  icon: ReactNode; label: string; active: boolean; collapsed: boolean; onClick: () => void;
  hoverBg: string; selectedBg: string; selectedColor: string; textColor: string;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '9px 0' : '9px 20px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        margin: '2px 4px', borderRadius: 6,
        cursor: 'pointer', fontSize: 13, lineHeight: 1.2,
        background: active ? selectedBg : 'transparent',
        color: active ? selectedColor : textColor,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: 15, display: 'flex' }}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </div>
  );
}

// Hub groups reveal their children as a hover-triggered flyout to the right
// of the sidebar (antd Popover, trigger="hover") — no click/expand step.
function NavGroupRow({
  item, collapsed, activeKey, navigate, hoverBg, selectedBg, selectedColor, textColor, popoverBg, popoverBorder,
}: {
  item: NavGroup; collapsed: boolean; activeKey: string; navigate: (key: string) => void;
  hoverBg: string; selectedBg: string; selectedColor: string; textColor: string; popoverBg: string; popoverBorder: string;
}) {
  const hasActiveChild = item.children.some((c) => c.key === activeKey);
  const content = (
    <div style={{ minWidth: 190, padding: 4, background: popoverBg }}>
      <div style={{ padding: '4px 10px 8px', fontSize: 12, fontWeight: 600, color: textColor, opacity: 0.7 }}>{item.label}</div>
      {item.children.map((child) => (
        <NavItemRow
          key={child.key}
          icon={child.icon}
          label={child.label}
          active={child.key === activeKey}
          collapsed={false}
          onClick={() => navigate(child.key)}
          hoverBg={hoverBg}
          selectedBg={selectedBg}
          selectedColor={selectedColor}
          textColor={textColor}
        />
      ))}
    </div>
  );
  return (
    <Popover
      trigger="hover"
      placement={collapsed ? 'right' : 'rightTop'}
      mouseEnterDelay={0.05}
      mouseLeaveDelay={0.1}
      overlayInnerStyle={{ padding: 0, border: `1px solid ${popoverBorder}` }}
      content={content}
    >
      <div>
        <NavItemRow
          icon={item.icon}
          label={item.label}
          active={hasActiveChild}
          collapsed={collapsed}
          onClick={() => {}}
          hoverBg={hoverBg}
          selectedBg={selectedBg}
          selectedColor={selectedColor}
          textColor={textColor}
        />
      </div>
    </Popover>
  );
}

export function AppShell() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { mode, toggle: toggleTheme, monochrome, toggleMonochrome } = useThemeStore();
  const { entries, toggle: toggleApiLog } = useApiLogStore();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const color = paletteFor(mode);

  // Matches Menu tokens in antd-theme.ts so the hand-rolled rows below read
  // identically to what antd's own Menu component rendered before.
  const itemSelectedBg = mode === 'dark' ? '#2A2750' : '#EEEDFE';
  const itemHoverBg = mode === 'dark' ? '#26262B' : '#F2F1EC';

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
            // '#fff': header background is always navy (color.primary, see antd-theme.ts headerBg)
            // regardless of light/dark mode, so header icons/text stay fixed white for contrast.
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <Space align="center" size={8}>
            <BankOutlined style={{ color: color.secondary, fontSize: 20 }} />
            <Typography.Text style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>Noname</Typography.Text>
            <Typography.Text style={{ color: color.secondary, fontWeight: 700, fontSize: 16 }}>ETRM</Typography.Text>
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
          <Tooltip title={monochrome ? 'Switch to color' : 'Switch to black & white'}>
            <Button
              type="text"
              icon={<BgColorsOutlined style={{ color: '#fff', fontSize: 16 }} />}
              onClick={toggleMonochrome}
              aria-label="Toggle black and white mode"
              // Pressed/filled look when active — the grayscale filter (see
              // index.css's html.theme-mono rule) applies to the whole
              // document including this header, so this button desaturates
              // along with everything else; the on/off pressed state still
              // reads clearly since it only depends on lightness, not hue.
              style={monochrome ? { background: 'rgba(255,255,255,0.2)' } : undefined}
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
            <nav style={{ paddingTop: 4, flex: 1, overflowY: 'auto' }}>
              {NAV_ITEMS.map((item, idx) => {
                if ('type' in item) {
                  return <div key={`divider-${idx}`} style={{ margin: '8px 16px', borderTop: `1px solid ${color.border}` }} />;
                }
                if ('children' in item) {
                  return (
                    <NavGroupRow
                      key={item.key}
                      item={item}
                      collapsed={sidebarCollapsed}
                      activeKey={activeKey}
                      navigate={(key) => { void navigate(key); }}
                      hoverBg={itemHoverBg}
                      selectedBg={itemSelectedBg}
                      selectedColor={color.primary}
                      textColor={color.textPrimary}
                      popoverBg={color.bgElevated}
                      popoverBorder={color.border}
                    />
                  );
                }
                const row = (
                  <NavItemRow
                    icon={item.icon}
                    label={item.label}
                    active={activeKey === item.key}
                    collapsed={sidebarCollapsed}
                    onClick={() => { void navigate(item.key); }}
                    hoverBg={itemHoverBg}
                    selectedBg={itemSelectedBg}
                    selectedColor={color.primary}
                    textColor={color.textPrimary}
                  />
                );
                return sidebarCollapsed
                  ? <Tooltip key={item.key} title={item.label} placement="right">{row}</Tooltip>
                  : <div key={item.key}>{row}</div>;
              })}
            </nav>
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
