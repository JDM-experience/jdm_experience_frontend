import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Typography, Upload, message } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { ProductImage } from '@/components/common/ProductImage';
import { createTour } from '@/services/tourService';
import { uploadTourImage } from '@/services/uploadService';
import { getErrorMessage } from '@/utils/errors';
import { slugify } from '@/utils/formatters';
import { IMAGE_ACCEPT } from './constants';
import type { TourFormValues } from './types';

interface CreateTourModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  isStaff: boolean;
  guideOptions: { value: number; label: string }[];
}

export function CreateTourModal({ open, onClose, onCreated, isStaff, guideOptions }: CreateTourModalProps) {
  const [form] = Form.useForm<TourFormValues>();
  const [creating, setCreating] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSlugEdited(false);
      setImages([]);
    }
  }, [open, form]);

  async function handleUploadImage(file: File) {
    setUploading(true);
    try {
      const imageUrl = await uploadTourImage(file);
      setImages((prev) => [...prev, imageUrl]);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to upload this image.'));
    } finally {
      setUploading(false);
    }
    return Upload.LIST_IGNORE;
  }

  function handleValuesChange(changed: Partial<TourFormValues>) {
    if (changed.name !== undefined && !slugEdited) {
      form.setFieldValue('slug', slugify(changed.name));
    }
    if (changed.slug !== undefined) {
      setSlugEdited(true);
    }
  }

  async function handleFinish(values: TourFormValues) {
    setCreating(true);
    try {
      await createTour({
        name: values.name,
        slug: values.slug,
        description: values.description?.trim() || undefined,
        price: values.price,
        currency: values.currency,
        seats: values.seats,
        guideId: values.guideId,
        images: images.length ? images.map((imageUrl, sortOrder) => ({ imageUrl, sortOrder })) : undefined,
      });
      message.success('Tour created — it starts Pending until an Admin confirms it.');
      onClose();
      onCreated();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to create this tour.'));
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal
      title="Create Tour"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={creating}
      okText="Create Tour"
      width={640}
    >
      <Form<TourFormValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={handleValuesChange}
        initialValues={{ currency: 'JPY', seats: 1 }}
      >
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
          extra="Used in the tour's URL. Auto-filled from the name — edit if you need something different."
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
          <Form.Item label="Tour Guide" name="guideId" extra="Who this tour is assigned to. Leave unset to keep it unassigned.">
            <Select allowClear placeholder="Unassigned" options={guideOptions} notFoundContent="No tour guides available" />
          </Form.Item>
        )}
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
          New tours start as <strong>Pending</strong> — an Admin must confirm the tour before it
          becomes Available to customers.
        </Typography.Text>
        <Form.Item label="Images" extra="JPEG, PNG, WebP or AVIF, up to 5 MB each.">
          {images.length > 0 && (
            <Space wrap style={{ marginBottom: 8 }}>
              {images.map((url, index) => (
                <div key={url} style={{ position: 'relative' }}>
                  <ProductImage
                    fileName={url}
                    alt={`Tour image ${index + 1}`}
                    style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 4 }}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ position: 'absolute', top: -8, right: -8 }}
                    onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                  />
                </div>
              ))}
            </Space>
          )}
          <Upload accept={IMAGE_ACCEPT} multiple showUploadList={false} beforeUpload={handleUploadImage}>
            <Button icon={<UploadOutlined />} loading={uploading}>
              Upload Image
            </Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
