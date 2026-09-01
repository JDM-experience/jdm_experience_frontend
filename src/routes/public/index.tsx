import type { AppRoute } from '@/routes/types';
import Home from '@/pages/Home';
import Tours from '@/pages/Tours';
import TourDetail from '@/pages/TourDetail';
import Cart from '@/pages/Cart';
import ThankYou from '@/pages/ThankYou';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Policy from '@/pages/Policy';
import Weather from '@/pages/Weather';

/** Routes nested under `MainLayout` that need no authentication. */
export const publicRoutes: AppRoute[] = [
  { index: true, element: <Home /> },
  { path: 'tours', element: <Tours /> },
  { path: 'tours/:id', element: <TourDetail /> },
  { path: 'weather', element: <Weather /> },
  { path: 'cart', element: <Cart /> },
  { path: 'thank-you/:orderId', element: <ThankYou /> },
  { path: 'about', element: <About /> },
  { path: 'contact', element: <Contact /> },
  { path: 'policy', element: <Policy /> },
];

/** Routes that only make sense for a signed-out visitor — bounced elsewhere once authenticated. */
export const guestOnlyRoutes: AppRoute[] = [
  { path: 'login', element: <Login /> },
  { path: 'register', element: <Register /> },
];
