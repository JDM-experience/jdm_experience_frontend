import { useEffect, useState } from 'react';
import { Button, Descriptions, Empty, Image, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, CloseCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { PageSpinner } from '@/components/common/PageSpinner';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  addRefundProof,
  approveCancellationRequest,
  completeRefund,
  listCancellationRequests,
  rejectCancellationRequest,
} from '@/services/cancellationRequestService';
import { getBookingById } from '@/services/bookingService';
import { ALLOWED_IMAGE_TYPES, uploadRefundProofImage } from '@/services/uploadService';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { CancellationRequest, CancellationRequestStatus } from '@/types/cancellationRequest';
import type { Booking } from '@/types/booking';

const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');

const STATUS_COLOR: Record<CancellationRequestStatus, string> = {
  PENDING: 'gold',
  APPROVED: 'blue',
  REFUND_PROCESSING: 'blue',
  REFUNDED: 'green',
  REJECTED: 'red',
};

const STATUS_FILTER_OPTIONS: { value: '' | CancellationRequestStatus; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REFUND_PROCESSING', label: 'Refund Processing' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function AdminCancellationRequests() {
  const { admin } = useAdminAuth();
  // Matches admin/Users's self-gate: the backend already 403s a Tour Guide's requests
  // regardless, but without this the page would render its full shell and only fail after a
  // confusing loading spinner + generic error toast.
  const canView = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';

  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'' | CancellationRequestStatus>('');

  // Booking details (customer/tour/amount/payment status) aren't included on the cancellation
  // request response -- fetched per-row, on demand, the same way MyBookings resolves tour images
  // lazily rather than the backend joining every related entity up front.
  const [bookingsById, setBookingsById] = useState<Record<number, Booking>>({});

  const [detailTarget, setDetailTarget] = useState<CancellationRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CancellationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  function fetchRequests() {
    setLoading(true);
    listCancellationRequests(statusFilter || undefined)
      .then(async (rows) => {
        setRequests(rows);
        const missingIds = [...new Set(rows.map((r) => r.bookingId))].filter((id) => !bookingsById[id]);
        if (missingIds.length === 0) return;
        const entries = await Promise.all(
          missingIds.map(async (id) => {
            const booking = await getBookingById(id).catch(() => null);
            return [id, booking] as const;
          }),
        );
        setBookingsById((prev) => ({
          ...prev,
          ...Object.fromEntries(entries.filter(([, booking]) => booking !== null) as [number, Booking][]),
        }));
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load cancellation requests.')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (canView) fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, statusFilter]);

  if (!canView) {
    return (
      <div style={{ padding: '80px 24px' }}>
        <EmptyState title="You are not authorized to view this page." description="Only a Super Admin or Admin can view cancellation requests." />
      </div>
    );
  }

  async function handleApprove(id: number) {
    setBusyId(id);
    try {
      await approveCancellationRequest(id);
      message.success('Cancellation request approved.');
      fetchRequests();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to approve this request.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectionReason.trim()) return;
    setBusyId(rejectTarget.id);
    try {
      await rejectCancellationRequest(rejectTarget.id, rejectionReason.trim());
      message.success('Cancellation request rejected.');
      setRejectTarget(null);
      setRejectionReason('');
      fetchRequests();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to reject this request.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleUploadProof(target: CancellationRequest, file: File) {
    setUploadingProof(true);
    try {
      const fileUrl = await uploadRefundProofImage(file);
      const updated = await addRefundProof(target.id, { fileUrl, fileName: file.name, fileType: file.type });
      message.success('Refund proof uploaded.');
      setDetailTarget(updated);
      fetchRequests();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to upload refund proof.'));
    } finally {
      setUploadingProof(false);
    }
    return Upload.LIST_IGNORE;
  }

  async function handleComplete(id: number) {
    setBusyId(id);
    try {
      await completeRefund(id);
      message.success('Refund marked as completed. The customer has been emailed.');
      setDetailTarget(null);
      fetchRequests();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to mark this refund as completed.'));
    } finally {
      setBusyId(null);
    }
  }

  const columns: ColumnsType<CancellationRequest> = [
    { title: 'Request', dataIndex: 'id', render: (id: number) => `CR-${id}` },
    { title: 'Booking', dataIndex: 'bookingId', render: (id: number) => `JDM-${id}` },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, r) => bookingsById[r.bookingId]?.customerName ?? '—',
    },
    { title: 'Tour', key: 'tour', render: (_, r) => bookingsById[r.bookingId]?.tourNameSnapshot ?? '—' },
    {
      title: 'Booking Date',
      key: 'bookingDate',
      render: (_, r) => {
        const date = bookingsById[r.bookingId]?.bookingDate;
        return date ? new Date(date).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' }) : '—';
      },
    },
    {
      title: 'Original Amount',
      key: 'originalAmount',
      render: (_, r) => {
        const amount = bookingsById[r.bookingId]?.totalPrice;
        return amount !== undefined ? formatCurrency(amount) : '—';
      },
    },
    { title: 'Refund Amount', dataIndex: 'refundAmount', render: (v: number) => formatCurrency(v) },
    { title: 'Refund Method', dataIndex: 'refundMethodName' },
    { title: 'Requested', dataIndex: 'createdAt', render: (v: string) => formatDateTime(v) },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: CancellationRequestStatus) => <Tag color={STATUS_COLOR[status]}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space wrap>
          <Button size="small" onClick={() => setDetailTarget(r)}>
            View
          </Button>
          {r.status === 'PENDING' && (
            <>
              <Popconfirm title={`Approve request CR-${r.id}?`} onConfirm={() => handleApprove(r.id)}>
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} loading={busyId === r.id}>
                  Approve
                </Button>
              </Popconfirm>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => setRejectTarget(r)}>
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Cancellation Requests
      </Typography.Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select style={{ width: 200 }} value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTER_OPTIONS} />
      </Space>

      {loading ? (
        <PageSpinner />
      ) : (
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          scroll={{ x: true }}
          pagination={{ pageSize: 20, showSizeChanger: true, hideOnSinglePage: true }}
        />
      )}

      <Modal
        title={detailTarget ? `Cancellation Request — CR-${detailTarget.id}` : 'Cancellation Request'}
        open={detailTarget !== null}
        onCancel={() => setDetailTarget(null)}
        footer={
          detailTarget && (
            <Space>
              {detailTarget.status === 'APPROVED' && (
                <Upload accept={IMAGE_ACCEPT} showUploadList={false} beforeUpload={(file) => handleUploadProof(detailTarget, file)}>
                  <Button icon={<UploadOutlined />} loading={uploadingProof}>
                    Upload Refund Proof
                  </Button>
                </Upload>
              )}
              {detailTarget.status === 'REFUND_PROCESSING' && (
                <Popconfirm title="Mark this refund as completed?" onConfirm={() => handleComplete(detailTarget.id)}>
                  <Button type="primary" loading={busyId === detailTarget.id}>
                    Mark Refund as Completed
                  </Button>
                </Popconfirm>
              )}
              <Button onClick={() => setDetailTarget(null)}>Close</Button>
            </Space>
          )
        }
      >
        {detailTarget && (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={1} size="small" bordered title="Customer & Booking">
              <Descriptions.Item label="Customer">{bookingsById[detailTarget.bookingId]?.customerName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Customer Email">{bookingsById[detailTarget.bookingId]?.customerEmail ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Booking">JDM-{detailTarget.bookingId}</Descriptions.Item>
              <Descriptions.Item label="Tour">{bookingsById[detailTarget.bookingId]?.tourNameSnapshot ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Participants">{bookingsById[detailTarget.bookingId]?.participants ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Original Amount">
                {bookingsById[detailTarget.bookingId] ? formatCurrency(bookingsById[detailTarget.bookingId].totalPrice) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">{bookingsById[detailTarget.bookingId]?.paymentStatus ?? '—'}</Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} size="small" bordered title="Cancellation">
              <Descriptions.Item label="Reason">{detailTarget.reason}</Descriptions.Item>
              <Descriptions.Item label="Requested">{formatDateTime(detailTarget.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={STATUS_COLOR[detailTarget.status]}>{detailTarget.status}</Tag>
              </Descriptions.Item>
              {detailTarget.rejectionReason && <Descriptions.Item label="Rejection Reason">{detailTarget.rejectionReason}</Descriptions.Item>}
            </Descriptions>

            <Descriptions column={1} size="small" bordered title="Refund (sensitive — staff only)">
              <Descriptions.Item label="Refund Method">{detailTarget.refundMethodName}</Descriptions.Item>
              <Descriptions.Item label="Refund Destination">{detailTarget.refundDestination}</Descriptions.Item>
              <Descriptions.Item label="Refund Amount">{formatCurrency(detailTarget.refundAmount)}</Descriptions.Item>
              <Descriptions.Item label="Refund Proof">
                {detailTarget.refundProofUrl ? (
                  detailTarget.refundProofFileType?.startsWith('image/') ? (
                    <Image src={detailTarget.refundProofUrl} alt={detailTarget.refundProofFileName ?? 'Refund proof'} style={{ maxWidth: '100%' }} />
                  ) : (
                    <a href={detailTarget.refundProofUrl} target="_blank" rel="noopener noreferrer">
                      {detailTarget.refundProofFileName}
                    </a>
                  )
                ) : (
                  <Empty description="No refund proof uploaded yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>

      <Modal
        title={rejectTarget ? `Reject Request CR-${rejectTarget.id}` : 'Reject Request'}
        open={rejectTarget !== null}
        onCancel={() => {
          setRejectTarget(null);
          setRejectionReason('');
        }}
        onOk={handleReject}
        okText="Reject Request"
        okButtonProps={{ danger: true, disabled: !rejectionReason.trim(), loading: busyId === rejectTarget?.id }}
      >
        <Typography.Paragraph>Please provide a reason -- this will be emailed to the customer.</Typography.Paragraph>
        <Input.TextArea rows={4} maxLength={1000} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
      </Modal>
    </div>
  );
}
