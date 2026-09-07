import { Checkbox, DatePicker, Form, InputNumber, Space, TimePicker, Typography } from 'antd';
import type { FormInstance } from 'antd';
import { effectivePrice } from '@/utils/bookingUtils';
import { formatCurrency } from '@/utils/formatters';
import type { TourFormValues } from './types';

interface LimitedOfferFormSectionProps {
  form: FormInstance<TourFormValues>;
}

/**
 * Admin-only Limited-Time Offer controls, shared by Create/Edit Tour -- staff-only (rendered
 * behind the same `isStaff` gate as Status/Tour Guide in both callers). Date and time are kept as
 * separate pickers (matching the feature spec's admin UI) rather than one combined field; the
 * caller's submit handler combines them into a single JST instant (see bookingUtils'
 * jstDateTimeToIso) -- this component only collects the four raw field values.
 */
export function LimitedOfferFormSection({ form }: LimitedOfferFormSectionProps) {
  const enabled = Form.useWatch('limitedOfferEnabled', form);
  const discount = Form.useWatch('limitedOfferDiscount', form);
  const price = Form.useWatch('price', form);

  return (
    <Form.Item label="Limited-Time Offer" style={{ marginBottom: 0 }}>
      <div style={{ border: '1px solid #303849', borderRadius: 8, padding: 16 }}>
        <Form.Item name="limitedOfferEnabled" valuePropName="checked" noStyle>
          <Checkbox>Enable Limited-Time Offer</Checkbox>
        </Form.Item>

        {enabled && (
          <div style={{ marginTop: 16 }}>
            <Form.Item
              label="Discount"
              name="limitedOfferDiscount"
              rules={[
                { required: true, message: 'Discount is required when the offer is enabled.' },
                { type: 'number', min: 0.01, max: 100, message: 'Discount must be greater than 0% and no more than 100%.' },
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={0.01} max={100} step={1} placeholder="e.g. 25" addonAfter="%" />
            </Form.Item>
            <Space size="middle" wrap>
              <Form.Item label="Start Date" name="limitedOfferStartDate" rules={[{ required: true, message: 'Start date is required.' }]}>
                <DatePicker />
              </Form.Item>
              <Form.Item label="Start Time" name="limitedOfferStartTime" rules={[{ required: true, message: 'Start time is required.' }]}>
                <TimePicker format="HH:mm" />
              </Form.Item>
              <Form.Item label="End Date" name="limitedOfferEndDate" rules={[{ required: true, message: 'End date is required.' }]}>
                <DatePicker />
              </Form.Item>
              <Form.Item label="End Time" name="limitedOfferEndTime" rules={[{ required: true, message: 'End time is required.' }]}>
                <TimePicker format="HH:mm" />
              </Form.Item>
            </Space>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
              All times are Japan Standard Time (JST).
            </Typography.Text>
            {typeof price === 'number' && price > 0 && typeof discount === 'number' && discount > 0 && discount <= 100 && (
              <div style={{ background: '#161B26', borderRadius: 6, padding: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  Original Price
                </Typography.Text>
                <Typography.Text delete>{formatCurrency(price)}</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                  Offer Price
                </Typography.Text>
                <Typography.Text strong type="danger">
                  {formatCurrency(effectivePrice(price, discount))}
                </Typography.Text>
              </div>
            )}
          </div>
        )}
      </div>
    </Form.Item>
  );
}
