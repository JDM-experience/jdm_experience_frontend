import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Image, Input, InputNumber, Modal, Row, Select, Space, Typography, message } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getTourById } from '@/services/tourService';
import { createBooking } from '@/services/bookingService';
import { formatCurrency } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { Booking } from '@/types/booking';
import type { Tour, TourAvailability } from '@/types/tour';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="%23f0f0f0"/></svg>',
  );

/** The date a JST-based slot falls on, independent of the browser's own timezone --
 *  the backend itself resolves bookingDate against Asia/Tokyo, so this must match. */
function jstDateOf(isoDatetime: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' });
  return formatter.format(new Date(isoDatetime));
}

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const tourId = Number(id);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<TourAvailability | null>(null);
  const [participants, setParticipants] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setLoading(true);
    getTourById(tourId)
      .then((result) => {
        setTour(result);
        setMainImage(result.images[0]?.imageUrl ?? null);
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load this tour.')))
      .finally(() => setLoading(false));
  }, [tourId]);

  if (loading) return <PageSpinner />;
  if (!tour) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="Tour not found." actionText="Back to Tours" actionTo="/tours" />
      </div>
    );
  }

  // A slot in the past is never actually bookable (the backend enforces the same JST cutoff
  // rule server-side regardless) -- filter it out here too so it's never shown as selectable.
  const todayJST = jstDateOf(new Date().toISOString());
  const bookableSlots = tour.availability.filter(
    (slot) => slot.spotsRemaining > 0 && jstDateOf(slot.startDatetime) >= todayJST,
  );

  async function handleReserve() {
    if (!selectedSlot) {
      message.warning('Please select an available date.');
      return;
    }
    if (!isAuthenticated) {
      login({ returnTo: `${window.location.pathname}` });
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createBooking({
        tourId: tour!.id,
        bookingDate: jstDateOf(selectedSlot.startDatetime),
        participants,
        specialRequests: specialRequests.trim() || undefined,
      });
      setConfirmedBooking(booking);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to reserve this tour.'));
      // The slot's spotsRemaining may be stale (someone else just booked it) -- refetch.
      getTourById(tourId).then(setTour);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px' }}>
      <Row gutter={[40, 32]}>
        <Col xs={24} md={12} style={{ textAlign: 'center' }}>
          <Image
            src={mainImage ?? PLACEHOLDER_IMAGE}
            alt={tour.name}
            style={{ width: '100%', maxHeight: 520, objectFit: 'cover', borderRadius: 8 }}
          />
          {tour.images.length > 1 && (
            <Space style={{ marginTop: 16 }} wrap>
              {tour.images.map((img) => (
                <img
                  key={img.id}
                  src={img.imageUrl}
                  alt="Tour gallery"
                  onClick={() => setMainImage(img.imageUrl)}
                  style={{
                    width: 90,
                    height: 90,
                    objectFit: 'cover',
                    cursor: 'pointer',
                    borderRadius: 4,
                    border: img.imageUrl === mainImage ? '2px solid #000' : '1px solid #eee',
                  }}
                />
              ))}
            </Space>
          )}
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
          <Typography.Title level={4} style={{ margin: 0 }}>
            {formatCurrency(tour.price)}
          </Typography.Title>
          <Typography.Paragraph style={{ marginTop: 16 }}>{tour.description}</Typography.Paragraph>

          <Typography.Title level={5}>Select Tour Details</Typography.Title>
          <Space orientation="vertical" size="middle" style={{ width: '100%', maxWidth: 360 }}>
            <div>
              <Typography.Text>Available Dates</Typography.Text>
              <Select
                style={{ width: '100%' }}
                placeholder={bookableSlots.length === 0 ? 'No dates available' : 'Choose a date'}
                disabled={bookableSlots.length === 0}
                value={selectedSlot?.id}
                onChange={(slotId) => setSelectedSlot(bookableSlots.find((slot) => slot.id === slotId) ?? null)}
                options={bookableSlots.map((slot) => ({
                  value: slot.id,
                  label: `${new Date(slot.startDatetime).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Asia/Tokyo',
                  })} JST — ${slot.spotsRemaining} spots left`,
                }))}
              />
            </div>

            <div>
              <Typography.Text>Participants</Typography.Text>
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={selectedSlot ? Math.min(selectedSlot.spotsRemaining, tour.capacity) : tour.capacity}
                value={participants}
                onChange={(v) => setParticipants(v ?? 1)}
              />
            </div>

            <div>
              <Typography.Text>Special Requests (optional)</Typography.Text>
              <Input.TextArea
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any special requests..."
              />
            </div>

            <Button type="primary" size="large" loading={submitting} onClick={handleReserve}>
              {isAuthenticated ? 'Reserve Now' : 'Log In to Reserve'}
            </Button>
          </Space>

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
            <Typography.Title level={5}>Reservation confirmed!</Typography.Title>
            <Typography.Paragraph type="secondary">
              Booking Reference: JDM-{confirmedBooking.id}
              <br />
              Tour: {confirmedBooking.tourNameSnapshot}
              <br />
              Date: {new Date(confirmedBooking.bookingDate).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}
              <br />
              Participants: {confirmedBooking.participants}
              <br />
              Total: {formatCurrency(confirmedBooking.totalPrice)}
              <br />
              Status: {confirmedBooking.status}
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
