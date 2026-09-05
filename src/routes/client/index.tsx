import type { AppRoute } from '@/routes/types';
import Profile from '@/pages/Profile';
import MyBookings from '@/pages/MyBookings';
import ReservationCheckout from '@/pages/ReservationCheckout';

/** Routes nested under `MainLayout` + `ProtectedRoute` — customer must be logged in. */
export const clientRoutes: AppRoute[] = [
  { path: 'profile', element: <Profile /> },
  { path: 'my-bookings', element: <MyBookings /> },
  // Final review step between TourDetail's reservation form and actually creating the booking --
  // receives its draft via router state (see ReservationDraft), not its own persisted data.
  { path: 'reservations/:tourId/checkout', element: <ReservationCheckout /> },
];
