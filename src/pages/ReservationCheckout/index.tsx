import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Checkbox, Col, Image, Row, Space, Typography, Upload, message } from 'antd';
import { EditOutlined, UploadOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductImage } from '@/components/common/ProductImage';
import { useAuth } from '@/contexts/AuthContext';
import { getTourById } from '@/services/tourService';
import { createBooking } from '@/services/bookingService';
import { getPaymentMethodById } from '@/services/paymentMethodService';
import { ALLOWED_IMAGE_TYPES, uploadPaymentProofImage } from '@/services/uploadService';
import { formatCurrency } from '@/utils/formatters';
import { formatTourDate } from '@/utils/bookingUtils';
import { getErrorMessage } from '@/utils/errors';
import type { PaymentMethod } from '@/types/paymentMethod';
import type { Tour } from '@/types/tour';

/** Carried from TourDetail via router state -- the reservation isn't created yet, this is a
 *  draft the customer reviews here before it becomes a real booking. Not persisted anywhere
 *  else: a refresh/direct link with no state falls back to "Return to Reservation" below,
 *  rather than submitting anything incomplete. */
export interface ReservationDraft {
  tourId: number;
  bookingDate: string;
  participants: number;
  specialRequests?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethodId: number;
}

const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

export default function ReservationCheckout() {
  const { tourId: tourIdParam } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useAuth();

  const draft = (location.state as { draft?: ReservationDraft } | null)?.draft;

  const [tour, setTour] = useState<Tour | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!draft) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getTourById(draft.tourId), getPaymentMethodById(draft.paymentMethodId)])
      .then(([t, method]) => {
        setTour(t);
        setPaymentMethod(method);
      })
      .catch((error) => setLoadError(getErrorMessage(error, 'Unable to load your reservation details.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.tourId, draft?.paymentMethodId]);

  async function handleUploadProof(file: File) {
    setUploadingProof(true);
    try {
      const url = await uploadPaymentProofImage(file);
      setProofUrl(url);
      setProofFile(file);
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to upload payment proof.'));
    } finally {
      setUploadingProof(false);
    }
    return Upload.LIST_IGNORE;
  }

  const canConfirm = !!draft && !!tour && !!paymentMethod?.isActive && !!proofUrl && !!proofFile && confirmed && !uploadingProof;

  async function handleConfirmReservation() {
    if (!draft || !proofUrl || !proofFile) return;
    setSubmitting(true);
    try {
      const booking = await createBooking({
        tourId: draft.tourId,
        bookingDate: draft.bookingDate,
        participants: draft.participants,
        specialRequests: draft.specialRequests,
        customerName: draft.customerName,
        customerEmail: draft.customerEmail,
        customerPhone: draft.customerPhone,
        paymentMethodId: draft.paymentMethodId,
        paymentProof: { fileUrl: proofUrl, fileName: proofFile.name, fileType: proofFile.type },
      });
      message.success(
        `Reservation JDM-${booking.id} submitted. Our team will verify your payment and update your reservation status.`,
        6,
      );
      navigate('/my-bookings');
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to submit this reservation.'));
      // The selected payment method may have just been disabled, or the date taken -- refresh
      // what we're showing so the customer isn't confirming stale information.
      if (draft) {
        getPaymentMethodById(draft.paymentMethodId).then(setPaymentMethod).catch(() => setPaymentMethod(null));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (isInitializing || loading) return <PageSpinner />;

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="Log in to continue your reservation." actionText="Browse Tours" actionTo="/tours" />
      </div>
    );
  }

  if (!draft || String(draft.tourId) !== tourIdParam) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState
          title="No reservation to review."
          description="Start a reservation from a tour page first."
          actionText="Return to Reservation"
          actionTo={tourIdParam ? `/tours/${tourIdParam}` : '/tours'}
        />
      </div>
    );
  }

  if (loadError || !tour) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title={loadError ?? 'Tour not found.'} actionText="Return to Reservation" actionTo={`/tours/${draft.tourId}`} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        Review &amp; Confirm Reservation
      </Typography.Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Reservation Summary" style={{ height: '100%' }}>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <ProductImage
                fileName={tour.images[0]?.imageUrl ?? ''}
                alt={tour.name}
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }}
              />
              <div>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  {tour.name}
                </Typography.Text>
                {tour.description && (
                  <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                    {tour.description}
                  </Typography.Paragraph>
                )}
              </div>
              <div>
                <Typography.Text type="secondary">Reservation Date</Typography.Text>
                <br />
                <Typography.Text>{formatTourDate(draft.bookingDate)}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Number of Seats</Typography.Text>
                <br />
                <Typography.Text>
                  {draft.participants} (tour capacity: {tour.seats})
                </Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Total</Typography.Text>
                <br />
                <Typography.Text strong>{formatCurrency(tour.price * draft.participants)}</Typography.Text>
              </div>
              {draft.specialRequests && (
                <div>
                  <Typography.Text type="secondary">Special Requests</Typography.Text>
                  <br />
                  <Typography.Text>{draft.specialRequests}</Typography.Text>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Customer Information" style={{ marginBottom: 24 }}>
            <Space orientation="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Typography.Text type="secondary">Full Name</Typography.Text>
                <br />
                <Typography.Text>{draft.customerName}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Email</Typography.Text>
                <br />
                <Typography.Text>{draft.customerEmail}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Phone Number</Typography.Text>
                <br />
                <Typography.Text>{draft.customerPhone}</Typography.Text>
              </div>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/tours/${draft.tourId}`, { state: { draft } })}
                style={{ marginTop: 8 }}
              >
                Edit Reservation Details
              </Button>
            </Space>
          </Card>

          <Card title="Payment Method">
            {!paymentMethod ? (
              <Alert type="warning" showIcon message="This payment method could not be loaded." />
            ) : !paymentMethod.isActive ? (
              <Alert
                type="error"
                showIcon
                message="This payment method is no longer available."
                description="Please go back and select another payment method."
                action={
                  <Button size="small" onClick={() => navigate(`/tours/${draft.tourId}`, { state: { draft } })}>
                    Choose Another
                  </Button>
                }
              />
            ) : (
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  {paymentMethod.name}
                </Typography.Text>
                {paymentMethod.description && <Typography.Paragraph>{paymentMethod.description}</Typography.Paragraph>}
                {paymentMethod.imageUrl && (
                  <Image src={paymentMethod.imageUrl} alt={paymentMethod.name} style={{ maxWidth: 220 }} />
                )}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Payment Proof" style={{ marginTop: 24 }}>
        <Typography.Paragraph type="secondary">
          Upload your payment receipt/screenshot after completing the payment above.
        </Typography.Paragraph>
        <Space orientation="vertical" size="middle">
          {proofUrl && (
            <Image src={proofUrl} alt="Payment proof" width={160} style={{ display: 'block', borderRadius: 4 }} />
          )}
          <Upload accept={IMAGE_ACCEPT} showUploadList={false} beforeUpload={handleUploadProof}>
            <Button icon={<UploadOutlined />} loading={uploadingProof}>
              {proofUrl ? 'Remove & Re-upload' : 'Upload Payment Proof'}
            </Button>
          </Upload>
        </Space>
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ marginBottom: 16 }}>
          I have reviewed my reservation details and payment information and confirm that they are correct.
        </Checkbox>
        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
          Your reservation will be reviewed by our team after your payment proof is submitted. It will not be
          confirmed automatically.
        </Typography.Paragraph>
        <Button
          type="primary"
          size="large"
          block
          disabled={!canConfirm}
          loading={submitting}
          onClick={handleConfirmReservation}
        >
          Confirm Reservation
        </Button>
      </Card>
    </div>
  );
}
