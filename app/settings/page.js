'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import InviteCollaborator from '../../components/InviteCollaborator';

function ProviderCard({ provider }) {
  return (
    <div className={`
      rounded-2xl p-5 border transition-all
      ${provider.configured
        ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm'
        : 'border-slate-200 bg-white'
      }
    `}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-800">{provider.name}</h3>
        <span className={`
          px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
          ${provider.configured
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-100 text-slate-500'
          }
        `}>
          {provider.configured ? '● Active' : '○ Inactive'}
        </span>
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">{provider.bestFor}</p>
      {provider.note && (
        <p className="text-xs text-amber-700 mt-3 bg-amber-50 px-3 py-2 rounded-xl leading-relaxed">
          💡 {provider.note}
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  const configuredCount = status
    ? Object.values(status.providers).filter((p) => p.configured).length
    : 0;
  const totalCount = status ? Object.keys(status.providers).length : 0;

  return (
    <div className="flex h-[100dvh]">
      <Sidebar
        activePage="settings"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white safe-top sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-semibold text-slate-800">Settings</h1>
        </div>

        <div className="p-6 sm:p-8 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-1 hidden lg:block">Settings</h1>
          <p className="text-slate-500 text-sm mb-8 hidden lg:block">
            AI provider status and configuration
          </p>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : !status ? (
            <div className="bg-red-50 text-red-700 p-5 rounded-2xl text-sm">
              Failed to load provider status.
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1">
                    {Array.from({ length: totalCount }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full border-2 border-white ${
                          i < configuredCount ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-blue-900 text-sm">
                    {configuredCount}/{totalCount} providers active
                  </span>
                </div>
                {configuredCount < totalCount && (
                  <p className="text-xs text-blue-600 mt-2">
                    Add missing keys to <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">.env.local</code> and restart
                  </p>
                )}
              </div>

              {/* Provider cards */}
              <div className="space-y-3 mb-10">
                {Object.entries(status.providers).map(([key, provider]) => (
                  <ProviderCard key={key} provider={provider} />
                ))}
              </div>

              {/* Database */}
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Database</h2>
              <div className={`
                rounded-2xl p-5 border mb-10
                ${status.supabase.configured
                  ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white'
                  : 'border-slate-200 bg-white'
                }
              `}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">Supabase</h3>
                    <p className="text-sm text-slate-500 mt-1">Database, auth, file storage & real-time sync</p>
                  </div>
                  <span className={`
                    px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${status.supabase.configured
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                    }
                  `}>
                    {status.supabase.configured ? '● Connected' : '○ Disconnected'}
                  </span>
                </div>
              </div>

              {/* Collaboration */}
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Collaboration</h2>
              <div className="rounded-2xl bg-white border border-slate-200 p-5 mb-10">
                <h3 className="font-semibold text-slate-800 mb-3">Invite Collaborators</h3>
                <InviteCollaborator workspaceId={null} />
              </div>

              {/* How Assist works */}
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">How Assist Works</h2>
              <div className="rounded-2xl bg-white border border-slate-200 p-5 text-sm text-slate-600 space-y-3">
                <p className="font-medium text-slate-800">
                  Assist analyzes your message and routes to the best AI:
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { icon: '🔍', label: 'Research', target: 'Perplexity', fallback: 'GPT-4o if unavailable' },
                    { icon: '💻', label: 'Code & debugging', target: 'GPT-4o', fallback: '' },
                    { icon: '✍️', label: 'Writing & analysis', target: 'GPT-4o', fallback: '' },
                    { icon: '📊', label: 'Data & GIS', target: 'Gemini', fallback: '' },
                  ].map((r) => (
                    <div key={r.label} className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                      <span>{r.icon}</span>
                      <div>
                        <div className="font-medium text-slate-700 text-xs">{r.label}</div>
                        <div className="text-slate-500 text-xs">→ {r.target}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 pt-1">
                  Works with any combination of providers. The more you have, the smarter the routing.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
