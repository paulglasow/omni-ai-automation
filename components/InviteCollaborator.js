'use client';

import { useState } from 'react';

const ROLES = [
  { value: 'viewer', label: 'Viewer', desc: 'Can view files and analyses' },
  { value: 'editor', label: 'Editor', desc: 'Can upload files and run analyses' },
  { value: 'admin', label: 'Admin', desc: 'Full access including invites' },
];

export default function InviteCollaborator({ workspaceId, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleInvite() {
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      setEmail('');
      onInvited?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!workspaceId) {
    return (
      <div className="text-sm text-slate-400 text-center py-4">
        Select a workspace first to invite collaborators
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          placeholder="Email address…"
          type="email"
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-2 py-2 rounded-xl border border-slate-200 text-sm bg-white"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <button
          onClick={handleInvite}
          disabled={loading || !email.trim()}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          {loading ? '…' : 'Invite'}
        </button>
      </div>

      {message && (
        <div className="text-sm text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">✓ {message}</div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">⚠️ {error}</div>
      )}

      <div className="text-xs text-slate-400">
        Collaborators must have signed into OmniAI at least once before they can be invited.
      </div>
    </div>
  );
}
