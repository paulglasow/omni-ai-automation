'use client';

import { useState } from 'react';
import AppShell from '../../components/AppShell';

export default function WealthPage() {
  const [empowerData, setEmpowerData] = useState('');
  const [monarchData, setMonarchData] = useState('');
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleAnalyze() {
    if ((!empowerData.trim() && !monarchData.trim() && !question.trim()) || loading) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/wealth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empowerData: empowerData.trim() || null,
          monarchData: monarchData.trim() || null,
          question: question.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell activePage="wealth" title="Wealth & Finance">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-1 hidden lg:block">Wealth & Finance</h1>
          <p className="text-slate-500 text-sm mb-6 hidden lg:block">Paste data from Empower or Monarch for AI-powered financial analysis</p>

          {/* Data inputs */}
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div className="bg-white rounded-2xl border-2 border-emerald-200 p-4">
              <h3 className="text-sm font-bold text-emerald-700 mb-2">💚 Empower Data</h3>
              <textarea
                value={empowerData}
                onChange={(e) => setEmpowerData(e.target.value)}
                placeholder="Paste your Empower (Personal Capital) holdings, allocations, or account summary here…"
                rows={6}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <div className="bg-white rounded-2xl border-2 border-amber-200 p-4">
              <h3 className="text-sm font-bold text-amber-700 mb-2">🟡 Monarch Data</h3>
              <textarea
                value={monarchData}
                onChange={(e) => setMonarchData(e.target.value)}
                placeholder="Paste your Monarch Money cash flow, budget summary, or net worth breakdown here…"
                rows={6}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Ask a specific question (optional) — e.g., 'Should I rebalance my portfolio?'"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || (!empowerData.trim() && !monarchData.trim() && !question.trim())}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors mb-6"
          >
            {loading ? '🔄 Analyzing…' : '📊 Run Financial Analysis'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">⚠️ {error}</div>
          )}

          {/* Analysis result */}
          {analysis && (
            <div className="space-y-4 fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3">📊 Analysis</h3>
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{analysis.analysis}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                ⚠️ {analysis.disclaimer}
              </div>
            </div>
          )}

          {!analysis && !loading && (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">💰</div>
              <div className="text-sm">Paste financial data above for AI-powered analysis</div>
              <div className="text-xs mt-1">Supports Empower, Monarch, or any financial data</div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
