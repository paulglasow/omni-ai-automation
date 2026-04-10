/**
 * src/AuthPage.jsx
 *
 * Login/signup page with Google OAuth and email+password via Supabase.
 */

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from './ThemeContext.jsx';

// Create a Supabase client for auth (uses public anon key, safe for frontend)
function getSupabaseClient() {
  const url = window.__SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = window.__SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: true } });
}

export default function AuthPage({ onAuth }) {
  const { theme } = useTheme();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleGoogleSignIn() {
    setError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to your environment.');
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
    }
    // Browser will redirect to Google, then back with tokens
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/web?action=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (data.token) {
        localStorage.setItem('omni_auth_token', data.token);
        if (data.user) localStorage.setItem('omni_user', JSON.stringify(data.user));
        onAuth(data.user, data.token);
      } else if (data.message) {
        setMessage(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: theme.bg,
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: '16px',
        padding: '32px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontWeight: 800, fontSize: '1.6rem', color: theme.text }}>
            Omni<span style={{ color: '#1976d2' }}>AI</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: theme.textMuted, marginTop: '4px' }}>
            Multi-AI Platform with QA/QC Analysis
          </div>
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleSignIn}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            background: theme.bgInput,
            color: theme.text,
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: theme.border }} />
          <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>or use email</span>
          <div style={{ flex: 1, height: '1px', background: theme.border }} />
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${theme.border}` }}>
          {['login', 'signup'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setMessage(null); }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                background: mode === m ? '#1976d2' : theme.bgInput,
                color: mode === m ? '#fff' : theme.textSecondary,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                background: theme.bgInput,
                color: theme.text,
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
              placeholder="Email"
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                background: theme.bgInput,
                color: theme.text,
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
              placeholder={mode === 'signup' ? 'Password (min 6 chars)' : 'Password'}
            />
          </div>

          {error && (
            <div style={{ background: theme.errorBg, color: theme.errorText, padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: theme.costBg, color: theme.costText, padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#90caf9' : '#1976d2',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Skip auth */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => onAuth(null, null)}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textMuted,
              cursor: 'pointer',
              fontSize: '0.8rem',
              textDecoration: 'underline',
            }}
          >
            Continue without signing in
          </button>
        </div>
      </div>
    </div>
  );
}
