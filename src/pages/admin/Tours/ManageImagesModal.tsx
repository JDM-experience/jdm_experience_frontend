import { Modal } from 'antd';
import type { Tour } from '@/types/tour';
import { TourImagesEditor } from './TourImagesEditor';

interface ManageImagesModalProps {
  open: boolean;
  tour: Tour | null;
  onClose: () => void;
  onChange: () => void | Promise<void>;
}

export function ManageImagesModal({ open, tour, onClose, onChange }: ManageImagesModalProps) {
  return (
    <Modal
      title={`Manage Images${tour ? ` — ${tour.name}` : ''}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
    >
      {tour && <TourImagesEditor tour={tour} onChange={onChange} />}
    </Modal>
  );
}
