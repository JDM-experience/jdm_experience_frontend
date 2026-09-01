import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, Col, Input, Row, Tag, Typography } from 'antd';
import { PageSpinner } from '@/components/common/PageSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { getTours } from '@/services/tourService';
import { formatCurrency } from '@/utils/formatters';
import { getErrorMessage } from '@/utils/errors';
import type { Tour } from '@/types/tour';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="400" height="240" fill="%23f0f0f0"/></svg>',
  );

export default function Tours() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTours('ACTIVE')
      .then(setTours)
      .catch((error) => {
        // Not shown as a page-blocking error -- an empty tours list with no explanation is
        // less confusing than a raw error state for a public browsing page.
        console.error(getErrorMessage(error, 'Unable to load tours.'));
      })
      .finally(() => setLoading(false));
  }, []);

  function updateSearch(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('search', value);
    else next.delete('search');
    setSearchParams(next);
  }

  const visibleTours = search
    ? tours.filter((tour) => tour.name.toLowerCase().includes(search.toLowerCase()))
    : tours;

  return (
    <section style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Typography.Title level={2}>Tours</Typography.Title>
        <Typography.Text type="secondary">Choose a tour, view details, and reserve it by date.</Typography.Text>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
        <Input.Search
          placeholder="Search tours..."
          defaultValue={search}
          onSearch={updateSearch}
          allowClear
          style={{ width: '100%', maxWidth: 280 }}
        />
      </div>

      {loading ? (
        <PageSpinner />
      ) : visibleTours.length === 0 ? (
        <EmptyState title="No tours found." />
      ) : (
        <Row gutter={[24, 24]}>
          {visibleTours.map((tour) => (
            <Col key={tour.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                style={{ height: '100%' }}
                styles={{ body: { textAlign: 'center' } }}
                cover={
                  <img
                    src={tour.images[0]?.imageUrl ?? PLACEHOLDER_IMAGE}
                    alt={tour.name}
                    style={{ height: 220, width: '100%', objectFit: 'cover' }}
                  />
                }
              >
                {tour.guide?.fullName && (
                  <Tag style={{ marginBottom: 8 }}>Guide: {tour.guide.fullName}</Tag>
                )}
                <Typography.Title level={5} style={{ marginTop: 4, marginBottom: 8 }}>
                  {tour.name}
                </Typography.Title>
                <Typography.Text strong>{formatCurrency(tour.price)}</Typography.Text>
                <div>
                  <Link to={`/tours/${tour.id}`}>
                    <Button style={{ marginTop: 12 }}>View Details</Button>
                  </Link>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
}
