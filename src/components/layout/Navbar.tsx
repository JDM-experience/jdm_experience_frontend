import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AutoComplete, Avatar, Badge, Button, Drawer, Dropdown, Grid, Input, Layout, Menu, Space } from 'antd';
import type { MenuProps } from 'antd';
import { CalendarOutlined, MenuOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { getMyBookings } from '@/services/bookingService';
import { listTours } from '@/services/tourService';
import { formatCurrency } from '@/utils/formatters';

interface SearchSuggestion {
  id: number;
  name: string;
  price: number;
  image: string;
}

const NAV_LINKS = [
  { key: '/', label: 'Home' },
  { key: '/tours', label: 'Tours' },
  { key: '/about', label: 'About' },
  { key: '/contact', label: 'Contact' },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [unpaidCount, setUnpaidCount] = useState(0);

  // Notifies the user they have reservation(s) still needing payment. A CANCELLED booking is
  // excluded even if it was never paid -- there's nothing left to pay on it. Refreshes on login/
  // logout and on mount; doesn't live-update the instant a new booking is created elsewhere on
  // the page (no shared bookings state exists yet -- same as reloading picks it up).
  useEffect(() => {
    if (!isAuthenticated) {
      setUnpaidCount(0);
      return;
    }
    getMyBookings()
      .then((bookings) => setUnpaidCount(bookings.filter((b) => b.paymentStatus === 'UNPAID' && b.status !== 'CANCELLED').length))
      .catch(() => setUnpaidCount(0));
  }, [isAuthenticated]);

  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(() => {
      // Search + sort are performed by the backend (GET /tours?search=&sortBy=name&sortOrder=asc)
      // -- only the display cap (top 20) happens here, not the actual matching/ordering.
      listTours({ status: 'AVAILABLE', search: term, sortBy: 'name', sortOrder: 'asc' })
        .then((tours) =>
          setSuggestions(
            tours.slice(0, 20).map((t) => ({ id: t.id, name: t.name, price: t.price, image: t.images[0]?.imageUrl ?? '' })),
          ),
        )
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const navMenuItems = useMemo(
    () => NAV_LINKS.map((link) => ({ key: link.key, label: <Link to={link.key}>{link.label}</Link> })),
    [],
  );

  const selectedNavKey = useMemo(() => {
    const match = [...NAV_LINKS].reverse().find((link) => (link.key === '/' ? location.pathname === '/' : location.pathname.startsWith(link.key)));
    return match ? [match.key] : [];
  }, [location.pathname]);

  const goToSearch = (term: string) => {
    if (!term.trim()) return;
    navigate(`/tours?search=${encodeURIComponent(term.trim())}`);
    setSearchTerm('');
    setSuggestions([]);
  };

  const searchOptions = suggestions.map((item) => ({
    value: item.name,
    key: item.id,
    label: (
      <Space onClick={() => navigate(`/tours/${item.id}`)}>
        <Avatar shape="square" src={item.image} />
        <span>
          <div style={{ fontWeight: 600 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{formatCurrency(item.price)}</div>
        </span>
      </Space>
    ),
  }));

  const userMenuItems: MenuProps['items'] = [
    // Real bookings (see routes/client/index.tsx), served at /cart -- reusing the old cart path/
    // name, but backed by real Booking data now, not the legacy mock Cart/Checkout system.
    {
      key: 'my-bookings',
      label: (
        <Link to="/cart">
          My Reservations
          {unpaidCount > 0 && (
            <Badge count={unpaidCount} size="small" style={{ marginLeft: 8 }} title={`${unpaidCount} unpaid reservation${unpaidCount === 1 ? '' : 's'}`} />
          )}
        </Link>
      ),
    },
    { key: 'profile', label: <Link to="/profile">My Profile</Link> },
    { type: 'divider' },
    { key: 'logout', danger: true, label: 'Logout', onClick: () => logout() },
  ];

  return (
    <Layout.Header
      style={{
        position: 'fixed',
        top: 0,
        insetInline: 0,
        zIndex: 100,
        width: '100%',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        paddingInline: 0,
        height: 72,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          height: '100%',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          paddingInline: 24,
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <img src="/images/jdm-logo.png" alt="JDM Experience" style={{ height: 52, width: 'auto' }} />
        </Link>

        {!isMobile && (
          <Menu
            mode="horizontal"
            selectable
            selectedKeys={selectedNavKey}
            items={navMenuItems}
            style={{ flex: 1, justifyContent: 'center', borderBottom: 'none', minWidth: 0, fontWeight: 500 }}
          />
        )}

        <Space size="large" align="center" style={{ marginLeft: isMobile ? 'auto' : 0 }}>
          {!isMobile && (
            <AutoComplete
              className="jdm-nav-search"
              options={searchOptions}
              value={searchTerm}
              onChange={setSearchTerm}
              onSelect={(value) => goToSearch(value)}
              style={{ width: screens.lg ? 260 : 180 }}
              popupMatchSelectWidth={320}
            >
              <Input
                variant="filled"
                size="small"
                placeholder="Search tours..."
                prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.35)' }} />}
                allowClear
                onPressEnter={(e) => goToSearch((e.target as HTMLInputElement).value)}
              />
            </AutoComplete>
          )}

          {isAuthenticated && (
            // "Your Reservation" -- "My Reservations" is already the label inside the profile
            // dropdown below; this is the same real /cart page, just reachable in one click from
            // the header the way the old cart icon used to work.
            <Link to="/cart" aria-label="Your Reservation">
              <Button
                type="text"
                shape="circle"
                icon={
                  <Badge count={unpaidCount} size="small" title={`${unpaidCount} unpaid reservation${unpaidCount === 1 ? '' : 's'}`}>
                    <CalendarOutlined style={{ fontSize: 18, color: '#000' }} />
                  </Badge>
                }
              />
            </Link>
          )}

          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }} size={8}>
                <Badge dot={unpaidCount > 0} title={`${unpaidCount} unpaid reservation${unpaidCount === 1 ? '' : 's'}`}>
                  <Avatar size={32} icon={<UserOutlined />} style={{ background: '#000' }} />
                </Badge>
                {!isMobile && <span style={{ fontWeight: 600 }}>Hi, {(user?.fullName ?? user?.email)?.split(' ')[0]}</span>}
              </Space>
            </Dropdown>
          ) : (
            <Link to="/login" aria-label="Login">
              <Button type="text" shape="circle" icon={<UserOutlined style={{ fontSize: 18, color: '#000' }} />} />
            </Link>
          )}

          {isMobile && (
            <Button type="text" shape="circle" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} aria-label="Open menu" />
          )}
        </Space>
      </div>

      <Drawer title="Menu" placement="right" onClose={() => setDrawerOpen(false)} open={drawerOpen}>
        <Input.Search
          variant="filled"
          placeholder="Search tours..."
          onSearch={(value) => {
            goToSearch(value);
            setDrawerOpen(false);
          }}
          style={{ marginBottom: 16 }}
          prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.35)' }} />}
        />
        <Menu mode="vertical" selectable selectedKeys={selectedNavKey} onClick={() => setDrawerOpen(false)} items={navMenuItems} />
      </Drawer>
    </Layout.Header>
  );
}
