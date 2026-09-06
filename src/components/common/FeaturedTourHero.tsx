import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { ProductImage } from './ProductImage';
import { AvailabilityBadge } from './AvailabilityBadge';
import { tourAvailabilityStatus } from '@/utils/bookingUtils';
import { formatCurrency } from '@/utils/formatters';
import type { Tour } from '@/types/tour';

interface FeaturedTourHeroProps {
  tours: Tour[];
}

/**
 * The large "featured tour" banner atop the Home page's tour grid -- a full-width image with an
 * always-visible detail overlay (not hover-only: a hover-triggered reveal has no equivalent on a
 * touch device, so this adapts that part of the reference design rather than copying it exactly)
 * and prev/next arrows to cycle which tour is featured.
 */
export function FeaturedTourHero({ tours }: FeaturedTourHeroProps) {
  const [index, setIndex] = useState(0);

  if (tours.length === 0) return null;
  const tour = tours[index % tours.length];
  const status = tourAvailabilityStatus(tour);
  const image = tour.images[0]?.imageUrl ?? '';

  function goTo(delta: number) {
    setIndex((current) => (current + delta + tours.length) % tours.length);
  }

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        height: 420,
        marginBottom: 24,
        border: '1px solid #303849',
      }}
    >
      <ProductImage
        key={tour.id}
        fileName={image}
        alt={tour.name}
        className="jdm-hero-fade"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Gradient overlay covers the right half so the image itself (usually the tour's most
         scenic shot) stays fully visible on the left. */}
      <div
        key={`overlay-${tour.id}`}
        className="jdm-hero-fade"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, transparent 40%, rgba(15,17,23,0.94) 78%)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ maxWidth: 420, padding: '32px 40px 56px', textAlign: 'right' }}>
          <div style={{ marginBottom: 8 }}>
            <AvailabilityBadge status={status} />
          </div>
          <Typography.Title level={3} style={{ color: '#fff', margin: '0 0 4px' }}>
            {tour.name}
          </Typography.Title>
          <Typography.Text strong style={{ color: '#fff', fontSize: 18, display: 'block', marginBottom: 8 }}>
            {formatCurrency(tour.price)}
          </Typography.Text>
          {tour.description && (
            <Typography.Paragraph
              style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}
              ellipsis={{ rows: 2 }}
            >
              {tour.description}
            </Typography.Paragraph>
          )}
          <Link to={`/tours/${tour.id}`}>
            <Button type="primary">View Details</Button>
          </Link>
        </div>
      </div>

      {tours.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 12,
          }}
        >
          <Button
            shape="circle"
            icon={<LeftOutlined />}
            aria-label="Previous featured tour"
            onClick={() => goTo(-1)}
            style={{ background: 'rgba(15,17,23,0.6)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
          />
          <Button
            shape="circle"
            icon={<RightOutlined />}
            aria-label="Next featured tour"
            onClick={() => goTo(1)}
            style={{ background: 'rgba(15,17,23,0.6)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
          />
        </div>
      )}
    </div>
  );
}
