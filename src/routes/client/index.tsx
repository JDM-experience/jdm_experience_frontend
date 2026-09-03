import type { AppRoute } from '@/routes/types';
import Checkout from '@/pages/Checkout';
import Profile from '@/pages/Profile';
import MyOrders from '@/pages/MyOrders';
import MyBookings from '@/pages/MyBookings';
import Receipt from '@/pages/Receipt';
import ReservationCheckout from '@/pages/ReservationCheckout';

/** Routes nested under `MainLayout` + `ProtectedRoute` — customer must be logged in. */
export const clientRoutes: AppRoute[] = [
  { path: 'checkout', element: <Checkout /> },
  { path: 'profile', element: <Profile /> },
  { path: 'my-orders', element: <MyOrders /> },
  // Real bookings (via the real Tour/Booking API) -- distinct from /my-orders, which still
  // shows legacy mock Cart/Checkout orders.
  { path: 'my-bookings', element: <MyBookings /> },
  // Final review step between TourDetail's reservation form and actually creating the booking --
  // receives its draft via router state (see ReservationDraft), not its own persisted data.
  { path: 'reservations/:tourId/checkout', element: <ReservationCheckout /> },
  { path: 'receipt/:orderId', element: <Receipt /> },
];
