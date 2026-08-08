import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Popconfirm, Select, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { deleteOrder, getAllOrders, updateOrderStatus } from '@/services/orderService';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { formatTourDate, formatTourTime } from '@/utils/bookingUtils';
import { getErrorMessage } from '@/utils/errors';
import type { Order, OrderItem, OrderStatus } from '@/types/order';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Shipped', label: 'Confirmed' },
  { value: 'Delivered', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const itemColumns: ColumnsType<OrderItem> = [
  {
    title: 'Image',
    dataIndex: 'productImage',
    render: (image: string, item) => (
      <ProductImage fileName={image} alt={item.productName} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6 }} />
    ),
  },
  { title: 'Tour Name', dataIndex: 'productName' },
  { title: 'Tour Date', dataIndex: 'date', render: formatTourDate },
  { title: 'Tour Time', dataIndex: 'time', render: formatTourTime },
  { title: 'Quantity', dataIndex: 'quantity' },
  { title: 'Tour Price', dataIndex: 'price', render: (price: number) => formatCurrency(price) },
  { title: 'Total Price', key: 'subtotal', render: (_, item) => formatCurrency(item.price * item.quantity) },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchOrders() {
    setLoading(true);
    getAllOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(fetchOrders, []);

  async function handleStatusChange(orderId: number, status: OrderStatus) {
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      message.success('Reservation status updated.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to update status.'));
    }
  }

  async function handleDelete(orderId: number) {
    try {
      await deleteOrder(orderId);
      message.success('Reservation deleted.');
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to delete this reservation.'));
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Reservations Management
      </Typography.Title>

      {orders.length === 0 ? (
        <EmptyState title="No orders found." />
      ) : (
        orders.map((order) => {
          const computedTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const savings = computedTotal - order.totalAmount;

          return (
            <Card key={order.id} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  Reservation #{order.id} — {formatCurrency(order.totalAmount)}
                </Typography.Title>
                <Typography.Text type="secondary">{formatDateTime(order.orderDate)}</Typography.Text>
              </div>

              <div style={{ margin: '12px 0' }}>
                <p style={{ margin: 0 }}>
                  <strong>Name:</strong> {order.customerName}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Email:</strong> {order.email}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Address:</strong> {order.address}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Payment:</strong> {order.paymentMethod}
                </p>
              </div>

              <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <Typography.Text strong>Price Breakdown</Typography.Text>
                <p style={{ margin: '4px 0' }}>Original Total: {formatCurrency(computedTotal)}</p>
                {savings > 0 ? (
                  <p style={{ margin: '4px 0', color: '#389e0d' }}>Discount (promo code): -{formatCurrency(savings)}</p>
                ) : (
                  <p style={{ margin: '4px 0', color: 'rgba(0,0,0,0.45)' }}>Discount: None</p>
                )}
                <p style={{ margin: '4px 0 0', fontWeight: 700 }}>Final Total: {formatCurrency(order.totalAmount)}</p>
              </div>

              <Table
                columns={itemColumns}
                dataSource={order.items}
                rowKey={(item) => `${item.productId}-${item.date}-${item.time}`}
                pagination={false}
                size="small"
                scroll={{ x: true }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
                <Select
                  value={order.status}
                  options={STATUS_OPTIONS}
                  style={{ width: 160 }}
                  onChange={(value: OrderStatus) => handleStatusChange(order.id, value)}
                />
                <Space>
                  <Link to={`/admin/receipt/${order.id}`}>
                    <Button icon={<FileTextOutlined />}>View Receipt</Button>
                  </Link>
                  <Popconfirm title={`Delete Reservation #${order.id}?`} onConfirm={() => handleDelete(order.id)}>
                    <Button danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
