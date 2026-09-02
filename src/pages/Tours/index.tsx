import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Col, Input, Row, Select, Space, Typography, message } from 'antd';
import { TourCard } from '@/components/common/TourCard';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { listTours } from '@/services/tourService';
import { getErrorMessage } from '@/utils/errors';
import type { SortOrder, Tour, TourSortBy } from '@/types/tour';

type TourSort = 'az' | 'za' | 'low' | 'high';

const SORT_OPTIONS: { value: TourSort | ''; label: string }[] = [
  { value: '', label: 'Sort' },
  { value: 'az', label: 'A - Z' },
  { value: 'za', label: 'Z - A' },
  { value: 'low', label: 'Tour Price: Low to High' },
  { value: 'high', label: 'Tour Price: High to Low' },
];

/** Maps this page's UI-facing sort choice onto the backend's sortBy/sortOrder query params —
 *  the API does the actual sorting (database ORDER BY), this is just a label-to-params lookup.
 *  Unset/unrecognized falls back to the same default the UI always had: name ascending. */
const SORT_TO_PARAMS: Record<TourSort, { sortBy: TourSortBy; sortOrder: SortOrder }> = {
  az: { sortBy: 'name', sortOrder: 'asc' },
  za: { sortBy: 'name', sortOrder: 'desc' },
  low: { sortBy: 'price', sortOrder: 'asc' },
  high: { sortBy: 'price', sortOrder: 'desc' },
};

export default function Tours() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const sort = (searchParams.get('sort') ?? '') as TourSort | '';

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { sortBy, sortOrder } = SORT_TO_PARAMS[sort || 'az'];
    listTours({ status: 'AVAILABLE', search: search || undefined, sortBy, sortOrder })
      .then(setTours)
      .catch((error) => message.error(getErrorMessage(error, 'Unable to load tours.')))
      .finally(() => setLoading(false));
  }, [search, sort]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <section style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Typography.Title level={2}>Tours</Typography.Title>
        <Typography.Text type="secondary">Choose a tour, view details, and reserve an available slot.</Typography.Text>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Available Tours
        </Typography.Title>

        <Space wrap>
          <Input.Search
            placeholder="Search tours..."
            defaultValue={search}
            onSearch={(value) => updateParam('search', value)}
            allowClear
            style={{ width: 200 }}
          />
          <Select
            value={sort || undefined}
            style={{ width: 200 }}
            onChange={(value) => updateParam('sort', value ?? '')}
            options={SORT_OPTIONS.filter((o) => o.value).map((o) => ({ value: o.value, label: o.label }))}
            placeholder="Sort"
            allowClear
          />
        </Space>
      </div>

      {loading ? (
        <PageSpinner />
      ) : tours.length === 0 ? (
        <EmptyState title="No tours found." />
      ) : (
        <Row gutter={[24, 24]}>
          {tours.map((tour) => (
            <Col key={tour.id} xs={24} sm={12} md={8} lg={6}>
              <TourCard tour={tour} />
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}
