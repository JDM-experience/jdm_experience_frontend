import { useState } from 'react';
import { Alert, Button, Col, Form, Input, Row, Space, Typography } from 'antd';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  FacebookOutlined,
  InstagramOutlined,
  MailOutlined,
  PhoneOutlined,
  TikTokOutlined,
} from '@ant-design/icons';
import { createMessage } from '@/services/messageService';
import { getErrorMessage } from '@/utils/errors';
import type { CreateContactMessageInput } from '@/types/contactMessage';

export default function Contact() {
  const [form] = Form.useForm<CreateContactMessageInput>();
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFinish(values: CreateContactMessageInput) {
    setAlert(null);
    setSubmitting(true);
    try {
      await createMessage(values);
      setAlert({ type: 'success', text: 'Thank you, your message has been sent successfully!' });
      form.resetFields();
    } catch (error) {
      setAlert({ type: 'error', text: getErrorMessage(error, 'Something went wrong. Please try again later.') });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 24px' }}>
      <Row gutter={[48, 32]}>
        <Col xs={24} md={12}>
          <Typography.Title level={2}>Send Us a Message</Typography.Title>

          {alert && <Alert type={alert.type} message={alert.text} showIcon style={{ marginBottom: 16 }} />}

          <Form<CreateContactMessageInput> form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required.' }]}>
              <Input placeholder="Your Name" />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Email is required.' },
                { type: 'email', message: 'Enter a valid email address.' },
              ]}
            >
              <Input placeholder="Your Email" />
            </Form.Item>
            <Form.Item label="Message" name="message" rules={[{ required: true, message: 'Message is required.' }]}>
              <Input.TextArea rows={5} placeholder="Your Message" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Send Message
            </Button>
          </Form>
        </Col>

        <Col xs={24} md={12}>
          <Typography.Title level={2}>Contact Information</Typography.Title>
          <Space orientation="vertical" size="middle">
            <Typography.Text>
              <EnvironmentOutlined style={{ marginRight: 8 }} />
              24 Ligaya Street, Manila, Philippines
            </Typography.Text>
            <Typography.Text>
              <PhoneOutlined style={{ marginRight: 8 }} />
              +819060804777
            </Typography.Text>
            <Typography.Text>
              <MailOutlined style={{ marginRight: 8 }} />
              jkonagi0410@gmail.com
            </Typography.Text>
            <Typography.Text>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              Mon - Sun: 9AM - 6PM
            </Typography.Text>
          </Space>
          <div style={{ marginTop: 24 }}>
            <Space size="large">
              <InstagramOutlined style={{ fontSize: 24 }} />
              <TikTokOutlined style={{ fontSize: 24 }} />
              <FacebookOutlined style={{ fontSize: 24 }} />
            </Space>
          </div>
        </Col>
      </Row>
    </div>
  );
}
