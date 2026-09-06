import { useState } from 'react';
import { Button, Form, Input, Modal, Rate, Space, Typography, message } from 'antd';
import { createReview } from '@/services/reviewService';
import { formatDateTime } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { Review } from '@/types/review';

interface BookingReviewControlProps {
  tourId: number;
  tourName: string;
  /** The caller's own existing review for this tour, if any -- null means not reviewed yet. */
  review: Review | null;
  /** Called after a successful submit so the parent can refresh its review-by-tour map. */
  onSubmitted: () => void;
  size?: 'small' | 'middle';
}

interface ReviewFormValues {
  rating: number;
  comment: string;
}

/**
 * The action shown on a COMPLETED booking to leave/view its review -- shared between My
 * Reservations and a tour's own "Your Reservation(s)" card so both surfaces behave identically.
 * Eligibility itself (the booking must be COMPLETED) is decided by the caller, who only renders
 * this at all for COMPLETED bookings; the backend re-verifies independently on every submit.
 */
export function BookingReviewControl({ tourId, tourName, review, onSubmitted, size = 'small' }: BookingReviewControlProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<ReviewFormValues>();

  function openForm() {
    form.setFieldsValue({ rating: 5, comment: '' });
    setModalOpen(true);
  }

  async function handleSubmit(values: ReviewFormValues) {
    setSaving(true);
    try {
      await createReview(tourId, values);
      message.success('Review submitted. Thank you!');
      setModalOpen(false);
      onSubmitted();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to submit your review. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  if (review) {
    return (
      <>
        <Button size={size} onClick={() => setModalOpen(true)}>
          View Review
        </Button>
        <Modal title={`Your Review — ${tourName}`} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
          <Rate disabled value={review.rating} />
          <Typography.Paragraph style={{ marginTop: 12 }}>{review.comment}</Typography.Paragraph>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Submitted {formatDateTime(review.createdAt)}
          </Typography.Text>
        </Modal>
      </>
    );
  }

  return (
    <>
      <Button size={size} type="primary" onClick={openForm}>
        Leave a Review
      </Button>
      <Modal title={`Leave a Review — ${tourName}`} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnHidden>
        <Form<ReviewFormValues> form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="How was your experience?" name="rating" rules={[{ required: true, message: 'Please select a rating.' }]}>
            <Rate />
          </Form.Item>
          <Form.Item label="Tell us about your experience" name="comment" rules={[{ required: true, message: 'Please share a few words about your experience.' }]}>
            <Input.TextArea rows={4} maxLength={2000} showCount placeholder="Tell us about your experience..." />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              Submit Review
            </Button>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </>
  );
}
