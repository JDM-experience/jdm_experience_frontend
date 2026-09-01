import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Typography, message } from 'antd';
import { DeleteOutlined, MailOutlined, MessageOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { deleteMessage, getMessages, replyToMessage } from '@/services/messageService';
import { formatDateTime } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { ContactMessage } from '@/types/contactMessage';

interface ReplyFormValues {
  subject: string;
  body: string;
}

export default function AdminMessages() {
  const { admin } = useAdminAuth();
  const isStaff = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTarget, setReplyTarget] = useState<ContactMessage | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [form] = Form.useForm<ReplyFormValues>();

  function fetchMessages() {
    setLoading(true);
    getMessages()
      .then(setMessages)
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

  async function handleReplySubmit(values: ReplyFormValues) {
    if (!replyTarget) return;
    setReplySubmitting(true);
    try {
      await replyToMessage({ messageId: replyTarget.id, subject: values.subject, body: values.body });
      message.success('Reply sent successfully!');
      setReplyTarget(null);
      form.resetFields();
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to send email. Please check your mail configuration.'));
    } finally {
      setReplySubmitting(false);
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
                <MailOutlined /> {msg.name}
              </Typography.Text>
              <Typography.Text type="secondary">{formatDateTime(msg.createdAt)}</Typography.Text>
            </div>
            <p style={{ margin: '8px 0' }}>
              <strong>Email:</strong> {msg.email}
            </p>
            <p style={{ margin: '8px 0' }}>
              <strong>Message:</strong>
              <br />
              {msg.message}
            </p>
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<MessageOutlined />} onClick={() => setReplyTarget(msg)}>
                  Reply
                </Button>
                {isStaff && (
                  <Popconfirm title="Delete this message?" onConfirm={() => handleDelete(msg.id)}>
                    <Button danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </div>
          </Card>
        ))
      )}

      <Modal
        title={replyTarget ? `Reply to ${replyTarget.name}` : 'Reply'}
        open={replyTarget !== null}
        onCancel={() => setReplyTarget(null)}
        onOk={() => form.submit()}
        confirmLoading={replySubmitting}
        okText="Send Reply"
      >
        <Form<ReplyFormValues> form={form} layout="vertical" onFinish={handleReplySubmit}>
          <Form.Item label="Subject" name="subject" rules={[{ required: true, message: 'Subject is required.' }]}>
            <Input placeholder="Enter subject" />
          </Form.Item>
          <Form.Item label="Message" name="body" rules={[{ required: true, message: 'Reply message is required.' }]}>
            <Input.TextArea rows={5} placeholder="Write your reply..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
