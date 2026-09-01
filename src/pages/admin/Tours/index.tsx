import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  Button,
  DatePicker,
  Form,
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
import { DeleteOutlined, EditOutlined, PictureOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { ProductImage } from '@/components/common/ProductImage';
import {
  addTourAvailability,
  addTourImage,
  archiveTour,
  createTour,
  listTours,
  removeTourAvailability,
  removeTourImage,
  updateTour,
} from '@/services/tourService';
import { ALLOWED_IMAGE_TYPES, uploadTourImage } from '@/services/uploadService';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency, formatDateTime, slugify } from '@/utils/formatters';
import type { Tour, TourStatus, UpdateTourInput } from '@/types/tour';

interface TourFormValues {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  status: TourStatus;
  capacity: number;
}

const TOUR_STATUS_OPTIONS: { value: TourStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const STATUS_COLOR: Record<TourStatus, string> = {
  DRAFT: 'default',
  ACTIVE: 'green',
  INACTIVE: 'orange',
  ARCHIVED: 'red',
};

const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

/** Image gallery + uploader for an existing tour. Shared by the "Manage Images" and "Edit Tour" modals. */
function TourImagesEditor({ tour, onChange }: { tour: Tour; onChange: () => void | Promise<void> }) {
  const [urlValue, setUrlValue] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>, fallback: string) {
    setBusy(true);
    try {
      await fn();
      await onChange();
    } catch (error) {
      message.error(getErrorMessage(error, fallback));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap>
        {tour.images.length === 0 && <Typography.Text type="secondary">No images yet.</Typography.Text>}
        {tour.images.map((img) => (
          <div key={img.id} style={{ position: 'relative' }}>
            <ProductImage
              fileName={img.imageUrl}
              alt={tour.name}
              style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 4 }}
            />
            <Popconfirm
              title="Remove this image?"
              onConfirm={() => run(() => removeTourImage(tour.id, img.id), 'Unable to remove this image.')}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ position: 'absolute', top: -8, right: -8 }}
              />
            </Popconfirm>
          </div>
        ))}
      </Space>

      <Upload
        accept={IMAGE_ACCEPT}
        multiple
        showUploadList={false}
        beforeUpload={(file) => {
          void run(async () => {
            const imageUrl = await uploadTourImage(file);
            await addTourImage(tour.id, { imageUrl, sortOrder: tour.images.length });
          }, 'Unable to upload this image.');
          return Upload.LIST_IGNORE;
        }}
      >
        <Button icon={<UploadOutlined />} loading={busy}>
          Upload Image
        </Button>
      </Upload>

      <div>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
          …or add by URL
        </Typography.Text>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="https://example.com/tour.jpg"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
          />
          <Button
            type="primary"
            loading={busy}
            onClick={() => {
              const imageUrl = urlValue.trim();
              if (!imageUrl) return;
              void run(async () => {
                await addTourImage(tour.id, { imageUrl, sortOrder: tour.images.length });
                setUrlValue('');
              }, 'Unable to add this image.');
            }}
          >
            Add
          </Button>
        </Space.Compact>
      </div>
    </Space>
  );
}

export default function AdminTours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  const [createForm] = Form.useForm<TourFormValues>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [newTourImages, setNewTourImages] = useState<string[]>([]);
  const [uploadingNewImage, setUploadingNewImage] = useState(false);

  const [editForm] = Form.useForm<TourFormValues>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [updating, setUpdating] = useState(false);

  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [imagesTour, setImagesTour] = useState<Tour | null>(null);

  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [availabilityTour, setAvailabilityTour] = useState<Tour | null>(null);
  const [newSlotDatetime, setNewSlotDatetime] = useState<Dayjs | null>(null);
  const [newSlotSpots, setNewSlotSpots] = useState(1);
  const [addingSlot, setAddingSlot] = useState(false);

  function fetchTours() {
    setLoading(true);
    listTours()
      .then((results) => setTours([...results].sort((a, b) => b.id - a.id)))
      .finally(() => setLoading(false));
  }

  useEffect(fetchTours, []);

  async function refreshTour(id: number) {
    const results = await listTours();
    const updated = results.find((t) => t.id === id) ?? null;
    setTours([...results].sort((a, b) => b.id - a.id));
    if (updated) {
      setImagesTour((prev) => (prev && prev.id === id ? updated : prev));
      setAvailabilityTour((prev) => (prev && prev.id === id ? updated : prev));
      setEditingTour((prev) => (prev && prev.id === id ? updated : prev));
    }
  }

  // Create
  function openCreateModal() {
    createForm.resetFields();
    setSlugEdited(false);
    setNewTourImages([]);
    setCreateModalOpen(true);
  }

  async function handleUploadNewTourImage(file: File) {
    setUploadingNewImage(true);
    try {
      const imageUrl = await uploadTourImage(file);
      setNewTourImages((prev) => [...prev, imageUrl]);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to upload this image.'));
    } finally {
      setUploadingNewImage(false);
    }
    return Upload.LIST_IGNORE;
  }

  function handleCreateValuesChange(changed: Partial<TourFormValues>) {
    if (changed.name !== undefined && !slugEdited) {
      createForm.setFieldValue('slug', slugify(changed.name));
    }
    if (changed.slug !== undefined) {
      setSlugEdited(true);
    }
  }

  async function handleCreateFinish(values: TourFormValues) {
    setCreating(true);
    try {
      await createTour({
        name: values.name,
        slug: values.slug,
        description: values.description?.trim() || undefined,
        price: values.price,
        currency: values.currency,
        status: values.status,
        capacity: values.capacity,
        images: newTourImages.length
          ? newTourImages.map((imageUrl, sortOrder) => ({ imageUrl, sortOrder }))
          : undefined,
      });
      message.success('Tour created successfully.');
      setCreateModalOpen(false);
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to create this tour.'));
    } finally {
      setCreating(false);
    }
  }

  // Edit
  function openEditModal(tour: Tour) {
    setEditingTour(tour);
    editForm.setFieldsValue({
      name: tour.name,
      slug: tour.slug,
      description: tour.description ?? '',
      price: tour.price,
      currency: tour.currency,
      status: tour.status,
      capacity: tour.capacity,
    });
    setEditModalOpen(true);
  }

  async function handleEditFinish(values: TourFormValues) {
    if (!editingTour) return;
    setUpdating(true);
    try {
      const input: UpdateTourInput = {
        name: values.name,
        slug: values.slug,
        description: values.description?.trim() || undefined,
        price: values.price,
        currency: values.currency,
        status: values.status,
        capacity: values.capacity,
      };
      await updateTour(editingTour.id, input);
      message.success('Tour updated successfully.');
      setEditModalOpen(false);
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to save this tour.'));
    } finally {
      setUpdating(false);
    }
  }

  // Archive
  async function handleArchive(id: number) {
    try {
      await archiveTour(id);
      message.success('Tour archived.');
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to archive this tour.'));
    }
  }

  // Images
  function openImagesModal(tour: Tour) {
    setImagesTour(tour);
    setImagesModalOpen(true);
  }

  // Availability
  function openAvailabilityModal(tour: Tour) {
    setAvailabilityTour(tour);
    setNewSlotDatetime(null);
    setNewSlotSpots(1);
    setAvailabilityModalOpen(true);
  }

  async function handleAddSlot() {
    if (!availabilityTour || !newSlotDatetime) return;
    setAddingSlot(true);
    try {
      await addTourAvailability(availabilityTour.id, {
        startDatetime: newSlotDatetime.format('YYYY-MM-DDTHH:mm:ssZ'),
        spotsRemaining: newSlotSpots,
      });
      setNewSlotDatetime(null);
      setNewSlotSpots(1);
      await refreshTour(availabilityTour.id);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to add this slot.'));
    } finally {
      setAddingSlot(false);
    }
  }

  async function handleRemoveSlot(availabilityId: number) {
    if (!availabilityTour) return;
    try {
      await removeTourAvailability(availabilityTour.id, availabilityId);
      await refreshTour(availabilityTour.id);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to remove this slot.'));
    }
  }

  const columns: ColumnsType<Tour> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: 'Name',
      dataIndex: 'name',
      render: (_, tour) => (
        <div>
          <Typography.Text strong>{tour.name}</Typography.Text>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {tour.slug}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      render: (_, tour) => (
        <span>
          {formatCurrency(tour.price)} {tour.currency}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: TourStatus) => <Tag color={STATUS_COLOR[status]}>{status}</Tag>,
    },
    { title: 'Capacity', dataIndex: 'capacity' },
    {
      title: 'Guide',
      key: 'guide',
      render: (_, tour) => tour.guide?.fullName ?? tour.guide?.email ?? 'Unassigned',
    },
    {
      title: 'Images',
      key: 'images',
      render: (_, tour) => (
        <Button size="small" icon={<PictureOutlined />} onClick={() => openImagesModal(tour)}>
          {tour.images.length}
        </Button>
      ),
    },
    {
      title: 'Availability',
      key: 'availability',
      render: (_, tour) => (
        <Button size="small" onClick={() => openAvailabilityModal(tour)}>
          {tour.availability.length} slot{tour.availability.length === 1 ? '' : 's'}
        </Button>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, tour) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(tour)} />
          <Popconfirm title={`Archive ${tour.name}?`} onConfirm={() => handleArchive(tour.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} disabled={tour.status === 'ARCHIVED'} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) return <PageSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Manage Tours
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Tour
        </Button>
      </div>

      <Table columns={columns} dataSource={tours} rowKey="id" scroll={{ x: true }} />

      <Modal
        title="Create Tour"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={creating}
        okText="Create Tour"
        width={640}
      >
        <Form<TourFormValues>
          form={createForm}
          layout="vertical"
          onFinish={handleCreateFinish}
          onValuesChange={handleCreateValuesChange}
          initialValues={{ currency: 'JPY', status: 'ACTIVE', capacity: 1 }}
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
          <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Select a status.' }]}>
            <Select options={TOUR_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item label="Capacity" name="capacity" rules={[{ required: true, message: 'Capacity is required.' }]}>
            <InputNumber style={{ width: '100%' }} min={1} step={1} placeholder="Number of seats" />
          </Form.Item>
          <Form.Item label="Images" extra="JPEG, PNG, WebP or AVIF, up to 5 MB each.">
            {newTourImages.length > 0 && (
              <Space wrap style={{ marginBottom: 8 }}>
                {newTourImages.map((url, index) => (
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
                      onClick={() => setNewTourImages((prev) => prev.filter((u) => u !== url))}
                    />
                  </div>
                ))}
              </Space>
            )}
            <Upload
              accept={IMAGE_ACCEPT}
              multiple
              showUploadList={false}
              beforeUpload={handleUploadNewTourImage}
            >
              <Button icon={<UploadOutlined />} loading={uploadingNewImage}>
                Upload Image
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Tour"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={updating}
        okText="Save Changes"
        width={640}
      >
        <Form<TourFormValues> form={editForm} layout="vertical" onFinish={handleEditFinish}>
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
          <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Select a status.' }]}>
            <Select options={TOUR_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item label="Capacity" name="capacity" rules={[{ required: true, message: 'Capacity is required.' }]}>
            <InputNumber style={{ width: '100%' }} min={1} step={1} placeholder="Number of seats" />
          </Form.Item>
          {editingTour && (
            <Form.Item label="Images">
              <TourImagesEditor tour={editingTour} onChange={() => refreshTour(editingTour.id)} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={`Manage Images${imagesTour ? ` — ${imagesTour.name}` : ''}`}
        open={imagesModalOpen}
        onCancel={() => setImagesModalOpen(false)}
        footer={null}
        width={560}
      >
        {imagesTour && <TourImagesEditor tour={imagesTour} onChange={() => refreshTour(imagesTour.id)} />}
      </Modal>

      <Modal
        title={`Manage Availability${availabilityTour ? ` — ${availabilityTour.name}` : ''}`}
        open={availabilityModalOpen}
        onCancel={() => setAvailabilityModalOpen(false)}
        footer={null}
        width={560}
      >
        {availabilityTour && (
          <>
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              {availabilityTour.availability.length === 0 && (
                <Typography.Text type="secondary">No slots yet.</Typography.Text>
              )}
              {[...availabilityTour.availability]
                .sort((a, b) => dayjs(a.startDatetime).valueOf() - dayjs(b.startDatetime).valueOf())
                .map((slot) => (
                  <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Typography.Text style={{ flex: 1 }}>
                      {formatDateTime(slot.startDatetime)} — {slot.spotsRemaining} spot{slot.spotsRemaining === 1 ? '' : 's'}
                    </Typography.Text>
                    <Popconfirm title="Remove this slot?" onConfirm={() => handleRemoveSlot(slot.id)}>
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                ))}
            </Space>
            <Space style={{ marginTop: 16 }}>
              <DatePicker showTime value={newSlotDatetime} onChange={setNewSlotDatetime} />
              <InputNumber min={0} value={newSlotSpots} onChange={(v) => setNewSlotSpots(v ?? 0)} placeholder="Spots" />
              <Button type="primary" loading={addingSlot} onClick={handleAddSlot} disabled={!newSlotDatetime}>
                Add Slot
              </Button>
            </Space>
          </>
        )}
      </Modal>
    </div>
  );
}
