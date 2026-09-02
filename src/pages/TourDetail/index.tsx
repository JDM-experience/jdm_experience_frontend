import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button, Col, Image, Input, InputNumber, Modal, Row, Select, Space, Typography, message } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { AvailabilityBadge } from '@/components/common/AvailabilityBadge';
import { useAuth } from '@/contexts/AuthContext';
import { getTourById } from '@/services/tourService';
import { createBooking } from '@/services/bookingService';
import { formatTourDate, tourAvailabilityStatus } from '@/utils/bookingUtils';
import { getErrorMessage } from '@/utils/errors';
import type { Booking } from '@/types/booking';
import type { Tour, TourAvailability } from '@/types/tour';

/** The JST calendar date a slot falls on. The backend resolves `bookingDate` against
 *  Asia/Tokyo, and only ever books one date per day for a tour, so the customer picks a date --
 *  never a time -- and same-day bookings close at the 17:00 JST cutoff (enforced server-side). */
function jstDateOf(isoDatetime: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' });
  return formatter.format(new Date(isoDatetime));
}

/** One selectable option per JST calendar date. Slots are expected to be one-per-day, but if
 *  more than one ever lands on the same date, their remaining spots are combined so the
 *  participant cap stays accurate either way. */
interface DateOption {
  date: string;
  spotsRemaining: number;
}

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const tourId = Number(id);
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [participants, setParticipants] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
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
  }, [tourId]);

  const dateOptions = useMemo<DateOption[]>(() => {
    if (!tour) return [];
    const now = dayjs();
    const byDate = new Map<string, number>();
    for (const slot of tour.availability as TourAvailability[]) {
      if (slot.spotsRemaining <= 0 || !dayjs(slot.startDatetime).isAfter(now)) continue;
      const date = jstDateOf(slot.startDatetime);
      byDate.set(date, (byDate.get(date) ?? 0) + slot.spotsRemaining);
    }
    return [...byDate.entries()]
      .map(([date, spotsRemaining]) => ({ date, spotsRemaining }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [tour]);

  const selectedOption = dateOptions.find((opt) => opt.date === selectedDate);

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
  const bookable = tour.status === 'AVAILABLE' && selectedOption !== undefined;

  async function handleReserve() {
    if (!tour || !selectedOption) {
      message.warning('Please select an available tour date.');
      return;
    }
    if (!isAuthenticated) {
      login({ returnTo: window.location.pathname });
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createBooking({
        tourId: tour.id,
        bookingDate: selectedOption.date,
        participants,
        specialRequests: specialRequests.trim() || undefined,
      });
      setConfirmedBooking(booking);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to reserve this tour.'));
      // Remaining spots may be stale (someone else just booked the same date) -- refetch.
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
              {dateOptions.length > 0
                ? `${dateOptions.length} date${dateOptions.length === 1 ? '' : 's'} open for booking.`
                : 'No upcoming dates are open for booking right now.'}
            </Typography.Paragraph>
          </div>

          <Typography.Title level={5}>Select Tour Date</Typography.Title>
          <Space orientation="vertical" size="middle" style={{ width: '100%', maxWidth: 360 }}>
            <div>
              <Typography.Text>Tour Date</Typography.Text>
              <Select
                style={{ width: '100%' }}
                placeholder={dateOptions.length === 0 ? 'No dates available' : 'Choose a date'}
                disabled={dateOptions.length === 0}
                value={selectedDate ?? undefined}
                onChange={(date) => {
                  setSelectedDate(date);
                  setParticipants(1);
                }}
                options={dateOptions.map((opt) => ({
                  value: opt.date,
                  label: `${formatTourDate(opt.date)} — ${opt.spotsRemaining} spot${opt.spotsRemaining === 1 ? '' : 's'} left`,
                }))}
                notFoundContent="No available dates"
              />
            </div>

            <div>
              <Typography.Text>Participants</Typography.Text>
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={selectedOption ? Math.min(selectedOption.spotsRemaining, tour.seats) : tour.seats}
                value={participants}
                disabled={!selectedOption}
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

            <Button type="primary" size="large" disabled={!bookable} loading={submitting} onClick={handleReserve}>
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
