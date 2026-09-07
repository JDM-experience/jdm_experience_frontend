import { memo, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Tag, Typography } from 'antd';
import { ArrowRightOutlined, FireFilled, HeartFilled, HeartOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import type { Tour } from '@/types/tour';
import { effectivePrice, tourAvailabilityStatus } from '@/utils/bookingUtils';
import { formatCurrency } from '@/utils/formatters';
import { LimitedOfferTimer } from './LimitedOfferTimer';
import { ProductImage } from './ProductImage';
import { AvailabilityBadge } from './AvailabilityBadge';

/** Memoized: rendered many-up in tour grids (Home, Tours) where an unrelated state change on the
 *  page (e.g. a filter, a weather widget) would otherwise re-render every card. */
export const TourCard = memo(function TourCard({ tour, onOfferExpire }: { tour: Tour; onOfferExpire?: () => void }) {
  const status = tourAvailabilityStatus(tour);
  const coverImage = tour.images[0];
  const image = coverImage?.imageUrl ?? '';
  const focalPosition = `${coverImage?.focalX ?? 50}% ${coverImage?.focalY ?? 50}%`;
  const { isAuthenticated, login } = useAuth();
  const { wishlistedTourIds, isPending, toggle } = useWishlist();
  const saved = wishlistedTourIds.has(tour.id);
  // The backend re-verifies at booking time regardless -- this local flag only stops the UI from
  // continuing to advertise a discount whose countdown has already visibly hit zero, per the
  // Limited-Time Offer spec ("the frontend must detect expiration").
  const [offerExpired, setOfferExpired] = useState(false);
  function handleOfferExpire() {
    setOfferExpired(true);
    onOfferExpire?.();
  }
  const showOffer = tour.limitedOffer.isActive && !offerExpired && tour.limitedOffer.discount !== null;

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
          {showOffer && (
            <Tag
              icon={<FireFilled />}
              color="error"
              style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 2, fontWeight: 600 }}
            >
              {tour.limitedOffer.discount}% OFF
            </Tag>
          )}
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
            style={{ height: 200, width: '100%', objectFit: 'cover', objectPosition: focalPosition }}
          />
        </div>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <Typography.Title level={5} style={{ margin: 0, marginBottom: 8 }} ellipsis={{ tooltip: tour.name }}>
            {tour.name}
          </Typography.Title>
          {showOffer ? (
            <>
              <Typography.Text delete type="secondary" style={{ fontSize: 12, display: 'block' }}>
                {formatCurrency(tour.price)}
              </Typography.Text>
              <Typography.Text strong type="danger">
                {formatCurrency(effectivePrice(tour.price, tour.limitedOffer.discount!))}
              </Typography.Text>
              {tour.limitedOffer.endAt && (
                <div style={{ marginTop: 6 }}>
                  <LimitedOfferTimer endAt={tour.limitedOffer.endAt} onExpire={handleOfferExpire} size="small" />
                </div>
              )}
            </>
          ) : (
            <>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                Tour Price
              </Typography.Text>
              <Typography.Text strong>{formatCurrency(tour.price)}</Typography.Text>
            </>
          )}
        </div>
        <Link to={`/tours/${tour.id}`} aria-label={`View details for ${tour.name}`}>
          <Button shape="circle" icon={<ArrowRightOutlined />} />
        </Link>
      </div>
    </Card>
  );
});
