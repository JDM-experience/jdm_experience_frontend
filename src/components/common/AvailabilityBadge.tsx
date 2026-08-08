import { Tag } from 'antd';
import type { AvailabilityStatus } from '@/types/product';

const COLOR_BY_STATUS: Record<AvailabilityStatus, string> = {
  Available: 'green',
  Unavailable: 'red',
  'Under Maintenance': 'orange',
};

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  return (
    <Tag color={COLOR_BY_STATUS[status]} style={{ fontWeight: 600 }}>
      {status}
    </Tag>
  );
}
