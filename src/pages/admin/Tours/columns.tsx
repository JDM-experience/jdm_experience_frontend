import { Button, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, ContactsOutlined, DeleteOutlined, EditOutlined, PictureOutlined } from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatters';
import type { Tour, TourStatus } from '@/types/tour';
import { MANUAL_STATUS_OPTIONS, STATUS_COLOR, STATUS_LABEL } from './constants';

interface TourColumnsOptions {
  isStaff: boolean;
  isGuide: boolean;
  isSuperAdmin: boolean;
  adminId?: number;
  confirmingId: number | null;
  statusUpdatingId: number | null;
  onConfirm: (id: number) => void;
  onStatusChange: (id: number, status: TourStatus) => void;
  onEdit: (tour: Tour) => void;
  onManageContact: (tour: Tour) => void;
  onDelete: (id: number) => void;
  onManageImages: (tour: Tour) => void;
}

export function getTourColumns({
  isStaff,
  isGuide,
  isSuperAdmin,
  adminId,
  confirmingId,
  statusUpdatingId,
  onConfirm,
  onStatusChange,
  onEdit,
  onManageContact,
  onDelete,
  onManageImages,
}: TourColumnsOptions): ColumnsType<Tour> {
  return [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: 'Name',
      dataIndex: 'name',
      render: (_, tour) => (
        <div>
          <Typography.Text strong>{tour.name}</Typography.Text>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {tour.slug}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Price',
      key: 'price',
      render: (_, tour) => (
        <span>
          {formatCurrency(tour.price)} {tour.currency}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: TourStatus, tour) => {
        const tag = <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>;
        // Manual transitions are staff-only, and only make sense once a tour is past PENDING —
        // getting to AVAILABLE for the first time goes through "Confirm" instead (Actions column).
        if (!isStaff || status === 'PENDING') return tag;
        return (
          <Select<TourStatus>
            size="small"
            value={status}
            style={{ width: 168 }}
            options={MANUAL_STATUS_OPTIONS}
            loading={statusUpdatingId === tour.id}
            onChange={(value) => onStatusChange(tour.id, value)}
          />
        );
      },
    },
    { title: 'Seats', dataIndex: 'seats' },
    {
      title: 'Guide',
      key: 'guide',
      render: (_, tour) => tour.guide?.fullName ?? tour.guide?.email ?? 'Unassigned',
    },
    {
      title: 'Images',
      key: 'images',
      render: (_, tour) => (
        <Button size="small" icon={<PictureOutlined />} onClick={() => onManageImages(tour)}>
          {tour.images.length}
        </Button>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, tour) => {
        const ownsTour = isGuide && tour.guide?.userId === adminId;
        const canEdit = isStaff || ownsTour;
        const canDelete = isSuperAdmin || ownsTour;
        return (
          <Space>
            {isStaff && tour.status === 'PENDING' && (
              <Popconfirm title={`Confirm ${tour.name} as Available?`} onConfirm={() => onConfirm(tour.id)}>
                <Button size="small" icon={<CheckCircleOutlined />} loading={confirmingId === tour.id}>
                  Confirm
                </Button>
              </Popconfirm>
            )}
            {canEdit && <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(tour)} />}
            {canEdit && (
              <Button size="small" icon={<ContactsOutlined />} onClick={() => onManageContact(tour)} title="Customer-facing contact info" />
            )}
            {canDelete && (
              <Popconfirm title={`Delete ${tour.name}?`} onConfirm={() => onDelete(tour.id)}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];
}
