/**
 * src/Dashboard.jsx
 *
 * Dashboard page with live stats, quick actions, and recent activity.
 * Fetches data from /api/usage and /api/workspaces.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        flex: '1 1 180px',
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: '12px',
        padding: '20px',
        minWidth: '180px',
      }}
    >
      <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: color || '#222' }}>
        {value}
      </div>
    </div>
  );
}

function QuickAction({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: '1 1 180px',
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: '10px',
        padding: '14px 18px',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '0.95rem',
        fontWeight: 500,
        color: '#333',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        minWidth: '180px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#1976d2';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(25,118,210,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e8e8e8';
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
      {/* Greeting */}
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px', color: '#222' }}>
        {getGreeting()}
      </h1>
      <p style={{ color: '#888', marginTop: 0, marginBottom: '28px' }}>
        Here's your overview for today.
      </p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <StatCard
          label="Total Requests"
          value={loading ? '...' : stats.totalRequests.toLocaleString()}
        />
        <StatCard
          label="Total Cost"
          value={loading ? '...' : `$${stats.totalCost.toFixed(4)}`}
          color="#2e7d32"
        />
        <StatCard
          label="Workspaces"
          value={loading ? '...' : workspaceCount}
        />
        <StatCard
          label="AI Providers"
          value={providerCount}
        />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <QuickAction label="New QA/QC Chat" onClick={() => navigate('/chat')} />
          <QuickAction label="Upload Files for Analysis" onClick={() => navigate('/chat')} />
          <QuickAction label="View Settings" onClick={() => navigate('/settings')} />
        </div>
      </div>

      {/* Model usage breakdown */}
      {!loading && Object.keys(stats.modelBreakdown).length > 0 && (
        <div>
          <h2 style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Usage by Provider
          </h2>
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px', overflow: 'hidden' }}>
            {Object.entries(stats.modelBreakdown).map(([provider, data], i) => (
              <div
                key={provider}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 18px',
                  borderBottom: i < Object.keys(stats.modelBreakdown).length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: '#333' }}>{provider.toUpperCase()}</span>
                  <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: '12px' }}>
                    {data.requests ?? 0} requests
                  </span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#2e7d32' }}>
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
