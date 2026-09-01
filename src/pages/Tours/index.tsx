import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Col, Input, Row, Select, Space, Typography } from 'antd';
import { TourCard } from '@/components/common/TourCard';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { listTours } from '@/services/tourService';
import type { Tour } from '@/types/tour';

type TourSort = 'az' | 'za' | 'low' | 'high';

const SORT_OPTIONS: { value: TourSort | ''; label: string }[] = [
  { value: '', label: 'Sort' },
  { value: 'az', label: 'A - Z' },
  { value: 'za', label: 'Z - A' },
  { value: 'low', label: 'Tour Price: Low to High' },
  { value: 'high', label: 'Tour Price: High to Low' },
];

export default function Tours() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const sort = (searchParams.get('sort') ?? '') as TourSort | '';

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listTours({ status: 'ACTIVE' })
      .then(setTours)
      .finally(() => setLoading(false));
  }, []);

  const visibleTours = useMemo(() => {
    let results = [...tours];

    if (search) {
      const term = search.toLowerCase();
      results = results.filter((t) => t.name.toLowerCase().includes(term));
    }

    switch (sort) {
      case 'za':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'az':
      default:
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return results;
  }, [tours, search, sort]);

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
      ) : visibleTours.length === 0 ? (
        <EmptyState title="No tours found." />
      ) : (
        <Row gutter={[24, 24]}>
          {visibleTours.map((tour) => (
            <Col key={tour.id} xs={24} sm={12} md={8} lg={6}>
              <TourCard tour={tour} />
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}
