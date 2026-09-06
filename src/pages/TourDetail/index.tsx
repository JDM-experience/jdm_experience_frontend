import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Button, Card, Col, DatePicker, Image, Input, InputNumber, Modal, Radio, Row, Space, Steps, Tag, Typography, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { AvailabilityBadge } from '@/components/common/AvailabilityBadge';
import { TourWeatherForecast } from '@/components/common/TourWeatherForecast';
import { CurrencyConverter } from '@/components/common/CurrencyConverter';
import { TourReviews } from '@/components/common/TourReviews';
import { useAuth } from '@/contexts/AuthContext';
import { getBookedDates, getTourById } from '@/services/tourService';
import { getMyBookings, submitPaymentProof } from '@/services/bookingService';
import { listPaymentMethods } from '@/services/paymentMethodService';
import { ALLOWED_IMAGE_TYPES, uploadPaymentProofImage } from '@/services/uploadService';
import { isBookingClosedForDate, tourAvailabilityStatus } from '@/utils/bookingUtils';
import { formatCurrency } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { PaymentMethod } from '@/types/paymentMethod';
import type { Tour } from '@/types/tour';
import type { Booking, BookingPaymentStatus, BookingStatus } from '@/types/booking';
import type { ReservationDraft } from '@/pages/ReservationCheckout';

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: 'warning',
  CONFIRMED: 'processing',
  CANCELLED: 'error',
  COMPLETED: 'success',
};

const PAYMENT_STATUS_COLOR: Record<BookingPaymentStatus, string> = {
  UNPAID: 'default',
  PENDING: 'warning',
  PAID: 'success',
  FAILED: 'error',
  REFUNDED: 'purple',
};

const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const tourId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login } = useAuth();

  // If we got here via "Edit Reservation Details" from Checkout, the draft comes back as router
  // state -- prefill from it instead of starting over.
  const returningDraft = (location.state as { draft?: ReservationDraft } | null)?.draft;

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  // Dates already CONFIRMED-booked for this tour — a tour-date is exclusive to one such booking
  // (like reserving the whole vehicle for the day), so these are simply disabled in the picker.
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(returningDraft?.bookingDate ?? null);
  const [participants, setParticipants] = useState(returningDraft?.participants ?? 1);
  const [specialRequests, setSpecialRequests] = useState(returningDraft?.specialRequests ?? '');

  // Contact info — prefilled from the authenticated user (or the returning draft), editable. No
  // delivery address: a reservation isn't shipped anywhere, this is just how the customer and
  // tour owner reach each other.
  const [customerName, setCustomerName] = useState(returningDraft?.customerName ?? '');
  const [customerEmail, setCustomerEmail] = useState(returningDraft?.customerEmail ?? '');
  const [customerPhone, setCustomerPhone] = useState(returningDraft?.customerPhone ?? '');

  // The tour owner is determined automatically from the tour record (tour.guide) — the customer
  // never selects it.
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(returningDraft?.paymentMethodId ?? null);

  // If the customer already booked this tour (e.g. arriving here via "View Tour Page" from their
  // reservation details), that context shouldn't disappear -- surfaced as its own card rather
  // than making them hunt back through /cart.
  const [myBookingsForTour, setMyBookingsForTour] = useState<Booking[]>([]);
  const [proofTarget, setProofTarget] = useState<Booking | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  function fetchMyBookingsForTour() {
    getMyBookings()
      .then((bookings) => setMyBookingsForTour(bookings.filter((b) => b.tourId === tourId)))
      .catch(() => undefined); // Non-fatal — this section just won't show.
  }

  async function handleUploadProof(file: File) {
    if (!proofTarget) return Upload.LIST_IGNORE;
    setUploadingProof(true);
    try {
      const fileUrl = await uploadPaymentProofImage(file);
      await submitPaymentProof(proofTarget.id, { fileUrl, fileName: file.name, fileType: file.type });
      message.success('Payment proof submitted — awaiting review.');
      setProofTarget(null);
      fetchMyBookingsForTour();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to submit payment proof.'));
    } finally {
      setUploadingProof(false);
    }
    return Upload.LIST_IGNORE;
  }

  useEffect(() => {
    // tourId can change without unmounting this component (e.g. navigating between two tour
    // detail pages) -- a cancellation flag stops a slower, stale fetch from overwriting the
    // newer tour's data.
    let cancelled = false;
    setLoading(true);
    getTourById(tourId)
      .then((t) => {
        if (cancelled) return;
        setTour(t);
        if (t) setMainImage(t.images[0]?.imageUrl ?? '');
      })
      .catch((error) => {
        if (!cancelled) message.error(getErrorMessage(error, 'Unable to load this tour.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    getBookedDates(tourId)
      .then((dates) => {
        if (!cancelled) setBookedDates(dates);
      })
      .catch(() => undefined); // Non-fatal — worst case a taken date shows selectable and the backend rejects it.
    return () => {
      cancelled = true;
    };
  }, [tourId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!returningDraft) {
      setCustomerName(user?.fullName ?? '');
      setCustomerEmail(user?.email ?? '');
    }
    listPaymentMethods()
      .then(setPaymentMethods)
      .catch(() => undefined); // Non-fatal — the button stays disabled without a selection either way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMyBookingsForTour([]);
      return;
    }
    fetchMyBookingsForTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, tourId]);

  if (loading) return <PageSpinner />;
  if (!tour) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="Tour not found." actionText="Back to Tours" actionTo="/tours" />
      </div>
    );
  }

  const gallery = tour.images.map((img) => img.imageUrl);
  const status = tourAvailabilityStatus(tour);

  function isDateDisabled(date: Dayjs): boolean {
    if (date.isBefore(dayjs(), 'day')) return true;
    const iso = date.format('YYYY-MM-DD');
    return bookedDates.includes(iso) || isBookingClosedForDate(iso);
  }

  const readyForCheckout =
    tour!.status === 'AVAILABLE' &&
    selectedDate !== null &&
    customerName.trim() !== '' &&
    customerEmail.trim() !== '' &&
    customerPhone.trim() !== '' &&
    paymentMethodId !== null;

  function handleProceedToCheckout() {
    if (!tour || !selectedDate) {
      message.warning('Please select a tour date.');
      return;
    }
    if (!isAuthenticated) {
      login({ returnTo: window.location.pathname });
      return;
    }
    if (!readyForCheckout) {
      message.warning('Please fill in your contact information and select a payment method.');
      return;
    }

    const draft: ReservationDraft = {
      tourId: tour.id,
      bookingDate: selectedDate,
      participants,
      specialRequests: specialRequests.trim() || undefined,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      paymentMethodId: paymentMethodId!,
    };
    navigate(`/reservations/${tour.id}/checkout`, { state: { draft } });
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px' }}>
      <Row gutter={[40, 32]}>
        <Col xs={24} md={12} style={{ textAlign: 'center' }}>
          <Image
            src={mainImage}
            alt={tour.name}
            width="100%"
            height={480}
            style={{ objectFit: 'cover', borderRadius: 8 }}
          />
          <Space style={{ marginTop: 16 }} wrap>
            {gallery.map((img) => (
              <ProductImage
                key={img}
                fileName={img}
                alt="Tour gallery"
                onClick={() => setMainImage(img)}
                style={{
                  width: 90,
                  height: 90,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: 4,
                  border: img === mainImage ? '2px solid #000' : '1px solid #eee',
                }}
              />
            ))}
          </Space>
        </Col>

        <Col xs={24} md={12}>
          {myBookingsForTour.length > 0 && (
            <Card size="small" style={{ marginBottom: 20, borderRadius: 8, background: '#fafafa' }} title="Your Reservation(s) for This Tour">
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                {myBookingsForTour.map((booking) => {
                  const canManagePayment = booking.status !== 'CANCELLED' && booking.paymentStatus !== 'PAID';
                  return (
                    <div key={booking.id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
                      <Space size={8} wrap>
                        <Typography.Text strong>Reference JDM-{booking.id}</Typography.Text>
                        <Tag color={STATUS_COLOR[booking.status]}>{booking.status}</Tag>
                        <Tag color={PAYMENT_STATUS_COLOR[booking.paymentStatus]}>{booking.paymentStatus}</Tag>
                      </Space>
                      <div style={{ marginTop: 4 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                          {new Date(booking.bookingDate).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' })} ·{' '}
                          {booking.participants} participant{booking.participants === 1 ? '' : 's'} · {formatCurrency(booking.totalPrice)}
                        </Typography.Text>
                      </div>
                      {canManagePayment && (
                        <Button size="small" style={{ marginTop: 8 }} icon={<UploadOutlined />} onClick={() => setProofTarget(booking)}>
                          {booking.paymentStatus === 'UNPAID' ? 'Upload Proof' : 'Replace Proof'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </Space>
              <Link to="/cart" style={{ fontSize: 12 }}>
                View all your reservations →
              </Link>
            </Card>
          )}

          {tour.guide?.fullName && (
            <Typography.Text type="secondary" style={{ textTransform: 'uppercase' }}>
              Guide: {tour.guide.fullName}
            </Typography.Text>
          )}
          <Typography.Title level={2} style={{ marginTop: 4 }}>
            {tour.name}
          </Typography.Title>
          <PriceDisplay price={tour.price} discount={0} />
          <CurrencyConverter amountJPY={tour.price} />
          <Typography.Paragraph style={{ marginTop: 16 }}>{tour.description}</Typography.Paragraph>

          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong>Availability Status: </Typography.Text>
            <AvailabilityBadge status={status} />
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              {status === 'Available'
                ? 'Pick any open date below — booking closes for the current day after 5:00 PM Japan time.'
                : 'This tour is not currently open for booking.'}
            </Typography.Paragraph>
          </div>

          {tour.status === 'AVAILABLE' && (
            <Steps
              size="small"
              direction="vertical"
              current={3}
              style={{ marginBottom: 8 }}
              items={[
                {
                  title: 'Tour Date & Seats',
                  description: (
                    <Space orientation="vertical" size="middle" style={{ width: '100%', maxWidth: 360, marginBottom: 16 }}>
                      <div>
                        <Typography.Text>Tour Date</Typography.Text>
                        <DatePicker
                          style={{ width: '100%' }}
                          placeholder="Choose a date"
                          disabledDate={isDateDisabled}
                          value={selectedDate ? dayjs(selectedDate) : null}
                          onChange={(date) => setSelectedDate(date ? date.format('YYYY-MM-DD') : null)}
                        />
                        {selectedDate && <TourWeatherForecast date={selectedDate} />}
                      </div>
                      <div>
                        <Typography.Text>Participants</Typography.Text>
                        <InputNumber
                          style={{ width: '100%' }}
                          min={1}
                          max={tour.seats}
                          value={participants}
                          disabled={!selectedDate}
                          onChange={(v) => setParticipants(v ?? 1)}
                        />
                      </div>
                    </Space>
                  ),
                },
                {
                  title: 'Contact Information',
                  description: (
                    <Space orientation="vertical" size="middle" style={{ width: '100%', maxWidth: 360, marginBottom: 16 }}>
                      <div>
                        <Typography.Text>Full Name</Typography.Text>
                        <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your full name" />
                      </div>
                      <div>
                        <Typography.Text>Email</Typography.Text>
                        <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="you@example.com" />
                      </div>
                      <div>
                        <Typography.Text>Phone Number</Typography.Text>
                        <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+81-90-1234-5678" />
                      </div>
                      <div>
                        <Typography.Text>Special Requests (optional)</Typography.Text>
                        <Input.TextArea rows={2} value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} />
                      </div>
                    </Space>
                  ),
                },
                {
                  title: 'Payment Method',
                  description:
                    paymentMethods.length === 0 ? (
                      <Typography.Text type="secondary">No payment methods are configured yet.</Typography.Text>
                    ) : (
                      <Radio.Group
                        value={paymentMethodId ?? undefined}
                        onChange={(e) => setPaymentMethodId(e.target.value as number)}
                        style={{ marginBottom: 16 }}
                      >
                        <Space orientation="vertical">
                          {paymentMethods.map((method) => (
                            <Radio key={method.id} value={method.id}>
                              <Space>
                                {method.imageUrl && (
                                  <img src={method.imageUrl} alt={method.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                )}
                                {method.name}
                              </Space>
                            </Radio>
                          ))}
                        </Space>
                      </Radio.Group>
                    ),
                },
              ]}
            />
          )}

          <Button type="primary" size="large" disabled={!readyForCheckout} onClick={handleProceedToCheckout}>
            {isAuthenticated ? 'Proceed to Checkout' : 'Log In to Reserve'}
          </Button>

          <div style={{ marginTop: 16 }}>
            <Link to="/tours">
              <Button>Back to Tours</Button>
            </Link>
          </div>
        </Col>
      </Row>

      <TourReviews tourId={tour.id} />

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
