import { useEffect, useState } from 'react';
import { Button, Form, Image, Input, Modal, Popconfirm, Space, Switch, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { PageSpinner } from '@/components/common/PageSpinner';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
} from '@/services/paymentMethodService';
import { ALLOWED_IMAGE_TYPES, uploadPaymentMethodImage } from '@/services/uploadService';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/formatters';
import type { PaymentMethod } from '@/types/paymentMethod';

interface FormValues {
  name: string;
  description?: string;
  isActive: boolean;
}

const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

export default function AdminPaymentMethods() {
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const [form] = Form.useForm<FormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function fetchMethods() {
    setLoading(true);
    listPaymentMethods()
      .then(setMethods)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load payment methods.')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isSuperAdmin) fetchMethods();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  function openCreateModal() {
    setEditing(null);
    setImageUrl(undefined);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(method: PaymentMethod) {
    setEditing(method);
    setImageUrl(method.imageUrl ?? undefined);
    form.setFieldsValue({ name: method.name, description: method.description ?? '', isActive: method.isActive });
    setModalOpen(true);
  }

  async function handleUploadImage(file: File) {
    setUploadingImage(true);
    try {
      const url = await uploadPaymentMethodImage(file);
      setImageUrl(url);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to upload this image.'));
    } finally {
      setUploadingImage(false);
    }
    return Upload.LIST_IGNORE;
  }

  async function handleFinish(values: FormValues) {
    setSubmitting(true);
    try {
      if (editing) {
        await updatePaymentMethod(editing.id, {
          name: values.name,
          description: values.description?.trim() || undefined,
          imageUrl,
          isActive: values.isActive,
        });
        message.success('Payment method updated.');
      } else {
        await createPaymentMethod({
          name: values.name,
          description: values.description?.trim() || undefined,
          imageUrl,
          isActive: values.isActive,
        });
        message.success('Payment method created.');
      }
      setModalOpen(false);
      fetchMethods();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to save this payment method.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(method: PaymentMethod) {
    try {
      await updatePaymentMethod(method.id, { isActive: !method.isActive });
      message.success(method.isActive ? 'Payment method disabled.' : 'Payment method enabled.');
      fetchMethods();
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to update this payment method's status."));
    }
  }

  async function handleDelete(id: number) {
    try {
      await deletePaymentMethod(id);
      message.success('Payment method deleted.');
      setMethods((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to delete this payment method.'));
    }
  }

  const columns: ColumnsType<PaymentMethod> = [
    {
      title: 'Image',
      key: 'image',
      render: (_, method) =>
        method.imageUrl ? (
          <Image src={method.imageUrl} alt={method.name} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Description', dataIndex: 'description', render: (v: string | null) => v ?? '—' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (isActive: boolean) => <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Disabled'}</Tag>,
    },
    { title: 'Updated', dataIndex: 'updatedAt', render: (v: string) => formatDateTime(v) },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, method) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(method)}>
            Edit
          </Button>
          <Switch
            size="small"
            checked={method.isActive}
            onChange={() => handleToggleActive(method)}
            checkedChildren="Active"
            unCheckedChildren="Disabled"
          />
          <Popconfirm title={`Delete ${method.name}?`} description="Past bookings that used it keep their history." onConfirm={() => handleDelete(method.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) return <PageSpinner />;

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="You are not authorized to view this page." description="Only a Super Admin can manage payment methods." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Payment Methods
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Payment Method
        </Button>
      </div>

      <Table columns={columns} dataSource={methods} rowKey="id" scroll={{ x: true }} pagination={{ pageSize: 20, showSizeChanger: true, hideOnSinglePage: true }} />

      <Modal
        title={editing ? 'Edit Payment Method' : 'Add Payment Method'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editing ? 'Save Changes' : 'Create'}
      >
        <Form<FormValues> form={form} layout="vertical" onFinish={handleFinish} initialValues={{ isActive: true }}>
          <Form.Item label="Payment Method Name" name="name" rules={[{ required: true, message: 'Name is required.' }]}>
            <Input placeholder="e.g. GCash" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Optional description customers will see" />
          </Form.Item>
          <Form.Item label="Payment Image" extra="JPEG, PNG, WebP or AVIF, up to 5 MB.">
            <Space orientation="vertical" style={{ width: '100%' }}>
              {imageUrl && (
                <Image src={imageUrl} alt="Payment method" width={96} height={96} style={{ objectFit: 'cover', borderRadius: 4 }} />
              )}
              <Upload accept={IMAGE_ACCEPT} showUploadList={false} beforeUpload={handleUploadImage}>
                <Button icon={<UploadOutlined />} loading={uploadingImage}>
                  {imageUrl ? 'Replace Image' : 'Upload Image'}
                </Button>
              </Upload>
            </Space>
          </Form.Item>
          <Form.Item label="Status" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
