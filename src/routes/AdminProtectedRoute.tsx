import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

/** Guards /admin/* routes, mirroring admin/admin_auth.php. */
export function AdminProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAdminAuth();

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
