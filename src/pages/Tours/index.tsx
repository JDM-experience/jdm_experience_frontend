import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Col, Input, InputNumber, Row, Select, Space, Typography, message } from 'antd';
import { ClearOutlined, FilterOutlined } from '@ant-design/icons';
import { TourCard } from '@/components/common/TourCard';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { listTours } from '@/services/tourService';
import { getErrorMessage } from '@/utils/errors';
import type { SortOrder, Tour, TourSortBy, TourStatus } from '@/types/tour';

type TourSort = 'az' | 'za' | 'low' | 'high' | 'newest' | 'oldest';

const SORT_OPTIONS: { value: TourSort; label: string }[] = [
  { value: 'newest', label: 'Recommended (Newest)' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'low', label: 'Price: Low to High' },
  { value: 'high', label: 'Price: High to Low' },
  { value: 'az', label: 'Name: A - Z' },
  { value: 'za', label: 'Name: Z - A' },
];

/** Maps this page's UI-facing sort choice onto the backend's sortBy/sortOrder query params —
 *  the API does the actual sorting (database ORDER BY), this is just a label-to-params lookup. */
const SORT_TO_PARAMS: Record<TourSort, { sortBy: TourSortBy; sortOrder: SortOrder }> = {
  az: { sortBy: 'name', sortOrder: 'asc' },
  za: { sortBy: 'name', sortOrder: 'desc' },
  low: { sortBy: 'price', sortOrder: 'asc' },
  high: { sortBy: 'price', sortOrder: 'desc' },
  newest: { sortBy: 'createdAt', sortOrder: 'desc' },
  oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
};

const AVAILABILITY_OPTIONS: { value: TourStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'UNAVAILABLE', label: 'Unavailable' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
];

export default function Tours() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const sort = (searchParams.get('sort') ?? '') as TourSort | '';
  const status = (searchParams.get('status') ?? '') as TourStatus | '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  // Price range and availability are applied explicitly (an "Apply Filters" button) rather than
  // instantly like search/sort -- typing into a number field would otherwise fire a request per
  // keystroke. Draft state mirrors the URL until Apply is clicked; re-synced whenever the URL
  // changes underneath it (e.g. Clear Filters, browser back/forward).
  const [draftMinPrice, setDraftMinPrice] = useState<number | null>(minPrice ? Number(minPrice) : null);
  const [draftMaxPrice, setDraftMaxPrice] = useState<number | null>(maxPrice ? Number(maxPrice) : null);
  const [draftStatus, setDraftStatus] = useState<TourStatus | ''>(status);

  useEffect(() => {
    setDraftMinPrice(minPrice ? Number(minPrice) : null);
    setDraftMaxPrice(maxPrice ? Number(maxPrice) : null);
    setDraftStatus(status);
  }, [minPrice, maxPrice, status]);

  useEffect(() => {
    // Any param can change again before the previous request resolves (e.g. two quick searches)
    // -- guard against the older response overwriting the newer one.
    let cancelled = false;
    setLoading(true);
    const { sortBy, sortOrder } = SORT_TO_PARAMS[sort || 'newest'];
    // Unavailable / under-maintenance tours stay visible here (with their status badge on the
    // card) rather than being hidden -- only AVAILABLE tours can actually be booked, enforced on
    // the Tour Details page and by the backend, not by hiding the tour from this list.
    listTours({
      search: search || undefined,
      status: status || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
      sortOrder,
    })
      .then((results) => {
        if (!cancelled) setTours(results);
      })
      .catch((error) => {
        if (!cancelled) message.error(getErrorMessage(error, 'Unable to load tours.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, sort, status, minPrice, maxPrice]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  function handleApplyFilters() {
    const next = new URLSearchParams(searchParams);
    if (draftMinPrice !== null) next.set('minPrice', String(draftMinPrice));
    else next.delete('minPrice');
    if (draftMaxPrice !== null) next.set('maxPrice', String(draftMaxPrice));
    else next.delete('maxPrice');
    if (draftStatus) next.set('status', draftStatus);
    else next.delete('status');
    setSearchParams(next);
  }

  function handleClearFilters() {
    setSearchParams(new URLSearchParams());
  }

  const hasActiveFilters = Boolean(search || sort || status || minPrice || maxPrice);

  return (
    <section style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Typography.Title level={2}>Tours</Typography.Title>
        <Typography.Text type="secondary">Choose a tour, view details, and reserve an available slot.</Typography.Text>
      </div>

      <Card style={{ marginBottom: 32, borderRadius: 12 }} styles={{ body: { padding: 20 } }}>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Typography.Text strong>
              <FilterOutlined /> Search Tours
            </Typography.Text>
            <Input.Search
              placeholder="Search tours..."
              defaultValue={search}
              onSearch={(value) => updateParam('search', value)}
              allowClear
              style={{ width: 240 }}
            />
          </Space>

          <Row gutter={[16, 16]} align="bottom">
            <Col xs={24} sm={12} md={7}>
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                Price Range
              </Typography.Text>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={0}
                  placeholder="Minimum"
                  value={draftMinPrice}
                  onChange={setDraftMinPrice}
                  style={{ width: '50%' }}
                />
                <InputNumber
                  min={0}
                  placeholder="Maximum"
                  value={draftMaxPrice}
                  onChange={setDraftMaxPrice}
                  style={{ width: '50%' }}
                />
              </Space.Compact>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                Availability
              </Typography.Text>
              <Select
                value={draftStatus || undefined}
                onChange={(value) => setDraftStatus(value ?? '')}
                options={AVAILABILITY_OPTIONS}
                placeholder="Any availability"
                allowClear
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
                Sort By
              </Typography.Text>
              <Select
                value={sort || 'newest'}
                onChange={(value) => updateParam('sort', value === 'newest' ? '' : value)}
                options={SORT_OPTIONS}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Space>
                <Button type="primary" onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
                <Button icon={<ClearOutlined />} onClick={handleClearFilters} disabled={!hasActiveFilters}>
                  Clear
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {loading ? (
        <PageSpinner />
      ) : tours.length === 0 ? (
        <EmptyState
          title="No tours found."
          description={hasActiveFilters ? 'Try adjusting or clearing your filters.' : undefined}
        />
      ) : (
        <Row gutter={[24, 24]}>
          {tours.map((tour, i) => (
            <Col key={tour.id} xs={24} sm={12} md={8} lg={6}>
              <div className="jdm-stagger-in" style={{ animationDelay: `${(i % 8) * 60}ms`, height: '100%' }}>
                <TourCard tour={tour} />
              </div>
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}
