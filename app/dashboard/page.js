'use client';

import { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl ${color}`}>
          {icon}
        </span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </div>
  );
}

function QuickAction({ icon, label, href }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:shadow-md hover:border-blue-200 transition-all"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </a>
  );
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    fetch('/api/tasks').then((r) => r.json()).then((d) => setTasks(d.tasks || [])).catch(() => {});
    fetch('/api/conversations').then((r) => r.json()).then((d) => setConversations(d.conversations || [])).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const pendingTasks = tasks.filter((t) => !t.done).length;

  return (
    <AppShell activePage="dashboard" title="Dashboard">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-4xl mx-auto">
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{greeting()} 👋</h1>
            <p className="text-slate-500 mt-1">Here's your overview for today.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon="✅" label="Pending Tasks" value={pendingTasks} color="bg-blue-50" />
            <StatCard icon="💬" label="Conversations" value={conversations.length} color="bg-purple-50" />
            <StatCard icon="📁" label="Workspaces" value="—" color="bg-amber-50" />
            <StatCard icon="🤖" label="AI Providers" value="4" color="bg-emerald-50" />
          </div>

          {/* Quick Actions */}
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <QuickAction icon="💬" label="New Chat" href="/chat" />
            <QuickAction icon="✅" label="Add Task" href="/tasks" />
            <QuickAction icon="🎙️" label="Meeting Notes" href="/meetings" />
            <QuickAction icon="💰" label="Wealth Review" href="/wealth" />
          </div>

          {/* Recent Tasks */}
          {tasks.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Tasks</h2>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 mb-8">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="px-5 py-3 flex items-center gap-3">
                    <span className={`text-lg ${task.done ? 'opacity-40' : ''}`}>
                      {task.done ? '✓' : '○'}
                    </span>
                    <span className={`text-sm flex-1 ${task.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {task.text}
                    </span>
                    {task.priority && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        task.priority === 'high' ? 'bg-red-50 text-red-600' :
                        task.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
