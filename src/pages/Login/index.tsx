import { Link, useSearchParams } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  function handleLogin() {
    const raw = searchParams.get('redirect');
    let returnTo: string | undefined;
    if (raw) {
      try {
        returnTo = decodeURIComponent(raw);
      } catch {
        returnTo = undefined;
      }
    }
    login({ returnTo });
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '100px auto',
        padding: 40,
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center',
      }}
    >
      <Typography.Title level={3} style={{ marginBottom: 8 }}>
        Welcome Back
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Sign in to book tours, view your reservations, and manage your profile.
      </Typography.Paragraph>

      <Button type="primary" block size="large" onClick={handleLogin}>
        Sign in
      </Button>

      <Typography.Paragraph style={{ textAlign: 'center', marginTop: 16 }}>
        Don&apos;t have an account? <Link to="/register">Create one</Link>
      </Typography.Paragraph>
    </div>
  );
}
