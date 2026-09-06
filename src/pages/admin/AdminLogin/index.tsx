import { Button, Typography } from 'antd';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminLogin() {
  const { login } = useAdminAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#0F1117', color: '#fff', display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          maxWidth: 400,
          margin: '0 auto',
          background: '#1C2333',
          border: '1px solid #303849',
          padding: 30,
          borderRadius: 10,
          boxShadow: '0 0 15px rgba(0,0,0,0.3)',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Typography.Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
          Admin Login
        </Typography.Title>
        <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>
          Sign in with your staff account to manage tours, reservations, and site content.
        </Typography.Paragraph>

        <Button type="primary" block size="large" onClick={() => login()}>
          Sign in
        </Button>
      </div>
    </div>
  );
}
