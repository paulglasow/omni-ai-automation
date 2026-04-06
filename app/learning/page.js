'use client';

import { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';

export default function LearningPage() {
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/learning').then((r) => r.json()).then((d) => setTopics(d.topics || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function addTopic() {
    if (!newTopic.trim()) return;
    const res = await fetch('/api/learning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTopic.trim() }),
    });
    const data = await res.json();
    if (data.topic) { setTopics((prev) => [data.topic, ...prev]); setNewTopic(''); }
  }

  async function updateProgress(id, progress) {
    setTopics((prev) => prev.map((t) => t.id === id ? { ...t, progress } : t));
    await fetch('/api/learning', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, progress }),
    }).catch(() => {});
  }

  return (
    <AppShell activePage="learning" title="Learning">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-1 hidden lg:block">Learning</h1>
          <p className="text-slate-500 text-sm mb-6 hidden lg:block">Track topics, progress, and notes</p>

          {/* Add topic */}
          <div className="flex gap-2 mb-6">
            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTopic()}
              placeholder="Add a learning topic…"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <button onClick={addTopic} disabled={!newTopic.trim()} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400">
              Add
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : topics.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">📚</div>
              <div>No topics yet. Start learning something new!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {topics.map((topic) => (
                <div key={topic.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">{topic.name}</h3>
                    <span className="text-xs font-mono text-slate-400">{topic.progress}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="relative h-2 bg-slate-100 rounded-full mb-3 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${topic.progress}%` }}
                    />
                  </div>
                  {/* Progress buttons */}
                  <div className="flex gap-2">
                    {[0, 25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        onClick={() => updateProgress(topic.id, val)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                          topic.progress === val
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                  {topic.notes && (
                    <p className="text-xs text-slate-500 mt-3 bg-slate-50 rounded-xl p-3">{topic.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
