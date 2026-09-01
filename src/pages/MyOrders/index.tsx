import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { OrderStatusTag } from '@/components/common/OrderStatusTag';
import { useAuth } from '@/contexts/AuthContext';
import { getOrdersByUser } from '@/services/orderService';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { formatTourDate, formatTourTime } from '@/utils/bookingUtils';
import type { Order, OrderItem } from '@/types/order';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getOrdersByUser(user.id)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageSpinner />;

  if (orders.length === 0) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="You have no reservations yet." actionText="Browse Tours" actionTo="/tours" />
      </div>
    );
  }

  const columns: ColumnsType<OrderItem> = [
    {
      title: 'Image',
      dataIndex: 'productImage',
      render: (image: string, item) => (
        <ProductImage fileName={image} alt={item.productName} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
      ),
    },
    { title: 'Tour Name', dataIndex: 'productName' },
    { title: 'Tour Date', dataIndex: 'date', render: formatTourDate },
    { title: 'Tour Time', dataIndex: 'time', render: formatTourTime },
    { title: 'Quantity', dataIndex: 'quantity' },
    { title: 'Tour Price', dataIndex: 'price', render: (price: number) => formatCurrency(price) },
    {
      title: 'Total Price',
      key: 'subtotal',
      render: (_, item) => formatCurrency(item.price),
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        My Reservations
      </Typography.Title>

      {orders.map((order) => (
        <Card key={order.id} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Reservation #{order.id} — {formatCurrency(order.totalAmount)}
            </Typography.Title>
            <div style={{ textAlign: 'right' }}>
              <OrderStatusTag status={order.status} />
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDateTime(order.orderDate)}
                </Typography.Text>
              </div>
            </div>
          </div>

          <Typography.Paragraph type="secondary" style={{ marginBottom: 4 }}>
            <strong>Payment:</strong> {order.paymentMethod}
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary">
            <strong>Address:</strong> {order.address}
          </Typography.Paragraph>

          <Table
            columns={columns}
            dataSource={order.items}
            rowKey={(item) => `${item.productId}-${item.date}-${item.time}`}
            pagination={false}
            size="small"
            scroll={{ x: true }}
          />

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Link to={`/receipt/${order.id}`}>
              <Button type="primary" size="small">
                View Details
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
