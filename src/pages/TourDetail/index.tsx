import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { Button, Col, DatePicker, Image, InputNumber, Modal, Row, Space, TimePicker, Typography, message } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { AvailabilityBadge } from '@/components/common/AvailabilityBadge';
import { useCart } from '@/contexts/CartContext';
import { checkAvailability, getProductById } from '@/services/productService';
import { effectivePrice, formatTourDate, formatTourTime, getAvailabilityForDate } from '@/utils/bookingUtils';
import { getErrorMessage } from '@/utils/errors';
import { IMAGE_BASE_PATH } from '@/constants';
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
  const [time, setTime] = useState<Dayjs | null>(null);
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

  async function handleReserve() {
    if (!date || !time) {
      message.warning('Please select a tour date, tour time, and quantity.');
      return;
    }
    const dateStr = date.format('YYYY-MM-DD');
    const timeStr = time.format('HH:mm');
    setSubmitting(true);
    try {
      await addItem({
        productId: product!.id,
        productName: product!.name,
        price: tourPrice,
        productImage: product!.image1,
        date: dateStr,
        time: timeStr,
        quantity,
      });
      setConfirmation({ date: dateStr, time: timeStr, quantity });
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
          <Typography.Paragraph style={{ marginTop: 16 }}>{product.description}</Typography.Paragraph>

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
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Same-day bookings close after 5:00 PM Japan Standard Time.
                </Typography.Text>
              </div>
            </div>

            <div>
              <Typography.Text>Tour Time</Typography.Text>
              <TimePicker style={{ width: '100%' }} value={time} onChange={setTime} format="HH:mm" minuteStep={5} />
            </div>

            <div>
              <Typography.Text>Quantity</Typography.Text>
              <InputNumber style={{ width: '100%' }} min={1} value={quantity} onChange={(v) => setQuantity(v ?? 1)} />
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
