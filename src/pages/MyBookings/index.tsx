import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Modal, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UploadOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getMyBookings, submitPaymentProof } from '@/services/bookingService';
import { ALLOWED_IMAGE_TYPES, uploadPaymentProofImage } from '@/services/uploadService';
import { formatCurrency } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { Booking, BookingStatus } from '@/types/booking';

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'error',
  COMPLETED: 'default',
};

const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

/** Real bookings made via the current Tour/booking flow -- distinct from /my-orders, which
 *  still shows the legacy mock Cart/Checkout orders. */
export default function MyBookings() {
  const { isAuthenticated, isInitializing } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [proofTarget, setProofTarget] = useState<Booking | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  function fetchBookings() {
    getMyBookings()
      .then(setBookings)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load your reservations.')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isInitializing]);

  async function handleUploadProof(file: File) {
    if (!proofTarget) return Upload.LIST_IGNORE;
    setUploadingProof(true);
    try {
      const fileUrl = await uploadPaymentProofImage(file);
      await submitPaymentProof(proofTarget.id, { fileUrl, fileName: file.name, fileType: file.type });
      message.success('Payment proof submitted — awaiting review.');
      setProofTarget(null);
      fetchBookings();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to submit payment proof.'));
    } finally {
      setUploadingProof(false);
    }
    return Upload.LIST_IGNORE;
  }

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
    { title: 'Payment Method', dataIndex: 'paymentMethodName', render: (v: string | null) => v ?? '—' },
    { title: 'Payment', dataIndex: 'paymentStatus', render: (status: string) => <Tag>{status}</Tag> },
    { title: 'Status', dataIndex: 'status', render: (status: BookingStatus) => <Tag color={STATUS_COLOR[status]}>{status}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, booking) => (
        <>
          {booking.status !== 'CANCELLED' && booking.paymentStatus !== 'PAID' && (
            <Button size="small" icon={<UploadOutlined />} onClick={() => setProofTarget(booking)} style={{ marginRight: 8 }}>
              {booking.paymentStatus === 'UNPAID' ? 'Upload Payment Proof' : 'Replace Payment Proof'}
            </Button>
          )}
          <Link to={`/tours/${booking.tourId}`}>View Tour</Link>
        </>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        My Reservations
      </Typography.Title>
      <Table columns={columns} dataSource={bookings} rowKey="id" scroll={{ x: true }} />

      <Modal
        title={proofTarget ? `Upload Payment Proof — JDM-${proofTarget.id}` : 'Upload Payment Proof'}
        open={proofTarget !== null}
        onCancel={() => setProofTarget(null)}
        footer={null}
      >
        <Upload accept={IMAGE_ACCEPT} showUploadList={false} beforeUpload={handleUploadProof}>
          <Button icon={<UploadOutlined />} loading={uploadingProof}>
            Choose Image
          </Button>
        </Upload>
      </Modal>
    </div>
  );
}
