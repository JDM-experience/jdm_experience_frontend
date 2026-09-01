import { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  Upload,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { AvailabilityBadge } from '@/components/common/AvailabilityBadge';
import { ProductImage } from '@/components/common/ProductImage';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { createProduct, deleteProduct, getProducts, updateProduct } from '@/services/productService';
import { listUsers } from '@/services/adminUserService';
import { manualStatusFromStock } from '@/utils/bookingUtils';
import { getErrorMessage } from '@/utils/errors';
import type { Product } from '@/types/product';
import type { ManagedUser } from '@/types/managedUser';

interface TourFormValues {
  name: string;
  category: string;
  description: string;
  price: number;
  discount: number;
  availabilityStatus: 0 | 1 | 2;
  latitude?: number;
  longitude?: number;
  seatCapacity: 1 | 4;
  guideId?: number;
}

const AVAILABILITY_OPTIONS = [
  { value: 1, label: 'Available' },
  { value: 2, label: 'Unavailable' },
  { value: 0, label: 'Under Maintenance' },
];

const SEAT_CAPACITY_OPTIONS = [
  { value: 4, label: '4 Seats' },
  { value: 1, label: '1 Seat' },
];

interface ImageFiles {
  image1?: File;
  image2?: File;
  image3?: File;
}

export default function AdminTours() {
  const { admin } = useAdminAuth();
  const isGuide = admin?.role === 'TOUR_GUIDE';
  const isStaff = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';

  const [tours, setTours] = useState<Product[]>([]);
  const [guides, setGuides] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm<TourFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Product | null>(null);
  const [imageFiles, setImageFiles] = useState<ImageFiles>({});
  const [submitting, setSubmitting] = useState(false);

  function fetchTours() {
    setLoading(true);
    getProducts()
      .then((results) => setTours([...results].sort((a, b) => b.id - a.id)))
      .finally(() => setLoading(false));
  }

  useEffect(fetchTours, []);

  // Only staff get a guide-picker in the form — a Tour Guide is always auto-assigned to their
  // own tours, so they never need to see or choose from this list.
  useEffect(() => {
    if (!isStaff) return;
    listUsers()
      .then((users) => setGuides(users.filter((u) => u.role === 'TOUR_GUIDE')))
      .catch(() => setGuides([]));
  }, [isStaff]);

  const visibleTours = isGuide ? tours.filter((tour) => tour.guideId === admin?.id) : tours;

  function openAddModal() {
    setEditingTour(null);
    setImageFiles({});
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(tour: Product) {
    setEditingTour(tour);
    setImageFiles({});
    form.setFieldsValue({
      name: tour.name,
      category: tour.category,
      description: tour.description,
      price: tour.price,
      discount: tour.discount,
      availabilityStatus: tour.stock === 0 ? 0 : tour.stock === 2 ? 2 : 1,
      latitude: tour.latitude,
      longitude: tour.longitude,
      seatCapacity: tour.seatCapacity,
      guideId: tour.guideId ?? undefined,
    });
    setModalOpen(true);
  }

  function makeUploadProps(field: keyof ImageFiles) {
    return {
      accept: 'image/*',
      maxCount: 1,
      fileList: imageFiles[field] ? [{ uid: field, name: imageFiles[field]!.name } as UploadFile] : [],
      beforeUpload: (file: File) => {
        setImageFiles((prev) => ({ ...prev, [field]: file }));
        return false;
      },
      onRemove: () => setImageFiles((prev) => ({ ...prev, [field]: undefined })),
    };
  }

  async function handleFinish(values: TourFormValues) {
    if (!editingTour && !imageFiles.image1) {
      message.error('Please select a primary tour image.');
      return;
    }

    setSubmitting(true);
    try {
      const image1 = imageFiles.image1 ? URL.createObjectURL(imageFiles.image1) : editingTour!.image1;
      const image2 = imageFiles.image2 ? URL.createObjectURL(imageFiles.image2) : (editingTour?.image2 ?? '');
      const image3 = imageFiles.image3 ? URL.createObjectURL(imageFiles.image3) : (editingTour?.image3 ?? '');

      const stock = values.availabilityStatus;
      // A Tour Guide is always auto-assigned to their own tours — never trust a hidden/client
      // field for this, since guides don't even see the guide-picker. Staff use whatever the
      // picker resolved to (or leave a tour unassigned).
      const guideId = isGuide ? (admin?.id ?? null) : (values.guideId ?? null);

      if (editingTour) {
        await updateProduct({
          id: editingTour.id,
          name: values.name,
          category: values.category,
          description: values.description,
          price: values.price,
          discount: values.discount,
          stock,
          image1,
          image2,
          image3,
          latitude: values.latitude,
          longitude: values.longitude,
          seatCapacity: values.seatCapacity,
          guideId,
        });
        message.success('Tour updated successfully.');
      } else {
        await createProduct({
          name: values.name,
          category: values.category,
          description: values.description,
          price: values.price,
          discount: values.discount,
          stock,
          image1,
          image2,
          image3,
          latitude: values.latitude,
          longitude: values.longitude,
          seatCapacity: values.seatCapacity,
          guideId,
        });
        message.success('Tour added successfully.');
      }

      setModalOpen(false);
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to save this tour.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteProduct(id);
      message.success('Tour deleted.');
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to delete this tour.'));
    }
  }

  const columns: ColumnsType<Product> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Tour Type', dataIndex: 'category' },
    {
      title: 'Tour Price (with Sale)',
      key: 'price',
      render: (_, tour) => <PriceDisplay price={tour.price} discount={tour.discount} />,
    },
    { title: 'Discount', dataIndex: 'discount', render: (discount: number) => `${discount}%` },
    {
      title: 'Manual Availability',
      key: 'availability',
      render: (_, tour) => <AvailabilityBadge status={manualStatusFromStock(tour.stock)} />,
    },
    {
      title: 'Images',
      key: 'images',
      render: (_, tour) => (
        <Space>
          {[tour.image1, tour.image2, tour.image3].filter(Boolean).map((img, idx) => (
            <ProductImage key={idx} fileName={img} alt={`${tour.name} ${idx + 1}`} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
          ))}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, tour) => {
        const canEdit = isStaff || (isGuide && tour.guideId === admin?.id);
        const canDelete = admin?.role === 'SUPER_ADMIN' || (isGuide && tour.guideId === admin?.id);
        return (
          <Space>
            {canEdit && <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(tour)} />}
            {canDelete && (
              <Popconfirm title={`Delete ${tour.name} from the fleet?`} onConfirm={() => handleDelete(tour.id)}>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Add Tour
        </Button>
      </div>

      <Table columns={columns} dataSource={visibleTours} rowKey="id" scroll={{ x: true }} />

      <Modal
        title={editingTour ? 'Edit Tour' : 'Add New Tour'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingTour ? 'Save Changes' : 'Add Tour'}
        width={640}
      >
        <Form<TourFormValues> form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item label="Tour Name" name="name" rules={[{ required: true, message: 'Tour name is required.' }]}>
            <Input placeholder="Enter tour name" />
          </Form.Item>
          <Form.Item label="Tour Type" name="category" rules={[{ required: true, message: 'Tour type is required.' }]}>
            <Input placeholder="e.g. Sports Car, Group Tour" />
          </Form.Item>
          <Form.Item label="Tour Description" name="description">
            <Input.TextArea rows={3} placeholder="Short description of the tour" />
          </Form.Item>
          <Form.Item label="Tour Price" name="price" rules={[{ required: true, message: 'Tour price is required.' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="Enter tour price" />
          </Form.Item>
          <Form.Item label="Sale Discount (%)" name="discount" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item
            label="Manual Availability"
            name="availabilityStatus"
            initialValue={1}
            rules={[{ required: true, message: 'Select an availability status.' }]}
            extra="This controls manual overrides. Date bookings still make tours unavailable dynamically."
          >
            <Select options={AVAILABILITY_OPTIONS} />
          </Form.Item>
          <Form.Item
            label="Seat Capacity"
            name="seatCapacity"
            initialValue={4}
            rules={[{ required: true, message: 'Select a seat capacity.' }]}
            extra="Caps how many seats a customer can select when booking. The tour price is flat per booking and does not change with seat count."
          >
            <Select options={SEAT_CAPACITY_OPTIONS} />
          </Form.Item>
          {isStaff && (
            <Form.Item
              label="Assign Guide"
              name="guideId"
              extra="Leave blank to keep this tour staff-managed (unassigned)."
            >
              <Select
                allowClear
                placeholder="Unassigned"
                options={guides.map((g) => ({ value: g.id, label: g.fullName ?? g.email }))}
              />
            </Form.Item>
          )}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Latitude" name="latitude" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="e.g. 35.658600" />
            </Form.Item>
            <Form.Item label="Longitude" name="longitude" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="e.g. 139.745400" />
            </Form.Item>
          </div>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: -16, marginBottom: 16 }}>
            Optional. Powers the weather forecast on the tour detail page.
          </Typography.Paragraph>
          <Form.Item label="Tour Images" required={!editingTour}>
            <Space orientation="vertical">
              <Upload {...makeUploadProps('image1')}>
                <Button icon={<UploadOutlined />}>Primary Image</Button>
              </Upload>
              <Upload {...makeUploadProps('image2')}>
                <Button icon={<UploadOutlined />}>Gallery Image 2 (optional)</Button>
              </Upload>
              <Upload {...makeUploadProps('image3')}>
                <Button icon={<UploadOutlined />}>Gallery Image 3 (optional)</Button>
              </Upload>
            </Space>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
              {editingTour ? 'Leave blank to keep existing images.' : 'Upload JPG or PNG files.'}
            </Typography.Paragraph>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
