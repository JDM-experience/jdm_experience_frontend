import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function MainLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Layout.Content style={{ paddingTop: 64 }}>
        <Outlet />
      </Layout.Content>
      <Footer />
    </Layout>
  );
}
