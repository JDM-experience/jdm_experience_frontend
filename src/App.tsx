import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { App as AntdApp, ConfigProvider } from 'antd';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminProtectedRoute } from '@/routes/AdminProtectedRoute';
import { MainLayout } from '@/layouts/MainLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

import Home from '@/pages/Home';
import Tours from '@/pages/Tours';
import TourDetail from '@/pages/TourDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import ThankYou from '@/pages/ThankYou';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import MyOrders from '@/pages/MyOrders';
import Receipt from '@/pages/Receipt';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Policy from '@/pages/Policy';
import NotFound from '@/pages/NotFound';

import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminTours from '@/pages/admin/Tours';
import AdminOrders from '@/pages/admin/Orders';
import AdminOrderReceipt from '@/pages/admin/OrderReceipt';
import AdminCustomers from '@/pages/admin/Customers';
import AdminCustomerDetail from '@/pages/admin/CustomerDetail';
import AdminMessages from '@/pages/admin/Messages';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#000000',
          borderRadius: 6,
          fontFamily: "'Segoe UI', Roboto, -apple-system, sans-serif",
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <AdminAuthProvider>
            <AuthProvider>
              <CartProvider>
                <Routes>
                  <Route element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="tours" element={<Tours />} />
                    <Route path="tours/:id" element={<TourDetail />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="thank-you/:orderId" element={<ThankYou />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="policy" element={<Policy />} />

                    <Route element={<ProtectedRoute />}>
                      <Route path="checkout" element={<Checkout />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="my-orders" element={<MyOrders />} />
                      <Route path="receipt/:orderId" element={<Receipt />} />
                    </Route>
                  </Route>

                  <Route path="admin/login" element={<AdminLogin />} />
                  <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route element={<AdminProtectedRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="admin/dashboard" element={<AdminDashboard />} />
                      <Route path="admin/tours" element={<AdminTours />} />
                      <Route path="admin/orders" element={<AdminOrders />} />
                      <Route path="admin/receipt/:orderId" element={<AdminOrderReceipt />} />
                      <Route path="admin/customers" element={<AdminCustomers />} />
                      <Route path="admin/customers/:customerId" element={<AdminCustomerDetail />} />
                      <Route path="admin/messages" element={<AdminMessages />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </CartProvider>
            </AuthProvider>
          </AdminAuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
