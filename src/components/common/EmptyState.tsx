import { Button, Empty } from 'antd';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  actionText?: string;
  actionTo?: string;
}

export function EmptyState({ title, description, actionText, actionTo }: EmptyStateProps) {
  return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <Empty description={description ?? title} />
      {actionText && actionTo && (
        <Link to={actionTo}>
          <Button type="primary" style={{ marginTop: 16 }}>
            {actionText}
          </Button>
        </Link>
      )}
    </div>
  );
}
