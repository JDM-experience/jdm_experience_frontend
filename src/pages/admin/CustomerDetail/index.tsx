import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Tag, Typography, message } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { getCustomerById } from '@/services/customerService';
import { formatDateTime } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { Customer } from '@/types/customer';

const PROFILE_FIELDS: { key: keyof Customer; label: string }[] = [
  { key: 'phone', label: 'Phone' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'passportNumber', label: 'Passport Number' },
  { key: 'licenseNumber', label: "Driver's License Number" },
  { key: 'licenseCountry', label: 'License Country' },
  { key: 'notes', label: 'Notes' },
];

export default function AdminCustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerById(Number(customerId))
      .then(setCustomer)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load this customer.')))
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
        <strong>Full Name:</strong> {customer.fullName || '—'}
      </p>
      <p>
        <strong>Email:</strong> {customer.email}
      </p>
      <p>
        <strong>Status:</strong> <Tag color={customer.isActive ? 'success' : 'default'}>{customer.isActive ? 'Active' : 'Deactivated'}</Tag>
      </p>
      <p>
        <strong>Date Registered:</strong> {formatDateTime(customer.createdAt)}
      </p>

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Travel Profile
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginTop: -8, fontSize: 12 }}>
        Filled in by the customer or staff when relevant — blank until then.
      </Typography.Paragraph>
      {PROFILE_FIELDS.map(({ key, label }) => (
        <p key={key}>
          <strong>{label}:</strong> {(customer[key] as string | null) || '—'}
        </p>
      ))}

      <Link to="/admin/customers">
        <Button type="primary" style={{ marginTop: 12 }}>
          Back to List
        </Button>
      </Link>
    </Card>
  );
}
