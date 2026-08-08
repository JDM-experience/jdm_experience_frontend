import type { AppRoute } from '@/routes/types';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminTours from '@/pages/admin/Tours';
import AdminOrders from '@/pages/admin/Orders';
import AdminOrderReceipt from '@/pages/admin/OrderReceipt';
import AdminCustomers from '@/pages/admin/Customers';
import AdminCustomerDetail from '@/pages/admin/CustomerDetail';
import AdminMessages from '@/pages/admin/Messages';

/** Routes nested under `AdminLayout` + `AdminProtectedRoute`. `admin/login` isn't here — it
 *  renders without the admin layout/guard, so it stays a direct `<Route>` in `App.tsx`. */
export const adminRoutes: AppRoute[] = [
  { path: 'admin/dashboard', element: <AdminDashboard /> },
  { path: 'admin/tours', element: <AdminTours /> },
  { path: 'admin/orders', element: <AdminOrders /> },
  { path: 'admin/receipt/:orderId', element: <AdminOrderReceipt /> },
  { path: 'admin/customers', element: <AdminCustomers /> },
  { path: 'admin/customers/:customerId', element: <AdminCustomerDetail /> },
  { path: 'admin/messages', element: <AdminMessages /> },
];
