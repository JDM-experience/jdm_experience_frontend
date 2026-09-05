import { useEffect, useRef, useState } from 'react';
import { Button, Card, Form, Input, List, Modal, Popconfirm, Space, Tabs, Typography, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import {
  getAboutContent,
  getContactSettings,
  getPolicyForAdmin,
  getSocialLinks,
  removeSocialLink,
  saveSocialLink,
  updateAboutContent,
  updateContactSettings,
  updatePolicy,
} from '@/services/settingsService';
import { SOCIAL_PLATFORM_LABELS } from '@/utils/socialIcons';
import { getErrorMessage } from '@/utils/errors';
import type { PolicyPage, PolicyType, SocialLink, SocialPlatform } from '@/types/settings';

interface ContactFormValues {
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  contactHours?: string;
}

type SocialFormValues = Partial<Record<SocialPlatform, string>>;

const SOCIAL_PLATFORMS: SocialPlatform[] = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'TWITTER', 'YOUTUBE'];

const POLICY_TYPES: { type: PolicyType; label: string }[] = [
  { type: 'PRIVACY', label: 'Privacy Policy' },
  { type: 'TERMS', label: 'Terms & Conditions' },
  { type: 'BOOKING', label: 'Booking Policy' },
  { type: 'CANCELLATION', label: 'Cancellation Policy' },
  { type: 'PAYMENT', label: 'Payment Policy' },
  { type: 'CONDUCT', label: 'Customer Conduct Policy' },
];

function ContactInfoTab({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const [form] = Form.useForm<ContactFormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getContactSettings()
      .then((contact) => {
        form.setFieldsValue({
          contactEmail: contact?.contactEmail ?? '',
          contactPhone: contact?.contactPhone ?? '',
          address: contact?.address ?? '',
          contactHours: contact?.contactHours ?? '',
        });
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load contact information.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFinish(values: ContactFormValues) {
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(values).filter(([, value]) => typeof value === 'string' && value.trim().length > 0),
      );
      await updateContactSettings(payload);
      onDirtyChange(false);
      message.success('Website settings updated successfully.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to update website settings. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <Card>
      <Typography.Paragraph type="secondary">
        This is the contact information shown on the public Contact page. Leave a field empty if you don't want it
        displayed.
      </Typography.Paragraph>
      <Form<ContactFormValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={() => onDirtyChange(true)}
        style={{ maxWidth: 480 }}
      >
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
        <Button type="primary" htmlType="submit" loading={saving}>
          Save Changes
        </Button>
      </Form>
    </Card>
  );
}

function SocialMediaTab({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const [form] = Form.useForm<SocialFormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingPlatform, setRemovingPlatform] = useState<SocialPlatform | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  function loadLinks() {
    return getSocialLinks().then((links) => {
      setSocialLinks(links);
      const values: SocialFormValues = {};
      for (const link of links) values[link.platform] = link.url;
      form.setFieldsValue(values);
    });
  }

  useEffect(() => {
    loadLinks()
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load social media links.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFinish(values: SocialFormValues) {
    setSaving(true);
    try {
      let current = socialLinks;
      for (const platform of SOCIAL_PLATFORMS) {
        const url = values[platform]?.trim();
        if (!url) continue;
        const saved = await saveSocialLink(current, platform, { url, enabled: true });
        current = [...current.filter((link) => link.platform !== platform), saved];
      }
      setSocialLinks(current);
      onDirtyChange(false);
      message.success('Website settings updated successfully.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to update website settings. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(platform: SocialPlatform) {
    const existing = socialLinks.find((link) => link.platform === platform);
    if (!existing) {
      form.setFieldValue(platform, '');
      return;
    }
    setRemovingPlatform(platform);
    try {
      await removeSocialLink(existing.id);
      setSocialLinks((prev) => prev.filter((link) => link.id !== existing.id));
      form.setFieldValue(platform, '');
      message.success(`${SOCIAL_PLATFORM_LABELS[platform]} link removed.`);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to remove this link. Please try again.'));
    } finally {
      setRemovingPlatform(null);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <Card>
      <Typography.Paragraph type="secondary">
        Leave a platform empty if you don't want its icon displayed on the public website. Adding a URL and saving
        shows the icon; removing the link hides it completely.
      </Typography.Paragraph>
      <Form<SocialFormValues> form={form} layout="vertical" onValuesChange={() => onDirtyChange(true)} onFinish={handleFinish} style={{ maxWidth: 560 }}>
        {SOCIAL_PLATFORMS.map((platform) => {
          const hasExisting = socialLinks.some((link) => link.platform === platform && link.url.trim().length > 0);
          return (
            <Form.Item key={platform} label={SOCIAL_PLATFORM_LABELS[platform]}>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name={platform} noStyle rules={[{ type: 'url', message: 'Enter a valid URL.' }]}>
                  <Input placeholder="https://..." />
                </Form.Item>
                <Popconfirm
                  title={`Remove ${SOCIAL_PLATFORM_LABELS[platform]} link?`}
                  description="This will remove the link from the public website."
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleRemove(platform)}
                  disabled={!hasExisting}
                >
                  <Button danger icon={<DeleteOutlined />} loading={removingPlatform === platform} disabled={!hasExisting}>
                    Remove
                  </Button>
                </Popconfirm>
              </Space.Compact>
            </Form.Item>
          );
        })}
        <Button type="primary" htmlType="submit" loading={saving}>
          Save Changes
        </Button>
      </Form>
    </Card>
  );
}

interface AboutFormValues {
  title: string;
  content: string;
}

function AboutUsTab({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const [form] = Form.useForm<AboutFormValues>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAboutContent()
      .then((about) => {
        form.setFieldsValue({ title: about?.title ?? 'About Our Tours', content: about?.content ?? '' });
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load About Us content.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFinish(values: AboutFormValues) {
    setSaving(true);
    try {
      await updateAboutContent(values);
      onDirtyChange(false);
      message.success('Website settings updated successfully.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to update website settings. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <Card>
      <Typography.Paragraph type="secondary">This content is shown on the public About Us page.</Typography.Paragraph>
      <Form<AboutFormValues> form={form} layout="vertical" onValuesChange={() => onDirtyChange(true)} onFinish={handleFinish}>
        <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Title is required.' }]}>
          <Input placeholder="About Our Tours" />
        </Form.Item>
        <Form.Item label="Content" name="content" rules={[{ required: true, message: 'Content is required.' }]}>
          <RichTextEditor placeholder="Tell customers about your tours..." />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>
          Save Changes
        </Button>
      </Form>
    </Card>
  );
}

interface PolicyFormValues {
  title: string;
  content: string;
}

function PoliciesTab() {
  const [editing, setEditing] = useState<PolicyType | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<PolicyFormValues>();

  function openEditor(type: PolicyType) {
    setEditing(type);
    setLoadingPolicy(true);
    getPolicyForAdmin(type)
      .then((policy: PolicyPage) => form.setFieldsValue({ title: policy.title, content: policy.content }))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load this policy.')))
      .finally(() => setLoadingPolicy(false));
  }

  async function handleSave(values: PolicyFormValues) {
    if (!editing) return;
    setSaving(true);
    try {
      await updatePolicy(editing, values);
      message.success('Website settings updated successfully.');
      setEditing(null);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to update website settings. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <Typography.Paragraph type="secondary">
        A policy with no content saved yet is simply not shown on the public Policy page.
      </Typography.Paragraph>
      <List
        dataSource={POLICY_TYPES}
        renderItem={({ type, label }) => (
          <List.Item actions={[<Button key="edit" icon={<EditOutlined />} onClick={() => openEditor(type)}>Edit</Button>]}>
            <Typography.Text strong>{label}</Typography.Text>
          </List.Item>
        )}
      />

      <Modal
        title={editing ? `Edit ${POLICY_TYPES.find((p) => p.type === editing)?.label}` : 'Edit Policy'}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        footer={null}
        width={720}
        destroyOnHidden
      >
        {loadingPolicy ? (
          <PageSpinner />
        ) : (
          <Form<PolicyFormValues> form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Title is required.' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Content" name="content" rules={[{ required: true, message: 'Content is required.' }]}>
              <RichTextEditor placeholder="Policy content..." />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                Save Changes
              </Button>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
            </Space>
          </Form>
        )}
      </Modal>
    </Card>
  );
}

export default function AdminSettings() {
  const dirtyRef = useRef(false);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  function markDirty(dirty: boolean) {
    dirtyRef.current = dirty;
  }

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Website Settings
      </Typography.Title>

      <Tabs
        defaultActiveKey="contact"
        items={[
          { key: 'contact', label: 'Contact Information', children: <ContactInfoTab onDirtyChange={markDirty} /> },
          { key: 'social', label: 'Social Media', children: <SocialMediaTab onDirtyChange={markDirty} /> },
          { key: 'about', label: 'About Us', children: <AboutUsTab onDirtyChange={markDirty} /> },
          { key: 'policies', label: 'Policies', children: <PoliciesTab /> },
        ]}
      />
    </div>
  );
}
