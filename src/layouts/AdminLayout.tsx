import { Outlet } from 'react-router-dom';
import { Grid, Layout, Typography } from 'antd';
import { AdminNavbar } from '@/components/layout/AdminNavbar';

export function AdminLayout() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      {/* max-width caps line length on very large desktops (matches the customer side's own
          content containers); the tighter mobile padding keeps every page's own content -- cards,
          tables, forms -- from being squeezed by outer padding it doesn't need. */}
      <Layout.Content style={{ padding: isMobile ? '20px 12px' : '32px 24px', background: '#0F1117', width: '100%', maxWidth: 1440, margin: '0 auto' }}>
        <Outlet />
      </Layout.Content>
      <Layout.Footer style={{ textAlign: 'center', background: '#0F1117', borderTop: '1px solid #303849' }}>
        <Typography.Text type="secondary">© 2026 Japan JDM Experience Admin Panel</Typography.Text>
      </Layout.Footer>
    </Layout>
  );
}
