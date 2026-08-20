import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

/** Guards /admin/* routes, mirroring admin/admin_auth.php. Also bounces a plain CUSTOMER back
 *  to the admin login — under one shared Auth0 session, any logged-in visitor is "authenticated",
 *  so `isAuthenticated` alone would let a customer reach the admin UI shell. This is a UX guard
 *  only; every backend request still independently enforces RBAC regardless of what this checks. */
export function AdminProtectedRoute() {
  const { admin, isAuthenticated, isInitializing } = useAdminAuth();

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated || admin?.role === 'CUSTOMER') {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
