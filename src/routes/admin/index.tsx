import type { AppRoute } from '@/routes/types';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminTours from '@/pages/admin/Tours';
import AdminCustomers from '@/pages/admin/Customers';
import AdminCustomerDetail from '@/pages/admin/CustomerDetail';
import AdminMessages from '@/pages/admin/Messages';
import AdminUsers from '@/pages/admin/Users';
import AdminSettings from '@/pages/admin/Settings';
import AdminPaymentMethods from '@/pages/admin/PaymentMethods';
import AdminBookings from '@/pages/admin/Bookings';

/** Routes nested under `AdminLayout` + `AdminProtectedRoute`. `admin/login` isn't here — it
 *  renders without the admin layout/guard, so it stays a direct `<Route>` in `App.tsx`.
 *  `admin/users` and `admin/settings` are further role-gated inside their own page components
 *  (Super Admin only / Super Admin+Admin only) rather than a new route-guard component. */
export const adminRoutes: AppRoute[] = [
  { path: 'admin/dashboard', element: <AdminDashboard /> },
  { path: 'admin/tours', element: <AdminTours /> },
  { path: 'admin/customers', element: <AdminCustomers /> },
  { path: 'admin/customers/:customerId', element: <AdminCustomerDetail /> },
  { path: 'admin/messages', element: <AdminMessages /> },
  { path: 'admin/users', element: <AdminUsers /> },
  { path: 'admin/settings', element: <AdminSettings /> },
  { path: 'admin/payment-methods', element: <AdminPaymentMethods /> },
  { path: 'admin/bookings', element: <AdminBookings /> },
];
