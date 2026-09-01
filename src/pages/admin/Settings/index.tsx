import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Typography, message } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { getContactSettings, getSocialLinks, saveSocialLink, updateContactSettings } from '@/services/settingsService';
import { getErrorMessage } from '@/utils/errors';
import type { SocialLink, SocialPlatform } from '@/types/settings';

interface ContactFormValues {
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  contactHours?: string;
}

interface SocialFormValues {
  FACEBOOK?: string;
  INSTAGRAM?: string;
  TIKTOK?: string;
}

const SOCIAL_PLATFORMS: { key: SocialPlatform; label: string }[] = [
  { key: 'FACEBOOK', label: 'Facebook' },
  { key: 'INSTAGRAM', label: 'Instagram' },
  { key: 'TIKTOK', label: 'TikTok' },
];

export default function AdminSettings() {
  const [contactForm] = Form.useForm<ContactFormValues>();
  const [socialForm] = Form.useForm<SocialFormValues>();
  const [loading, setLoading] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    Promise.all([getContactSettings(), getSocialLinks()])
      .then(([contact, links]) => {
        contactForm.setFieldsValue({
          contactEmail: contact?.contactEmail ?? '',
          contactPhone: contact?.contactPhone ?? '',
          address: contact?.address ?? '',
          contactHours: contact?.contactHours ?? '',
        });
        setSocialLinks(links);
        const socialValues: SocialFormValues = {};
        for (const link of links) socialValues[link.platform] = link.url;
        socialForm.setFieldsValue(socialValues);
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load website settings.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveContact(values: ContactFormValues) {
    setSavingContact(true);
    try {
      // Omit blank fields rather than sending empty strings — the backend's validators (e.g.
      // email format) apply to any present value, even an empty one.
      const payload = Object.fromEntries(
        Object.entries(values).filter(([, value]) => typeof value === 'string' && value.trim().length > 0),
      );
      await updateContactSettings(payload);
      message.success('Contact information updated successfully.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to update contact information.'));
    } finally {
      setSavingContact(false);
    }
  }

  async function handleSaveSocial(values: SocialFormValues) {
    setSavingSocial(true);
    try {
      let current = socialLinks;
      for (const { key } of SOCIAL_PLATFORMS) {
        const url = values[key]?.trim();
        if (!url) continue;
        const saved = await saveSocialLink(current, key, { url, enabled: true });
        current = [...current.filter((link) => link.platform !== key), saved];
      }
      setSocialLinks(current);
      message.success('Social media links updated successfully.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to update social media links.'));
    } finally {
      setSavingSocial(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Website Settings
      </Typography.Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Contact Information">
            <Form<ContactFormValues> form={contactForm} layout="vertical" onFinish={handleSaveContact}>
              <Form.Item label="Business Email" name="contactEmail" rules={[{ type: 'email', message: 'Enter a valid email address.' }]}>
                <Input placeholder="e.g. hello@example.com" />
              </Form.Item>
              <Form.Item label="Phone Number" name="contactPhone">
                <Input placeholder="e.g. +81 90 6080 4777" />
              </Form.Item>
              <Form.Item label="Address" name="address">
                <Input placeholder="Street, city, country" />
              </Form.Item>
              <Form.Item label="Business Hours" name="contactHours">
                <Input placeholder="e.g. Mon - Sun: 9AM - 6PM" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={savingContact}>
                Save Changes
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Social Media">
            <Form<SocialFormValues> form={socialForm} layout="vertical" onFinish={handleSaveSocial}>
              {SOCIAL_PLATFORMS.map(({ key, label }) => (
                <Form.Item key={key} label={label} name={key} rules={[{ type: 'url', message: 'Enter a valid URL.' }]}>
                  <Input placeholder={`https://...`} />
                </Form.Item>
              ))}
              <Button type="primary" htmlType="submit" loading={savingSocial}>
                Save Changes
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
