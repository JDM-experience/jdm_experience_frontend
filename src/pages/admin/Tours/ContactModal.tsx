import { useEffect, useState } from 'react';
import { Form, Input, Modal, Typography, message } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { getTourContact, updateTourContact } from '@/services/tourService';
import { getErrorMessage } from '@/utils/errors';
import type { Tour, TourContact } from '@/types/tour';

interface ContactModalProps {
  open: boolean;
  tour: Tour | null;
  onClose: () => void;
}

/** Customer-facing contact info (shown to the customer once a booking is CONFIRMED) —
 *  SUPER_ADMIN/ADMIN may manage any tour's; a Tour Guide only their own (enforced server-side). */
export function ContactModal({ open, tour, onClose }: ContactModalProps) {
  const [form] = Form.useForm<TourContact>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && tour) {
      setLoading(true);
      getTourContact(tour.id)
        .then((contact) =>
          form.setFieldsValue({
            contactName: contact.contactName ?? '',
            contactEmail: contact.contactEmail ?? '',
            contactPhone: contact.contactPhone ?? '',
          }),
        )
        .catch((error) => message.error(getErrorMessage(error, 'Unable to load contact information.')))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tour?.id]);

  async function handleFinish(values: TourContact) {
    if (!tour) return;
    setSaving(true);
    try {
      await updateTourContact(tour.id, {
        contactName: values.contactName?.trim() || undefined,
        contactEmail: values.contactEmail?.trim() || undefined,
        contactPhone: values.contactPhone?.trim() || undefined,
      });
      message.success('Contact information updated.');
      onClose();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to save contact information.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Customer Contact${tour ? ` — ${tour.name}` : ''}`}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText="Save Contact Info"
    >
      {loading ? (
        <PageSpinner />
      ) : (
        <Form<TourContact> form={form} layout="vertical" onFinish={handleFinish}>
          <Typography.Paragraph type="secondary" style={{ marginTop: -8, fontSize: 12 }}>
            Shown to the customer once their booking on this tour is confirmed — not necessarily
            the same as your own account email/phone.
          </Typography.Paragraph>
          <Form.Item label="Contact Name" name="contactName">
            <Input placeholder="e.g. John Smith" />
          </Form.Item>
          <Form.Item label="Contact Email" name="contactEmail" rules={[{ type: 'email', message: 'Enter a valid email address.' }]}>
            <Input placeholder="john@example.com" />
          </Form.Item>
          <Form.Item label="Contact Phone" name="contactPhone">
            <Input placeholder="+81-90-1234-5678" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
