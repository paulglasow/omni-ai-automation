'use client';

import { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import { subscribeToTasks } from '../../lib/supabase/realtime';

const PRIORITIES = [
  { value: 'high', label: 'High', color: 'bg-red-50 text-red-600 border-red-200' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { value: 'low', label: 'Low', color: 'bg-slate-50 text-slate-500 border-slate-200' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Real-time sync — tasks update across devices
    const unsubscribe = subscribeToTasks((event, newRow, oldRow) => {
      if (event === 'INSERT') {
        setTasks((prev) => {
          if (prev.some((t) => t.id === newRow.id)) return prev;
          return [newRow, ...prev];
        });
      } else if (event === 'UPDATE') {
        setTasks((prev) => prev.map((t) => t.id === newRow.id ? newRow : t));
      } else if (event === 'DELETE') {
        setTasks((prev) => prev.filter((t) => t.id !== oldRow.id));
      }
    });
    return () => unsubscribe();
  }, []);

  async function addTask() {
    if (!newTask.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTask.trim(), priority }),
      });
      const data = await res.json();
      if (data.task) {
        setTasks((prev) => [data.task, ...prev]);
        setNewTask('');
      }
    } catch {} finally { setAdding(false); }
  }

  async function toggleTask(id, done) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done } : t));
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done }),
    }).catch(() => {});
  }

  const pending = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done);

  return (
    <AppShell activePage="tasks" title="Tasks">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-1 hidden lg:block">Tasks</h1>
          <p className="text-slate-500 text-sm mb-6 hidden lg:block">Priority task manager with AI scheduling</p>

          {/* Add task */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
            <div className="flex gap-2">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Add a new task…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <button
                onClick={addTask}
                disabled={adding || !newTask.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
              >
                {adding ? '…' : 'Add'}
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    priority === p.value ? p.color + ' ring-1 ring-current' : 'bg-white text-slate-400 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : (
            <>
              {/* Pending */}
              {pending.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Pending ({pending.length})
                  </h2>
                  <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                    {pending.map((task) => (
                      <div key={task.id} className="px-4 py-3.5 flex items-center gap-3">
                        <button
                          onClick={() => toggleTask(task.id, true)}
                          className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-blue-500 transition-colors flex-shrink-0"
                        />
                        <span className="text-sm text-slate-700 flex-1">{task.text}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          task.priority === 'high' ? 'bg-red-50 text-red-600' :
                          task.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed */}
              {completed.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Completed ({completed.length})
                  </h2>
                  <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 opacity-60">
                    {completed.map((task) => (
                      <div key={task.id} className="px-4 py-3 flex items-center gap-3">
                        <button
                          onClick={() => toggleTask(task.id, false)}
                          className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs"
                        >
                          ✓
                        </button>
                        <span className="text-sm text-slate-400 line-through flex-1">{task.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tasks.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <div className="text-4xl mb-3">✅</div>
                  <div>No tasks yet. Add one above!</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
