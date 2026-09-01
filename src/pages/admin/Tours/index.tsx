import { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { DeleteOutlined, EditOutlined, PictureOutlined, PlusOutlined, ScheduleOutlined, UploadOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  addTourAvailability,
  addTourImage,
  archiveTour,
  createTour,
  getMyTours,
  getTours,
  removeTourAvailability,
  removeTourImage,
  updateTour,
} from '@/services/tourService';
import { listUsers } from '@/services/adminUserService';
import { uploadTourImage } from '@/services/uploadService';
import { getErrorMessage } from '@/utils/errors';
import type { CreateTourInput, Tour, TourStatus } from '@/types/tour';
import type { ManagedUser } from '@/types/managedUser';

interface TourFormValues {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  status: TourStatus;
  capacity: number;
  guideId?: number;
}

const STATUS_OPTIONS: { value: TourStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const STATUS_COLOR: Record<TourStatus, string> = {
  DRAFT: 'default',
  ACTIVE: 'success',
  INACTIVE: 'warning',
  ARCHIVED: 'error',
};

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminTours() {
  const { admin } = useAdminAuth();
  const isGuide = admin?.role === 'TOUR_GUIDE';
  const isStaff = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';

  const [tours, setTours] = useState<Tour[]>([]);
  const [guides, setGuides] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [form] = Form.useForm<TourFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [imagesTour, setImagesTour] = useState<Tour | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [addingImage, setAddingImage] = useState(false);

  const [availabilityTour, setAvailabilityTour] = useState<Tour | null>(null);
  const [newSlotDate, setNewSlotDate] = useState<Dayjs | null>(null);
  const [newSlotSpots, setNewSlotSpots] = useState(1);
  const [addingSlot, setAddingSlot] = useState(false);

  function fetchTours() {
    setLoading(true);
    // A guide only ever needs their own tours -- my-tours already scopes server-side,
    // avoiding fetching (and filtering out) every other guide's tours client-side.
    (isGuide ? getMyTours() : getTours())
      .then((results) => setTours(results))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load tours.')))
      .finally(() => setLoading(false));
  }

  useEffect(fetchTours, [isGuide]);

  // Only staff get a guide-picker in the form -- a Tour Guide is always auto-assigned to
  // their own tours server-side, so they never need to see or choose from this list.
  useEffect(() => {
    if (!isStaff) return;
    listUsers()
      .then((users) => setGuides(users.filter((u) => u.role === 'TOUR_GUIDE')))
      .catch(() => setGuides([]));
  }, [isStaff]);

  function openAddModal() {
    setEditingTour(null);
    form.resetFields();
    form.setFieldsValue({ currency: 'JPY', status: 'ACTIVE', capacity: 1 });
    setModalOpen(true);
  }

  function openEditModal(tour: Tour) {
    setEditingTour(tour);
    form.setFieldsValue({
      name: tour.name,
      slug: tour.slug,
      description: tour.description ?? '',
      price: tour.price,
      currency: tour.currency,
      status: tour.status,
      capacity: tour.capacity,
      guideId: tour.guide?.userId,
    });
    setModalOpen(true);
  }

  async function handleFinish(values: TourFormValues) {
    setSubmitting(true);
    try {
      const payload: CreateTourInput = {
        name: values.name,
        slug: values.slug,
        description: values.description || undefined,
        price: values.price,
        currency: values.currency,
        status: values.status,
        capacity: values.capacity,
        guideId: isStaff ? (values.guideId ?? null) : undefined,
      };

      if (editingTour) {
        await updateTour(editingTour.id, payload);
        message.success('Tour updated successfully.');
      } else {
        await createTour(payload);
        message.success('Tour created successfully.');
      }
      setModalOpen(false);
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to save this tour.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive(tour: Tour) {
    try {
      await archiveTour(tour.id);
      message.success('Tour archived.');
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to archive this tour.'));
    }
  }

  async function handleAddImage() {
    if (!imagesTour || !newImageUrl.trim()) return;
    setAddingImage(true);
    try {
      const image = await addTourImage(imagesTour.id, newImageUrl.trim(), imagesTour.images.length);
      setImagesTour({ ...imagesTour, images: [...imagesTour.images, image] });
      setNewImageUrl('');
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to add this image. Check the URL is valid.'));
    } finally {
      setAddingImage(false);
    }
  }

  const uploadProps: UploadProps = {
    accept: 'image/jpeg,image/png,image/webp,image/gif',
    maxCount: 1,
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      if (!imagesTour) return;
      try {
        const url = await uploadTourImage(file as File);
        const image = await addTourImage(imagesTour.id, url, imagesTour.images.length);
        setImagesTour((prev) => (prev ? { ...prev, images: [...prev.images, image] } : prev));
        fetchTours();
        onSuccess?.(image);
        message.success('Image uploaded.');
      } catch (error) {
        onError?.(error as Error);
        message.error(getErrorMessage(error, 'Unable to upload this image.'));
      }
    },
  };

  async function handleRemoveImage(imageId: number) {
    if (!imagesTour) return;
    try {
      await removeTourImage(imagesTour.id, imageId);
      setImagesTour({ ...imagesTour, images: imagesTour.images.filter((img) => img.id !== imageId) });
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to remove this image.'));
    }
  }

  async function handleAddSlot() {
    if (!availabilityTour || !newSlotDate) return;
    setAddingSlot(true);
    try {
      const slot = await addTourAvailability(availabilityTour.id, newSlotDate.toISOString(), newSlotSpots);
      setAvailabilityTour({ ...availabilityTour, availability: [...availabilityTour.availability, slot] });
      setNewSlotDate(null);
      setNewSlotSpots(1);
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to add this availability slot.'));
    } finally {
      setAddingSlot(false);
    }
  }

  async function handleRemoveSlot(availabilityId: number) {
    if (!availabilityTour) return;
    try {
      await removeTourAvailability(availabilityTour.id, availabilityId);
      setAvailabilityTour({
        ...availabilityTour,
        availability: availabilityTour.availability.filter((slot) => slot.id !== availabilityId),
      });
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to remove this availability slot.'));
    }
  }

  if (loading) return <PageSpinner />;

  const columns: ColumnsType<Tour> = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Slug', dataIndex: 'slug', render: (slug: string) => <Typography.Text code>{slug}</Typography.Text> },
    { title: 'Price', dataIndex: 'price', render: (price: number, tour) => `${tour.currency} ${price.toLocaleString()}` },
    { title: 'Status', dataIndex: 'status', render: (status: TourStatus) => <Tag color={STATUS_COLOR[status]}>{status}</Tag> },
    { title: 'Guide', dataIndex: 'guide', render: (guide: Tour['guide']) => guide?.fullName ?? '— unassigned —' },
    { title: 'Images', dataIndex: 'images', render: (images: Tour['images']) => images.length },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, tour) => (
        <Space wrap>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(tour)}>
            Edit
          </Button>
          <Button size="small" icon={<PictureOutlined />} onClick={() => setImagesTour(tour)}>
            Images
          </Button>
          <Button size="small" icon={<ScheduleOutlined />} onClick={() => setAvailabilityTour(tour)}>
            Availability
          </Button>
          {tour.status !== 'ARCHIVED' && (isStaff ? admin?.role === 'SUPER_ADMIN' : true) && (
            <Popconfirm title={`Archive "${tour.name}"?`} onConfirm={() => handleArchive(tour)}>
              <Button size="small" danger icon={<DeleteOutlined />}>
                Archive
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Tours
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Add Tour
        </Button>
      </div>

      <Table columns={columns} dataSource={tours} rowKey="id" scroll={{ x: true }} />

      <Modal
        title={editingTour ? 'Edit Tour' : 'Add Tour'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingTour ? 'Save Changes' : 'Create Tour'}
        width={560}
      >
        <Form<TourFormValues>
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          onValuesChange={(changed) => {
            // Auto-fill the slug from the name for a new tour, until the user edits it directly.
            if (!editingTour && changed.name !== undefined) {
              const currentSlug = form.getFieldValue('slug');
              const autoSlug = slugify(form.getFieldValue('name') ?? '');
              if (!currentSlug || currentSlug === slugify(changed.name ?? '').slice(0, currentSlug.length)) {
                form.setFieldsValue({ slug: autoSlug });
              }
            }
          }}
        >
          <Form.Item label="Tour Name" name="name" rules={[{ required: true, message: 'Tour name is required.' }]}>
            <Input placeholder="e.g. Mt. Fuji JDM Drive Tour" />
          </Form.Item>
          <Form.Item
            label="Slug"
            name="slug"
            rules={[
              { required: true, message: 'Slug is required.' },
              { pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, message: 'Lowercase, alphanumeric, hyphen-separated only.' },
            ]}
          >
            <Input placeholder="e.g. mt-fuji-jdm-drive-tour" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Describe the tour..." />
          </Form.Item>
          <Space.Compact block>
            <Form.Item label="Price" name="price" rules={[{ required: true, message: 'Price is required.' }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0.01} placeholder="25000" />
            </Form.Item>
            <Form.Item label="Currency" name="currency" style={{ width: 100 }}>
              <Input maxLength={3} style={{ textTransform: 'uppercase' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item label="Status" name="status" style={{ flex: 1 }}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item label="Capacity" name="capacity" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Space.Compact>
          {isStaff && (
            <Form.Item label="Tour Guide" name="guideId">
              <Select
                allowClear
                placeholder="Unassigned"
                options={guides.map((g) => ({ value: g.id, label: g.fullName ?? g.email }))}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={`Images — ${imagesTour?.name ?? ''}`}
        open={imagesTour !== null}
        onCancel={() => setImagesTour(null)}
        footer={null}
      >
        <Space wrap style={{ marginBottom: 16 }}>
          {imagesTour?.images.map((img) => (
            <div key={img.id} style={{ position: 'relative' }}>
              <Image src={img.imageUrl} alt="Tour" width={100} height={100} style={{ objectFit: 'cover', borderRadius: 6 }} />
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ position: 'absolute', top: 2, right: 2 }}
                onClick={() => handleRemoveImage(img.id)}
              />
            </div>
          ))}
        </Space>

        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} block>
            Upload Image (JPEG/PNG/WebP/GIF, max 5MB)
          </Button>
        </Upload>

        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 4 }}>
          Or paste a link to an already-hosted image:
        </Typography.Paragraph>
        <Space.Compact block>
          <Input
            placeholder="https://example.com/image.jpg"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onPressEnter={handleAddImage}
          />
          <Button type="primary" loading={addingImage} onClick={handleAddImage}>
            Add
          </Button>
        </Space.Compact>
      </Modal>

      <Modal
        title={`Availability — ${availabilityTour?.name ?? ''}`}
        open={availabilityTour !== null}
        onCancel={() => setAvailabilityTour(null)}
        footer={null}
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="small">
          {availabilityTour?.availability.map((slot) => (
            <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {dayjs(slot.startDatetime).format('MMM D, YYYY h:mm A')} — {slot.spotsRemaining} spots
              </span>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemoveSlot(slot.id)} />
            </div>
          ))}
          {availabilityTour?.availability.length === 0 && (
            <Typography.Text type="secondary">No availability slots yet.</Typography.Text>
          )}
        </Space>

        <Space.Compact block style={{ marginTop: 16 }}>
          <input
            type="datetime-local"
            style={{ flex: 1, padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: '6px 0 0 6px' }}
            onChange={(e) => setNewSlotDate(e.target.value ? dayjs(e.target.value) : null)}
          />
          <InputNumber min={1} value={newSlotSpots} onChange={(v) => setNewSlotSpots(v ?? 1)} placeholder="Spots" />
          <Button type="primary" loading={addingSlot} onClick={handleAddSlot} disabled={!newSlotDate}>
            Add
          </Button>
        </Space.Compact>
      </Modal>
    </div>
  );
}
