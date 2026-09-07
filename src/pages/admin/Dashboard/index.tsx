import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Col, DatePicker, Row, Segmented, Statistic, Table, Tooltip, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { CarOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageSpinner } from '@/components/common/PageSpinner';
import { listTours } from '@/services/tourService';
import { getCustomers } from '@/services/customerService';
import { getMessages } from '@/services/messageService';
import { getDashboardSummary } from '@/services/dashboardService';
import { formatCurrency } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { DashboardSummary } from '@/types/dashboard';
import type { TourPerformance } from '@/types/dashboard';

interface HeaderStats {
  tours: number;
  customers: number;
  messages: number;
}

const HEADER_CARDS: { key: keyof HeaderStats; title: string; icon: React.ReactNode; to: string; cta: string }[] = [
  { key: 'tours', title: 'Total Tours', icon: <CarOutlined style={{ fontSize: 40 }} />, to: '/admin/tours', cta: 'Manage Tours' },
  { key: 'customers', title: 'Total Customers', icon: <UserOutlined style={{ fontSize: 40 }} />, to: '/admin/customers', cta: 'View Customers' },
  { key: 'messages', title: 'Messages', icon: <MailOutlined style={{ fontSize: 40 }} />, to: '/admin/messages', cta: 'View Messages' },
];

type DatePreset = 'today' | 'week' | 'month' | 'year' | 'custom';

/** Maps a preset to a concrete [from, to] date range (YYYY-MM-DD) -- "custom" is handled
 *  separately via the RangePicker instead of a fixed offset. */
function presetToRange(preset: Exclude<DatePreset, 'custom'>): [string, string] {
  const now = dayjs();
  const from = preset === 'today' ? now : preset === 'week' ? now.startOf('week') : preset === 'month' ? now.startOf('month') : now.startOf('year');
  return [from.format('YYYY-MM-DD'), now.format('YYYY-MM-DD')];
}

/** Minimal dependency-free bar chart -- no charting library is installed anywhere in this app,
 *  and a daily sales trend is simple enough not to warrant adding one just for this. */
function SalesTrendChart({ points }: { points: DashboardSummary['salesTrend'] }) {
  if (points.length === 0) {
    return <Typography.Text type="secondary">No sales data in this date range.</Typography.Text>;
  }
  const max = Math.max(...points.map((p) => p.revenue), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, overflowX: 'auto', paddingTop: 8 }}>
      {points.map((p) => (
        <Tooltip key={p.date} title={`${p.date}: ${formatCurrency(p.revenue)} · ${p.bookings} booking${p.bookings === 1 ? '' : 's'}`}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 22 }}>
            <div
              style={{
                width: 16,
                height: Math.max(4, (p.revenue / max) * 130),
                background: '#000',
                borderRadius: 2,
              }}
            />
            <Typography.Text style={{ fontSize: 10, marginTop: 4, whiteSpace: 'nowrap' }} type="secondary">
              {dayjs(p.date).format('MM/DD')}
            </Typography.Text>
          </div>
        </Tooltip>
      ))}
    </div>
  );
}

const TOUR_PERFORMANCE_COLUMNS: ColumnsType<TourPerformance> = [
  { title: 'Tour Name', dataIndex: 'tourName' },
  { title: 'Bookings', dataIndex: 'bookings', sorter: (a, b) => a.bookings - b.bookings },
  { title: 'Participants', dataIndex: 'participants', sorter: (a, b) => a.participants - b.participants },
  { title: 'Confirmed', dataIndex: 'confirmedBookings' },
  { title: 'Cancelled', dataIndex: 'cancelledBookings' },
  {
    title: 'Revenue',
    dataIndex: 'revenue',
    sorter: (a, b) => a.revenue - b.revenue,
    defaultSortOrder: 'descend',
    render: (v: number) => formatCurrency(v),
  },
];

export default function AdminDashboard() {
  const [headerStats, setHeaderStats] = useState<HeaderStats | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [preset, setPreset] = useState<DatePreset>('month');
  const [customRange, setCustomRange] = useState<[string, string] | null>(null);

  useEffect(() => {
    Promise.all([listTours(), getCustomers(), getMessages()]).then(([tours, customers, messages]) => {
      setHeaderStats({ tours: tours.length, customers: customers.length, messages: messages.length });
    });
  }, []);

  useEffect(() => {
    setSummaryLoading(true);
    const [from, to] = preset === 'custom' ? customRange ?? [undefined, undefined] : presetToRange(preset);
    getDashboardSummary({ from, to })
      .then(setSummary)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load dashboard data.')))
      .finally(() => setSummaryLoading(false));
  }, [preset, customRange]);

  if (!headerStats) return <PageSpinner />;

  return (
    <div>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
        Tour Admin Dashboard
      </Typography.Title>

      <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
        {HEADER_CARDS.map((card) => (
          <Col key={card.key} xs={24} sm={12} lg={8}>
            <Card style={{ textAlign: 'center' }}>
              {card.icon}
              <Typography.Title level={5} style={{ marginTop: 16 }}>
                {card.title}
              </Typography.Title>
              <Statistic value={headerStats[card.key]} styles={{ content: { fontSize: 36, fontWeight: 700 } }} />
              <Link to={card.to}>
                <Button type="primary" style={{ marginTop: 16 }}>
                  {card.cta}
                </Button>
              </Link>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Business Reports
        </Typography.Title>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Segmented
            value={preset}
            onChange={(v) => setPreset(v as DatePreset)}
            options={[
              { label: 'Today', value: 'today' },
              { label: 'This Week', value: 'week' },
              { label: 'This Month', value: 'month' },
              { label: 'This Year', value: 'year' },
              { label: 'Custom', value: 'custom' },
            ]}
          />
          {preset === 'custom' && (
            <DatePicker.RangePicker
              value={customRange ? [dayjs(customRange[0]), dayjs(customRange[1])] : null}
              onChange={(dates) =>
                setCustomRange(dates && dates[0] && dates[1] ? [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')] : null)
              }
            />
          )}
        </div>
      </div>

      {summaryLoading || !summary ? (
        <PageSpinner />
      ) : (
        <>
          <Typography.Title level={5}>Sales Overview</Typography.Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            {[
              { label: 'Total Bookings', value: summary.sales.totalBookings },
              { label: 'Confirmed Bookings', value: summary.sales.confirmedBookings },
              { label: 'Pending Bookings', value: summary.sales.pendingBookings },
              { label: 'Cancelled Bookings', value: summary.sales.cancelledBookings },
              { label: 'Completed Bookings', value: summary.sales.completedBookings },
            ].map((tile) => (
              <Col xs={12} sm={8} lg={4} key={tile.label}>
                <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                  <Statistic title={tile.label} value={tile.value} />
                </Card>
              </Col>
            ))}
          </Row>

          <Typography.Title level={5}>Revenue</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
            Only confirmed/paid bookings count as revenue -- pending, unpaid, and cancelled bookings never do.
          </Typography.Paragraph>
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic title="Total Revenue" value={formatCurrency(summary.revenue.totalRevenue)} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic title="Confirmed Revenue" value={formatCurrency(summary.revenue.confirmedRevenue)} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
                <Statistic title="Pending Revenue (not yet earned)" value={formatCurrency(summary.revenue.pendingRevenue)} />
              </Card>
            </Col>
          </Row>

          <Typography.Title level={5}>Tour Performance</Typography.Title>
          <Table
            style={{ marginBottom: 32 }}
            size="small"
            columns={TOUR_PERFORMANCE_COLUMNS}
            dataSource={summary.tourPerformance}
            rowKey="tourId"
            scroll={{ x: true }}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            locale={{ emptyText: 'No bookings in this date range.' }}
          />

          <Typography.Title level={5}>Sales Trend</Typography.Title>
          <Card size="small" style={{ borderRadius: 10 }}>
            <SalesTrendChart points={summary.salesTrend} />
          </Card>
        </>
      )}
    </div>
  );
}
