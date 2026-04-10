import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import AuthPage from './AuthPage.jsx';
import Layout from './Layout.jsx';
import Dashboard from './Dashboard.jsx';
import OmniAI from './OmniAI.jsx';
import Settings from './Settings.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('omni_auth_token');
    const savedUser = localStorage.getItem('omni_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    } else if (localStorage.getItem('omni_anonymous') === 'true') {
      // Restore anonymous session
      setUser({ anonymous: true });
    } else {
      // Also check for legacy device token
      const deviceToken = localStorage.getItem('omni_device_token');
      if (deviceToken) {
        setUser({ anonymous: true });
      }
    }
    setAuthChecked(true);
  }, []);

  function handleAuth(userData, token) {
    const resolvedUser = userData || { anonymous: true };
    setUser(resolvedUser);
    if (token) {
      localStorage.setItem('omni_device_token', token);
    }
    if (resolvedUser.anonymous) {
      localStorage.setItem('omni_anonymous', 'true');
    }
    if (userData && !userData.anonymous) {
      localStorage.setItem('omni_user', JSON.stringify(userData));
    }
  }

  function handleLogout() {
    localStorage.removeItem('omni_auth_token');
    localStorage.removeItem('omni_user');
    localStorage.removeItem('omni_device_token');
    localStorage.removeItem('omni_anonymous');
    setUser(null);
  }

  if (!authChecked) return null; // Don't flash UI before auth check

  return (
    <ThemeProvider>
      <ErrorBoundary>
        {!user ? (
          <AuthPage onAuth={handleAuth} />
        ) : (
          <BrowserRouter>
            <Routes>
              <Route element={<Layout user={user} onLogout={handleLogout} />}>
                <Route index element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<OmniAI />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        )}
      </ErrorBoundary>
    </ThemeProvider>
  );
}
