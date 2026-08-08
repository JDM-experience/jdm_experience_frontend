import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Popconfirm, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { deleteCustomer, getCustomers } from '@/services/customerService';
import { formatDateTime } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { User } from '@/types/user';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchCustomers() {
    setLoading(true);
    getCustomers()
      .then(setCustomers)
      .finally(() => setLoading(false));
  }

  useEffect(fetchCustomers, []);

  async function handleDelete(id: number) {
    try {
      await deleteCustomer(id);
      message.success('Customer deleted successfully.');
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      message.error(getErrorMessage(error, 'Customer not found or already deleted.'));
    }
  }

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Full Name', dataIndex: 'fullName' },
    { title: 'Email', dataIndex: 'email' },
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
          <Popconfirm
            title="Are you sure you want to delete this customer? This action cannot be undone."
            onConfirm={() => handleDelete(customer.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
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
