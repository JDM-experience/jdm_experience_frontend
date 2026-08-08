import { Link } from 'react-router-dom';
import { Button, Card, Typography } from 'antd';
import type { Product } from '@/types/product';
import { manualStatusFromStock } from '@/utils/bookingUtils';
import { ProductImage } from './ProductImage';
import { PriceDisplay } from './PriceDisplay';
import { AvailabilityBadge } from './AvailabilityBadge';

export function TourCard({ product }: { product: Product }) {
  const status = manualStatusFromStock(product.stock);

  return (
    <Card
      hoverable
      style={{ height: '100%' }}
      styles={{ body: { textAlign: 'center' } }}
      cover={
        <div style={{ position: 'relative' }}>
          {product.discount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                zIndex: 2,
                background: '#c1121f',
                color: '#fff',
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 4,
              }}
            >
              SALE
            </span>
          )}
          <span style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
            <AvailabilityBadge status={status} />
          </span>
          <ProductImage
            fileName={product.image1}
            alt={product.name}
            style={{ height: 220, width: '100%', objectFit: 'cover' }}
          />
        </div>
      }
    >
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Tour Type: {product.category}
      </Typography.Text>
      <Typography.Title level={5} style={{ marginTop: 4, marginBottom: 8 }}>
        {product.name}
      </Typography.Title>
      <PriceDisplay price={product.price} discount={product.discount} align="center" />
      <Link to={`/tours/${product.id}`}>
        <Button style={{ marginTop: 12 }}>View Details</Button>
      </Link>
    </Card>
  );
}
