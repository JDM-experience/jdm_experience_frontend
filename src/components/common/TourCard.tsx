import { Link } from 'react-router-dom';
import { Button, Card, Typography } from 'antd';
import type { Tour } from '@/types/tour';
import { tourAvailabilityStatus } from '@/utils/bookingUtils';
import { ProductImage } from './ProductImage';
import { PriceDisplay } from './PriceDisplay';
import { AvailabilityBadge } from './AvailabilityBadge';

export function TourCard({ tour }: { tour: Tour }) {
  const status = tourAvailabilityStatus(tour);
  const image = tour.images[0]?.imageUrl ?? '';

  return (
    <Card
      hoverable
      style={{ height: '100%' }}
      styles={{ body: { textAlign: 'center' } }}
      cover={
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
            <AvailabilityBadge status={status} />
          </span>
          <ProductImage fileName={image} alt={tour.name} style={{ height: 220, width: '100%', objectFit: 'cover' }} />
        </div>
      }
    >
      <Typography.Title level={5} style={{ marginTop: 4, marginBottom: 8 }}>
        {tour.name}
      </Typography.Title>
      <PriceDisplay price={tour.price} discount={0} align="center" />
      <Link to={`/tours/${tour.id}`}>
        <Button style={{ marginTop: 12 }}>View Details</Button>
      </Link>
    </Card>
  );
}
