import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Typography, Upload, message } from 'antd';
import { DeleteOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons';
import { ProductImage, resolveSrc } from '@/components/common/ProductImage';
import { createTour } from '@/services/tourService';
import type { CreateTourInput } from '@/types/tour';
import { uploadTourImage } from '@/services/uploadService';
import { getErrorMessage } from '@/utils/errors';
import { slugify } from '@/utils/formatters';
import { IMAGE_ACCEPT } from './constants';
import { ImageCropGuide } from './ImageCropGuide';
import { ImageFocalPointPicker } from './ImageFocalPointPicker';
import { LimitedOfferFormSection } from './LimitedOfferFormSection';
import { buildLimitedOfferInput } from './limitedOffer';
import type { TourFormValues } from './types';

interface CreateTourModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  isStaff: boolean;
  guideOptions: { value: number; label: string }[];
}

interface DraftImage {
  imageUrl: string;
  focalX: number;
  focalY: number;
}

export function CreateTourModal({ open, onClose, onCreated, isStaff, guideOptions }: CreateTourModalProps) {
  const [form] = Form.useForm<TourFormValues>();
  const [creating, setCreating] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [images, setImages] = useState<DraftImage[]>([]);
  const [uploading, setUploading] = useState(false);
  // Which image the "reposition" editor is open for, by URL (URLs are unique within this draft list).
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [draftFocal, setDraftFocal] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSlugEdited(false);
      setImages([]);
      setPreviewUrl(null);
    }
  }, [open, form]);

  useEffect(() => {
    const target = images.find((img) => img.imageUrl === previewUrl);
    if (target) setDraftFocal({ x: target.focalX, y: target.focalY });
  }, [previewUrl, images]);

  async function handleUploadImage(file: File) {
    setUploading(true);
    try {
      const imageUrl = await uploadTourImage(file);
      setImages((prev) => [...prev, { imageUrl, focalX: 50, focalY: 50 }]);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to upload this image.'));
    } finally {
      setUploading(false);
    }
    return Upload.LIST_IGNORE;
  }

  function handleSavePosition() {
    if (!previewUrl) return;
    setImages((prev) =>
      prev.map((img) => (img.imageUrl === previewUrl ? { ...img, focalX: draftFocal.x, focalY: draftFocal.y } : img)),
    );
    setPreviewUrl(null);
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
    let offerFields: Partial<CreateTourInput> = {};
    if (isStaff) {
      const offer = buildLimitedOfferInput(values);
      if ('error' in offer) {
        message.error(offer.error);
        return;
      }
      offerFields = offer;
    }

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
        images: images.length
          ? images.map((img, sortOrder) => ({ imageUrl: img.imageUrl, sortOrder, focalX: img.focalX, focalY: img.focalY }))
          : undefined,
        ...offerFields,
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
          <>
            <Form.Item label="Tour Guide" name="guideId" extra="Who this tour is assigned to. Leave unset to keep it unassigned.">
              <Select allowClear placeholder="Unassigned" options={guideOptions} notFoundContent="No tour guides available" />
            </Form.Item>
            <LimitedOfferFormSection form={form} />
          </>
        )}
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
          New tours start as <strong>Pending</strong> — an Admin must confirm the tour before it
          becomes Available to customers.
        </Typography.Text>
        <Form.Item label="Images" extra="JPEG, PNG, WebP or AVIF, up to 5 MB each.">
          {images.length > 0 && (
            <Space wrap style={{ marginBottom: 8 }}>
              {images.map((img, index) => (
                <div key={img.imageUrl} style={{ position: 'relative' }}>
                  <ProductImage
                    fileName={img.imageUrl}
                    alt={`Tour image ${index + 1}`}
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: 'cover',
                      objectPosition: `${img.focalX}% ${img.focalY}%`,
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                    onClick={() => setPreviewUrl(img.imageUrl)}
                  />
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    aria-label="Reposition and preview how this image will be cropped on the site"
                    onClick={() => setPreviewUrl(img.imageUrl)}
                    style={{ position: 'absolute', bottom: -8, left: -8 }}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ position: 'absolute', top: -8, right: -8 }}
                    onClick={() => setImages((prev) => prev.filter((i) => i.imageUrl !== img.imageUrl))}
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

      <Modal
        title="Reposition Image"
        open={previewUrl !== null}
        onCancel={() => setPreviewUrl(null)}
        footer={[
          <Button key="cancel" onClick={() => setPreviewUrl(null)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleSavePosition}>
            Save Position
          </Button>,
        ]}
        width={480}
      >
        {previewUrl && (
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <ImageFocalPointPicker
              src={resolveSrc(previewUrl)}
              alt="Tour image preview"
              focalX={draftFocal.x}
              focalY={draftFocal.y}
              onChange={(x, y) => setDraftFocal({ x, y })}
            />
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              The dimmed area below will be cut off — only the outlined area will actually be visible.
            </Typography.Paragraph>
            <ImageCropGuide
              src={resolveSrc(previewUrl)}
              alt="Tour image preview"
              ratio={1.4}
              label="Tours Grid Card"
              description="Shown on the Home page and the Tours listing."
              focalX={draftFocal.x}
              focalY={draftFocal.y}
            />
            <ImageCropGuide
              src={resolveSrc(previewUrl)}
              alt="Tour image preview"
              ratio={2.6}
              label="Featured Tours Hero (desktop)"
              description="Shown at the top of the Home page when this is one of the first 3 tours. Much wider than the card, so this crops more aggressively -- on mobile it's closer to the card's shape instead."
              focalX={draftFocal.x}
              focalY={draftFocal.y}
            />
          </Space>
        )}
      </Modal>
    </Modal>
  );
}
