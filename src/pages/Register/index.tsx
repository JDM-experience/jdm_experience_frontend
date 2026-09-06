import { Link, useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Same heuristic as Login: only go back if this session actually navigated here from
  // somewhere, otherwise a direct link/typed URL would have nowhere to "go back" to.
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
          Create Account
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Sign up to book tours and manage your reservations.
        </Typography.Paragraph>

        <Button type="primary" block size="large" onClick={() => login({ screenHint: 'signup' })}>
          Create account
        </Button>

        <Typography.Paragraph style={{ textAlign: 'center', marginTop: 16 }}>
          Already have an account? <Link to="/login">Login here</Link>
        </Typography.Paragraph>
      </div>
    </div>
  );
}
