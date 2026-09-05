import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { App as AntdApp, ConfigProvider } from 'antd';
import { Auth0Provider } from '@auth0/auth0-react';
import type { AppState } from '@auth0/auth0-react';
import { ANTD_THEME } from '@/constants';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { RouteMain } from '@/routes/RouteMain';

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;

/**
 * Auth0Provider needs router context to restore the pre-login route after Universal Login
 * redirects back (`appState.returnTo`) — so it's nested inside BrowserRouter and restores the
 * URL via `useNavigate` rather than a raw `window.history` call, which would desync React
 * Router's internal state from the URL bar (RR doesn't observe history mutations it didn't
 * make itself).
 */
function Auth0ProviderWithNavigate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const onRedirectCallback = useCallback(
    (appState?: AppState) => {
      navigate(appState?.returnTo ?? window.location.pathname, { replace: true });
    },
    [navigate],
  );

  // Belt-and-suspenders alongside vite.config.ts's build-time check (which should already have
  // caught this in CI) — if a deployment still ships without these, render a clear error instead
  // of silently mounting Auth0Provider with domain="undefined", which sends login to
  // https://undefined/authorize.
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_AUDIENCE) {
    const missing = [
      !AUTH0_DOMAIN && 'VITE_AUTH0_DOMAIN',
      !AUTH0_CLIENT_ID && 'VITE_AUTH0_CLIENT_ID',
      !AUTH0_AUDIENCE && 'VITE_AUTH0_AUDIENCE',
    ].filter(Boolean);
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '0 auto' }}>
        <h1>Configuration error</h1>
        <p>
          Missing required environment variable(s): <strong>{missing.join(', ')}</strong>. Set these in this
          deployment&apos;s environment and redeploy.
        </p>
      </div>
    );
  }

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{ redirect_uri: window.location.origin, audience: AUTH0_AUDIENCE }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
}

function App() {
  return (
    <ConfigProvider theme={ANTD_THEME}>
      <AntdApp>
        <BrowserRouter>
          <Auth0ProviderWithNavigate>
            <AdminAuthProvider>
              <AuthProvider>
                <RouteMain />
              </AuthProvider>
            </AdminAuthProvider>
          </Auth0ProviderWithNavigate>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
