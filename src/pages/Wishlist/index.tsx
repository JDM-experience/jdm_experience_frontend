import { Col, Row, Typography } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { TourCard } from '@/components/common/TourCard';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';

/** Saved tours, reusing the same TourCard used on Home/Tours -- its heart button already shows
 *  "Saved" (filled) and lets the customer remove a tour right from this grid. */
export default function Wishlist() {
  const { isInitializing } = useAuth();
  const { items } = useWishlist();

  if (isInitializing) return <PageSpinner />;

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px' }}>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        My Wishlist
      </Typography.Title>

      {items.length === 0 ? (
        <EmptyState
          title="No tours in your wishlist yet."
          description="Save tours you are interested in and come back to them later."
          actionText="Explore Tours"
          actionTo="/tours"
        />
      ) : (
        <Row gutter={[24, 24]}>
          {items.map((item, i) => (
            <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
              <div className="jdm-stagger-in" style={{ animationDelay: `${(i % 8) * 60}ms`, height: '100%' }}>
                <TourCard tour={item.tour} />
              </div>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
