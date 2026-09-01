import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Col, Row, Statistic, Typography } from 'antd';
import { CarOutlined, CalendarOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { PageSpinner } from '@/components/common/PageSpinner';
import { listTours } from '@/services/tourService';
import { getAllOrders } from '@/services/orderService';
import { getCustomers } from '@/services/customerService';
import { getMessages } from '@/services/messageService';

interface DashboardStats {
  tours: number;
  reservations: number;
  customers: number;
  messages: number;
}

const CARDS: { key: keyof DashboardStats; title: string; icon: React.ReactNode; to: string; cta: string }[] = [
  { key: 'tours', title: 'Total Tours', icon: <CarOutlined style={{ fontSize: 40 }} />, to: '/admin/tours', cta: 'Manage Tours' },
  {
    key: 'reservations',
    title: 'Total Reservations',
    icon: <CalendarOutlined style={{ fontSize: 40 }} />,
    to: '/admin/orders',
    cta: 'View Reservations',
  },
  {
    key: 'customers',
    title: 'Total Customers',
    icon: <UserOutlined style={{ fontSize: 40 }} />,
    to: '/admin/customers',
    cta: 'View Customers',
  },
  { key: 'messages', title: 'Messages', icon: <MailOutlined style={{ fontSize: 40 }} />, to: '/admin/messages', cta: 'View Messages' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    Promise.all([listTours(), getAllOrders(), getCustomers(), getMessages()]).then(
      ([tours, orders, customers, messages]) => {
        setStats({ tours: tours.length, reservations: orders.length, customers: customers.length, messages: messages.length });
      },
    );
  }, []);

  if (!stats) return <PageSpinner />;

  return (
    <div>
      <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
        Tour Admin Dashboard
      </Typography.Title>

      <Row gutter={[24, 24]}>
        {CARDS.map((card) => (
          <Col key={card.key} xs={24} sm={12} lg={6}>
            <Card style={{ textAlign: 'center' }}>
              {card.icon}
              <Typography.Title level={5} style={{ marginTop: 16 }}>
                {card.title}
              </Typography.Title>
              <Statistic value={stats[card.key]} styles={{ content: { fontSize: 36, fontWeight: 700 } }} />
              <Link to={card.to}>
                <Button type="primary" style={{ marginTop: 16 }}>
                  {card.cta}
                </Button>
              </Link>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
