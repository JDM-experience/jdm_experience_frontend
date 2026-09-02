import { useEffect, useState } from 'react';
import { Button, Card, Popconfirm, Select, Space, Tag, Typography, message } from 'antd';
import { CheckCircleOutlined, DeleteOutlined, MailOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { deleteMessage, getMessages, updateMessageStatus } from '@/services/messageService';
import { formatDateTime } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { ContactMessage, ContactMessageStatus } from '@/types/contactMessage';

const STATUS_OPTIONS: { value: ContactMessageStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'READ', label: 'Read' },
  { value: 'REPLIED', label: 'Replied' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const STATUS_COLOR: Record<ContactMessageStatus, string> = {
  NEW: 'blue',
  READ: 'default',
  REPLIED: 'green',
  ARCHIVED: 'default',
};

export default function AdminMessages() {
  const { admin } = useAdminAuth();
  const isStaff = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  function fetchMessages() {
    setLoading(true);
    getMessages()
      .then(setMessages)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load messages.')))
      .finally(() => setLoading(false));
  }

  useEffect(fetchMessages, []);

  async function handleDelete(id: number) {
    try {
      await deleteMessage(id);
      message.success('Message deleted.');
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to delete this message.'));
    }
  }

  async function handleStatusChange(id: number, status: ContactMessageStatus) {
    setStatusUpdatingId(id);
    try {
      const updated = await updateMessageStatus(id, status);
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to update this message's status."));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Contact Messages
      </Typography.Title>

      {messages.length === 0 ? (
        <EmptyState title="No messages found." />
      ) : (
        messages.map((msg) => (
          <Card key={msg.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <Typography.Text strong>
                <MailOutlined /> {msg.name ?? 'Unknown sender'}
              </Typography.Text>
              <Space>
                <Tag color={STATUS_COLOR[msg.status]}>{msg.status}</Tag>
                <Typography.Text type="secondary">{formatDateTime(msg.createdAt)}</Typography.Text>
              </Space>
            </div>
            <p style={{ margin: '8px 0' }}>
              <strong>Email:</strong> {msg.email ?? '—'}
            </p>
            {msg.subject && (
              <p style={{ margin: '8px 0' }}>
                <strong>Subject:</strong> {msg.subject}
              </p>
            )}
            <p style={{ margin: '8px 0' }}>
              <strong>Message:</strong>
              <br />
              {msg.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
              {/* There's no outbound email system yet -- this only records that staff have
                  actually replied (e.g. via their own inbox), it doesn't send anything itself. */}
              <Select<ContactMessageStatus>
                size="small"
                value={msg.status}
                style={{ width: 140 }}
                options={STATUS_OPTIONS}
                disabled={statusUpdatingId === msg.id}
                onChange={(value) => handleStatusChange(msg.id, value)}
              />
              {msg.status !== 'REPLIED' && (
                <Button
                  size="small"
                  icon={<CheckCircleOutlined />}
                  loading={statusUpdatingId === msg.id}
                  onClick={() => handleStatusChange(msg.id, 'REPLIED')}
                >
                  Mark Replied
                </Button>
              )}
              {isStaff && (
                <Popconfirm title="Delete this message?" onConfirm={() => handleDelete(msg.id)}>
                  <Button danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
