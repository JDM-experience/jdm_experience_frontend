import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/utils/errors';
import type { RegisterInput } from '@/types/user';

export default function Register() {
  const { register } = useAuth();
  const [form] = Form.useForm<RegisterInput>();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleFinish(values: RegisterInput) {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await register(values);
      setSuccess('Account created successfully! You can now log in.');
      form.resetFields();
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again later.'));
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
        Create Account
      </Typography.Title>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
      {success && <Alert type="success" message={success} showIcon style={{ marginBottom: 16 }} />}

      <Form<RegisterInput> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Full name is required.' }]}>
          <Input placeholder="Enter your full name" />
        </Form.Item>

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

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Password is required.' }]}
          hasFeedback
        >
          <Input.Password placeholder="Enter password" />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm your password.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve();
                return Promise.reject(new Error('Passwords do not match.'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm password" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ marginTop: 8 }}>
          Register
        </Button>

        <Typography.Paragraph style={{ textAlign: 'center', marginTop: 16 }}>
          Already have an account? <Link to="/login">Login here</Link>
        </Typography.Paragraph>
      </Form>
    </div>
  );
}
