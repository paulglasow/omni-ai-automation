'use client';

import { useState, useRef, useEffect } from 'react';

const MODEL_OPTIONS = [
  { value: 'assist', label: 'Assist', icon: '✨', color: 'bg-amber-500' },
  { value: 'openai', label: 'GPT-4o', icon: '🟢', color: 'bg-green-500' },
  { value: 'claude', label: 'Claude', icon: '🟣', color: 'bg-purple-500' },
  { value: 'gemini', label: 'Gemini', icon: '🔵', color: 'bg-blue-500' },
  { value: 'perplexity', label: 'Perplexity', icon: '🟠', color: 'bg-orange-500' },
  { value: 'all', label: 'All', icon: '⚡', color: 'bg-slate-700' },
];

function formatCost(usd) {
  if (usd == null || usd === 0) return null;
  if (usd < 0.0001) return '<$0.0001';
  return `$${usd.toFixed(4)}`;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4 fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-400 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-slate-400 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-slate-400 typing-dot" />
        </div>
      </div>
    </div>
  );
}

function AllModelsResponse({ msg }) {
  return (
    <div className="mb-4 fade-in">
      <div className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-2">
        <span className="text-base">⚡</span> All Models
        {msg.usage?.total?.estimatedCostUsd > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px]">
            {formatCost(msg.usage.total.estimatedCostUsd)}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(msg.responses).map(([provider, content]) => (
          <div key={provider} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              {provider}
              {msg.usage?.[provider]?.estimatedCostUsd > 0 && (
                <span className="text-emerald-600 font-mono font-normal">
                  {formatCost(msg.usage[provider].estimatedCostUsd)}
                </span>
              )}
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed text-slate-700">{content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  if (msg.model === 'all' && msg.responses) {
    return <AllModelsResponse msg={msg} />;
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 fade-in`}>
      <div
        className={`
          max-w-[85%] sm:max-w-[75%] px-4 py-3 shadow-sm
          ${isUser
            ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
            : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-md'
          }
        `}
      >
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
        {!isUser && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {msg.routedTo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                via {msg.routedTo}
                {msg.bucket ? ` · ${msg.bucket}` : ''}
              </span>
            )}
            {msg.usedModels?.length > 0 && !msg.routedTo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-medium">
                {msg.usedModels.join(', ')}
              </span>
            )}
            {msg.usage?.total?.estimatedCostUsd > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono">
                {formatCost(msg.usage.total.estimatedCostUsd)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatInterface({ conversationId: initialConvId, workspaceId, onConversationCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('assist');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [convId, setConvId] = useState(initialConvId);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (initialConvId) {
      setConvId(initialConvId);
      fetch(`/api/conversations/${initialConvId}/messages`)
        .then((r) => r.json())
        .then((d) => setMessages((d.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
          model: m.model,
          routedTo: m.routed_to,
          bucket: m.bucket,
          usedModels: m.used_models,
          usage: m.usage,
          responses: m.responses,
        }))))
        .catch(() => {});
    } else {
      setMessages([]);
      setConvId(null);
    }
  }, [initialConvId]);

  async function saveMessage(cId, msg) {
    if (!cId) return;
    await fetch(`/api/conversations/${cId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    }).catch(() => {});
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    setError(null);

    // Auto-create conversation if none exists
    let activeConvId = convId;
    if (!activeConvId) {
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: text.slice(0, 60), workspaceId }),
        });
        const data = await res.json();
        if (data.conversation) {
          activeConvId = data.conversation.id;
          setConvId(activeConvId);
          onConversationCreated?.(data.conversation);
        }
      } catch {} // Non-fatal — chat still works without persistence
    }

    // Save user message
    saveMessage(activeConvId, userMsg);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          model,
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
        usedModels: data.usedModels,
        usage: data.usage,
        responses: data.responses,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      saveMessage(activeConvId, assistantMsg);
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

  const sessionCost = messages
    .filter((m) => m.role === 'assistant')
    .reduce((sum, m) => sum + (m.usage?.total?.estimatedCostUsd ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-lg flex items-center gap-3 sticky top-0 z-10 safe-top">
        <h2 className="font-semibold text-slate-800 hidden sm:block">Chat</h2>
        <div className="flex-1" />

        {/* Model picker — pills on desktop, dropdown on mobile */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {MODEL_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setModel(o.value)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                ${model === o.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }
              `}
            >
              <span className="mr-1">{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>

        {/* Mobile model picker */}
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="sm:hidden px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white font-medium"
        >
          {MODEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.icon} {o.label}
            </option>
          ))}
        </select>

        {sessionCost > 0 && (
          <span className="hidden sm:inline text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-mono font-medium">
            ${sessionCost.toFixed(4)}
          </span>
        )}

        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setError(null); }}
            className="text-xs text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Clear
          </button>
        )}
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scroll-smooth scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center gradient-bg">
            <div className="text-center px-6 max-w-md">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                What can I help you with?
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {model === 'assist'
                  ? 'Assist automatically picks the best AI — Perplexity for research, Claude for writing, GPT-4o for code, Gemini for data.'
                  : `You're using ${MODEL_OPTIONS.find((o) => o.value === model)?.label || model}.`
                }
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Research recent market trends',
                  'Help me draft an email',
                  'Analyze this data',
                  'Debug my code',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                    className="px-3 py-2 text-xs bg-white/80 border border-slate-200 rounded-xl text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm fade-in">
                <span className="font-medium">Error:</span> {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 bg-white/80 backdrop-blur-lg p-3 sm:p-4 safe-bottom">
        <div className="max-w-3xl mx-auto flex gap-2 sm:gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything…"
            rows={1}
            disabled={loading}
            className="
              flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm
              bg-white shadow-sm
              resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400
              disabled:bg-slate-50 disabled:text-slate-400
              placeholder:text-slate-400
              transition-shadow
            "
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onInput={(e) => {
              e.target.style.height = '44px';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="
              w-11 h-11 flex-shrink-0 rounded-2xl
              bg-blue-600 text-white
              flex items-center justify-center
              disabled:bg-slate-200 disabled:text-slate-400
              hover:bg-blue-700 active:scale-95
              transition-all duration-150 shadow-sm
              self-end
            "
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
