import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

  // React Router stores how many entries deep the current one is in history.state.idx -- 0 means
  // this is the first entry this session (e.g. a direct link/typed URL), so "back" would leave
  // the app entirely; go to the home page instead of risking a dead end or leaving the site.
  function handleBack() {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/');
  }

  return (
    <div style={{ maxWidth: 420, margin: '80px auto 0', padding: '0 24px' }}>
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginBottom: 12 }}>
        Back to Website
      </Button>
      <div
        style={{
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
    </div>
  );
}
