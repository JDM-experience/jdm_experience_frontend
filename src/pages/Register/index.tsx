import { Link } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { useAuth } from '@/contexts/AuthContext';

export default function Register() {
  const { login } = useAuth();

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
  );
}
