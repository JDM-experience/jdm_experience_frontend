import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, StopOutlined } from '@ant-design/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { PageSpinner } from '@/components/common/PageSpinner';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { createUser, deactivateUser, listUsers, updateUser } from '@/services/adminUserService';
import { getErrorMessage } from '@/utils/errors';
import type { ManagedUser } from '@/types/managedUser';
import type { UserRole } from '@/types/admin';

interface UserFormValues {
  fullName: string;
  email: string;
  role: 'ADMIN' | 'TOUR_GUIDE';
}

// Only Admin/Tour Guide are offered here — never Super Admin (a Super Admin creating another
// Super Admin isn't exposed in this UI) and never Customer (customers self-register).
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TOUR_GUIDE', label: 'Tour Guide' },
];

const ROLE_TAG_COLOR: Record<UserRole, string> = {
  SUPER_ADMIN: 'gold',
  ADMIN: 'blue',
  TOUR_GUIDE: 'green',
  CUSTOMER: 'default',
};

export default function AdminUsers() {
  const { admin } = useAdminAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm<UserFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';
  // Admin gets read-only visibility (e.g. to see guide profiles) — only Super Admin can
  // create/edit/deactivate. A Tour Guide gets no access to this page at all.
  const canView = isSuperAdmin || admin?.role === 'ADMIN';

  function fetchUsers() {
    setLoading(true);
    listUsers()
      .then(setUsers)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load users.')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (canView) fetchUsers();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  if (loading) return <PageSpinner />;

  if (!canView) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="You are not authorized to view this page." description="Only a Super Admin or Admin can view users." />
      </div>
    );
  }

  function openAddModal() {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(user: ManagedUser) {
    setEditingUser(user);
    form.setFieldsValue({
      fullName: user.fullName ?? '',
      email: user.email,
      role: user.role === 'ADMIN' || user.role === 'TOUR_GUIDE' ? user.role : 'ADMIN',
    });
    setModalOpen(true);
  }

  async function handleFinish(values: UserFormValues) {
    setSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, { fullName: values.fullName, email: values.email, role: values.role });
        message.success('User updated successfully.');
      } else {
        await createUser({ fullName: values.fullName, email: values.email, role: values.role });
        message.success('User created successfully.');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to save this user.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(user: ManagedUser) {
    try {
      await deactivateUser(user.id);
      message.success('User deactivated.');
      fetchUsers();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to deactivate this user.'));
    }
  }

  async function handleReactivate(user: ManagedUser) {
    try {
      await updateUser(user.id, { isActive: true });
      message.success('User activated.');
      fetchUsers();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to activate this user.'));
    }
  }

  const columns: ColumnsType<ManagedUser> = [
    { title: 'Name', dataIndex: 'fullName', render: (name: string | null) => name || '—' },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (role: UserRole) => <Tag color={ROLE_TAG_COLOR[role]}>{role.replace('_', ' ')}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (isActive: boolean) => <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Deactivated'}</Tag>,
    },
    ...(isSuperAdmin
      ? [
          {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, user: ManagedUser) => (
              <Space>
                {(user.role === 'ADMIN' || user.role === 'TOUR_GUIDE') && (
                  <Button size="small" onClick={() => openEditModal(user)}>
                    Edit
                  </Button>
                )}
                {user.isActive ? (
                  <Popconfirm title={`Deactivate ${user.fullName ?? user.email}?`} onConfirm={() => handleDeactivate(user)}>
                    <Button size="small" danger icon={<StopOutlined />} disabled={user.id === admin?.id}>
                      Deactivate
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button size="small" onClick={() => handleReactivate(user)}>
                    Activate
                  </Button>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          User Management
        </Typography.Title>
        {isSuperAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            Add Admin / Tour Guide
          </Button>
        )}
      </div>

      <Table columns={columns} dataSource={users} rowKey="id" scroll={{ x: true }} />

      <Modal
        title={editingUser ? 'Edit User' : 'Add Admin or Tour Guide'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingUser ? 'Save Changes' : 'Create User'}
      >
        <Form<UserFormValues> form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Full name is required.' }]}>
            <Input placeholder="Enter full name" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email is required.' },
              { type: 'email', message: 'Enter a valid email address.' },
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>
          {!editingUser && (
            <Typography.Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 16, fontSize: 12 }}>
              This person signs in via Auth0 using the email above — no password to set here.
            </Typography.Paragraph>
          )}
          <Form.Item label="Role" name="role" initialValue="ADMIN" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
