import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Button, Col, DatePicker, Image, InputNumber, Modal, Row, Space, Typography, message } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { AvailabilityBadge } from '@/components/common/AvailabilityBadge';
import { TourWeatherForecast } from '@/components/common/TourWeatherForecast';
import { CurrencyConverter } from '@/components/common/CurrencyConverter';
import { TourItineraryMap } from '@/components/common/TourItineraryMap';
import { useCart } from '@/contexts/CartContext';
import { checkAvailability, getProductById } from '@/services/productService';
import { DEFAULT_TOKYO_COORDINATES } from '@/services/weatherService';
import { effectivePrice, formatTourDate, formatTourTime, getAvailabilityForDate } from '@/utils/bookingUtils';
import { isBookingAllowed } from '@/utils/dateTime';
import { getErrorMessage } from '@/utils/errors';
import { DEFAULT_BOOKING_TIME, IMAGE_BASE_PATH } from '@/constants';
import type { AvailabilityResult } from '@/types/availability';
import type { Product } from '@/types/product';

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  const [date, setDate] = useState<Dayjs | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ date: string; time: string; quantity: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    getProductById(productId)
      .then((p) => {
        setProduct(p);
        if (p) setMainImage(p.image1);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (product) setQuantity((q) => Math.min(q, product.seatCapacity));
  }, [product]);

  useEffect(() => {
    if (!product) return;
    if (!date) {
      setAvailability(getAvailabilityForDate(product.stock, '', false));
      return;
    }
    const dateStr = date.format('YYYY-MM-DD');
    let cancelled = false;
    checkAvailability(product.id, dateStr).then((result) => {
      if (!cancelled) setAvailability(result);
    });
    return () => {
      cancelled = true;
    };
  }, [date, product]);

  if (loading) return <PageSpinner />;
  if (!product) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="Tour not found." actionText="Back to Tours" actionTo="/tours" />
      </div>
    );
  }

  const gallery = [product.image1, product.image2, product.image3].filter(Boolean);
  const tourPrice = effectivePrice(product.price, product.discount);

  // Frontend-only enforcement of the JST 5PM cutoff — the future Node backend MUST
  // re-validate an isBookingAllowed()-equivalent check server-side before persisting
  // a booking; never trust a client-supplied date.
  async function handleReserve() {
    if (!date) {
      message.warning('Please select a tour date.');
      return;
    }
    const dateStr = date.format('YYYY-MM-DD');
    setSubmitting(true);
    try {
      await addItem({
        productId: product!.id,
        productName: product!.name,
        price: tourPrice,
        productImage: product!.image1,
        date: dateStr,
        time: DEFAULT_BOOKING_TIME,
        quantity,
      });
      setConfirmation({ date: dateStr, time: DEFAULT_BOOKING_TIME, quantity });
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to reserve this tour.'));
      checkAvailability(product!.id, dateStr).then(setAvailability);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px' }}>
      <Row gutter={[40, 32]}>
        <Col xs={24} md={12} style={{ textAlign: 'center' }}>
          <Image
            src={`${IMAGE_BASE_PATH}${mainImage}`}
            alt={product.name}
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
          <Typography.Text type="secondary" style={{ textTransform: 'uppercase' }}>
            Tour Type: {product.category}
          </Typography.Text>
          <Typography.Title level={2} style={{ marginTop: 4 }}>
            {product.name}
          </Typography.Title>
          <PriceDisplay price={product.price} discount={product.discount} />
          <CurrencyConverter amountJPY={tourPrice} />
          <Typography.Paragraph style={{ marginTop: 16 }}>{product.description}</Typography.Paragraph>
          <TourItineraryMap />

          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong>Availability Status: </Typography.Text>
            {availability && <AvailabilityBadge status={availability.status} />}
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              {availability?.message}
            </Typography.Paragraph>
          </div>

          <Typography.Title level={5}>Select Tour Details</Typography.Title>
          <Space orientation="vertical" size="middle" style={{ width: '100%', maxWidth: 360 }}>
            <div>
              <Typography.Text>Tour Date</Typography.Text>
              <DatePicker
                style={{ width: '100%' }}
                value={date}
                onChange={setDate}
                disabledDate={(current) =>
                  Boolean(current && current < dayjs().startOf('day')) ||
                  !isBookingAllowed(current?.format('YYYY-MM-DD') ?? '')
                }
              />
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Same-day bookings close after 5:00 PM Japan Standard Time.
                </Typography.Text>
              </div>
            </div>

            <div>
              <Typography.Text>Seats</Typography.Text>
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={product.seatCapacity}
                value={quantity}
                onChange={(v) => setQuantity(v ?? 1)}
              />
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  This tour seats up to {product.seatCapacity}. The tour price does not change with seat count.
                </Typography.Text>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              disabled={!availability?.bookable}
              loading={submitting}
              onClick={handleReserve}
            >
              Reserve Now
            </Button>
          </Space>

          {date && (
            <TourWeatherForecast
              latitude={product.latitude ?? DEFAULT_TOKYO_COORDINATES.latitude}
              longitude={product.longitude ?? DEFAULT_TOKYO_COORDINATES.longitude}
              locationLabel={product.latitude ? product.name : 'Tokyo'}
              date={date.format('YYYY-MM-DD')}
            />
          )}

          <div style={{ marginTop: 16 }}>
            <Link to="/tours">
              <Button>Back to Tours</Button>
            </Link>
          </div>
        </Col>
      </Row>

      <Modal
        open={confirmation !== null}
        onCancel={() => setConfirmation(null)}
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <ProductImage
            fileName={product.image1}
            alt={product.name}
            style={{ width: 200, height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
          />
          <Typography.Title level={5}>{product.name} added for review</Typography.Title>
          {confirmation && (
            <Typography.Paragraph type="secondary">
              Tour Date: {formatTourDate(confirmation.date)}
              <br />
              Tour Time: {formatTourTime(confirmation.time)}
              <br />
              Seats: {confirmation.quantity}
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
