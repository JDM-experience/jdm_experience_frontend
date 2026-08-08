import { Typography } from 'antd';
import { effectivePrice } from '@/utils/bookingUtils';
import { formatCurrency } from '@/utils/formatters';

const { Text } = Typography;

interface PriceDisplayProps {
  price: number;
  discount: number;
  label?: string;
  align?: 'left' | 'center';
}

/** Ported from the repeated price-block markup in shop.php / product.php / cart.php. */
export function PriceDisplay({ price, discount, label = 'Tour Price', align = 'left' }: PriceDisplayProps) {
  const textAlign = align;

  if (discount > 0) {
    const discounted = effectivePrice(price, discount);
    return (
      <div style={{ textAlign }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {label}
        </Text>
        <br />
        <Text delete type="secondary">
          {formatCurrency(price)}
        </Text>
        <br />
        <Text strong type="danger">
          {formatCurrency(discounted)}
        </Text>
        <br />
        <Text type="success" style={{ fontSize: 12 }}>
          Sale Price ({discount}% OFF)
        </Text>
      </div>
    );
  }

  return (
    <div style={{ textAlign }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Text>
      <br />
      <Text strong>{formatCurrency(price)}</Text>
    </div>
  );
}
