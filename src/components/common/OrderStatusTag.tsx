import { Tag } from 'antd';
import type { OrderStatus } from '@/types/order';

const COLOR_BY_STATUS: Record<OrderStatus, string> = {
  Pending: 'gold',
  Shipped: 'blue',
  Delivered: 'green',
  Cancelled: 'red',
};

export function OrderStatusTag({ status }: { status: OrderStatus }) {
  return (
    <Tag color={COLOR_BY_STATUS[status]} style={{ fontWeight: 600 }}>
      {status}
    </Tag>
  );
}
