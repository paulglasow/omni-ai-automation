/**
 * OmniAI v4 — Main React Interface
 * File: templates/omni-v4.jsx
 *
 * This is the primary chat interface that connects to all 4 AI models.
 * Deploy this to Vercel (or any React hosting) to get your live URL.
 *
 * SETUP:
 * 1. Copy this file to your project's pages/ or app/ directory
 * 2. Make sure your .env is configured with all API keys
 * 3. Run: npm run dev to test locally
 * 4. Run: npm run build && npm run deploy for production
 */

'use client';

import { useState, useRef, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {'user'|'assistant'|'system'} role
 * @property {string} content
 * @property {string|null} aiModel  - Which AI generated this (null for user messages)
 * @property {Date} timestamp
 */

// ── Constants ─────────────────────────────────────────────────────────────────
const AI_MODELS = [
  { id: 'auto',       label: 'Auto (Best AI)',      emoji: '🤖', color: '#6366f1' },
  { id: 'gpt-4o',     label: 'ChatGPT',             emoji: '💬', color: '#10a37f' },
  { id: 'claude',     label: 'Claude',              emoji: '🧠', color: '#d4a27f' },
  { id: 'gemini',     label: 'Gemini',              emoji: '✨', color: '#4285f4' },
  { id: 'perplexity', label: 'Perplexity',          emoji: '🔍', color: '#20b2aa' },
  { id: 'all',        label: 'All 4 AIs',           emoji: '🌐', color: '#8b5cf6' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function OmniAI() {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [selectedModel, setModel]     = useState('auto');
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      id:        `user-${Date.now()}`,
      role:      'user',
      content:   trimmed,
      aiModel:   null,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          model:   selectedModel,
          history: messages.slice(-10).map(m => ({
            role:    m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Handle both single response and multi-AI responses
      if (data.responses) {
        // All-4-AIs mode
        for (const [model, content] of Object.entries(data.responses)) {
          const aiMsg = {
            id:        `ai-${model}-${Date.now()}`,
            role:      'assistant',
            content,
            aiModel:   model,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMsg]);
        }
      } else {
        const aiMsg = {
          id:        `ai-${Date.now()}`,
          role:      'assistant',
          content:   data.content || data.message,
          aiModel:   data.model || selectedModel,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>🤖</span>
          <div>
            <h1 style={styles.title}>OmniAI v4</h1>
            <p style={styles.subtitle}>Multi-Model AI Orchestration</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={clearChat} style={styles.clearBtn} title="Clear conversation">
            🗑️ Clear
          </button>
        </div>
      </header>

      {/* Model Selector */}
      <div style={styles.modelBar}>
        <span style={styles.modelLabel}>AI Model:</span>
        {AI_MODELS.map(model => (
          <button
            key={model.id}
            onClick={() => setModel(model.id)}
            style={{
              ...styles.modelBtn,
              backgroundColor: selectedModel === model.id ? model.color : '#f0f0f0',
              color:           selectedModel === model.id ? '#fff' : '#333',
            }}
            title={model.label}
          >
            {model.emoji} {model.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <main style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.welcome}>
            <h2>Welcome to OmniAI v4 {currentModel.emoji}</h2>
            <p>Ask anything — I'll route it to the best AI for your question.</p>
            <div style={styles.suggestions}>
              {[
                '💰 Give me my financial overview for today',
                '💻 Review this code and suggest improvements',
                '📊 Research the latest trends in [topic]',
                '✍️ Help me write a professional email about [topic]',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  style={styles.suggestionBtn}
                  onClick={() => setInput(suggestion.slice(3))}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              ...styles.messageBubble,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div style={styles.avatar}>
              {msg.role === 'user' ? '👤' : getModelEmoji(msg.aiModel)}
            </div>
            <div
              style={{
                ...styles.bubble,
                backgroundColor: msg.role === 'user' ? '#6366f1' : '#f3f4f6',
                color:           msg.role === 'user' ? '#fff' : '#1f2937',
                borderRadius:    msg.role === 'user'
                  ? '18px 18px 4px 18px'
                  : '18px 18px 18px 4px',
              }}
            >
              {msg.aiModel && msg.role === 'assistant' && (
                <div style={styles.modelTag}>{getModelLabel(msg.aiModel)}</div>
              )}
              <p style={styles.bubbleText}>{msg.content}</p>
              <span style={styles.timestamp}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={styles.messageBubble}>
            <div style={styles.avatar}>⏳</div>
            <div style={{ ...styles.bubble, backgroundColor: '#f3f4f6' }}>
              <div style={styles.typing}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={styles.errorBanner}>
            ⚠️ {error}
            <button onClick={() => setError(null)} style={styles.dismissBtn}>✕</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer style={styles.inputArea}>
        <div style={styles.inputRow}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${currentModel.label}... (Enter to send, Shift+Enter for new line)`}
            style={styles.textarea}
            rows={1}
            maxLength={10000}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              ...styles.sendBtn,
              backgroundColor: isLoading || !input.trim() ? '#9ca3af' : '#6366f1',
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
        <p style={styles.hint}>
          {currentModel.emoji} Using {currentModel.label} • Press Enter to send
        </p>
      </footer>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getModelEmoji(model) {
  const map = {
    'gpt-4o':      '💬',
    'gpt-4':       '💬',
    'claude':      '🧠',
    'gemini':      '✨',
    'perplexity':  '🔍',
    'auto':        '🤖',
  };
  if (!model) return '🤖';
  for (const [key, emoji] of Object.entries(map)) {
    if (model.toLowerCase().includes(key)) return emoji;
  }
  return '🤖';
}

function getModelLabel(model) {
  if (!model) return 'AI';
  if (model.includes('gpt'))        return 'ChatGPT';
  if (model.includes('claude'))     return 'Claude';
  if (model.includes('gemini'))     return 'Gemini';
  if (model.includes('perplexity')) return 'Perplexity';
  return model;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  container: {
    display:       'flex',
    flexDirection: 'column',
    height:        '100vh',
    maxWidth:      '900px',
    margin:        '0 auto',
    fontFamily:    '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    backgroundColor: '#ffffff',
  },
  header: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         '16px 24px',
    borderBottom:    '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
  },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: '12px' },
  headerRight: { display: 'flex', gap: '8px' },
  logo:        { fontSize: '32px' },
  title:       { margin: 0, fontSize: '20px', fontWeight: 700, color: '#1f2937' },
  subtitle:    { margin: 0, fontSize: '12px', color: '#6b7280' },
  clearBtn: {
    padding:         '6px 12px',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    backgroundColor: '#ffffff',
    cursor:          'pointer',
    fontSize:        '14px',
    color:           '#6b7280',
  },
  modelBar: {
    display:       'flex',
    alignItems:    'center',
    gap:           '6px',
    padding:       '8px 24px',
    borderBottom:  '1px solid #e5e7eb',
    overflowX:     'auto',
    flexWrap:      'wrap',
  },
  modelLabel: { fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' },
  modelBtn: {
    padding:      '4px 10px',
    border:       'none',
    borderRadius: '20px',
    cursor:       'pointer',
    fontSize:     '12px',
    fontWeight:   500,
    whiteSpace:   'nowrap',
    transition:   'all 0.15s',
  },
  messages: {
    flex:       1,
    overflowY:  'auto',
    padding:    '24px',
    display:    'flex',
    flexDirection: 'column',
    gap:        '16px',
  },
  welcome: {
    textAlign:  'center',
    padding:    '40px 20px',
    color:      '#6b7280',
  },
  suggestions: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
    maxWidth:      '500px',
    margin:        '24px auto 0',
  },
  suggestionBtn: {
    padding:         '10px 16px',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    backgroundColor: '#f9fafb',
    cursor:          'pointer',
    textAlign:       'left',
    fontSize:        '14px',
    color:           '#374151',
  },
  messageBubble: {
    display:    'flex',
    gap:        '12px',
    alignItems: 'flex-start',
  },
  avatar: {
    fontSize:        '24px',
    flexShrink:      0,
    width:           '36px',
    textAlign:       'center',
  },
  bubble: {
    maxWidth:    '75%',
    padding:     '12px 16px',
    position:    'relative',
  },
  modelTag: {
    fontSize:    '10px',
    fontWeight:  600,
    color:       '#6b7280',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  bubbleText: { margin: 0, fontSize: '15px', lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  timestamp:  { fontSize: '10px', color: '#9ca3af', marginTop: '4px', display: 'block' },
  typing: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
  },
  errorBanner: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         '12px 16px',
    backgroundColor: '#fef2f2',
    border:          '1px solid #fecaca',
    borderRadius:    '8px',
    color:           '#dc2626',
    fontSize:        '14px',
  },
  dismissBtn: {
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    color:      '#dc2626',
    fontSize:   '16px',
  },
  inputArea: {
    padding:       '16px 24px',
    borderTop:     '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
  },
  inputRow: {
    display:  'flex',
    gap:      '8px',
    alignItems: 'flex-end',
  },
  textarea: {
    flex:        1,
    padding:     '12px 16px',
    border:      '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize:    '15px',
    lineHeight:  1.5,
    resize:      'none',
    outline:     'none',
    maxHeight:   '200px',
    overflowY:   'auto',
    fontFamily:  'inherit',
  },
  sendBtn: {
    width:        '44px',
    height:       '44px',
    border:       'none',
    borderRadius: '12px',
    color:        '#ffffff',
    fontSize:     '18px',
    flexShrink:   0,
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
  },
  hint: {
    margin:    '6px 0 0',
    fontSize:  '12px',
    color:     '#9ca3af',
    textAlign: 'center',
  },
};