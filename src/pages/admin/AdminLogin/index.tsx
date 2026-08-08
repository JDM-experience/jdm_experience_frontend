import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { getErrorMessage } from '@/utils/errors';
import type { AdminLoginInput } from '@/types/admin';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleFinish(values: AdminLoginInput) {
    setError('');
    setSubmitting(true);
    try {
      await login(values);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid username or password.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#fff', display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          maxWidth: 400,
          margin: '0 auto',
          background: '#1f1f1f',
          padding: 30,
          borderRadius: 10,
          boxShadow: '0 0 15px rgba(0,0,0,0.3)',
          width: '100%',
        }}
      >
        <Typography.Title level={3} style={{ color: '#fff', textAlign: 'center', marginBottom: 24 }}>
          Admin Login
        </Typography.Title>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form<AdminLoginInput> layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label={<span style={{ color: '#fff' }}>Username</span>}
            name="username"
            rules={[{ required: true, message: 'Username is required.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={<span style={{ color: '#fff' }}>Password</span>}
            name="password"
            rules={[{ required: true, message: 'Password is required.' }]}
          >
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Login
          </Button>
        </Form>

        <Typography.Paragraph style={{ textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          Demo credentials: admin / admin123
        </Typography.Paragraph>
      </div>
    </div>
  );
}
