'use client';

import { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    fetch('/api/meetings').then((r) => r.json()).then((d) => setMeetings(d.meetings || [])).catch(() => {}).finally(() => setPageLoading(false));
  }, []);

  async function handleSubmit(analyze = false) {
    if (!content.trim() || loading) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'Untitled Meeting', content, analyze }),
      });
      const data = await res.json();
      if (data.meeting) setMeetings((prev) => [data.meeting, ...prev]);
      if (data.analysis) setAnalysis(data.analysis);
      if (!analyze) { setTitle(''); setContent(''); }
    } catch {} finally { setLoading(false); }
  }

  return (
    <AppShell activePage="meetings" title="Meetings">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-1 hidden lg:block">Meetings</h1>
          <p className="text-slate-500 text-sm mb-6 hidden lg:block">Paste a transcript → AI extracts action items, decisions, and follow-ups</p>

          {/* Input */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meeting title (optional)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste meeting transcript or notes here…"
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading || !content.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
              >
                {loading ? 'Analyzing…' : '🔍 Analyze with AI'}
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading || !content.trim()}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Save Only
              </button>
            </div>
          </div>

          {/* Analysis result */}
          {analysis && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5 mb-6 fade-in">
              <h3 className="text-sm font-bold text-blue-800 mb-3">📋 AI Analysis</h3>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{analysis}</div>
            </div>
          )}

          {/* Past meetings */}
          {meetings.length > 0 && (
            <>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Past Meetings</h2>
              <div className="space-y-3">
                {meetings.map((m) => (
                  <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm text-slate-800">{m.title || 'Untitled'}</h3>
                      <span className="text-[10px] text-slate-400">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{m.content}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {!pageLoading && meetings.length === 0 && !analysis && (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">🎙️</div>
              <div>No meetings yet. Paste a transcript above!</div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
