import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Grid, Layout, Menu, Space, Typography } from 'antd';
import { LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const BASE_NAV_LINKS = [
  { key: '/admin/dashboard', label: 'Dashboard' },
  { key: '/admin/tours', label: 'Tours' },
  { key: '/admin/bookings', label: 'Bookings' },
  { key: '/admin/orders', label: 'Reservation Management' },
  { key: '/admin/customers', label: 'Customers' },
  { key: '/admin/messages', label: 'Messages' },
];

export function AdminNavbar() {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  // Same breakpoint convention as the customer Navbar (Grid.useBreakpoint's `md`) -- below that,
  // the horizontal Menu has nowhere near enough room for this many admin links.
  const isMobile = !screens.md;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';
  const isStaff = isSuperAdmin || admin?.role === 'ADMIN';

  const navLinks = useMemo(
    () => [
      ...BASE_NAV_LINKS,
      ...(isStaff
        ? [
            { key: '/admin/cancellation-requests', label: 'Cancellation Requests' },
            { key: '/admin/audit-trail', label: 'Audit Trail' },
            { key: '/admin/users', label: 'Users' },
            { key: '/admin/settings', label: 'Website Settings' },
          ]
        : []),
      ...(isSuperAdmin ? [{ key: '/admin/payment-methods', label: 'Payment Methods' }] : []),
    ],
    [isStaff, isSuperAdmin],
  );

  const menuItems = useMemo(
    () => navLinks.map((link) => ({ key: link.key, label: <Link to={link.key}>{link.label}</Link> })),
    [navLinks],
  );

  const selectedKey = navLinks.find((link) => location.pathname.startsWith(link.key))?.key;
  const selectedKeys = selectedKey ? [selectedKey] : [];
  const adminDisplayName = admin?.username ?? admin?.fullName ?? admin?.email;

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <Layout.Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        paddingInline: isMobile ? 16 : 24,
        background: '#0F1117',
        borderBottom: '1px solid #303849',
      }}
    >
      <Link
        to="/admin/dashboard"
        style={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {isMobile ? 'JDM Admin' : 'Japan JDM Experience Tours Admin'}
      </Link>

      {!isMobile && (
        <>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={selectedKeys}
            items={menuItems}
            style={{ flex: 1, minWidth: 0, background: 'transparent' }}
          />
          <Space>
            <Typography.Text style={{ color: '#fff' }}>Welcome, {adminDisplayName}</Typography.Text>
            <LogoutOutlined
              aria-label="Log out"
              style={{ color: '#fff', cursor: 'pointer', fontSize: 16 }}
              onClick={handleLogout}
            />
          </Space>
        </>
      )}

      {isMobile && (
        <Button
          type="text"
          shape="circle"
          icon={<MenuOutlined style={{ color: '#fff' }} />}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open admin menu"
        />
      )}

      <Drawer
        title={adminDisplayName ?? 'Menu'}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      >
        <Menu
          theme="dark"
          mode="vertical"
          selectable
          selectedKeys={selectedKeys}
          onClick={() => setDrawerOpen(false)}
          items={menuItems}
          style={{ background: 'transparent', borderInlineEnd: 'none', flex: 1 }}
        />
        <div style={{ padding: 16, borderTop: '1px solid #303849' }}>
          <Button block danger icon={<LogoutOutlined />} onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </Drawer>
    </Layout.Header>
  );
}
