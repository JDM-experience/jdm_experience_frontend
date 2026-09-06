import { useEffect, useState } from 'react';
import { Avatar, Button, Empty, Form, Input, List, Modal, Popconfirm, Rate, Space, Typography, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { getMyBookings } from '@/services/bookingService';
import { createReview, deleteReview, getTourReviews, updateReview } from '@/services/reviewService';
import { formatDateTime } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { Review, TourReviews as TourReviewsData } from '@/types/review';

interface TourReviewsProps {
  tourId: number;
}

interface ReviewFormValues {
  rating: number;
  comment: string;
}

/** Eligibility ("availed the tour") mirrors the backend's own rule exactly -- a COMPLETED
 *  booking for this tour -- but this is only ever used to decide which button to show. The
 *  backend re-verifies the same thing on every create, so nothing here is a security boundary. */
export function TourReviews({ tourId }: TourReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<TourReviewsData>({ reviews: [], averageRating: null, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form] = Form.useForm<ReviewFormValues>();

  function fetchReviews() {
    setLoading(true);
    getTourReviews(tourId)
      .then(setData)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load reviews.')))
      .finally(() => setLoading(false));
  }

  useEffect(fetchReviews, [tourId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setEligible(false);
      return;
    }
    getMyBookings()
      .then((bookings) => setEligible(bookings.some((b) => b.tourId === tourId && b.status === 'COMPLETED')))
      .catch(() => setEligible(false));
  }, [isAuthenticated, tourId]);

  const myReview = isAuthenticated ? data.reviews.find((r) => r.userId === user?.id) : undefined;

  function openCreate() {
    setEditing(null);
    form.setFieldsValue({ rating: 5, comment: '' });
    setModalOpen(true);
  }

  function openEdit(review: Review) {
    setEditing(review);
    form.setFieldsValue({ rating: review.rating, comment: review.comment });
    setModalOpen(true);
  }

  async function handleSave(values: ReviewFormValues) {
    setSaving(true);
    try {
      if (editing) {
        await updateReview(editing.id, values);
        message.success('Review updated.');
      } else {
        await createReview(tourId, values);
        message.success('Review submitted. Thank you!');
      }
      setModalOpen(false);
      fetchReviews();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to save your review. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteReview(id);
      message.success('Review deleted.');
      fetchReviews();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to delete your review.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ marginTop: 40 }}>
      <Typography.Title level={3} style={{ marginBottom: 8 }}>
        Reviews
      </Typography.Title>

      <Space align="center" size={12} style={{ marginBottom: 16 }}>
        <Rate disabled allowHalf value={data.averageRating ?? 0} />
        <Typography.Text strong>{data.averageRating ?? '—'}</Typography.Text>
        <Typography.Text type="secondary">
          Based on {data.totalCount} review{data.totalCount === 1 ? '' : 's'}
        </Typography.Text>
      </Space>

      <div style={{ marginBottom: 20 }}>
        {!isAuthenticated ? null : myReview ? (
          <Space>
            <Button onClick={() => openEdit(myReview)}>Edit Review</Button>
            <Popconfirm
              title="Delete this review?"
              description="This will remove your review permanently."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(myReview.id)}
            >
              <Button danger loading={deletingId === myReview.id}>
                Delete Review
              </Button>
            </Popconfirm>
          </Space>
        ) : eligible ? (
          <Button type="primary" onClick={openCreate}>
            Write a Review
          </Button>
        ) : (
          <Typography.Text type="secondary">You can review this tour after completing your booking.</Typography.Text>
        )}
      </div>

      <List
        loading={loading}
        dataSource={data.reviews}
        locale={{ emptyText: <Empty description="No reviews yet." /> }}
        pagination={data.reviews.length > 5 ? { pageSize: 5 } : false}
        renderItem={(review) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} />}
              title={
                <Space size={8}>
                  <span>{review.userName ?? 'Customer'}</span>
                  <Rate disabled value={review.rating} style={{ fontSize: 14 }} />
                </Space>
              }
              description={
                <>
                  <Typography.Paragraph style={{ marginBottom: 4 }}>{review.comment}</Typography.Paragraph>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDateTime(review.createdAt)}
                  </Typography.Text>
                </>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title={editing ? 'Edit Review' : 'Write a Review'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<ReviewFormValues> form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="Rating" name="rating" rules={[{ required: true, message: 'Please select a rating.' }]}>
            <Rate />
          </Form.Item>
          <Form.Item label="Comment" name="comment" rules={[{ required: true, message: 'Please write a comment.' }]}>
            <Input.TextArea rows={4} maxLength={2000} showCount placeholder="Share your experience..." />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editing ? 'Save Changes' : 'Submit Review'}
            </Button>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
