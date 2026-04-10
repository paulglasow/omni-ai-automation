/**
 * src/AuthPage.jsx
 *
 * Login/signup page with email+password authentication via Supabase.
 */

import { useState } from 'react';
import { useTheme } from './ThemeContext.jsx';

export default function AuthPage({ onAuth }) {
  const { theme } = useTheme();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

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

        {/* Tab toggle */}
        <div style={{ display: 'flex', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${theme.border}` }}>
          {['login', 'signup'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setMessage(null); }}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: mode === m ? '#1976d2' : theme.bgInput,
                color: mode === m ? '#fff' : theme.textSecondary,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'background 0.15s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: theme.textSecondary, marginBottom: '6px' }}>
              Email
            </label>
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
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
              placeholder="you@example.com"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: theme.textSecondary, marginBottom: '6px' }}>
              Password
            </label>
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
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
              placeholder={mode === 'signup' ? 'Min 6 characters' : 'Password'}
            />
          </div>

          {error && (
            <div style={{ background: theme.errorBg, color: theme.errorText, padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: theme.costBg, color: theme.costText, padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem' }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#90caf9' : '#1976d2',
              color: '#fff',
              fontSize: '1rem',
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
