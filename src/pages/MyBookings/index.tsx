import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getMyBookings } from '@/services/bookingService';
import { formatCurrency } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { Booking, BookingStatus } from '@/types/booking';

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'error',
  COMPLETED: 'default',
};

/** Real bookings made via the current Tour/booking flow -- distinct from /my-orders, which
 *  still shows the legacy mock Cart/Checkout orders. */
export default function MyBookings() {
  const { isAuthenticated, isInitializing } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    getMyBookings()
      .then(setBookings)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load your reservations.')))
      .finally(() => setLoading(false));
  }, [isAuthenticated, isInitializing]);

  if (loading || isInitializing) return <PageSpinner />;

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="Log in to see your reservations." actionText="Browse Tours" actionTo="/tours" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="You have no reservations yet." actionText="Browse Tours" actionTo="/tours" />
      </div>
    );
  }

  const columns: ColumnsType<Booking> = [
    { title: 'Reference', dataIndex: 'id', render: (id: number) => `JDM-${id}` },
    { title: 'Tour', dataIndex: 'tourNameSnapshot' },
    {
      title: 'Date',
      dataIndex: 'bookingDate',
      render: (date: string) => new Date(date).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' }),
    },
    { title: 'Participants', dataIndex: 'participants' },
    { title: 'Total', dataIndex: 'totalPrice', render: (price: number) => formatCurrency(price) },
    { title: 'Payment', dataIndex: 'paymentStatus', render: (status: string) => <Tag>{status}</Tag> },
    { title: 'Status', dataIndex: 'status', render: (status: BookingStatus) => <Tag color={STATUS_COLOR[status]}>{status}</Tag> },
    { title: 'Tour', key: 'view', render: (_, booking) => <Link to={`/tours/${booking.tourId}`}>View Tour</Link> },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        My Reservations
      </Typography.Title>
      <Table columns={columns} dataSource={bookings} rowKey="id" scroll={{ x: true }} />
    </div>
  );
}
