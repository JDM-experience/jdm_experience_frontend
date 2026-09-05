import { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Modal, Select, message } from 'antd';
import { updateTour } from '@/services/tourService';
import { getErrorMessage } from '@/utils/errors';
import type { Tour, UpdateTourInput } from '@/types/tour';
import { MANUAL_STATUS_OPTIONS } from './constants';
import type { TourFormValues } from './types';
import { TourImagesEditor } from './TourImagesEditor';

interface EditTourModalProps {
  open: boolean;
  tour: Tour | null;
  onClose: () => void;
  onSaved: () => void;
  onImagesChanged: () => void | Promise<void>;
  isStaff: boolean;
  guideOptions: { value: number; label: string }[];
}

export function EditTourModal({ open, tour, onClose, onSaved, onImagesChanged, isStaff, guideOptions }: EditTourModalProps) {
  const [form] = Form.useForm<TourFormValues>();
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open && tour) {
      form.setFieldsValue({
        name: tour.name,
        slug: tour.slug,
        description: tour.description ?? '',
        price: tour.price,
        currency: tour.currency,
        status: tour.status,
        seats: tour.seats,
        guideId: tour.guide?.id,
      });
    }
    // Deliberately keyed on tour id, not the tour object — refreshTour() swaps in a new
    // tour reference (e.g. after an image upload) while this modal is open, and that
    // must not clobber whatever the admin is mid-typing in the other fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tour?.id]);

  async function handleFinish(values: TourFormValues) {
    if (!tour) return;
    setUpdating(true);
    try {
      const input: UpdateTourInput = {
        name: values.name,
        slug: values.slug,
        description: values.description?.trim() || undefined,
        price: values.price,
        currency: values.currency,
        seats: values.seats,
        // A Tour Guide never gets a status/guideId control rendered (see below), and the backend
        // rejects a guide-submitted status change regardless — this just avoids sending fields the
        // form never showed.
        ...(isStaff ? { status: values.status, guideId: values.guideId ?? null } : {}),
      };
      await updateTour(tour.id, input);
      message.success('Tour updated successfully.');
      onClose();
      onSaved();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to save this tour.'));
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Modal
      title="Edit Tour"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={updating}
      okText="Save Changes"
      width={640}
    >
      <Form<TourFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Tour Name" name="name" rules={[{ required: true, message: 'Tour name is required.' }]}>
          <Input placeholder="Enter tour name" />
        </Form.Item>
        <Form.Item
          label="Slug"
          name="slug"
          rules={[
            { required: true, message: 'Slug is required.' },
            { pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, message: 'Lowercase, alphanumeric, hyphen-separated.' },
          ]}
        >
          <Input placeholder="e.g. mt-fuji-jdm-drive-tour" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} placeholder="Short description of the tour" />
        </Form.Item>
        <Form.Item label="Price" name="price" rules={[{ required: true, message: 'Price is required.' }]}>
          <InputNumber style={{ width: '100%' }} min={0.01} step={0.01} placeholder="Enter tour price" />
        </Form.Item>
        <Form.Item
          label="Currency"
          name="currency"
          rules={[{ required: true, message: 'Currency is required.' }, { len: 3, message: 'Use a 3-letter currency code.' }]}
        >
          <Input maxLength={3} placeholder="JPY" style={{ textTransform: 'uppercase' }} />
        </Form.Item>
        <Form.Item label="Seats" name="seats" rules={[{ required: true, message: 'Seats is required.' }]}>
          <InputNumber style={{ width: '100%' }} min={1} step={1} placeholder="Number of seats" />
        </Form.Item>
        {isStaff && (
          <>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Select a status.' }]}
              extra={tour?.status === 'PENDING' ? 'Use "Confirm" on the tour list to make a Pending tour Available.' : undefined}
            >
              <Select
                options={tour?.status === 'PENDING' ? [{ value: 'PENDING', label: 'Pending' }] : MANUAL_STATUS_OPTIONS}
                disabled={tour?.status === 'PENDING'}
              />
            </Form.Item>
            <Form.Item label="Tour Guide" name="guideId" extra="Who this tour is assigned to. Leave unset to keep it unassigned.">
              <Select allowClear placeholder="Unassigned" options={guideOptions} notFoundContent="No tour guides available" />
            </Form.Item>
          </>
        )}
        {tour && (
          <Form.Item label="Images">
            <TourImagesEditor tour={tour} onChange={onImagesChanged} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
