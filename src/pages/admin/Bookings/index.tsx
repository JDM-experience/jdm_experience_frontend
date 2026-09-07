import { useEffect, useState } from 'react';
import { Button, DatePicker, Empty, Image, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { CheckCircleOutlined, CloseCircleOutlined, FileImageOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import {
  confirmBooking,
  getPaymentProofs,
  listAllBookings,
  rejectBookingPayment,
} from '@/services/bookingService';
import { formatDateTime } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { Booking, BookingListFilter, BookingPaymentStatus, BookingSortBy, BookingStatus, PaymentProof } from '@/types/booking';

const SORT_OPTIONS: { value: string; label: string; sortBy: BookingSortBy; sortOrder: 'asc' | 'desc' }[] = [
  { value: 'created_desc', label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'created_asc', label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' },
  { value: 'date_asc', label: 'Tour Date (Earliest)', sortBy: 'bookingDate', sortOrder: 'asc' },
  { value: 'date_desc', label: 'Tour Date (Latest)', sortBy: 'bookingDate', sortOrder: 'desc' },
  { value: 'customer_asc', label: 'Customer (A-Z)', sortBy: 'customerName', sortOrder: 'asc' },
  { value: 'tour_asc', label: 'Tour (A-Z)', sortBy: 'tourName', sortOrder: 'asc' },
  { value: 'amount_desc', label: 'Amount (High to Low)', sortBy: 'totalPrice', sortOrder: 'desc' },
];

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: 'gold',
  CONFIRMED: 'green',
  CANCELLED: 'red',
  COMPLETED: 'default',
};

const PAYMENT_STATUS_COLOR: Record<BookingPaymentStatus, string> = {
  UNPAID: 'default',
  PENDING: 'gold',
  PAID: 'green',
  FAILED: 'red',
  REFUNDED: 'default',
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [proofModalBooking, setProofModalBooking] = useState<Booking | null>(null);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [proofsLoading, setProofsLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'PENDING' | 'CANCELLED'>('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [sortKey, setSortKey] = useState(SORT_OPTIONS[0].value);

  function fetchBookings() {
    setLoading(true);
    const sort = SORT_OPTIONS.find((o) => o.value === sortKey) ?? SORT_OPTIONS[0];
    const filter: BookingListFilter = {
      search: search || undefined,
      status: statusFilter || undefined,
      dateFrom: dateRange?.[0],
      dateTo: dateRange?.[1],
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    };
    listAllBookings(filter)
      // Search/filter/sort are all performed by the backend query above -- this is just the fixed
      // "which two statuses belong on this page" rule (confirmed bookings live on Reservation
      // Management instead), kept as a client-side safety net even though `statusFilter` above
      // already only ever offers PENDING/CANCELLED.
      .then((rows) => setBookings(rows.filter((b) => b.status === 'PENDING' || b.status === 'CANCELLED')))
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load bookings.')))
      .finally(() => setLoading(false));
  }

  useEffect(fetchBookings, [search, statusFilter, dateRange, sortKey]);

  function openProofModal(booking: Booking) {
    setProofModalBooking(booking);
    setProofsLoading(true);
    getPaymentProofs(booking.id)
      .then(setProofs)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load payment proof.')))
      .finally(() => setProofsLoading(false));
  }

  async function handleConfirm(id: number) {
    setBusyId(id);
    try {
      await confirmBooking(id);
      message.success('Booking confirmed. The customer has been emailed.');
      fetchBookings();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to confirm this booking.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: number) {
    setBusyId(id);
    try {
      await rejectBookingPayment(id);
      message.success('Payment rejected; booking cancelled.');
      fetchBookings();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to reject this payment.'));
    } finally {
      setBusyId(null);
    }
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
    {
      title: 'Customer',
      key: 'customer',
      render: (_, booking) => (
        <div>
          <div>{booking.customerName ?? '—'}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {booking.customerEmail ?? ''}
          </Typography.Text>
        </div>
      ),
    },
    { title: 'Payment Method', dataIndex: 'paymentMethodName', render: (v: string | null) => v ?? '—' },
    {
      title: 'Payment Proof',
      key: 'proof',
      render: (_, booking) => (
        <Button size="small" icon={<FileImageOutlined />} onClick={() => openProofModal(booking)}>
          View
        </Button>
      ),
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      render: (status: BookingPaymentStatus) => <Tag color={PAYMENT_STATUS_COLOR[status]}>{status}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: BookingStatus) => <Tag color={STATUS_COLOR[status]}>{status}</Tag>,
    },
    { title: 'Created', dataIndex: 'createdAt', render: (v: string) => formatDateTime(v) },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, booking) =>
        booking.status === 'PENDING' ? (
          <Space wrap>
            <Popconfirm title={`Confirm booking JDM-${booking.id}?`} onConfirm={() => handleConfirm(booking.id)}>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={busyId === booking.id}>
                Confirm
              </Button>
            </Popconfirm>
            <Popconfirm title={`Reject payment for JDM-${booking.id}?`} onConfirm={() => handleReject(booking.id)}>
              <Button size="small" danger icon={<CloseCircleOutlined />} loading={busyId === booking.id}>
                Reject
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Bookings
      </Typography.Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search reference, customer, or tour..."
          allowClear
          style={{ width: 260 }}
          defaultValue={search}
          onSearch={setSearch}
        />
        <Select
          style={{ width: 160 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ]}
        />
        <DatePicker.RangePicker
          value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
          onChange={(dates) =>
            setDateRange(dates && dates[0] && dates[1] ? [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')] : null)
          }
        />
        <Select style={{ width: 200 }} value={sortKey} onChange={setSortKey} options={SORT_OPTIONS} />
      </Space>

      {loading ? (
        <PageSpinner />
      ) : (
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="id"
          scroll={{ x: true }}
          pagination={{ pageSize: 20, showSizeChanger: true, hideOnSinglePage: true }}
        />
      )}

      <Modal
        title={proofModalBooking ? `Payment Proof — JDM-${proofModalBooking.id}` : 'Payment Proof'}
        open={proofModalBooking !== null}
        onCancel={() => setProofModalBooking(null)}
        footer={null}
      >
        {proofsLoading ? (
          <PageSpinner />
        ) : proofs.length === 0 ? (
          <Empty description="No payment proof uploaded yet." />
        ) : (
          <Space orientation="vertical" style={{ width: '100%' }}>
            {proofs.map((proof) => (
              <div key={proof.id}>
                {proof.fileType.startsWith('image/') ? (
                  <Image src={proof.fileUrl} alt={proof.fileName} style={{ maxWidth: '100%' }} />
                ) : (
                  <a href={proof.fileUrl} target="_blank" rel="noopener noreferrer">
                    {proof.fileName}
                  </a>
                )}
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                  Uploaded {formatDateTime(proof.createdAt)}
                </Typography.Text>
              </div>
            ))}
          </Space>
        )}
      </Modal>
    </div>
  );
}
