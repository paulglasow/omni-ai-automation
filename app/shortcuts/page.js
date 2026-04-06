'use client';

import { useState } from 'react';
import AppShell from '../../components/AppShell';

const SHORTCUTS = [
  {
    name: 'Morning Brief',
    icon: '🌅',
    siri: 'Hey Siri, morning brief',
    description: 'Prioritized daily briefing with tasks, calendar & AI schedule',
    action: 'morning_brief',
    color: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
    testData: { calendar: 'Team standup 9am, Design review 2pm, Client call 4pm' },
    resultKey: 'briefing',
  },
  {
    name: 'Quick Task',
    icon: '✅',
    siri: 'Hey Siri, add task',
    description: 'Dictate a task — AI auto-determines priority',
    action: 'quick_task',
    color: 'from-emerald-500 to-green-500',
    bgLight: 'bg-emerald-50',
    testData: { text: 'Review Q2 budget proposal before Friday meeting' },
    resultKey: 'message',
  },
  {
    name: 'Process Email',
    icon: '📧',
    siri: 'Hey Siri, process email',
    description: 'Summarize, extract actions & draft a reply',
    action: 'process_email',
    color: 'from-blue-500 to-indigo-500',
    bgLight: 'bg-blue-50',
    testData: { email: 'Hi Paul, the zoning board approved the variance request for the Elm Street project. We need to update the site plan by next Wednesday and schedule a pre-construction meeting. Can you coordinate with the engineering team? Thanks, Sarah' },
    resultKey: 'analysis',
  },
  {
    name: 'Ask AI',
    icon: '🤖',
    siri: 'Hey Siri, ask OmniAI',
    description: 'Ask anything — routes to the best AI automatically',
    action: 'ask_ai',
    color: 'from-purple-500 to-violet-500',
    bgLight: 'bg-purple-50',
    testData: { question: 'What are 3 strategies for effective time management?' },
    resultKey: 'answer',
  },
  {
    name: 'End of Day',
    icon: '🌙',
    siri: 'Hey Siri, end of day',
    description: 'Review accomplishments & plan tomorrow',
    action: 'end_of_day',
    color: 'from-slate-600 to-slate-800',
    bgLight: 'bg-slate-50',
    testData: {},
    resultKey: 'review',
  },
  {
    name: 'Meeting Prep',
    icon: '🎙️',
    siri: 'Hey Siri, prep for meeting',
    description: 'Talking points, questions & notes template',
    action: 'meeting_prep',
    color: 'from-rose-500 to-pink-500',
    bgLight: 'bg-rose-50',
    testData: { meeting: 'Weekly planning meeting — discuss Q2 roadmap priorities and resource allocation' },
    resultKey: 'prep',
  },
];

function ShortcutCard({ shortcut }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  async function handleTest() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch('/api/shortcuts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: shortcut.action, data: shortcut.testData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult({ success: true, text: data[shortcut.resultKey] || JSON.stringify(data) });
    } catch (err) {
      setResult({ success: false, text: err.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="group relative">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300">
        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${shortcut.color} px-5 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl drop-shadow-sm">{shortcut.icon}</span>
            <div>
              <h3 className="font-bold text-white text-lg">{shortcut.name}</h3>
              <p className="text-white/70 text-xs font-mono">"{shortcut.siri}"</p>
            </div>
          </div>
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/30 active:scale-95 disabled:opacity-50 transition-all border border-white/20"
          >
            {testing ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running…
              </span>
            ) : '▶ Test'}
          </button>
        </div>

        {/* Description */}
        <div className="px-5 py-3">
          <p className="text-sm text-slate-600">{shortcut.description}</p>
        </div>

        {/* Test result */}
        {result && (
          <div className={`mx-4 mb-4 rounded-xl p-4 fade-in ${result.success ? 'bg-slate-50 border border-slate-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${result.success ? 'text-emerald-600' : 'text-red-600'}`}>
                {result.success ? '✓ Response' : '✗ Error'}
              </span>
              <button
                onClick={() => setResult(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>
            <div className={`text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-hide ${result.success ? 'text-slate-700' : 'text-red-700'}`}>
              {result.text}
            </div>
          </div>
        )}

        {/* Setup toggle */}
        <button
          onClick={() => setShowSetup(!showSetup)}
          className="w-full px-5 py-3 border-t border-slate-100 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
        >
          <svg className={`w-3 h-3 transition-transform ${showSetup ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
          How to set up this Shortcut
        </button>

        {showSetup && (
          <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/50 fade-in">
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 mt-0.5">1</span>
                <p className="text-sm text-slate-600">Open the <strong>Shortcuts</strong> app on your iPhone or Mac</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 mt-0.5">2</span>
                <p className="text-sm text-slate-600">Tap <strong>+</strong> to create a new shortcut, name it <strong>"{shortcut.name}"</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 mt-0.5">3</span>
                <p className="text-sm text-slate-600">Add <strong>"Get Contents of URL"</strong> action with these settings:</p>
              </div>
              <div className="ml-9 bg-white rounded-xl border border-slate-200 p-4 font-mono text-xs space-y-2">
                <div><span className="text-slate-400">URL:</span> <span className="text-blue-600">https://omni-ai-automation-two.vercel.app/api/shortcuts</span></div>
                <div><span className="text-slate-400">Method:</span> <span className="text-slate-700">POST</span></div>
                <div><span className="text-slate-400">Headers:</span> <span className="text-slate-700">Content-Type = application/json</span></div>
                <div><span className="text-slate-400">Body (JSON):</span></div>
                <pre className="text-slate-700 bg-slate-50 rounded-lg p-2 overflow-x-auto">{`{"action":"${shortcut.action}","data":{}}`}</pre>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 mt-0.5">4</span>
                <p className="text-sm text-slate-600">Add <strong>"Get Value for Key"</strong> → key: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">{shortcut.resultKey}</code></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 mt-0.5">5</span>
                <p className="text-sm text-slate-600">Add <strong>"Speak Text"</strong> or <strong>"Show Result"</strong></p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
              ⚠️ Vercel free tier has a 10-second timeout. For best results, test locally or upgrade to Vercel Pro ($20/mo).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShortcutsPage() {
  return (
    <AppShell activePage="shortcuts" title="Siri & Shortcuts">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-3xl mx-auto">
          {/* Hero */}
          <div className="mb-8 hidden lg:block">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Siri & Shortcuts</h1>
            <p className="text-slate-500">
              Control OmniAI with your voice on iPhone, iPad, and Mac
            </p>
          </div>

          {/* How it works */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 mb-8 text-white">
            <h2 className="font-bold text-lg mb-4">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                <div>
                  <div className="font-medium text-sm">Say it</div>
                  <div className="text-xs text-white/60">"Hey Siri, morning brief"</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                <div>
                  <div className="font-medium text-sm">AI processes</div>
                  <div className="text-xs text-white/60">Pulls tasks, calendar, runs AI analysis</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                <div>
                  <div className="font-medium text-sm">Get results</div>
                  <div className="text-xs text-white/60">Siri reads your prioritized plan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Shortcut cards */}
          <div className="grid gap-5">
            {SHORTCUTS.map((shortcut) => (
              <ShortcutCard key={shortcut.action} shortcut={shortcut} />
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center text-xs text-slate-400 pb-8">
            All shortcuts call your secure API — AI keys never leave the server.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
