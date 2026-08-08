import { useState } from 'react';
import { Alert, Button, Divider, Form, Input, Typography } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/utils/errors';
import type { ChangePasswordInput, UpdateProfileInput } from '@/types/user';

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();

  const [infoForm] = Form.useForm<UpdateProfileInput>();
  const [infoStatus, setInfoStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [infoSubmitting, setInfoSubmitting] = useState(false);

  const [passwordForm] = Form.useForm<ChangePasswordInput>();
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  async function handleInfoSubmit(values: UpdateProfileInput) {
    setInfoStatus(null);
    setInfoSubmitting(true);
    try {
      await updateProfile(values);
      setInfoStatus({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      setInfoStatus({ type: 'error', text: getErrorMessage(error, 'Something went wrong. Try again.') });
    } finally {
      setInfoSubmitting(false);
    }
  }

  async function handlePasswordSubmit(values: ChangePasswordInput) {
    setPasswordStatus(null);
    setPasswordSubmitting(true);
    try {
      await changePassword(values);
      setPasswordStatus({ type: 'success', text: 'Password updated successfully.' });
      passwordForm.resetFields();
    } catch (error) {
      setPasswordStatus({ type: 'error', text: getErrorMessage(error, 'Failed to update password.') });
    } finally {
      setPasswordSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '100px auto',
        background: '#fff',
        padding: 40,
        borderRadius: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
        My Profile
      </Typography.Title>

      {infoStatus && <Alert type={infoStatus.type} message={infoStatus.text} showIcon style={{ marginBottom: 16 }} />}

      <Form<UpdateProfileInput>
        form={infoForm}
        layout="vertical"
        initialValues={{ fullName: user.fullName, email: user.email }}
        onFinish={handleInfoSubmit}
      >
        <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Full name is required.' }]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Email is required.' },
            { type: 'email', message: 'Enter a valid email address.' },
          ]}
        >
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={infoSubmitting}>
          Update Profile
        </Button>
      </Form>

      <Divider />

      <Typography.Title level={5} style={{ textAlign: 'center', marginBottom: 16 }}>
        Change Password
      </Typography.Title>

      {passwordStatus && (
        <Alert type={passwordStatus.type} message={passwordStatus.text} showIcon style={{ marginBottom: 16 }} />
      )}

      <Form<ChangePasswordInput> form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
        <Form.Item
          label="Current Password"
          name="currentPassword"
          rules={[{ required: true, message: 'Current password is required.' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[{ required: true, message: 'New password is required.' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="Confirm New Password"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Please confirm your new password.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error('New passwords do not match.'));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Button htmlType="submit" block loading={passwordSubmitting}>
          Change Password
        </Button>
      </Form>
    </div>
  );
}
