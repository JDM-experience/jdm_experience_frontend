import { useEffect, useState } from 'react';
import { Button, DatePicker, Descriptions, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { ClearOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { listAuditLogs } from '@/services/auditLogService';
import { formatDateTime } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { AuditLog, AuditLogFilter } from '@/types/auditLog';
import type { UserRole } from '@/types/user';

const ROLE_TAG_COLOR: Record<UserRole, string> = {
  SUPER_ADMIN: 'gold',
  ADMIN: 'blue',
  TOUR_GUIDE: 'green',
  CUSTOMER: 'default',
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TOUR_GUIDE', label: 'Tour Guide' },
  { value: 'CUSTOMER', label: 'Customer' },
];

/** Every action string in this app is "entity.verb" (see recordAuditLog call sites) -- the
 *  Entity filter lists the plural table names actually used as the `entity` field throughout
 *  those calls (tours, bookings, users, ...), not a separate free-form value. */
const ENTITY_OPTIONS = [
  'users',
  'tours',
  'bookings',
  'cancellation_requests',
  'payments',
  'payment_proofs',
  'payment_methods',
  'reviews',
  'customers',
  'contact_messages',
  'app_settings',
  'social_media_links',
  'about_content',
  'policy_pages',
];

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailTarget, setDetailTarget] = useState<AuditLog | null>(null);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [entity, setEntity] = useState<string | ''>('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  function fetchLogs() {
    setLoading(true);
    const filter: AuditLogFilter = {
      action: search || undefined,
      role: role || undefined,
      entity: entity || undefined,
      dateFrom: dateRange?.[0],
      dateTo: dateRange?.[1],
      page,
      pageSize,
    };
    listAuditLogs(filter)
      .then((result) => {
        setLogs(result.items);
        setTotal(result.total);
      })
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load audit logs.')))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fetchLogs, [search, role, entity, dateRange, page, pageSize]);

  function handleClearFilters() {
    setSearch('');
    setRole('');
    setEntity('');
    setDateRange(null);
    setPage(1);
  }

  const hasActiveFilters = Boolean(search || role || entity || dateRange);

  const columns: ColumnsType<AuditLog> = [
    { title: 'Date', dataIndex: 'createdAt', render: (v: string) => formatDateTime(v) },
    {
      title: 'User',
      key: 'user',
      render: (_, log) => (
        <div>
          <div>{log.userName ?? '—'}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {log.userEmail ?? ''}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (r: UserRole | null) => (r ? <Tag color={ROLE_TAG_COLOR[r]}>{r.replace('_', ' ')}</Tag> : '—'),
    },
    { title: 'Action', dataIndex: 'action' },
    { title: 'Entity', dataIndex: 'entity' },
    { title: 'Entity ID', dataIndex: 'entityId', render: (v: number | null) => v ?? '—' },
    {
      title: 'Status',
      key: 'status',
      // Every row here was only ever written after its action succeeded (see recordAuditLog's
      // call sites) -- there is no failed-attempt logging in this app today, so this column is
      // always "Success" rather than a stored value that could only ever hold one state.
      render: () => <Tag color="success">Success</Tag>,
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, log) => (
        <Button size="small" onClick={() => setDetailTarget(log)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Audit Trail
      </Typography.Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search action (e.g. tour.update)..."
          allowClear
          style={{ width: 240 }}
          defaultValue={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <Select
          style={{ width: 160 }}
          value={role || undefined}
          onChange={(value) => {
            setRole(value ?? '');
            setPage(1);
          }}
          options={ROLE_OPTIONS}
          placeholder="All Roles"
          allowClear
        />
        <Select
          style={{ width: 200 }}
          value={entity || undefined}
          onChange={(value) => {
            setEntity(value ?? '');
            setPage(1);
          }}
          options={ENTITY_OPTIONS.map((e) => ({ value: e, label: e }))}
          placeholder="All Entities"
          allowClear
        />
        <DatePicker.RangePicker
          value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
          onChange={(dates) => {
            setDateRange(dates && dates[0] && dates[1] ? [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')] : null);
            setPage(1);
          }}
        />
        <Button icon={<ClearOutlined />} onClick={handleClearFilters} disabled={!hasActiveFilters}>
          Clear Filters
        </Button>
      </Space>

      {loading ? (
        <PageSpinner />
      ) : (
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          scroll={{ x: true }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      )}

      <Modal
        title={detailTarget ? `Audit Details — ${detailTarget.action}` : 'Audit Details'}
        open={detailTarget !== null}
        onCancel={() => setDetailTarget(null)}
        footer={<Button onClick={() => setDetailTarget(null)}>Close</Button>}
      >
        {detailTarget && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Performed By">{detailTarget.userName ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Role">
              {detailTarget.role ? <Tag color={ROLE_TAG_COLOR[detailTarget.role]}>{detailTarget.role.replace('_', ' ')}</Tag> : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Action">{detailTarget.action}</Descriptions.Item>
            <Descriptions.Item label="Entity">{detailTarget.entity}</Descriptions.Item>
            <Descriptions.Item label="Entity ID">{detailTarget.entityId ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Date">{formatDateTime(detailTarget.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Changes">
              {detailTarget.metadata ? (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                  {JSON.stringify(detailTarget.metadata, null, 2)}
                </pre>
              ) : (
                '—'
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
