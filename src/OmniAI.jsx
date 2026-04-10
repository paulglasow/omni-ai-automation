/**
 * src/OmniAI.jsx
 *
 * OmniAI v4 — Main React UI component (used by src/App.js for the web build).
 * The canonical reference template is at templates/omni-v4.jsx.
 *
 * Features:
 * - Multi-model chat (assist / openai / claude / gemini / perplexity / all / qa)
 * - QA/QC chain: primary AI analysis -> secondary AI review -> combined recommendation
 * - Multi-file upload via browser picker and drag-and-drop
 * - Cost badges per message ("💰 $0.0012")
 * - Workspace selector
 * - Real-time conversation display
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { saveConversation, getConversation, downloadMarkdown } from './conversations.js';
import { useTheme } from './ThemeContext.jsx';

const MODEL_OPTIONS = [
  { value: 'qa',        label: 'QA/QC Analysis' },
  { value: 'assist',    label: 'Assist (auto-route)' },
  { value: 'openai',    label: 'GPT-4o' },
  { value: 'claude',    label: 'Claude' },
  { value: 'gemini',    label: 'Gemini' },
  { value: 'perplexity',label: 'Perplexity' },
  { value: 'all',       label: 'All Models' },
];

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3MB total limit
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];

function buildMarkdownComponents(theme) {
  return {
    p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
    h2: ({ children }) => <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '12px 0 4px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '4px' }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '10px 0 4px' }}>{children}</h3>,
    ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ol>,
    li: ({ children }) => <li style={{ marginBottom: '2px' }}>{children}</li>,
    code: ({ inline, children }) =>
      inline
        ? <code style={{ background: theme.codeBg, padding: '1px 4px', borderRadius: '3px', fontSize: '0.9em', fontFamily: 'monospace' }}>{children}</code>
        : <pre style={{ background: theme.codeBg, padding: '10px', borderRadius: '6px', overflow: 'auto', fontSize: '0.85rem', fontFamily: 'monospace', margin: '8px 0' }}><code>{children}</code></pre>,
    table: ({ children }) => <table style={{ borderCollapse: 'collapse', width: '100%', margin: '8px 0', fontSize: '0.9rem' }}>{children}</table>,
    th: ({ children }) => <th style={{ border: `1px solid ${theme.markdownTable}`, padding: '6px 10px', background: theme.markdownTableHeaderBg, textAlign: 'left', fontWeight: 600 }}>{children}</th>,
    td: ({ children }) => <td style={{ border: `1px solid ${theme.markdownTable}`, padding: '6px 10px' }}>{children}</td>,
    blockquote: ({ children }) => <blockquote style={{ borderLeft: `3px solid ${theme.blockquoteBorder}`, margin: '8px 0', padding: '4px 12px', color: theme.blockquoteText }}>{children}</blockquote>,
    strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
  };
}

function MarkdownContent({ content, theme }) {
  const components = buildMarkdownComponents(theme);
  return (
    <div style={{ lineHeight: 1.6, wordBreak: 'break-word', color: theme.text }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
const ACCEPTED_FILE_TYPES = '.txt,.csv,.json,.md,.pdf,.log,.xml,.html,.js,.jsx,.ts,.tsx,.py,.sql,.yaml,.yml,.png,.jpg,.jpeg,.gif,.webp,.bmp';

function formatCost(usd) {
  if (usd == null || usd === 0) return null;
  if (usd < 0.0001) return `💰 <$0.0001`;
  return `💰 $${usd.toFixed(4)}`;
}

function CostBadge({ usage, theme, showTokens }) {
  const cost = formatCost(usage?.total?.estimatedCostUsd);
  if (!cost) return null;
  const total = usage?.total || {};
  const inputT = total.inputTokens ?? 0;
  const outputT = total.outputTokens ?? 0;
  const tokenInfo = showTokens && (inputT || outputT) ? ` (${inputT}/${outputT} tok)` : '';
  return (
    <span
      style={{
        display: 'inline-block',
        marginLeft: '8px',
        padding: '1px 6px',
        borderRadius: '10px',
        background: theme?.costBg || '#e8f5e9',
        color: theme?.costText || '#2e7d32',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        verticalAlign: 'middle',
      }}
      title={tokenInfo ? `Input: ${inputT} tokens, Output: ${outputT} tokens` : ''}
    >
      {cost}{tokenInfo}
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

function FileChips({ files, onRemove, theme }) {
  if (!files.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 16px 8px' }}>
      {files.map((f, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 10px',
            borderRadius: '12px',
            background: theme?.chipBg || '#e3f2fd',
            color: theme?.chipText || '#1565c0',
            fontSize: '0.8rem',
          }}
        >
          {f.name} ({(f.size / 1024).toFixed(1)}KB)
          {onRemove && (
            <button
              onClick={() => onRemove(i)}
              style={{
                background: 'none',
                border: 'none',
                color: '#1565c0',
                cursor: 'pointer',
                padding: '0 2px',
                fontSize: '0.9rem',
                lineHeight: 1,
              }}
            >
              x
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

function MessageBubble({ msg, theme }) {
  const isUser = msg.role === 'user';

  // QA/QC chain result display
  if (msg.model === 'qa' && msg.primary && msg.qa) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', color: theme.textSecondary, fontSize: '1rem' }}>
          QA/QC Analysis
          {msg.usage?.total?.estimatedCostUsd != null && (
            <CostBadge usage={msg.usage} theme={theme} />
          )}
        </div>

        {/* Primary Analysis Card */}
        <div
          style={{
            background: theme.primaryCardBg,
            border: `2px solid ${theme.primaryCardBorder}`,
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '10px',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1565c0', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#1565c0', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
              PRIMARY
            </span>
            {msg.primary.provider.toUpperCase()}
            {msg.primary.usage && (
              <CostBadge usage={{ total: { estimatedCostUsd: msg.primary.usage.estimatedCostUsd } }} theme={theme} />
            )}
          </div>
          <MarkdownContent content={msg.primary.content} theme={theme} />
        </div>

        {/* QA Review Card */}
        <div
          style={{
            background: theme.qaCardBg,
            border: `2px solid ${theme.qaCardBorder}`,
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '10px',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f57f17', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#f57f17', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
              QA REVIEW
            </span>
            {msg.qa.provider.toUpperCase()}
            {msg.qa.usage && (
              <CostBadge usage={{ total: { estimatedCostUsd: msg.qa.usage.estimatedCostUsd } }} theme={theme} />
            )}
          </div>
          <MarkdownContent content={msg.qa.content} theme={theme} />
        </div>

        {/* Routing scores */}
        {msg.routingScores && (
          <div style={{ fontSize: '0.75rem', color: theme.textMuted, padding: '4px 0' }}>
            Routing: {msg.primary.provider} ({msg.routingScores[msg.primary.provider]}) → {msg.qa.provider} ({msg.routingScores[msg.qa.provider]})
            {msg.bucket && ` | Category: ${msg.bucket}`}
          </div>
        )}
      </div>
    );
  }

  if (msg.model === 'all' && msg.responses) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', color: theme.textSecondary }}>
          All Models
          {msg.usage?.total?.estimatedCostUsd != null && (
            <CostBadge usage={msg.usage} theme={theme} />
          )}
        </div>
        {Object.entries(msg.responses).map(([provider, content]) => (
          <div
            key={provider}
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '8px',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: theme.textMuted, marginBottom: '4px' }}>
              {provider.toUpperCase()}
              {msg.usage?.[provider] && (
                <CostBadge usage={{ total: { estimatedCostUsd: msg.usage[provider].estimatedCostUsd } }} theme={theme} />
              )}
            </div>
            <MarkdownContent content={content} theme={theme} />
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
          background: isUser ? theme.userBubble : theme.aiBubble,
          color: isUser ? theme.userBubbleText : theme.aiBubbleText,
          lineHeight: 1.6,
        }}
      >
        {isUser
          ? <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
          : <MarkdownContent content={msg.content} theme={theme} />
        }
        {isUser && msg.fileNames?.length > 0 && (
          <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#bbdefb' }}>
            Attached: {msg.fileNames.join(', ')}
          </div>
        )}
        {!isUser && (
          <div style={{ marginTop: '4px', fontSize: '0.75rem', color: theme.textMuted }}>
            <RouteBadge routedTo={msg.routedTo} bucket={msg.bucket} />
            <CostBadge usage={msg.usage} theme={theme} showTokens />
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('qa');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const { theme } = useTheme();
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load conversation from URL param ?c=<id>
  useEffect(() => {
    const cid = searchParams.get('c');
    if (cid && cid !== conversationId) {
      const conv = getConversation(cid);
      if (conv) {
        setMessages(conv.messages);
        setModel(conv.model || 'qa');
        setConversationId(cid);
      }
    }
  // eslint-disable-next-line
  }, [searchParams]);

  // Load template from URL param ?template=...&model=...
  useEffect(() => {
    const tmpl = searchParams.get('template');
    const tmplModel = searchParams.get('model');
    if (tmpl) {
      setInput(decodeURIComponent(tmpl));
      if (tmplModel) setModel(tmplModel);
      // Clear template params so they don't re-trigger
      setSearchParams({}, { replace: true });
    }
  // eslint-disable-next-line
  }, []);

  // Auto-save conversation when messages change
  const autoSave = useCallback((msgs, mdl) => {
    if (msgs.length === 0) return;
    const id = saveConversation(conversationId, msgs, mdl);
    if (id !== conversationId) {
      setConversationId(id);
      setSearchParams({ c: id }, { replace: true });
    }
  }, [conversationId, setSearchParams]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Loading step indicator for QA mode
  useEffect(() => {
    if (!loading) { setLoadingStep(''); return; }
    if (model === 'qa') {
      setLoadingStep('Step 1: Primary analysis...');
      const timer = setTimeout(() => setLoadingStep('Step 2: QA review...'), 6000);
      return () => clearTimeout(timer);
    }
    setLoadingStep('Thinking...');
  }, [loading, model]);

  // Load workspaces (best-effort; only works when authenticated)
  useEffect(() => {
    const token = localStorage.getItem('omni_device_token');
    if (!token) return;
    fetch('/api/workspaces', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.workspaces) setWorkspaces(data.workspaces); })
      .catch(() => {});
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleGlobalKeys(e) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'k') { e.preventDefault(); clearMessages(); }
      if (mod && e.key === 'e' && messages.length > 0) { e.preventDefault(); downloadMarkdown(messages, model); }
    }
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  });

  // Load system prompt from localStorage
  const systemPrompt = localStorage.getItem('omni_system_prompt') || '';

  // Read files into state
  function processFiles(fileList) {
    const newFiles = Array.from(fileList);
    const totalExisting = attachedFiles.reduce((sum, f) => sum + f.size, 0);
    const totalNew = newFiles.reduce((sum, f) => sum + f.size, 0);

    if (totalExisting + totalNew > MAX_FILE_SIZE_BYTES) {
      setError(`Total file size exceeds 3MB limit. Please reduce file sizes.`);
      return;
    }

    const readers = newFiles.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          const ext = file.name.toLowerCase().match(/\.\w+$/)?.[0] || '';
          const isPdf = ext === '.pdf';
          const isImage = IMAGE_EXTENSIONS.includes(ext);
          const isBinary = isPdf || isImage;
          reader.onload = () => {
            if (isBinary) {
              const base64 = reader.result.split(',')[1];
              resolve({ name: file.name, size: file.size, type: file.type || (isImage ? `image/${ext.slice(1)}` : 'application/pdf'), content: base64, encoding: 'base64' });
            } else {
              resolve({ name: file.name, size: file.size, type: file.type, content: reader.result });
            }
          };
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          isBinary ? reader.readAsDataURL(file) : reader.readAsText(file);
        })
    );

    Promise.all(readers)
      .then((results) => setAttachedFiles((prev) => [...prev, ...results]))
      .catch((err) => setError(err.message));
  }

  function handleFileSelect(e) {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = ''; // Reset so same file can be re-selected
  }

  function removeFile(index) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // Drag and drop handlers
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const fileNames = attachedFiles.map((f) => f.name);
    const userMsg = { role: 'user', content: text, fileNames };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    setError(null);

    // Prepare files payload (name, type, content only — not the full File object)
    const filesPayload = attachedFiles.map((f) => ({
      name: f.name,
      type: f.type,
      content: f.content,
      ...(f.encoding ? { encoding: f.encoding } : {}),
    }));
    setAttachedFiles([]);

    try {
      const token = localStorage.getItem('omni_device_token');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...history.map((m) => ({ role: m.role, content: m.content })),
          ],
          model,
          ...(activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}),
          ...(filesPayload.length ? { files: filesPayload } : {}),
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
        responses: data.responses,       // "all" mode
        primary: data.primary,           // "qa" mode
        qa: data.qa,                     // "qa" mode
        routingScores: data.routingScores, // "qa" mode
      };

      const updatedMessages = [...history, assistantMsg];
      setMessages(updatedMessages);
      autoSave(updatedMessages, model);
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
    setAttachedFiles([]);
    setError(null);
    setConversationId(null);
    setSearchParams({}, { replace: true });
  }

  // Calculate session cost
  const sessionCost = messages
    .filter((m) => m.role === 'assistant')
    .reduce((sum, m) => sum + (m.usage?.total?.estimatedCostUsd ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, sans-serif' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${theme.border}`, background: theme.toolbarBg, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: theme.text }}>Chat</span>
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
          <span style={{ fontSize: '0.85rem', background: theme.costBg, color: theme.costText, padding: '4px 10px', borderRadius: '12px', fontFamily: 'monospace' }}>
            Session: ${sessionCost.toFixed(4)}
          </span>
        )}
        {messages.length > 0 && (
          <button onClick={() => downloadMarkdown(messages, model)} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textSecondary, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
            Export
          </button>
        )}
        <button onClick={clearMessages} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textSecondary, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
          Clear
        </button>
      </div>

      {/* QA mode info banner */}
      {model === 'qa' && messages.length === 0 && (
        <div style={{ background: theme.infoBannerBg, padding: '8px 16px', fontSize: '0.85rem', color: theme.infoBannerText, borderBottom: `1px solid ${theme.infoBannerBorder}` }}>
          QA/QC mode: Your request is analyzed by the best-matched AI, then a second AI reviews and provides a combined recommendation. This makes 2 AI calls per request.
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#aaa', marginTop: '80px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🤖</div>
            <div>Start a conversation. Cost is tracked automatically.</div>
            <div style={{ fontSize: '0.85rem', marginTop: '8px' }}>
              Use <strong>QA/QC Analysis</strong> for AI-reviewed answers, or select a specific model above.
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px', color: '#bbb' }}>
              Attach files (including images) using the + button or drag and drop.
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '8px', color: '#ccc' }}>
              Shortcuts: Cmd/Ctrl+K new chat | Cmd/Ctrl+E export
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} theme={theme} />
        ))}
        {loading && (
          <div style={{ color: '#888', fontStyle: 'italic', padding: '8px' }}>{loadingStep || 'Thinking...'}</div>
        )}
        {error && (
          <div style={{ color: theme.errorText, background: theme.errorBg, padding: '8px 12px', borderRadius: '6px', marginBottom: '8px' }}>
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* File chips */}
      <FileChips files={attachedFiles} onRemove={removeFile} theme={theme} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Input area with drag-and-drop */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
          background: isDragging ? theme.chipBg : theme.toolbarBg,
          transition: 'background 0.2s',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title="Attach files"
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          +
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isDragging ? 'Drop files here...' : 'Type a message... (Enter to send, Shift+Enter for new line)'}
          rows={2}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: isDragging ? '2px dashed #1976d2' : `1px solid ${theme.border}`,
            background: theme.bgInput,
            color: theme.text,
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
            padding: '8px 20px',
            borderRadius: '10px',
            background: loading ? '#90caf9' : '#1976d2',
            color: '#fff',
            border: 'none',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
