import { memo, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Typography } from 'antd';
import { ArrowRightOutlined, HeartFilled, HeartOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import type { Tour } from '@/types/tour';
import { tourAvailabilityStatus } from '@/utils/bookingUtils';
import { formatCurrency } from '@/utils/formatters';
import { ProductImage } from './ProductImage';
import { AvailabilityBadge } from './AvailabilityBadge';

/** Memoized: rendered many-up in tour grids (Home, Tours) where an unrelated state change on the
 *  page (e.g. a filter, a weather widget) would otherwise re-render every card. */
export const TourCard = memo(function TourCard({ tour }: { tour: Tour }) {
  const status = tourAvailabilityStatus(tour);
  const image = tour.images[0]?.imageUrl ?? '';
  const { isAuthenticated, login } = useAuth();
  const { wishlistedTourIds, isPending, toggle } = useWishlist();
  const saved = wishlistedTourIds.has(tour.id);

  function handleWishlistClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      login();
      return;
    }
    void toggle(tour.id);
  }

  return (
    <Card
      hoverable
      className="jdm-tour-card"
      style={{ height: '100%' }}
      styles={{ body: { padding: 16 } }}
      cover={
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
            <AvailabilityBadge status={status} />
          </span>
          <Button
            shape="circle"
            aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
            icon={saved ? <HeartFilled style={{ color: '#E03D36' }} /> : <HeartOutlined />}
            loading={isPending(tour.id)}
            onClick={handleWishlistClick}
            style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}
          />
          <ProductImage
            fileName={image}
            alt={tour.name}
            className="jdm-tour-card-image"
            style={{ height: 200, width: '100%', objectFit: 'cover' }}
          />
        </div>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <Typography.Title level={5} style={{ margin: 0, marginBottom: 8 }} ellipsis={{ tooltip: tour.name }}>
            {tour.name}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
            Tour Price
          </Typography.Text>
          <Typography.Text strong>{formatCurrency(tour.price)}</Typography.Text>
        </div>
        <Link to={`/tours/${tour.id}`} aria-label={`View details for ${tour.name}`}>
          <Button shape="circle" icon={<ArrowRightOutlined />} />
        </Link>
      </div>
    </Card>
  );
});
