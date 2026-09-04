import { useEffect, useState } from 'react';
import { Button, Table, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { confirmTour, deleteTour, listTourGuides, listTours, updateTour } from '@/services/tourService';
import { getErrorMessage } from '@/utils/errors';
import type { Tour, TourGuide, TourStatus } from '@/types/tour';
import { STATUS_LABEL } from './constants';
import { getTourColumns } from './columns';
import { CreateTourModal } from './CreateTourModal';
import { EditTourModal } from './EditTourModal';
import { ManageImagesModal } from './ManageImagesModal';
import { ContactModal } from './ContactModal';

export default function AdminTours() {
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';
  const isStaff = isSuperAdmin || admin?.role === 'ADMIN';
  const isGuide = admin?.role === 'TOUR_GUIDE';

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState<TourGuide[]>([]);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);

  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [imagesTour, setImagesTour] = useState<Tour | null>(null);

  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactTour, setContactTour] = useState<Tour | null>(null);

  // No local sort needed -- listTours() with no sortBy already gets the backend's default order
  // (id desc, newest first).
  function fetchTours() {
    setLoading(true);
    listTours()
      .then(setTours)
      .finally(() => setLoading(false));
  }

  useEffect(fetchTours, []);
  useEffect(() => {
    listTourGuides()
      .then(setGuides)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load tour guides.')));
  }, []);

  const guideOptions = guides.map((g) => ({ value: g.id, label: g.fullName ?? g.email ?? `Guide #${g.id}` }));

  async function refreshTour(id: number) {
    const results = await listTours();
    const updated = results.find((t) => t.id === id) ?? null;
    setTours(results);
    if (updated) {
      setImagesTour((prev) => (prev && prev.id === id ? updated : prev));
      setEditingTour((prev) => (prev && prev.id === id ? updated : prev));
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTour(id);
      message.success('Tour deleted.');
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to delete this tour.'));
    }
  }

  // Availability status — confirmation (PENDING -> AVAILABLE) and manual transitions. Staff-only;
  // the backend also rejects a status change from a Tour Guide.
  async function handleConfirm(id: number) {
    setConfirmingId(id);
    try {
      await confirmTour(id);
      message.success('Tour confirmed — now Available.');
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, 'Unable to confirm this tour.'));
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleStatusChange(id: number, status: TourStatus) {
    setStatusUpdatingId(id);
    try {
      await updateTour(id, { status });
      message.success(`Status changed to ${STATUS_LABEL[status]}.`);
      fetchTours();
    } catch (error) {
      message.error(getErrorMessage(error, "Unable to change this tour's status."));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  const columns = getTourColumns({
    isStaff,
    isGuide,
    isSuperAdmin,
    adminId: admin?.id,
    confirmingId,
    statusUpdatingId,
    onConfirm: handleConfirm,
    onStatusChange: handleStatusChange,
    onEdit: (tour) => {
      setEditingTour(tour);
      setEditModalOpen(true);
    },
    onManageContact: (tour) => {
      setContactTour(tour);
      setContactModalOpen(true);
    },
    onDelete: handleDelete,
    onManageImages: (tour) => {
      setImagesTour(tour);
      setImagesModalOpen(true);
    },
  });

  if (loading) return <PageSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Manage Tours
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          Add Tour
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tours}
        rowKey="id"
        scroll={{ x: true }}
        pagination={{ pageSize: 20, showSizeChanger: true, hideOnSinglePage: true }}
      />

      <CreateTourModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={fetchTours}
        isStaff={isStaff}
        guideOptions={guideOptions}
      />

      <EditTourModal
        open={editModalOpen}
        tour={editingTour}
        onClose={() => setEditModalOpen(false)}
        onSaved={fetchTours}
        onImagesChanged={() => {
          if (editingTour) return refreshTour(editingTour.id);
        }}
        isStaff={isStaff}
        guideOptions={guideOptions}
      />

      <ManageImagesModal
        open={imagesModalOpen}
        tour={imagesTour}
        onClose={() => setImagesModalOpen(false)}
        onChange={() => {
          if (imagesTour) return refreshTour(imagesTour.id);
        }}
      />

      <ContactModal open={contactModalOpen} tour={contactTour} onClose={() => setContactModalOpen(false)} />
    </div>
  );
}
