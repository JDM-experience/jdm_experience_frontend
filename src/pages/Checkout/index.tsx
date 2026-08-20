import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { ProductImage } from '@/components/common/ProductImage';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { createOrder } from '@/services/orderService';
import { formatCurrency } from '@/utils/formatters';
import { formatTourDate, formatTourTime } from '@/utils/bookingUtils';
import { getErrorMessage } from '@/utils/errors';
import { PROMO_CODE, PROMO_DISCOUNT_RATE } from '@/constants';
import type { PaymentMethod } from '@/types/order';

interface CheckoutFormValues {
  name: string;
  email: string;
  address: string;
  payment: PaymentMethod;
  promoCode?: string;
  cardName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

export default function Checkout() {
  const [form] = Form.useForm<CheckoutFormValues>();
  const { user } = useAuth();
  const { items, total, loading, refresh } = useCart();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
  const [proofFile, setProofFile] = useState<UploadFile | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewTotal, setPreviewTotal] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const orderPlacedRef = useRef(false);

  useEffect(() => {
    if (!loading && items.length === 0 && !orderPlacedRef.current) {
      navigate('/cart', { replace: true });
    }
  }, [loading, items.length, navigate]);

  function handleApplyPromo() {
    const code = (form.getFieldValue('promoCode') as string | undefined)?.trim().toUpperCase() ?? '';
    if (!code) {
      setPromoMessage({ type: 'error', text: 'Please enter a promo code.' });
      setPreviewTotal(null);
      return;
    }
    if (code === PROMO_CODE) {
      setPreviewTotal(total * (1 - PROMO_DISCOUNT_RATE));
      setPromoMessage({ type: 'success', text: 'Promo applied! 10% discount has been applied.' });
    } else {
      setPromoMessage({ type: 'error', text: 'Invalid promo code.' });
      setPreviewTotal(null);
    }
  }

  function formatCardNumber(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim()
      .slice(0, 19);
  }

  async function handleFinish(values: CheckoutFormValues) {
    if (values.payment === 'GCash' && !proofFile) {
      message.error('Please upload your GCash payment proof before confirming the reservation.');
      return;
    }
    if (values.payment === 'Credit/Debit Card' && (!values.cardName || !values.cardNumber || !values.cardExpiry || !values.cardCvv)) {
      message.error('Please add your card details before confirming the reservation.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder(user?.id ?? null, {
        customerName: values.name,
        email: values.email,
        address: values.address,
        paymentMethod: values.payment,
        promoCode: values.promoCode,
        paymentProofFileName: proofFile?.name ?? null,
        cardName: values.cardName,
        cardNumber: values.cardNumber,
        cardExpiry: values.cardExpiry,
        cardCvv: values.cardCvv,
      });
      orderPlacedRef.current = true;
      await refresh();
      navigate(`/thank-you/${order.id}`);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to complete this reservation.'));
      if (getErrorMessage(error).toLowerCase().includes('unavailable')) {
        navigate('/cart');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || items.length === 0) return <PageSpinner />;

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px' }}>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        Reservation Checkout
      </Typography.Title>

      <Form<CheckoutFormValues>
        form={form}
        layout="vertical"
        initialValues={{ name: user?.fullName ?? undefined, email: user?.email }}
        onFinish={handleFinish}
      >
        <Row gutter={40}>
          <Col xs={24} md={12}>
            <Typography.Title level={4}>Customer Details</Typography.Title>

            <Form.Item label="Full Name" name="name" rules={[{ required: true, message: 'Full name is required.' }]}>
              <Input />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Email is required.' },
                { type: 'email', message: 'Enter a valid email address.' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Pickup / Contact Address"
              name="address"
              rules={[{ required: true, message: 'Pickup or contact address is required.' }]}
            >
              <Input.TextArea rows={3} placeholder="Enter pickup or contact address" />
            </Form.Item>

            <Form.Item label="Payment Method" name="payment" rules={[{ required: true, message: 'Select a payment method.' }]}>
              <Select
                placeholder="Select Payment"
                onChange={(value: PaymentMethod) => setPaymentMethod(value)}
                options={[
                  { value: 'Cash on Delivery', label: 'Cash on Arrival' },
                  { value: 'GCash', label: 'GCash' },
                  { value: 'Credit/Debit Card', label: 'Credit/Debit Card' },
                ]}
              />
            </Form.Item>

            {paymentMethod === 'GCash' && (
              <div style={{ marginBottom: 24 }}>
                <Typography.Title level={5}>Pay via GCash</Typography.Title>
                <ProductImage fileName="gcashqr.jpg" alt="GCash QR" style={{ maxWidth: 200, marginBottom: 12 }} />
                <Form.Item label="Upload Proof of Payment">
                  <Upload
                    accept="image/*"
                    maxCount={1}
                    fileList={proofFile ? [proofFile] : []}
                    beforeUpload={(file) => {
                      setProofFile(file as unknown as UploadFile);
                      return false;
                    }}
                    onRemove={() => setProofFile(null)}
                  >
                    <Button icon={<UploadOutlined />}>Select File</Button>
                  </Upload>
                </Form.Item>
              </div>
            )}

            {paymentMethod === 'Credit/Debit Card' && (
              <div style={{ marginBottom: 24 }}>
                <Typography.Title level={5}>Credit / Debit Card Details</Typography.Title>
                <Form.Item label="Cardholder Name" name="cardName">
                  <Input />
                </Form.Item>
                <Form.Item label="Card Number" name="cardNumber" getValueFromEvent={(e) => formatCardNumber(e.target.value)}>
                  <Input maxLength={19} placeholder="XXXX XXXX XXXX XXXX" />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Expiry Date" name="cardExpiry">
                      <Input placeholder="MM/YY" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="CVV" name="cardCvv">
                      <Input maxLength={4} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}
          </Col>

          <Col xs={24} md={12}>
            <Typography.Title level={4}>Reservation Summary</Typography.Title>

            <Space orientation="vertical" style={{ width: '100%' }} size="small">
              {items.map((item) => (
                <div key={item.index} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
                  <span>
                    <Typography.Text>{item.name}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Tour Date: {formatTourDate(item.date)}
                      <br />
                      Tour Time: {formatTourTime(item.time)}
                      <br />
                      Quantity: {item.quantity}
                    </Typography.Text>
                  </span>
                  <Typography.Text strong>{formatCurrency(item.subtotal)}</Typography.Text>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Text strong>Total:</Typography.Text>
                <Typography.Text strong>{formatCurrency(previewTotal ?? total)}</Typography.Text>
              </div>
            </Space>

            <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 8, padding: 12, margin: '16px 0' }}>
              <Typography.Text strong>Promo Code</Typography.Text>
              <Space.Compact style={{ width: '100%', marginTop: 8 }}>
                <Form.Item name="promoCode" noStyle>
                  <Input placeholder="Enter code" />
                </Form.Item>
                <Button onClick={handleApplyPromo}>Apply</Button>
              </Space.Compact>
              {promoMessage && (
                <Alert
                  type={promoMessage.type}
                  message={promoMessage.text}
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </div>

            <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
              Confirm Reservation
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
