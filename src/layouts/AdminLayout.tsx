import { Outlet } from 'react-router-dom';
import { Layout, Typography } from 'antd';
import { AdminNavbar } from '@/components/layout/AdminNavbar';

export function AdminLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      <Layout.Content style={{ padding: '32px 24px', background: '#0F1117' }}>
        <Outlet />
      </Layout.Content>
      <Layout.Footer style={{ textAlign: 'center', background: '#0F1117', borderTop: '1px solid #303849' }}>
        <Typography.Text type="secondary">© 2026 Japan JDM Experience Admin Panel</Typography.Text>
      </Layout.Footer>
    </Layout>
  );
}
