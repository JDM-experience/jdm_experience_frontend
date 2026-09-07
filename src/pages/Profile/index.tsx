import { useEffect, useState } from 'react';
import { Button, Form, Input, Typography, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { updateOwnProfile } from '@/services/authService';
import { getErrorMessage } from '@/utils/errors';

/** Full Name + Phone are editable; Email/Role are read-only (Email is Auth0-managed, Role/
 *  permissions/account-status are administrative fields a customer can never touch -- enforced
 *  server-side by updateOwnProfileSchema regardless of what this form could ever send). */
export default function Profile() {
  const { user, setUser } = useAuth();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) form.setFieldsValue({ fullName: user.fullName ?? '', phone: user.phone ?? '' });
  }, [user, form]);

  if (!user) return null;

  async function handleSave(values: { fullName: string; phone?: string }) {
    setSaving(true);
    try {
      const updated = await updateOwnProfile({ fullName: values.fullName, phone: values.phone ?? '' });
      setUser(updated);
      message.success('Profile updated.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to update your profile.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '100px auto',
        background: '#1C2333',
        border: '1px solid #303849',
        padding: 40,
        borderRadius: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
        My Profile
      </Typography.Title>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[
            { required: true, message: 'Please enter your full name.' },
            { max: 255, message: 'Full name is too long.' },
          ]}
        >
          <Input placeholder="Your full name" />
        </Form.Item>

        <Form.Item label="Email">
          <Input value={user.email} disabled />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Managed by your sign-in provider.
          </Typography.Text>
        </Form.Item>

        <Form.Item label="Role">
          <Input value={user.role.replace('_', ' ')} disabled />
        </Form.Item>

        <Form.Item name="phone" label="Phone" rules={[{ max: 50, message: 'Phone number is too long.' }]}>
          <Input placeholder="+81 90 1234 5678" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={saving} block>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
