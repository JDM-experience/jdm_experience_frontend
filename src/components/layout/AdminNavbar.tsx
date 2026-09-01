import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Space, Typography } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const BASE_NAV_LINKS = [
  { key: '/admin/dashboard', label: 'Dashboard' },
  { key: '/admin/tours', label: 'Tours' },
  { key: '/admin/orders', label: 'Reservations' },
  { key: '/admin/customers', label: 'Customers' },
  { key: '/admin/messages', label: 'Messages' },
];

export function AdminNavbar() {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    ...BASE_NAV_LINKS,
    ...(admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN' ? [{ key: '/admin/users', label: 'Users' }] : []),
    ...(admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN'
      ? [{ key: '/admin/settings', label: 'Website Settings' }]
      : []),
  ];

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
        items={navLinks.map((link) => ({ key: link.key, label: <Link to={link.key}>{link.label}</Link> }))}
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
