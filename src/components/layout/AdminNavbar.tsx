import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Space, Typography } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const NAV_LINKS = [
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

  const selectedKey = NAV_LINKS.find((link) => location.pathname.startsWith(link.key))?.key;

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
        items={NAV_LINKS.map((link) => ({ key: link.key, label: <Link to={link.key}>{link.label}</Link> }))}
        style={{ flex: 1, minWidth: 0, background: 'transparent' }}
      />

      <Space>
        <Typography.Text style={{ color: '#fff' }}>Welcome, {admin?.username}</Typography.Text>
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
