import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button, DatePicker, InputNumber, Modal, Popconfirm, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined } from '@ant-design/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { PageSpinner } from '@/components/common/PageSpinner';
import { ProductImage } from '@/components/common/ProductImage';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/utils/formatters';
import { formatTourDate, formatTourTime } from '@/utils/bookingUtils';
import { getErrorMessage } from '@/utils/errors';
import type { CartItem } from '@/types/cart';

export default function Cart() {
  const { items, total, loading, updateItem, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reviewOpen, setReviewOpen] = useState(false);

  async function handleFieldChange(item: CartItem, patch: Partial<Pick<CartItem, 'date' | 'time' | 'quantity'>>) {
    try {
      await updateItem({
        index: item.index,
        date: patch.date ?? item.date,
        time: patch.time ?? item.time,
        quantity: patch.quantity ?? item.quantity,
      });
    } catch (error) {
      message.error(getErrorMessage(error, 'Error updating reservation.'));
    }
  }

  async function handleRemove(item: CartItem) {
    try {
      await removeItem(item.index);
      message.success('Reservation removed.');
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to remove this reservation.'));
    }
  }

  function handleCheckoutClick() {
    setReviewOpen(true);
  }

  function handleConfirmCheckout() {
    setReviewOpen(false);
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login?redirect=%2Fcheckout');
    }
  }

  const columns: ColumnsType<CartItem> = [
    {
      title: 'Image',
      dataIndex: 'image',
      render: (image: string, item) => (
        <ProductImage fileName={image} alt={item.name} style={{ width: 90, borderRadius: 6, objectFit: 'cover' }} />
      ),
    },
    {
      title: 'Tour Name',
      dataIndex: 'name',
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: 'Tour Date',
      dataIndex: 'date',
      render: (date: string, item) => (
        <div>
          <DatePicker
            value={dayjs(date, 'YYYY-MM-DD')}
            onChange={(value) => value && handleFieldChange(item, { date: value.format('YYYY-MM-DD') })}
          />
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Same-day booking closes after 5:00 PM JST.
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Tour Time',
      dataIndex: 'time',
      render: (time: string) => <Typography.Text>{formatTourTime(time)}</Typography.Text>,
    },
    {
      title: 'Seats',
      dataIndex: 'quantity',
      render: (quantity: number, item) => (
        <InputNumber
          min={1}
          max={item.seatCapacity}
          value={quantity}
          onChange={(value) => value && handleFieldChange(item, { quantity: value })}
        />
      ),
    },
    {
      title: 'Tour Price',
      dataIndex: 'basePrice',
      render: (_: number, item) => <PriceDisplay price={item.basePrice} discount={item.discount} align="center" />,
    },
    {
      title: 'Total Price',
      dataIndex: 'subtotal',
      render: (subtotal: number) => <Typography.Text strong>{formatCurrency(subtotal)}</Typography.Text>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, item) => (
        <Popconfirm title="Remove this tour from your reservations?" onConfirm={() => handleRemove(item)}>
          <Button danger size="small" icon={<DeleteOutlined />}>
            Remove
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (loading) return <PageSpinner />;

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px' }}>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        Your Reservations
      </Typography.Title>

      {items.length === 0 ? (
        <EmptyState title="Your reservation list is empty" actionText="Browse Tours" actionTo="/tours" />
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={items}
            rowKey="index"
            pagination={false}
            scroll={{ x: true }}
          />

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Typography.Title level={4}>Total: {formatCurrency(total)}</Typography.Title>
            <Space>
              <Button onClick={() => navigate('/tours')}>Continue Browsing</Button>
              <Button type="primary" onClick={handleCheckoutClick}>
                Proceed to Checkout
              </Button>
            </Space>
          </div>
        </>
      )}

      <Modal
        title="Review Your Reservation"
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        onOk={handleConfirmCheckout}
        okText={isAuthenticated ? 'Yes, Proceed' : 'Login to Proceed'}
        cancelText="Cancel"
        width={640}
      >
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          {items.map((item) => (
            <div
              key={item.index}
              style={{ display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}
            >
              <ProductImage fileName={item.image} alt={item.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
              <div style={{ flex: 1 }}>
                <Typography.Text strong>{item.name}</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Tour Date: {formatTourDate(item.date)} · Tour Time: {formatTourTime(item.time)}
                </Typography.Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>Seats: {item.quantity}</div>
                <Typography.Text strong>{formatCurrency(item.subtotal)}</Typography.Text>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography.Text strong>Grand Total</Typography.Text>
            <Typography.Text strong>{formatCurrency(total)}</Typography.Text>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
