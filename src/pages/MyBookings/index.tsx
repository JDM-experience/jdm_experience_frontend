import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Col, Modal, Row, Segmented, Space, Tag, Typography, Upload, message } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileDoneOutlined,
  TeamOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { useAuth } from '@/contexts/AuthContext';
import { getMyBookings, submitPaymentProof } from '@/services/bookingService';
import { getTourById } from '@/services/tourService';
import { ALLOWED_IMAGE_TYPES, uploadPaymentProofImage } from '@/services/uploadService';
import { formatCurrency } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { Booking, BookingStatus } from '@/types/booking';

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: 'warning',
  CONFIRMED: 'processing',
  CANCELLED: 'error',
  COMPLETED: 'success',
};

const STATUS_ICON: Record<BookingStatus, ReactNode> = {
  PENDING: <ClockCircleOutlined />,
  CONFIRMED: <CheckCircleOutlined />,
  CANCELLED: <CloseCircleOutlined />,
  COMPLETED: <CheckCircleOutlined />,
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  UNPAID: 'default',
  PENDING: 'warning',
  PAID: 'success',
  FAILED: 'error',
  REFUNDED: 'purple',
};

const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

type FilterKey = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

const EMPTY_FILTER_MESSAGE: Record<FilterKey, string> = {
  ALL: 'No reservations found.',
  UPCOMING: 'No upcoming trips.',
  COMPLETED: 'No completed trips yet.',
  CANCELLED: 'No cancelled trips.',
};

/** Real bookings made via the current Tour/booking flow -- distinct from /my-orders, which
 *  still shows the legacy mock Cart/Checkout orders. */
export default function MyBookings() {
  const { isAuthenticated, isInitializing } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tourImages, setTourImages] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [proofTarget, setProofTarget] = useState<Booking | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('ALL');

  function fetchBookings() {
    getMyBookings()
      .then(async (data) => {
        setBookings(data);
        const uniqueTourIds = [...new Set(data.map((b) => b.tourId))];
        const entries = await Promise.all(
          uniqueTourIds.map(async (tourId) => {
            const tour = await getTourById(tourId).catch(() => null);
            return [tourId, tour?.images[0]?.imageUrl ?? ''] as const;
          }),
        );
        setTourImages(Object.fromEntries(entries.filter(([, url]) => url)));
      })
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

  const stats = useMemo(
    () => ({
      upcoming: bookings.filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED').length,
      completed: bookings.filter((b) => b.status === 'COMPLETED').length,
      cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
      total: bookings.length,
    }),
    [bookings],
  );

  const visibleBookings = useMemo(() => {
    switch (filter) {
      case 'UPCOMING':
        return bookings.filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED');
      case 'COMPLETED':
        return bookings.filter((b) => b.status === 'COMPLETED');
      case 'CANCELLED':
        return bookings.filter((b) => b.status === 'CANCELLED');
      default:
        return bookings;
    }
  }, [bookings, filter]);

  // The default "All Bookings" view groups confirmed reservations above pending requests so a
  // customer can see what's actually locked in without hunting through a flat, unsorted list.
  // Other filter tabs (Upcoming/Completed/Cancelled) still render as a single flat list below.
  const groupedSections = useMemo(() => {
    if (filter !== 'ALL') return null;
    return [
      { title: 'Upcoming Reservations', bookings: bookings.filter((b) => b.status === 'CONFIRMED') },
      { title: 'Pending Requests', bookings: bookings.filter((b) => b.status === 'PENDING') },
      { title: 'Completed', bookings: bookings.filter((b) => b.status === 'COMPLETED') },
      { title: 'Cancelled', bookings: bookings.filter((b) => b.status === 'CANCELLED') },
    ].filter((section) => section.bookings.length > 0);
  }, [bookings, filter]);

  function renderBookingCard(booking: Booking) {
    const canManagePayment = booking.status !== 'CANCELLED' && booking.paymentStatus !== 'PAID';
    return (
      <Card key={booking.id} style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Row gutter={16} align="middle" wrap>
          <Col flex="72px">
            {tourImages[booking.tourId] ? (
              <ProductImage
                fileName={tourImages[booking.tourId]}
                alt={booking.tourNameSnapshot}
                style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10 }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 10,
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#bfbfbf',
                  fontSize: 24,
                }}
              >
                <CalendarOutlined />
              </div>
            )}
          </Col>

          <Col flex="auto">
            <Space align="center" size={8} wrap>
              <Typography.Text strong style={{ fontSize: 16 }}>
                {booking.tourNameSnapshot}
              </Typography.Text>
              <Tag color={STATUS_COLOR[booking.status]} icon={STATUS_ICON[booking.status]} style={{ marginInlineEnd: 0 }}>
                {booking.status}
              </Tag>
              <Tag color={PAYMENT_STATUS_COLOR[booking.paymentStatus] ?? 'default'} style={{ marginInlineEnd: 0 }}>
                {booking.paymentStatus}
              </Tag>
            </Space>
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Reference JDM-{booking.id}
              </Typography.Text>
            </div>
            <Space size={16} wrap style={{ marginTop: 6 }}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                <CalendarOutlined /> {new Date(booking.bookingDate).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' })}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                <TeamOutlined /> {booking.participants} participant{booking.participants === 1 ? '' : 's'}
              </Typography.Text>
            </Space>
          </Col>

          <Col flex="0 0 auto">
            <Space orientation="vertical" size={8} style={{ alignItems: 'flex-end' }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {formatCurrency(booking.totalPrice)}
              </Typography.Title>
              <Space>
                <Link to={`/tours/${booking.tourId}`}>
                  <Button>View Tour</Button>
                </Link>
                {canManagePayment && (
                  <Button type="primary" icon={<UploadOutlined />} onClick={() => setProofTarget(booking)}>
                    {booking.paymentStatus === 'UNPAID' ? 'Upload Proof' : 'Replace Proof'}
                  </Button>
                )}
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>
    );
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

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        My Reservations
      </Typography.Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'Upcoming Trips', value: stats.upcoming, icon: <ClockCircleOutlined />, color: '#faad14', bg: '#fffbe6' },
          { label: 'Completed Trips', value: stats.completed, icon: <CheckCircleOutlined />, color: '#52c41a', bg: '#f6ffed' },
          { label: 'Cancelled Trips', value: stats.cancelled, icon: <CloseCircleOutlined />, color: '#ff4d4f', bg: '#fff1f0' },
          { label: 'Total Reservations', value: stats.total, icon: <FileDoneOutlined />, color: '#1677ff', bg: '#e6f4ff' },
        ].map((tile) => (
          <Col xs={12} md={6} key={tile.label}>
            <Card style={{ borderRadius: 12, height: '100%' }} styles={{ body: { padding: 16 } }}>
              <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {tile.value}
                  </Typography.Title>
                  <Typography.Text type="secondary">{tile.label}</Typography.Text>
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: tile.bg,
                    color: tile.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {tile.icon}
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Segmented
        style={{ marginBottom: 20 }}
        value={filter}
        onChange={(value) => setFilter(value as FilterKey)}
        options={[
          { label: 'All Bookings', value: 'ALL' },
          { label: 'Upcoming', value: 'UPCOMING' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ]}
      />

      {groupedSections ? (
        groupedSections.length === 0 ? (
          <Card style={{ borderRadius: 12 }}>
            <EmptyState title={EMPTY_FILTER_MESSAGE.ALL} />
          </Card>
        ) : (
          <Space orientation="vertical" size={32} style={{ width: '100%' }}>
            {groupedSections.map((section) => (
              <div key={section.title}>
                <Typography.Title level={5} style={{ marginBottom: 12 }}>
                  {section.title}
                </Typography.Title>
                <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                  {section.bookings.map(renderBookingCard)}
                </Space>
              </div>
            ))}
          </Space>
        )
      ) : visibleBookings.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <EmptyState title={EMPTY_FILTER_MESSAGE[filter]} />
        </Card>
      ) : (
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          {visibleBookings.map(renderBookingCard)}
        </Space>
      )}

      <Modal
        title={proofTarget ? `Upload Payment Proof — ${proofTarget.tourNameSnapshot}` : 'Upload Payment Proof'}
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
