import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Dropdown, Empty, Space, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDateTime } from '@/utils/formatters';
import type { AppNotification } from '@/types/notification';

const NAV_BADGE_STYLE: CSSProperties = { boxShadow: '0 0 0 2px #0F1117' };

/** Every notification created so far points at a booking (see the createNotification call sites
 *  in booking.service.ts/payment.service.ts/cancellationRequest.service.ts) -- /cart (My
 *  Reservations) is the one page that surfaces booking/payment/cancellation/refund state today,
 *  so that's where every notification click lands. */
function targetPathFor(notification: AppNotification): string {
  if (notification.relatedEntityType === 'booking') return '/cart';
  return '/cart';
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { items, unreadCount, loading, refreshList, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) refreshList();
  }

  function handleItemClick(notification: AppNotification) {
    if (!notification.isRead) void markAsRead(notification.id);
    setOpen(false);
    navigate(targetPathFor(notification));
  }

  return (
    <Dropdown
      trigger={['click']}
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      popupRender={() => (
        <div
          style={{
            width: 340,
            maxHeight: 420,
            overflowY: 'auto',
            background: '#1C2333',
            border: '1px solid #303849',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #303849', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Text strong>Notifications</Typography.Text>
            {unreadCount > 0 && (
              <Button type="link" size="small" onClick={() => void markAllAsRead()} style={{ padding: 0 }}>
                Mark All as Read
              </Button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Typography.Text type="secondary">Loading...</Typography.Text>
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 24 }}>
              <Empty description="No notifications yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            items.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleItemClick(notification)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #252D40',
                  cursor: 'pointer',
                  background: notification.isRead ? 'transparent' : 'rgba(224,61,54,0.08)',
                }}
              >
                <Space align="start" size={8}>
                  <span
                    style={{
                      marginTop: 6,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: notification.isRead ? 'transparent' : '#E03D36',
                    }}
                  />
                  <div>
                    <Typography.Text style={{ fontWeight: notification.isRead ? 400 : 600, display: 'block' }}>
                      {notification.message}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDateTime(notification.createdAt)}
                    </Typography.Text>
                  </div>
                </Space>
              </div>
            ))
          )}
        </div>
      )}
    >
      <span aria-label="Notifications" className="jdm-nav-icon-btn" style={{ cursor: 'pointer' }}>
        <Badge count={unreadCount} size="small" style={NAV_BADGE_STYLE}>
          <BellOutlined style={{ fontSize: 18, color: '#fff' }} />
        </Badge>
      </span>
    </Dropdown>
  );
}
