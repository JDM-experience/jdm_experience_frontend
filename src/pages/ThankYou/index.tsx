import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleFilled } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { OrderStatusTag } from '@/components/common/OrderStatusTag';
import { useAuth } from '@/contexts/AuthContext';
import { getOrderById } from '@/services/orderService';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { formatTourDate, formatTourTime } from '@/utils/bookingUtils';
import type { Order, OrderItem } from '@/types/order';

// Static — doesn't depend on component state/props, so it's defined once at module scope
// instead of being rebuilt on every render.
const columns: ColumnsType<OrderItem> = [
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

export default function ThankYou() {
  const { orderId } = useParams<{ orderId: string }>();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // orderId can change without unmounting -- guard against a slower, stale fetch overwriting
    // the newer order's data.
    let cancelled = false;
    getOrderById(Number(orderId))
      .then((result) => {
        if (!cancelled) setOrder(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) return <PageSpinner />;
  if (!order) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="Reservation not found." actionText="Back to Tours" actionTo="/tours" />
      </div>
    );
  }

  const computedTotal = order.items.reduce((sum, item) => sum + item.price, 0);
  const savings = computedTotal - order.totalAmount;

  return (
    <div style={{ maxWidth: 800, margin: '80px auto', padding: '0 24px 48px' }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 5px 15px rgba(0,0,0,0.1)', padding: 40, textAlign: 'center' }}>
        <CheckCircleFilled style={{ fontSize: 70, color: '#52c41a' }} />
        <Typography.Title level={2}>Thank You for Your Reservation!</Typography.Title>
        <Typography.Paragraph>Your tour reservation has been placed successfully.</Typography.Paragraph>

        <div style={{ textAlign: 'left', marginTop: 24 }}>
          <p>
            <strong>Reservation ID:</strong> #{order.id}
          </p>
          <p>
            <strong>Date:</strong> {formatDateTime(order.orderDate)}
          </p>
          <p>
            <strong>Payment Method:</strong> {order.paymentMethod}
          </p>
          <p>
            <strong>Status:</strong> <OrderStatusTag status={order.status} />
          </p>
        </div>

        <Typography.Title level={5} style={{ textAlign: 'left', marginTop: 32 }}>
          Reservation Summary
        </Typography.Title>
        <Table
          columns={columns}
          dataSource={order.items}
          rowKey={(item) => `${item.productId}-${item.date}-${item.time}`}
          pagination={false}
          size="small"
          summary={() => (
            <>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5} align="right">
                  <strong>Total:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{formatCurrency(order.totalAmount)}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              {savings > 0 && (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={6} align="right">
                    <Typography.Text type="success" strong>
                      You saved {formatCurrency(savings)} with a promo code.
                    </Typography.Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            </>
          )}
        />

        <div style={{ textAlign: 'left', marginTop: 24 }}>
          <Typography.Title level={5}>Customer Details:</Typography.Title>
          <p style={{ margin: 0 }}>{order.customerName}</p>
          <p style={{ margin: 0 }}>{order.address}</p>
          <p>{order.email}</p>
        </div>

        <Space style={{ marginTop: 24 }}>
          <Link to="/tours">
            <Button type="primary">Browse More Tours</Button>
          </Link>
          {isAuthenticated && (
            <Link to="/my-orders">
              <Button>View My Reservations</Button>
            </Link>
          )}
        </Space>
      </div>
    </div>
  );
}
