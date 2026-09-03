import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Button, Col, DatePicker, Image, Input, InputNumber, Modal, Radio, Row, Space, Steps, Typography, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { AvailabilityBadge } from '@/components/common/AvailabilityBadge';
import { useAuth } from '@/contexts/AuthContext';
import { getBookedDates, getTourById } from '@/services/tourService';
import { createBooking, submitPaymentProof } from '@/services/bookingService';
import { listPaymentMethods } from '@/services/paymentMethodService';
import { ALLOWED_IMAGE_TYPES, uploadPaymentProofImage } from '@/services/uploadService';
import { formatTourDate, isBookingClosedForDate, tourAvailabilityStatus } from '@/utils/bookingUtils';
import { getErrorMessage } from '@/utils/errors';
import type { Booking } from '@/types/booking';
import type { PaymentMethod } from '@/types/paymentMethod';
import type { Tour } from '@/types/tour';

const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const tourId = Number(id);
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  // Dates already CONFIRMED-booked for this tour — a tour-date is exclusive to one such booking
  // (like reserving the whole vehicle for the day), so these are simply disabled in the picker.
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [participants, setParticipants] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');

  // Contact info — prefilled from the authenticated user, editable. No delivery address: a
  // reservation isn't shipped anywhere, this is just how the customer and tour owner reach
  // each other.
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // The tour owner is determined automatically from the tour record (tour.guide) — the customer
  // never selects it.
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setLoading(true);
    getTourById(tourId)
      .then((t) => {
        setTour(t);
        if (t) setMainImage(t.images[0]?.imageUrl ?? '');
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load this tour.')))
      .finally(() => setLoading(false));
    getBookedDates(tourId)
      .then(setBookedDates)
      .catch(() => undefined); // Non-fatal — worst case a taken date shows selectable and the backend rejects it.
  }, [tourId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setCustomerName(user?.fullName ?? '');
    setCustomerEmail(user?.email ?? '');
    listPaymentMethods()
      .then(setPaymentMethods)
      .catch(() => undefined); // Non-fatal — the reserve button stays disabled without a selection either way.
  }, [isAuthenticated, user]);

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

  const bookable =
    tour!.status === 'AVAILABLE' &&
    selectedDate !== null &&
    customerName.trim() !== '' &&
    customerEmail.trim() !== '' &&
    customerPhone.trim() !== '' &&
    paymentMethodId !== null;

  async function handleUploadProof(file: File) {
    setUploadingProof(true);
    try {
      const url = await uploadPaymentProofImage(file);
      setProofUrl(url);
      setProofFile(file);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to upload payment proof.'));
    } finally {
      setUploadingProof(false);
    }
    return Upload.LIST_IGNORE;
  }

  async function handleReserve() {
    if (!tour || !selectedDate) {
      message.warning('Please select a tour date.');
      return;
    }
    if (!isAuthenticated) {
      login({ returnTo: window.location.pathname });
      return;
    }
    if (!bookable) {
      message.warning('Please fill in your contact information and select a payment method.');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createBooking({
        tourId: tour.id,
        bookingDate: selectedDate,
        participants,
        specialRequests: specialRequests.trim() || undefined,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethodId: paymentMethodId ?? undefined,
      });

      if (proofUrl && proofFile) {
        try {
          await submitPaymentProof(booking.id, { fileUrl: proofUrl, fileName: proofFile.name, fileType: proofFile.type });
        } catch (error) {
          // The booking itself already succeeded -- surface the proof-upload failure separately
          // rather than losing the booking confirmation behind it.
          message.error(getErrorMessage(error, 'Booking created, but payment proof failed to submit. You can retry from My Reservations.'));
        }
      }

      setConfirmedBooking(booking);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to reserve this tour.'));
      // The date may have just been confirmed for someone else — refetch so it shows disabled.
      setSelectedDate(null);
      getBookedDates(tourId).then(setBookedDates);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px' }}>
      <Row gutter={[40, 32]}>
        <Col xs={24} md={12} style={{ textAlign: 'center' }}>
          <Image
            src={mainImage}
            alt={tour.name}
            style={{ width: '100%', maxHeight: 520, objectFit: 'cover', borderRadius: 8 }}
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
          {tour.guide?.fullName && (
            <Typography.Text type="secondary" style={{ textTransform: 'uppercase' }}>
              Guide: {tour.guide.fullName}
            </Typography.Text>
          )}
          <Typography.Title level={2} style={{ marginTop: 4 }}>
            {tour.name}
          </Typography.Title>
          <PriceDisplay price={tour.price} discount={0} />
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
              current={4}
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
                {
                  title: 'Payment Proof (optional now, required before confirmation)',
                  description: (
                    <div style={{ marginBottom: 16 }}>
                      {proofUrl && (
                        <Image src={proofUrl} alt="Payment proof" width={120} style={{ display: 'block', marginBottom: 8, borderRadius: 4 }} />
                      )}
                      <Upload accept={IMAGE_ACCEPT} showUploadList={false} beforeUpload={handleUploadProof}>
                        <Button icon={<UploadOutlined />} loading={uploadingProof}>
                          {proofUrl ? 'Replace Payment Proof' : 'Upload Payment Proof'}
                        </Button>
                      </Upload>
                    </div>
                  ),
                },
              ]}
            />
          )}

          <Button type="primary" size="large" disabled={!bookable} loading={submitting} onClick={handleReserve}>
            {isAuthenticated ? 'Submit Reservation' : 'Log In to Reserve'}
          </Button>

          <div style={{ marginTop: 16 }}>
            <Link to="/tours">
              <Button>Back to Tours</Button>
            </Link>
          </div>
        </Col>
      </Row>

      <Modal open={confirmedBooking !== null} onCancel={() => setConfirmedBooking(null)} footer={null} centered>
        {confirmedBooking && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <ProductImage
              fileName={tour.images[0]?.imageUrl ?? ''}
              alt={tour.name}
              style={{ width: 200, height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
            />
            <Typography.Title level={5}>Reservation confirmed!</Typography.Title>
            <Typography.Paragraph type="secondary">
              Booking Reference: JDM-{confirmedBooking.id}
              <br />
              Tour: {confirmedBooking.tourNameSnapshot}
              <br />
              Tour Date: {formatTourDate(dayjs(confirmedBooking.bookingDate).format('YYYY-MM-DD'))}
              <br />
              Participants: {confirmedBooking.participants}
              <br />
              Payment Method: {confirmedBooking.paymentMethodName ?? 'Not specified'}
              <br />
              Status: {confirmedBooking.status}
              <br />
              {proofUrl
                ? 'Your payment proof was submitted and is awaiting review.'
                : 'You can upload payment proof any time from My Reservations.'}
            </Typography.Paragraph>
            <Space style={{ marginTop: 16 }}>
              <Button onClick={() => navigate('/tours')}>Continue Browsing</Button>
              <Button type="primary" onClick={() => navigate('/my-bookings')}>
                View My Reservations
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}
