import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Space, Typography } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const BASE_NAV_LINKS = [
  { key: '/admin/dashboard', label: 'Dashboard' },
  { key: '/admin/tours', label: 'Tours' },
  { key: '/admin/bookings', label: 'Bookings' },
  { key: '/admin/customers', label: 'Customers' },
  { key: '/admin/messages', label: 'Messages' },
];

export function AdminNavbar() {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';
  const isStaff = isSuperAdmin || admin?.role === 'ADMIN';

  const navLinks = useMemo(
    () => [
      ...BASE_NAV_LINKS,
      ...(isStaff ? [{ key: '/admin/users', label: 'Users' }, { key: '/admin/settings', label: 'Website Settings' }] : []),
      ...(isSuperAdmin ? [{ key: '/admin/payment-methods', label: 'Payment Methods' }] : []),
    ],
    [isStaff, isSuperAdmin],
  );

  const menuItems = useMemo(
    () => navLinks.map((link) => ({ key: link.key, label: <Link to={link.key}>{link.label}</Link> })),
    [navLinks],
  );

  const selectedKey = navLinks.find((link) => location.pathname.startsWith(link.key))?.key;

  return (
    <Layout.Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        paddingInline: 24,
        background: '#000',
      }}
    >
      <Link to="/admin/dashboard" style={{ color: '#faad14', fontWeight: 700, whiteSpace: 'nowrap' }}>
        Japan JDM Experience Tours Admin
      </Link>

      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={menuItems}
        style={{ flex: 1, minWidth: 0, background: 'transparent' }}
      />

      <Space>
        <Typography.Text style={{ color: '#fff' }}>Welcome, {admin?.username ?? admin?.fullName ?? admin?.email}</Typography.Text>
        <LogoutOutlined
          style={{ color: '#fff', cursor: 'pointer', fontSize: 16 }}
          onClick={() => {
            logout();
            navigate('/admin/login');
          }}
        />
      </Space>
    </Layout.Header>
  );
}
