import type { AppRoute } from '@/routes/types';
import Checkout from '@/pages/Checkout';
import Profile from '@/pages/Profile';
import MyOrders from '@/pages/MyOrders';
import Receipt from '@/pages/Receipt';

/** Routes nested under `MainLayout` + `ProtectedRoute` — customer must be logged in. */
export const clientRoutes: AppRoute[] = [
  { path: 'checkout', element: <Checkout /> },
  { path: 'profile', element: <Profile /> },
  { path: 'my-orders', element: <MyOrders /> },
  { path: 'receipt/:orderId', element: <Receipt /> },
];
