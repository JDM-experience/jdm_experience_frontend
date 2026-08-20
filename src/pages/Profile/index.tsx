import { Descriptions, Typography } from 'antd';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

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

      <Descriptions column={1} bordered>
        <Descriptions.Item label="Full Name">{user.fullName ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
        <Descriptions.Item label="Role">{user.role.replace('_', ' ')}</Descriptions.Item>
      </Descriptions>

      <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginTop: 24 }}>
        Profile details and password are managed through your sign-in provider.
      </Typography.Paragraph>
    </div>
  );
}
