import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Alert, Button, Card, Col, DatePicker, Image, Input, InputNumber, Modal, Popconfirm, Radio, Row, Space, Steps, Tag, Typography, Upload, message } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, UploadOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { AvailabilityBadge } from '@/components/common/AvailabilityBadge';
import { TourWeatherForecast } from '@/components/common/TourWeatherForecast';
import { CurrencyConverter } from '@/components/common/CurrencyConverter';
import { TourReviews } from '@/components/common/TourReviews';
import { useAuth } from '@/contexts/AuthContext';
import { getBookedDates, getTourById, holdTourDate, releaseTourDate } from '@/services/tourService';
import { cancelBooking, getMyBookings, submitPaymentProof } from '@/services/bookingService';
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

  // Dates that already have an active booking or someone's hold — a tour-date is exclusive to one
  // active booking/hold at a time (like reserving the whole vehicle for the day), so these are
  // simply disabled in the picker. Just a UX hint; holdTourDate below is the real enforcement.
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(returningDraft?.bookingDate ?? null);
  // Tracks the atomic backend hold for the currently-selected date -- "Proceed to Checkout" is
  // gated on this being 'held', not just on a date being picked in the UI, since another customer
  // may have grabbed the same date a moment earlier.
  const [holdStatus, setHoldStatus] = useState<'idle' | 'checking' | 'held' | 'unavailable'>(
    returningDraft ? 'held' : 'idle',
  );
  // The date this session currently holds, if any -- used to release it (best-effort) when the
  // customer picks a different date or leaves the page without completing checkout.
  const heldDateRef = useRef<string | null>(returningDraft?.bookingDate ?? null);
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
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  function fetchMyBookingsForTour() {
    getMyBookings({ tourId })
      .then(setMyBookingsForTour)
      .catch(() => undefined); // Non-fatal — this section just won't show.
  }

  async function handleCancelBooking(id: number) {
    setCancellingId(id);
    try {
      await cancelBooking(id);
      message.success('Booking cancelled.');
      fetchMyBookingsForTour();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to cancel this booking. Please try again.'));
    } finally {
      setCancellingId(null);
    }
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

  // Set right before navigating to Checkout so the hold survives the page transition -- the
  // unmount-release effect below would otherwise release it, since this component unmounts on
  // every navigation away, deliberate or not.
  const proceedingToCheckoutRef = useRef(false);

  async function attemptHoldDate(date: string) {
    setHoldStatus('checking');
    try {
      await holdTourDate(tourId, date);
      heldDateRef.current = date;
      setHoldStatus('held');
    } catch (error) {
      setHoldStatus('unavailable');
      message.error(getErrorMessage(error, 'This date is currently unavailable.'));
      // The picker's disabled-dates hint is now stale (this date should show as taken) --
      // refresh it so the customer doesn't immediately retry the same date.
      getBookedDates(tourId)
        .then(setBookedDates)
        .catch(() => undefined);
    }
  }

  function handleDateChange(date: Dayjs | null) {
    const previouslyHeld = heldDateRef.current;
    const iso = date ? date.format('YYYY-MM-DD') : null;
    setSelectedDate(iso);
    setHoldStatus('idle');
    if (previouslyHeld && previouslyHeld !== iso) {
      void releaseTourDate(tourId, previouslyHeld).catch(() => undefined);
      heldDateRef.current = null;
    }
    if (iso) void attemptHoldDate(iso);
  }

  // Release this session's hold when leaving the page without proceeding to checkout (picking a
  // different tour, navigating away entirely) -- best-effort, so the date frees up for other
  // customers sooner than the hold's own TTL.
  useEffect(() => {
    return () => {
      if (!proceedingToCheckoutRef.current && heldDateRef.current) {
        void releaseTourDate(tourId, heldDateRef.current).catch(() => undefined);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  // Arriving here via "Edit Reservation Details" from Checkout -- the draft's date was held
  // before, but may have expired while the customer was reviewing/editing on that page. Re-hold
  // (idempotent refresh if still held, real re-check otherwise) rather than trusting the
  // optimistic initial 'held' state.
  useEffect(() => {
    if (returningDraft && isAuthenticated) {
      void attemptHoldDate(returningDraft.bookingDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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

  const mainImageMeta = tour.images.find((img) => img.imageUrl === mainImage);
  const mainImageFocalPosition = `${mainImageMeta?.focalX ?? 50}% ${mainImageMeta?.focalY ?? 50}%`;
  const status = tourAvailabilityStatus(tour);

  function isDateDisabled(date: Dayjs): boolean {
    if (date.isBefore(dayjs(), 'day')) return true;
    const iso = date.format('YYYY-MM-DD');
    return bookedDates.includes(iso) || isBookingClosedForDate(iso);
  }

  const readyForCheckout =
    tour!.status === 'AVAILABLE' &&
    selectedDate !== null &&
    holdStatus === 'held' &&
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
    if (holdStatus !== 'held') {
      message.warning('This date is currently unavailable. Please choose another date.');
      return;
    }
    if (!readyForCheckout) {
      message.warning('Please fill in your contact information and select a payment method.');
      return;
    }

    // The hold must survive the page transition -- see the unmount-release effect above.
    proceedingToCheckoutRef.current = true;

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
            style={{ objectFit: 'cover', objectPosition: mainImageFocalPosition, borderRadius: 8 }}
          />
          <Space style={{ marginTop: 16 }} wrap>
            {tour.images.map((thumb) => (
              <ProductImage
                key={thumb.imageUrl}
                fileName={thumb.imageUrl}
                alt="Tour gallery"
                onClick={() => setMainImage(thumb.imageUrl)}
                style={{
                  width: 90,
                  height: 90,
                  objectFit: 'cover',
                  objectPosition: `${thumb.focalX}% ${thumb.focalY}%`,
                  cursor: 'pointer',
                  borderRadius: 4,
                  border: thumb.imageUrl === mainImage ? '2px solid #E03D36' : '1px solid #303849',
                }}
              />
            ))}
          </Space>
        </Col>

        <Col xs={24} md={12}>
          {myBookingsForTour.length > 0 && (
            <Card size="small" style={{ marginBottom: 20, borderRadius: 8, background: '#252D40', border: '1px solid #303849' }} title="Your Reservation(s) for This Tour">
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                {myBookingsForTour.map((booking) => {
                  const canManagePayment = booking.status !== 'CANCELLED' && booking.paymentStatus !== 'PAID';
                  return (
                    <div key={booking.id} style={{ borderBottom: '1px solid #303849', paddingBottom: 10 }}>
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
                      <Space style={{ marginTop: 8 }}>
                        {canManagePayment && (
                          <Button size="small" icon={<UploadOutlined />} onClick={() => setProofTarget(booking)}>
                            {booking.paymentStatus === 'UNPAID' ? 'Upload Proof' : 'Replace Proof'}
                          </Button>
                        )}
                        {booking.status === 'PENDING' && booking.paymentStatus === 'UNPAID' && (
                          <Popconfirm
                            title="Cancel this booking?"
                            description="This cannot be undone."
                            okText="Cancel Booking"
                            cancelText="Keep Booking"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleCancelBooking(booking.id)}
                          >
                            <Button size="small" danger loading={cancellingId === booking.id}>
                              Cancel Booking
                            </Button>
                          </Popconfirm>
                        )}
                      </Space>
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
                          onChange={handleDateChange}
                        />
                        {holdStatus === 'checking' && (
                          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            <LoadingOutlined /> Checking availability...
                          </Typography.Text>
                        )}
                        {holdStatus === 'held' && (
                          <Typography.Text type="success" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            <CheckCircleOutlined /> Date held for you — complete checkout to confirm your reservation.
                          </Typography.Text>
                        )}
                        {holdStatus === 'unavailable' && (
                          <Alert
                            type="error"
                            showIcon
                            message="This date is currently unavailable."
                            style={{ marginTop: 8 }}
                          />
                        )}
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
