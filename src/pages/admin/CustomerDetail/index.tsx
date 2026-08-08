import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Typography } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { getCustomerById } from '@/services/customerService';
import { formatDateTime } from '@/utils/formatters';
import type { User } from '@/types/user';

export default function AdminCustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerById(Number(customerId))
      .then(setCustomer)
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <PageSpinner />;
  if (!customer) {
    return <EmptyState title="Customer not found." actionText="Back to Customers" actionTo="/admin/customers" />;
  }

  return (
    <Card style={{ maxWidth: 560, margin: '0 auto' }}>
      <Typography.Title level={4}>Customer Information</Typography.Title>
      <p>
        <strong>Full Name:</strong> {customer.fullName}
      </p>
      <p>
        <strong>Email:</strong> {customer.email}
      </p>
      <p>
        <strong>Date Registered:</strong> {formatDateTime(customer.createdAt)}
      </p>
      <Link to="/admin/customers">
        <Button type="primary" style={{ marginTop: 12 }}>
          Back to List
        </Button>
      </Link>
    </Card>
  );
}
