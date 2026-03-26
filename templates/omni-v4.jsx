/**
 * templates/omni-v4.jsx
 *
 * OmniAI v4 — Reference UI template.
 * This file is the canonical source for the React UI component.
 * The production build uses a copy at src/OmniAI.jsx (required by react-scripts'
 * src/-only import restriction). Keep both files in sync when making changes.
 *
 * Features:
 * - Multi-model chat (assist / openai / claude / gemini / perplexity / all)
 * - Cost badges per message ("💰 $0.0012")
 * - Workspace selector
 * - Real-time conversation display
 */

import { useState, useRef, useEffect } from 'react';

const MODEL_OPTIONS = [
  { value: 'assist',     label: '🤖 Assist (auto-route)' },
  { value: 'openai',    label: '🟢 GPT-4o' },
  { value: 'claude',    label: '🟣 Claude' },
  { value: 'gemini',    label: '🔵 Gemini' },
  { value: 'perplexity',label: '🟠 Perplexity' },
  { value: 'all',       label: '⚡ All Models' },
];

function formatCost(usd) {
  if (usd == null || usd === 0) return null;
  if (usd < 0.0001) return `💰 <$0.0001`;
  return `💰 $${usd.toFixed(4)}`;
}

function CostBadge({ usage }) {
  const cost = formatCost(usage?.total?.estimatedCostUsd);
  if (!cost) return null;
  return (
    <span
      style={{
        display: 'inline-block',
        marginLeft: '8px',
        padding: '1px 6px',
        borderRadius: '10px',
        background: '#e8f5e9',
        color: '#2e7d32',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        verticalAlign: 'middle',
      }}
    >
      {cost}
    </span>
  );
}

function RouteBadge({ routedTo, bucket }) {
  if (!routedTo) return null;
  return (
    <span
      style={{
        display: 'inline-block',
        marginLeft: '4px',
        padding: '1px 6px',
        borderRadius: '10px',
        background: '#e3f2fd',
        color: '#1565c0',
        fontSize: '0.75rem',
        verticalAlign: 'middle',
      }}
    >
      via {routedTo}{bucket ? ` (${bucket})` : ''}
    </span>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  if (msg.model === 'all' && msg.responses) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#555' }}>
          ⚡ All Models
          {msg.usage?.total?.estimatedCostUsd != null && (
            <CostBadge usage={msg.usage} />
          )}
        </div>
        {Object.entries(msg.responses).map(([provider, content]) => (
          <div
            key={provider}
            style={{
              background: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '8px',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#888', marginBottom: '4px' }}>
              {provider.toUpperCase()}
              {msg.usage?.[provider] && (
                <CostBadge usage={{ total: { estimatedCostUsd: msg.usage[provider].estimatedCostUsd } }} />
              )}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{content}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          maxWidth: '75%',
          padding: '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser ? '#1976d2' : '#f0f0f0',
          color: isUser ? '#fff' : '#222',
          lineHeight: 1.6,
        }}
      >
        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
        {!isUser && (
          <div style={{ marginTop: '4px', fontSize: '0.75rem', color: isUser ? '#bbdefb' : '#888' }}>
            <RouteBadge routedTo={msg.routedTo} bucket={msg.bucket} />
            <CostBadge usage={msg.usage} />
          </div>
        )}
      </div>
    </div>
  );
}

function WorkspaceSelector({ workspaces, activeWorkspaceId, onChange }) {
  return (
    <select
      value={activeWorkspaceId ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      style={{
        padding: '6px 10px',
        borderRadius: '6px',
        border: '1px solid #ccc',
        fontSize: '0.85rem',
        background: '#fff',
      }}
    >
      <option value="">Personal</option>
      {workspaces.map((ws) => (
        <option key={ws.id} value={ws.id}>
          {ws.name}
        </option>
      ))}
    </select>
  );
}

export default function OmniAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('assist');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const bottomRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load workspaces (best-effort; only works when authenticated)
  useEffect(() => {
    const token = localStorage.getItem('omni_device_token');
    if (!token) return;
    fetch('/api/workspaces', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.workspaces) setWorkspaces(data.workspaces); })
      .catch(() => {});
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('omni_device_token');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: history,
          model,
          ...(activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Request failed');

      const assistantMsg = {
        role: 'assistant',
        content: data.content,
        model: data.model,
        routedTo: data.routedTo,
        bucket: data.bucket,
        usage: data.usage,
        responses: data.responses, // "all" mode
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearMessages() {
    setMessages([]);
    setError(null);
  }

  // Calculate session cost
  const sessionCost = messages
    .filter((m) => m.role === 'assistant')
    .reduce((sum, m) => sum + (m.usage?.total?.estimatedCostUsd ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', background: '#1976d2', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>OmniAI v4</span>
        <span style={{ flex: 1 }} />
        <WorkspaceSelector workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} onChange={setActiveWorkspaceId} />
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', fontSize: '0.85rem' }}
        >
          {MODEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {sessionCost > 0 && (
          <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px' }}>
            Session: 💰 ${sessionCost.toFixed(4)}
          </span>
        )}
        <button onClick={clearMessages} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
          Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#aaa', marginTop: '80px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🤖</div>
            <div>Start a conversation. Cost is tracked automatically.</div>
            <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>Select a model above or use <strong>Assist</strong> to auto-route.</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && (
          <div style={{ color: '#888', fontStyle: 'italic', padding: '8px' }}>Thinking…</div>
        )}
        {error && (
          <div style={{ color: '#c62828', background: '#ffebee', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px' }}>
            ⚠️ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={2}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid #ccc',
            fontSize: '1rem',
            resize: 'none',
            fontFamily: 'inherit',
          }}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '0 20px',
            borderRadius: '10px',
            background: loading ? '#90caf9' : '#1976d2',
            color: '#fff',
            border: 'none',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '…' : '➤'}
        </button>
      </div>
    </div>
  );
}
