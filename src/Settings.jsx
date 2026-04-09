/**
 * src/Settings.jsx
 *
 * Settings page showing API configuration status and platform info.
 * Calls a lightweight /api/chat health check to verify provider connectivity.
 */

import { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext.jsx';

const PROVIDERS = [
  { key: 'openai', name: 'OpenAI (GPT-4o)', envVar: 'OPENAI_API_KEY' },
  { key: 'claude', name: 'Anthropic (Claude)', envVar: 'ANTHROPIC_API_KEY' },
  { key: 'gemini', name: 'Google (Gemini)', envVar: 'GEMINI_API_KEY' },
  { key: 'perplexity', name: 'Perplexity', envVar: 'PERPLEXITY_API_KEY' },
];

function StatusDot({ status }) {
  const colors = {
    checking: '#ffa726',
    ok: '#4caf50',
    error: '#ef5350',
    unknown: '#bbb',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: colors[status] || colors.unknown,
        marginRight: '8px',
        flexShrink: 0,
      }}
    />
  );
}

export default function Settings() {
  const { theme } = useTheme();
  const [sysPrompt, setSysPrompt] = useState(() => localStorage.getItem('omni_system_prompt') || '');
  const [promptSaved, setPromptSaved] = useState(false);
  const [providerStatus, setProviderStatus] = useState(
    Object.fromEntries(PROVIDERS.map((p) => [p.key, 'unknown']))
  );
  const [checking, setChecking] = useState(false);

  async function checkProviders() {
    setChecking(true);
    setProviderStatus(Object.fromEntries(PROVIDERS.map((p) => [p.key, 'checking'])));

    const token = localStorage.getItem('omni_device_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Test each provider with a minimal prompt
    const results = await Promise.allSettled(
      PROVIDERS.map(async (p) => {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              prompt: 'Reply with just the word OK.',
              model: p.key,
            }),
          });
          if (res.ok) return { key: p.key, status: 'ok' };
          const data = await res.json().catch(() => ({}));
          // If it's an API key error, mark as error; otherwise still "ok" (API works)
          if (data.error?.includes('API key') || data.error?.includes('not configured')) {
            return { key: p.key, status: 'error' };
          }
          return { key: p.key, status: 'ok' };
        } catch {
          return { key: p.key, status: 'error' };
        }
      })
    );

    const newStatus = {};
    for (const result of results) {
      if (result.status === 'fulfilled') {
        newStatus[result.value.key] = result.value.status;
      }
    }
    setProviderStatus(newStatus);
    setChecking(false);
  }

  useEffect(() => {
    checkProviders();
  // eslint-disable-next-line
  }, []);

  const connectedCount = Object.values(providerStatus).filter((s) => s === 'ok').length;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px', color: theme.text }}>
        Settings
      </h1>
      <p style={{ color: theme.textMuted, marginTop: 0, marginBottom: '28px' }}>
        Platform configuration and API provider status.
      </p>

      {/* Provider Status */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '0.85rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            AI Providers ({connectedCount}/{PROVIDERS.length} connected)
          </h2>
          <button
            onClick={checkProviders}
            disabled={checking}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              background: '#fff',
              cursor: checking ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              color: '#555',
            }}
          >
            {checking ? 'Checking...' : 'Re-check'}
          </button>
        </div>

        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          {PROVIDERS.map((p, i) => (
            <div
              key={p.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 18px',
                borderBottom: i < PROVIDERS.length - 1 ? `1px solid ${theme.borderLight}` : 'none',
              }}
            >
              <StatusDot status={providerStatus[p.key]} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: theme.text, fontSize: '0.95rem' }}>{p.name}</div>
                <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: '2px' }}>{p.envVar}</div>
              </div>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color:
                    providerStatus[p.key] === 'ok' ? '#4caf50' :
                    providerStatus[p.key] === 'error' ? '#ef5350' :
                    providerStatus[p.key] === 'checking' ? '#ffa726' : '#bbb',
                }}
              >
                {providerStatus[p.key] === 'ok' && 'Connected'}
                {providerStatus[p.key] === 'error' && 'Not configured'}
                {providerStatus[p.key] === 'checking' && 'Checking...'}
                {providerStatus[p.key] === 'unknown' && 'Unknown'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* System Prompt */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '0.85rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          System Prompt
        </h2>
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '16px' }}>
          <textarea
            value={sysPrompt}
            onChange={(e) => { setSysPrompt(e.target.value); setPromptSaved(false); }}
            placeholder="Enter a custom system prompt applied to all conversations (e.g., 'You are a senior financial analyst. Always provide data-driven recommendations.')"
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              background: theme.bgInput,
              color: theme.text,
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
            <button
              onClick={() => {
                localStorage.setItem('omni_system_prompt', sysPrompt);
                setPromptSaved(true);
                setTimeout(() => setPromptSaved(false), 2000);
              }}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#1976d2',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Save
            </button>
            {sysPrompt && (
              <button
                onClick={() => {
                  setSysPrompt('');
                  localStorage.removeItem('omni_system_prompt');
                  setPromptSaved(true);
                  setTimeout(() => setPromptSaved(false), 2000);
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  background: theme.bgCard,
                  color: theme.textSecondary,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Clear
              </button>
            )}
            {promptSaved && <span style={{ color: theme.costText, fontSize: '0.85rem' }}>Saved</span>}
          </div>
          <div style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: '8px' }}>
            This prompt is prepended to every conversation as a system message.
          </div>
        </div>
      </div>

      {/* Platform Info */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '0.85rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          Platform Info
        </h2>
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden' }}>
          {[
            ['Version', 'OmniAI v4'],
            ['Features', 'QA/QC chain, multi-file upload, PDF support, markdown rendering'],
            ['Routing', 'Weighted heuristic scoring across 6 categories'],
            ['Security', 'All AI API calls server-side, no keys exposed to browser'],
            ['Deployment', 'Vercel serverless functions'],
          ].map(([label, value], i) => (
            <div
              key={label}
              style={{
                display: 'flex',
                padding: '12px 18px',
                borderBottom: i < 4 ? `1px solid ${theme.borderLight}` : 'none',
              }}
            >
              <div style={{ width: '120px', flexShrink: 0, fontWeight: 600, color: theme.textSecondary, fontSize: '0.9rem' }}>
                {label}
              </div>
              <div style={{ color: '#333', fontSize: '0.9rem' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
