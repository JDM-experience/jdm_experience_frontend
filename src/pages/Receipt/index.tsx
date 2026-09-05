import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PrinterOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { useAuth } from '@/contexts/AuthContext';
import { getOrderById } from '@/services/orderService';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { formatTourDate, formatTourTime } from '@/utils/bookingUtils';
import type { Order, OrderItem, OrderStatus } from '@/types/order';

const STATUS_TAG_COLOR: Record<OrderStatus, string> = {
  Pending: 'warning',
  Shipped: 'processing',
  Delivered: 'success',
  Cancelled: 'error',
};

// Static — doesn't depend on component state/props, so it's defined once at module scope
// instead of being rebuilt on every render.
const columns: ColumnsType<OrderItem> = [
  {
    title: 'Image',
    dataIndex: 'productImage',
    render: (image: string, item) => (
      <ProductImage fileName={image} alt={item.productName} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 5 }} />
    ),
  },
  { title: 'Tour Name', dataIndex: 'productName' },
  { title: 'Tour Date', dataIndex: 'date', render: formatTourDate },
  { title: 'Tour Time', dataIndex: 'time', render: formatTourTime },
  { title: 'Qty', dataIndex: 'quantity' },
  { title: 'Tour Price', dataIndex: 'price', render: (price: number) => formatCurrency(price) },
  { title: 'Total Price', key: 'subtotal', render: (_, item) => formatCurrency(item.price) },
];

export default function Receipt() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // orderId can change without unmounting (navigating from one receipt to another) -- guard
    // against a slower, stale fetch overwriting the newer receipt.
    let cancelled = false;
    getOrderById(Number(orderId))
      .then((result) => {
        if (!cancelled) setOrder(result && result.userId === user.id ? result : null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, user]);

  if (loading) return <PageSpinner />;

  if (!order) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="Reservation not found." actionText="Back to My Reservations" actionTo="/my-orders" />
      </div>
    );
  }

  return (
    <div className="receipt-container" style={{ maxWidth: 800, margin: '80px auto', padding: '40px 24px 48px' }}>
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={3}>Official Receipt</Typography.Title>
          <Typography.Text type="secondary">Japan JDM Experience</Typography.Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <div>
              <strong>Order ID:</strong> #{order.id}
            </div>
            <div>
              <strong>Date:</strong> {formatDateTime(order.orderDate)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>
              <strong>Status:</strong> <Tag color={STATUS_TAG_COLOR[order.status]}>{order.status}</Tag>
            </div>
            <div>
              <strong>Payment:</strong> {order.paymentMethod}
            </div>
          </div>
        </div>

        <hr />

        <div style={{ margin: '16px 0' }}>
          <Typography.Text strong>Customer Information</Typography.Text>
          <p style={{ margin: '4px 0' }}>{order.customerName}</p>
          <p style={{ margin: '4px 0' }}>{order.email}</p>
          <p style={{ margin: 0 }}>{order.address}</p>
        </div>

        <Table
          columns={columns}
          dataSource={order.items}
          rowKey={(item) => `${item.productId}-${item.date}-${item.time}`}
          pagination={false}
          size="small"
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={6} align="right">
                <strong>Total:</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <strong>{formatCurrency(order.totalAmount)}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />

        <div className="no-print" style={{ textAlign: 'center', marginTop: 32 }}>
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print Receipt
          </Button>
          <Link to="/my-orders" style={{ marginLeft: 12 }}>
            <Button>Back to Reservations</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
