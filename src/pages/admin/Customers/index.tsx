import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Popconfirm, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, StopOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { deactivateCustomer, getCustomers } from '@/services/customerService';
import { formatDateTime } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { Customer } from '@/types/customer';

export default function AdminCustomers() {
  const { admin } = useAdminAuth();
  // Matches the backend: DELETE /users/:id (which deactivating a customer reuses) is
  // SUPER_ADMIN-only -- an Admin would just get a 403 if this were shown to them too.
  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchCustomers() {
    setLoading(true);
    getCustomers()
      .then(setCustomers)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load customers.')))
      .finally(() => setLoading(false));
  }

  useEffect(fetchCustomers, []);

  async function handleDeactivate(id: number) {
    try {
      await deactivateCustomer(id);
      message.success('Customer deactivated.');
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: false } : c)));
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to deactivate this customer.'));
    }
  }

  const columns: ColumnsType<Customer> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Full Name', dataIndex: 'fullName', render: (name: string | null) => name || '—' },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (isActive: boolean) => <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Deactivated'}</Tag>,
    },
    { title: 'Date Registered', dataIndex: 'createdAt', render: (value: string) => formatDateTime(value) },
    {
      title: 'Action',
      key: 'action',
      render: (_, customer) => (
        <>
          <Link to={`/admin/customers/${customer.id}`}>
            <Button size="small" type="primary" icon={<EyeOutlined />} style={{ marginRight: 8 }}>
              View
            </Button>
          </Link>
          {isSuperAdmin && customer.isActive && (
            <Popconfirm
              title="Deactivate this customer's account?"
              description="They will no longer be able to log in. This can be undone from the Users page."
              onConfirm={() => handleDeactivate(customer.id)}
            >
              <Button size="small" danger icon={<StopOutlined />}>
                Deactivate
              </Button>
            </Popconfirm>
          )}
        </>
      ),
    },
  ];

  if (loading) return <PageSpinner />;

  return (
    <div>
      <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
        Customer Maintenance
      </Typography.Title>
      <Table columns={columns} dataSource={customers} rowKey="id" scroll={{ x: true }} />
    </div>
  );
}
