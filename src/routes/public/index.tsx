import type { AppRoute } from '@/routes/types';
import Home from '@/pages/Home';
import Tours from '@/pages/Tours';
import TourDetail from '@/pages/TourDetail';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Policy from '@/pages/Policy';
import PolicyDocument from '@/pages/PolicyDocument';
import FAQ from '@/pages/FAQ';
import Weather from '@/pages/Weather';

/** Routes nested under `MainLayout` that need no authentication. */
export const publicRoutes: AppRoute[] = [
  { index: true, element: <Home /> },
  { path: 'tours', element: <Tours /> },
  { path: 'tours/:id', element: <TourDetail /> },
  { path: 'weather', element: <Weather /> },
  { path: 'about', element: <About /> },
  { path: 'contact', element: <Contact /> },
  { path: 'policy', element: <Policy /> },
  { path: 'terms-and-conditions', element: <PolicyDocument type="TERMS" /> },
  { path: 'privacy-policy', element: <PolicyDocument type="PRIVACY" /> },
  { path: 'faq', element: <FAQ /> },
];

/** Routes that only make sense for a signed-out visitor — bounced elsewhere once authenticated. */
export const guestOnlyRoutes: AppRoute[] = [
  { path: 'login', element: <Login /> },
  { path: 'register', element: <Register /> },
];
