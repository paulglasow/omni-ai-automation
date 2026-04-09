/**
 * src/Dashboard.jsx
 *
 * Dashboard page with live stats, quick actions, and recent activity.
 * Fetches data from /api/usage and /api/workspaces.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext.jsx';

function SkeletonBar({ width, height, theme }) {
  return (
    <div
      style={{
        width: width || '60%',
        height: height || '24px',
        borderRadius: '6px',
        background: `linear-gradient(90deg, ${theme.borderLight} 25%, ${theme.border} 50%, ${theme.borderLight} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

function StatCard({ label, value, color, theme }) {
  return (
    <div
      style={{
        flex: '1 1 180px',
        background: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '20px',
        minWidth: '180px',
      }}
    >
      <div style={{ fontSize: '0.8rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: color || theme.text }}>
        {value}
      </div>
    </div>
  );
}

function QuickAction({ label, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: '1 1 180px',
        background: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: '10px',
        padding: '14px 18px',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '0.95rem',
        fontWeight: 500,
        color: theme.text,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        minWidth: '180px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#1976d2';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(25,118,210,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {label}
    </button>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [stats, setStats] = useState({ totalRequests: 0, totalCost: 0, modelBreakdown: {} });
  const [workspaceCount, setWorkspaceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('omni_device_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch usage stats and workspace count in parallel
    Promise.allSettled([
      fetch('/api/usage/personal', { headers }).then((r) => r.ok ? r.json() : null),
      fetch('/api/workspaces', { headers }).then((r) => r.ok ? r.json() : null),
    ]).then(([usageResult, wsResult]) => {
      if (usageResult.status === 'fulfilled' && usageResult.value) {
        const u = usageResult.value;
        setStats({
          totalRequests: u.totalRequests ?? 0,
          totalCost: u.totalEstimatedCostUsd ?? 0,
          modelBreakdown: u.byModel ?? {},
        });
      }
      if (wsResult.status === 'fulfilled' && wsResult.value?.workspaces) {
        setWorkspaceCount(wsResult.value.workspaces.length);
      }
      setLoading(false);
    });
  }, []);

  const providerCount = Object.keys(stats.modelBreakdown).length || 4;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      {/* Greeting */}
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px', color: theme.text }}>
        {getGreeting()}
      </h1>
      <p style={{ color: theme.textMuted, marginTop: 0, marginBottom: '28px' }}>
        Here's your overview for today.
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <StatCard theme={theme}
          label="Total Requests"
          value={loading ? <SkeletonBar theme={theme} width="50px" /> : stats.totalRequests.toLocaleString()}
        />
        <StatCard theme={theme}
          label="Total Cost"
          value={loading ? <SkeletonBar theme={theme} width="80px" /> : `$${stats.totalCost.toFixed(4)}`}
          color={theme.costText}
        />
        <StatCard theme={theme}
          label="Workspaces"
          value={loading ? <SkeletonBar theme={theme} width="30px" /> : workspaceCount}
        />
        <StatCard theme={theme}
          label="AI Providers"
          value={providerCount}
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '0.85rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <QuickAction theme={theme} label="New QA/QC Chat" onClick={() => navigate('/chat')} />
          <QuickAction theme={theme} label="Upload Files for Analysis" onClick={() => navigate('/chat')} />
          <QuickAction theme={theme} label="View Settings" onClick={() => navigate('/settings')} />
        </div>
      </div>

      {/* Model usage breakdown */}
      {!loading && Object.keys(stats.modelBreakdown).length > 0 && (
        <div>
          <h2 style={{ fontSize: '0.85rem', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Usage by Provider
          </h2>
          <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden' }}>
            {Object.entries(stats.modelBreakdown).map(([provider, data], i) => (
              <div
                key={provider}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 18px',
                  borderBottom: i < Object.keys(stats.modelBreakdown).length - 1 ? `1px solid ${theme.borderLight}` : 'none',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: theme.text }}>{provider.toUpperCase()}</span>
                  <span style={{ color: theme.textMuted, fontSize: '0.85rem', marginLeft: '12px' }}>
                    {data.requests ?? 0} requests
                  </span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: theme.costText }}>
                  ${(data.estimatedCostUsd ?? 0).toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && stats.totalRequests === 0 && (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🚀</div>
          <div>No usage data yet. Start a chat to see your stats here.</div>
        </div>
      )}
    </div>
  );
}
