import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminProtectedRoute } from '@/routes/AdminProtectedRoute';
import { publicRoutes } from '@/routes/public';
import { clientRoutes } from '@/routes/client';
import { adminRoutes } from '@/routes/admin';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import AdminLogin from '@/pages/admin/AdminLogin';
import NotFound from '@/pages/NotFound';

/** The full route tree. Kept out of `App.tsx` so that file only owns providers/theme setup. */
export function RouteMain() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {publicRoutes.map(({ path, index, element }) => (
          <Route key={path ?? 'index'} index={index} path={path} element={element} />
        ))}

        <Route element={<ProtectedRoute />}>
          {clientRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Route>
      </Route>

      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          {adminRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
