'use client';

import { useState, useEffect } from 'react';

export default function WorkspaceSelector({ activeId, onChange }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data) => setWorkspaces(data.workspaces || []))
      .catch(() => {});
  }, []);

  async function handleCreate() {
    if (!newName.trim() || creating) return;
    setCreating(true);

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.workspace) {
        setWorkspaces((prev) => [data.workspace, ...prev]);
        onChange(data.workspace.id);
        setNewName('');
        setShowCreate(false);
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={activeId || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm bg-white"
      >
        <option value="">Personal</option>
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name}
          </option>
        ))}
      </select>

      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="text-xs text-gray-500 hover:text-blue-600 px-1"
          title="Create workspace"
        >
          +
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Name…"
            className="px-2 py-1 text-sm border border-gray-300 rounded w-32"
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? '…' : 'Create'}
          </button>
          <button
            onClick={() => { setShowCreate(false); setNewName(''); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
