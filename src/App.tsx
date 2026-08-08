import { BrowserRouter } from 'react-router-dom';
import { App as AntdApp, ConfigProvider } from 'antd';
import { ANTD_THEME } from '@/constants';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { RouteMain } from '@/routes/RouteMain';

function App() {
  return (
    <ConfigProvider theme={ANTD_THEME}>
      <AntdApp>
        <BrowserRouter>
          <AdminAuthProvider>
            <AuthProvider>
              <CartProvider>
                <RouteMain />
              </CartProvider>
            </AuthProvider>
          </AdminAuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
