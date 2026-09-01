import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Col, Input, Row, Select, Space, Typography } from 'antd';
import { TourCard } from '@/components/common/TourCard';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { getCategories, getProducts } from '@/services/productService';
import type { Product, ProductSort } from '@/types/product';

const SORT_OPTIONS: { value: ProductSort | ''; label: string }[] = [
  { value: '', label: 'Sort' },
  { value: 'az', label: 'A - Z' },
  { value: 'za', label: 'Z - A' },
  { value: 'low', label: 'Tour Price: Low to High' },
  { value: 'high', label: 'Tour Price: High to Low' },
];

export default function Tours() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const sort = (searchParams.get('sort') ?? '') as ProductSort | '';

  const [categories, setCategories] = useState<string[]>([]);
  const [tours, setTours] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts({
      search: search || undefined,
      category: category || undefined,
      sort: sort || undefined,
    })
      .then(setTours)
      .finally(() => setLoading(false));
  }, [search, category, sort]);

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
        <Typography.Text type="secondary">Choose a tour, view details, and reserve it by date.</Typography.Text>
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
            style={{ width: '100%', maxWidth: 240 }}
          />
          <Select
            value={category || undefined}
            placeholder="All Tour Types"
            style={{ width: 180 }}
            allowClear
            onChange={(value) => updateParam('category', value ?? '')}
            options={categories.map((c) => ({ value: c, label: c }))}
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
              <TourCard product={tour} />
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}
