import { Outlet } from 'react-router-dom';
import { Layout, Typography } from 'antd';
import { AdminNavbar } from '@/components/layout/AdminNavbar';

export function AdminLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      <Layout.Content style={{ padding: '32px 24px', background: '#f5f5f5' }}>
        <Outlet />
      </Layout.Content>
      <Layout.Footer style={{ textAlign: 'center', background: '#fff' }}>
        <Typography.Text type="secondary">© 2026 Japan JDM Experience Admin Panel</Typography.Text>
      </Layout.Footer>
    </Layout>
  );
}
