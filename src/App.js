import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ThemeProvider } from './ThemeContext.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import AuthPage from './AuthPage.jsx';
import Layout from './Layout.jsx';
import Dashboard from './Dashboard.jsx';
import OmniAI from './OmniAI.jsx';
import Settings from './Settings.jsx';

// Supabase client for auth session management
function getSupabase() {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: true } });
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check for existing auth on mount — handles both email/password and Google OAuth
  useEffect(() => {
    const supabase = getSupabase();

    async function checkAuth() {
      if (supabase) {
        // This picks up OAuth redirects (Google sends tokens in URL hash)
        // and restores existing sessions from localStorage
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userData = { id: session.user.id, email: session.user.email };
          localStorage.setItem('omni_auth_token', session.access_token);
          localStorage.setItem('omni_user', JSON.stringify(userData));
          localStorage.setItem('omni_device_token', session.access_token);
          setUser(userData);
          setAuthChecked(true);
          return;
        }
      }

      // Fallback: check localStorage for existing session
      const token = localStorage.getItem('omni_auth_token');
      const savedUser = localStorage.getItem('omni_user');
      if (token && savedUser) {
        try { setUser(JSON.parse(savedUser)); } catch {}
      } else if (localStorage.getItem('omni_anonymous') === 'true') {
        setUser({ anonymous: true });
      } else {
        const deviceToken = localStorage.getItem('omni_device_token');
        if (deviceToken) setUser({ anonymous: true });
      }
      setAuthChecked(true);
    }

    checkAuth();

    // Listen for auth state changes (handles OAuth callback)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = { id: session.user.id, email: session.user.email };
          localStorage.setItem('omni_auth_token', session.access_token);
          localStorage.setItem('omni_user', JSON.stringify(userData));
          localStorage.setItem('omni_device_token', session.access_token);
          localStorage.removeItem('omni_anonymous');
          setUser(userData);
        }
        if (event === 'SIGNED_OUT') {
          handleLogout();
        }
      });
      return () => subscription?.unsubscribe();
    }
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
    const supabase = getSupabase();
    if (supabase) supabase.auth.signOut();
    localStorage.removeItem('omni_auth_token');
    localStorage.removeItem('omni_user');
    localStorage.removeItem('omni_device_token');
    localStorage.removeItem('omni_anonymous');
    setUser(null);
  }

  if (!authChecked) return null;

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
