'use client';

import { useState } from 'react';
import AppShell from '../../components/AppShell';

export default function GitHubPage() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a GitHub and code expert. Help with code review, PR analysis, debugging, and development workflows. Be specific and provide code examples when relevant.' },
            { role: 'user', content: input },
          ],
          model: 'assist',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResponse(data);
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell activePage="github" title="GitHub & Code">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-1 hidden lg:block">GitHub & Copilot</h1>
          <p className="text-slate-500 text-sm mb-6 hidden lg:block">Code review, PR analysis, and AI-assisted development</p>

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: '🔍', label: 'Review Code', prompt: 'Review this code for bugs, security issues, and improvements:\n\n' },
              { icon: '📝', label: 'Write Tests', prompt: 'Write comprehensive tests for this code:\n\n' },
              { icon: '🐛', label: 'Debug', prompt: 'Help me debug this error:\n\n' },
              { icon: '📖', label: 'Explain', prompt: 'Explain this code in detail:\n\n' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => setInput(action.prompt)}
                className="bg-white rounded-xl border border-slate-200 p-3 text-center hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="text-xl mb-1">{action.icon}</div>
                <div className="text-xs font-medium text-slate-600">{action.label}</div>
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste code, describe a bug, or ask a development question…"
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="mt-3 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
            >
              {loading ? '🔄 Processing…' : '🚀 Submit'}
            </button>
          </div>

          {/* Response */}
          {response && !response.error && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm fade-in">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold text-slate-800">Response</h3>
                {response.routedTo && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                    via {response.routedTo}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">{response.content}</div>
            </div>
          )}

          {response?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">⚠️ {response.error}</div>
          )}

          {!response && !loading && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">🐙</div>
              <div className="text-sm">Paste code or describe a coding problem</div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
