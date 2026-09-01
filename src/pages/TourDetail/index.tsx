import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button, Col, Image, InputNumber, Modal, Row, Select, Space, Typography, message } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { AvailabilityBadge } from '@/components/common/AvailabilityBadge';
import { useCart } from '@/contexts/CartContext';
import { getTourById } from '@/services/tourService';
import { formatTourDate, formatTourTime, tourAvailabilityStatus } from '@/utils/bookingUtils';
import { getErrorMessage } from '@/utils/errors';
import type { Tour, TourAvailability } from '@/types/tour';

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const tourId = Number(id);
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ date: string; time: string; quantity: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    getTourById(tourId)
      .then((t) => {
        setTour(t);
        if (t) setMainImage(t.images[0]?.imageUrl ?? '');
      })
      .finally(() => setLoading(false));
  }, [tourId]);

  const openSlots = useMemo(() => {
    if (!tour) return [];
    const now = dayjs();
    return [...tour.availability]
      .filter((slot) => slot.spotsRemaining > 0 && dayjs(slot.startDatetime).isAfter(now))
      .sort((a, b) => dayjs(a.startDatetime).valueOf() - dayjs(b.startDatetime).valueOf());
  }, [tour]);

  const selectedSlot: TourAvailability | undefined = openSlots.find((slot) => slot.id === selectedSlotId);

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
  const bookable = tour.status === 'ACTIVE' && selectedSlot !== undefined;

  async function handleReserve() {
    if (!tour || !selectedSlot) {
      message.warning('Please select an available tour slot.');
      return;
    }
    const slotDate = dayjs(selectedSlot.startDatetime);
    const dateStr = slotDate.format('YYYY-MM-DD');
    const timeStr = slotDate.format('HH:mm');
    setSubmitting(true);
    try {
      await addItem({
        productId: tour.id,
        productName: tour.name,
        price: tour.price,
        productImage: tour.images[0]?.imageUrl ?? '',
        date: dateStr,
        time: timeStr,
        quantity,
      });
      setConfirmation({ date: dateStr, time: timeStr, quantity });
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to reserve this tour.'));
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
          <Typography.Title level={2} style={{ marginTop: 4 }}>
            {tour.name}
          </Typography.Title>
          <PriceDisplay price={tour.price} discount={0} />
          <Typography.Paragraph style={{ marginTop: 16 }}>{tour.description}</Typography.Paragraph>

          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong>Availability Status: </Typography.Text>
            <AvailabilityBadge status={status} />
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              {openSlots.length > 0
                ? `${openSlots.length} tour slot${openSlots.length === 1 ? '' : 's'} open for booking.`
                : 'No upcoming slots are open for booking right now.'}
            </Typography.Paragraph>
          </div>

          <Typography.Title level={5}>Select Tour Slot</Typography.Title>
          <Space orientation="vertical" size="middle" style={{ width: '100%', maxWidth: 360 }}>
            <div>
              <Typography.Text>Tour Date &amp; Time</Typography.Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Choose an available slot"
                value={selectedSlotId ?? undefined}
                onChange={(value) => {
                  setSelectedSlotId(value);
                  setQuantity(1);
                }}
                options={openSlots.map((slot) => ({
                  value: slot.id,
                  label: `${formatTourDate(dayjs(slot.startDatetime).format('YYYY-MM-DD'))} at ${formatTourTime(dayjs(slot.startDatetime).format('HH:mm'))} — ${slot.spotsRemaining} spot${slot.spotsRemaining === 1 ? '' : 's'} left`,
                }))}
                notFoundContent="No available slots"
              />
            </div>

            <div>
              <Typography.Text>Quantity</Typography.Text>
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={selectedSlot?.spotsRemaining ?? 1}
                value={quantity}
                disabled={!selectedSlot}
                onChange={(v) => setQuantity(v ?? 1)}
              />
            </div>

            <Button type="primary" size="large" disabled={!bookable} loading={submitting} onClick={handleReserve}>
              Reserve Now
            </Button>
          </Space>

          <div style={{ marginTop: 16 }}>
            <Link to="/tours">
              <Button>Back to Tours</Button>
            </Link>
          </div>
        </Col>
      </Row>

      <Modal open={confirmation !== null} onCancel={() => setConfirmation(null)} footer={null} centered>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <ProductImage
            fileName={tour.images[0]?.imageUrl ?? ''}
            alt={tour.name}
            style={{ width: 200, height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
          />
          <Typography.Title level={5}>{tour.name} added for review</Typography.Title>
          {confirmation && (
            <Typography.Paragraph type="secondary">
              Tour Date: {formatTourDate(confirmation.date)}
              <br />
              Tour Time: {formatTourTime(confirmation.time)}
              <br />
              Quantity: {confirmation.quantity}
            </Typography.Paragraph>
          )}
          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => navigate('/tours')}>Continue Browsing</Button>
            <Button type="primary" onClick={() => navigate('/cart')}>
              View Reservations
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
}
