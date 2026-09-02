import { useEffect, useState } from 'react';
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
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { ProductImage } from '@/components/common/ProductImage';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  addTourAvailability,
  addTourImage,
  confirmTour,
  createTour,
  deleteTour,
  listTourGuides,
  listTours,
  removeTourAvailability,
  removeTourImage,
  updateTour,
} from '@/services/tourService';
import { ALLOWED_IMAGE_TYPES, uploadTourImage } from '@/services/uploadService';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency, formatDateTime, slugify } from '@/utils/formatters';
import type { Tour, TourGuide, TourStatus, UpdateTourInput } from '@/types/tour';

interface TourFormValues {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  seats: number;
  guideId?: number;
  /** Edit form only (staff-only field) — a new tour always starts PENDING server-side. */
  status?: TourStatus;
}

/** Manual transitions only — a tour reaches AVAILABLE for the first time solely via "Confirm"
 *  (PENDING is not selectable here, it's the automatic starting state). */
const MANUAL_STATUS_OPTIONS: { value: TourStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'UNAVAILABLE', label: 'Unavailable' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
];

const STATUS_LABEL: Record<TourStatus, string> = {
  PENDING: 'Pending',
  AVAILABLE: 'Available',
  UNAVAILABLE: 'Unavailable',
  UNDER_MAINTENANCE: 'Under Maintenance',
};

const STATUS_COLOR: Record<TourStatus, string> = {
  PENDING: 'gold',
  AVAILABLE: 'green',
  UNAVAILABLE: 'red',
  UNDER_MAINTENANCE: 'orange',
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
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';
  const isStaff = isSuperAdmin || admin?.role === 'ADMIN';
  const isGuide = admin?.role === 'TOUR_GUIDE';

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState<TourGuide[]>([]);

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

  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  function fetchTours() {
    setLoading(true);
    listTours()
      .then((results) => setTours([...results].sort((a, b) => b.id - a.id)))
      .finally(() => setLoading(false));
  }

  useEffect(fetchTours, []);
  useEffect(() => {
    listTourGuides()
      .then(setGuides)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load tour guides.')));
  }, []);

  const GUIDE_OPTIONS = guides.map((g) => ({ value: g.id, label: g.fullName ?? g.email ?? `Guide #${g.id}` }));

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
        seats: values.seats,
        guideId: values.guideId,
        images: newTourImages.length
          ? newTourImages.map((imageUrl, sortOrder) => ({ imageUrl, sortOrder }))
          : undefined,
      });
      message.success('Tour created — it starts Pending until an Admin confirms it.');
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
      seats: tour.seats,
      guideId: tour.guide?.id,
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
        seats: values.seats,
        // A Tour Guide never gets a status/guideId control rendered (see the Edit modal below),
        // and the backend rejects a guide-submitted status change regardless — this just avoids
        // sending fields the form never showed.
        ...(isStaff ? { status: values.status, guideId: values.guideId ?? null } : {}),
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

  // Delete
  async function handleDelete(id: number) {
    try {
      await deleteTour(id);
      message.success('Tour deleted.');
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to delete this tour.'));
    }
  }

  // Availability status — confirmation (PENDING -> AVAILABLE) and manual transitions. Staff-only;
  // the backend also rejects a status change from a Tour Guide.
  async function handleConfirm(id: number) {
    setConfirmingId(id);
    try {
      await confirmTour(id);
      message.success('Tour confirmed — now Available.');
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to confirm this tour.'));
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleStatusChange(id: number, status: TourStatus) {
    setStatusUpdatingId(id);
    try {
      await updateTour(id, { status });
      message.success(`Status changed to ${STATUS_LABEL[status]}.`);
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to change this tour\'s status.'));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  // Images
  function openImagesModal(tour: Tour) {
    setImagesTour(tour);
    setImagesModalOpen(true);
  }

  // Availability (bookable dates)
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
        startDatetime: newSlotDatetime.toISOString(),
        spotsRemaining: newSlotSpots,
      });
      message.success('Date added.');
      setNewSlotDatetime(null);
      setNewSlotSpots(1);
      await refreshTour(availabilityTour.id);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to add this date.'));
    } finally {
      setAddingSlot(false);
    }
  }

  async function handleRemoveSlot(availabilityId: number) {
    if (!availabilityTour) return;
    try {
      await removeTourAvailability(availabilityTour.id, availabilityId);
      message.success('Date removed.');
      await refreshTour(availabilityTour.id);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to remove this date.'));
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
      render: (status: TourStatus, tour) => {
        const tag = <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>;
        // Manual transitions are staff-only, and only make sense once a tour is past PENDING —
        // getting to AVAILABLE for the first time goes through "Confirm" instead (Actions column).
        if (!isStaff || status === 'PENDING') return tag;
        return (
          <Select<TourStatus>
            size="small"
            value={status}
            style={{ width: 168 }}
            options={MANUAL_STATUS_OPTIONS}
            loading={statusUpdatingId === tour.id}
            onChange={(value) => handleStatusChange(tour.id, value)}
          />
        );
      },
    },
    { title: 'Seats', dataIndex: 'seats' },
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
      title: 'Dates',
      key: 'availability',
      render: (_, tour) => (
        <Button size="small" icon={<CalendarOutlined />} onClick={() => openAvailabilityModal(tour)}>
          {tour.availability.length}
        </Button>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, tour) => {
        const ownsTour = isGuide && tour.guide?.userId === admin?.id;
        const canEdit = isStaff || ownsTour;
        const canDelete = isSuperAdmin || ownsTour;
        return (
          <Space>
            {isStaff && tour.status === 'PENDING' && (
              <Popconfirm title={`Confirm ${tour.name} as Available?`} onConfirm={() => handleConfirm(tour.id)}>
                <Button size="small" icon={<CheckCircleOutlined />} loading={confirmingId === tour.id}>
                  Confirm
                </Button>
              </Popconfirm>
            )}
            {canEdit && <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(tour)} />}
            {canDelete && (
              <Popconfirm title={`Delete ${tour.name}?`} onConfirm={() => handleDelete(tour.id)}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
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
              <Select
                allowClear
                placeholder="Unassigned"
                options={GUIDE_OPTIONS}
                notFoundContent="No tour guides available"
              />
            </Form.Item>
          )}
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
            New tours start as <strong>Pending</strong> — an Admin must confirm the tour before it
            becomes Available to customers.
          </Typography.Text>
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
          <Form.Item label="Seats" name="seats" rules={[{ required: true, message: 'Seats is required.' }]}>
            <InputNumber style={{ width: '100%' }} min={1} step={1} placeholder="Number of seats" />
          </Form.Item>
          {isStaff && (
            <>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Select a status.' }]}
                extra={editingTour?.status === 'PENDING' ? 'Use "Confirm" on the tour list to make a Pending tour Available.' : undefined}
              >
                <Select options={editingTour?.status === 'PENDING' ? [{ value: 'PENDING', label: 'Pending' }] : MANUAL_STATUS_OPTIONS} disabled={editingTour?.status === 'PENDING'} />
              </Form.Item>
              <Form.Item label="Tour Guide" name="guideId" extra="Who this tour is assigned to. Leave unset to keep it unassigned.">
                <Select
                  allowClear
                  placeholder="Unassigned"
                  options={GUIDE_OPTIONS}
                  notFoundContent="No tour guides available"
                />
              </Form.Item>
            </>
          )}
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
        title={`Manage Dates${availabilityTour ? ` — ${availabilityTour.name}` : ''}`}
        open={availabilityModalOpen}
        onCancel={() => setAvailabilityModalOpen(false)}
        footer={null}
        width={560}
      >
        {availabilityTour && (
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            <Space wrap>
              {availabilityTour.availability.length === 0 && (
                <Typography.Text type="secondary">No dates yet.</Typography.Text>
              )}
              {availabilityTour.availability.map((slot) => (
                <Tag key={slot.id} closable onClose={() => handleRemoveSlot(slot.id)}>
                  {formatDateTime(slot.startDatetime)} — {slot.spotsRemaining} spot{slot.spotsRemaining === 1 ? '' : 's'}
                </Tag>
              ))}
            </Space>

            <Space.Compact style={{ width: '100%' }}>
              <DatePicker
                showTime
                style={{ width: '60%' }}
                value={newSlotDatetime}
                onChange={setNewSlotDatetime}
                placeholder="Date & time"
              />
              <InputNumber
                style={{ width: '25%' }}
                min={1}
                step={1}
                value={newSlotSpots}
                onChange={(v) => setNewSlotSpots(v ?? 1)}
              />
              <Button type="primary" style={{ width: '15%' }} loading={addingSlot} onClick={handleAddSlot}>
                Add
              </Button>
            </Space.Compact>
          </Space>
        )}
      </Modal>
    </div>
  );
}
