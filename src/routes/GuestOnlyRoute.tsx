import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '@/contexts/AuthContext';

/** Guards login/register from an already-authenticated user, the inverse of `ProtectedRoute`. */
export function GuestOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const [searchParams] = useSearchParams();

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    const raw = searchParams.get('redirect');
    let returnTo = '/';
    if (raw) {
      try {
        returnTo = decodeURIComponent(raw);
      } catch {
        returnTo = '/';
      }
    }
    return <Navigate to={returnTo} replace />;
  }

  return <Outlet />;
}
