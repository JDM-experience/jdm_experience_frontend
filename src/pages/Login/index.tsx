import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/utils/errors';
import type { LoginInput } from '@/types/user';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTarget = (() => {
    const raw = searchParams.get('redirect');
    if (!raw) return '/';
    try {
      return decodeURIComponent(raw);
    } catch {
      return '/';
    }
  })();

  async function handleFinish(values: LoginInput) {
    setError('');
    setSubmitting(true);
    try {
      await login(values);
      navigate(redirectTarget);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to log in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
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
      }}
    >
      <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
        User Login
      </Typography.Title>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      <Form<LoginInput> layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: 'Email is required.' },
            { type: 'email', message: 'Enter a valid email address.' },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Password is required.' }]}>
          <Input.Password placeholder="Enter your password" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ marginTop: 8 }}>
          Login
        </Button>

        <Typography.Paragraph style={{ textAlign: 'center', marginTop: 16 }}>
          Don&apos;t have an account? <Link to="/register">Register here</Link>
        </Typography.Paragraph>
      </Form>
    </div>
  );
}
