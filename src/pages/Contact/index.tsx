import { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, Input, Row, Space, Spin, Typography } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { createMessage } from '@/services/messageService';
import { getContactSettings, getSocialLinks } from '@/services/settingsService';
import { getErrorMessage } from '@/utils/errors';
import { SOCIAL_ICONS, visibleSocialLinks } from '@/utils/socialIcons';
import type { CreateContactMessageInput } from '@/types/contactMessage';
import type { ContactSettings, SocialLink } from '@/types/settings';

export default function Contact() {
  const [form] = Form.useForm<CreateContactMessageInput>();
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [contactInfo, setContactInfo] = useState<ContactSettings | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [infoLoading, setInfoLoading] = useState(true);

  useEffect(() => {
    Promise.all([getContactSettings(), getSocialLinks()])
      .then(([info, links]) => {
        setContactInfo(info);
        setSocialLinks(links);
      })
      .catch(() => {
        // Contact info is supplementary to the form below — fail quietly and just show nothing.
      })
      .finally(() => setInfoLoading(false));
  }, []);

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

  const visibleLinks = visibleSocialLinks(socialLinks);

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

          {infoLoading ? (
            <Spin />
          ) : (
            <>
              <Space orientation="vertical" size="middle">
                {contactInfo?.address && (
                  <Typography.Text>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    {contactInfo.address}
                  </Typography.Text>
                )}
                {contactInfo?.contactPhone && (
                  <Typography.Text>
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    {contactInfo.contactPhone}
                  </Typography.Text>
                )}
                {contactInfo?.contactEmail && (
                  <Typography.Text>
                    <MailOutlined style={{ marginRight: 8 }} />
                    {contactInfo.contactEmail}
                  </Typography.Text>
                )}
                {contactInfo?.contactHours && (
                  <Typography.Text>
                    <ClockCircleOutlined style={{ marginRight: 8 }} />
                    {contactInfo.contactHours}
                  </Typography.Text>
                )}
              </Space>

              {visibleLinks.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <Space size="large">
                    {visibleLinks.map((link) => (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', fontSize: 24 }}
                      >
                        {SOCIAL_ICONS[link.platform]}
                      </a>
                    ))}
                  </Space>
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}
