'use client';

import { useState, useEffect } from 'react';

export default function ConversationList({ activeId, onSelect, onNew }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/conversations')
      .then((r) => r.json())
      .then((data) => setConversations(data.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return d.toLocaleDateString();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={onNew}
          className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 text-sm text-gray-400 animate-pulse">Loading…</div>
        ) : conversations.length === 0 ? (
          <div className="p-3 text-sm text-gray-400 text-center mt-4">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                activeId === conv.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
              }`}
            >
              <div className="text-sm font-medium text-gray-800 truncate">
                {conv.title || 'Untitled'}
              </div>
              <div className="text-xs text-gray-400">{formatDate(conv.updated_at)}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
