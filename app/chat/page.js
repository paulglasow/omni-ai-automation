'use client';

import { useState, useCallback } from 'react';
import ChatInterface from '../../components/ChatInterface';
import FileUpload from '../../components/FileUpload';
import ConversationList from '../../components/ConversationList';
import Sidebar from '../../components/Sidebar';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showConvos, setShowConvos] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [convRefresh, setConvRefresh] = useState(0);
  const [chatKey, setChatKey] = useState(0);

  function handleNewConversation() {
    setActiveConversation(null);
    setChatKey((k) => k + 1);
  }

  const handleConversationCreated = useCallback(() => {
    setConvRefresh((r) => r + 1);
  }, []);

  return (
    <div className="flex h-[100dvh]">
      <Sidebar
        activePage="chat"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Conversation sidebar — desktop only by default */}
      <div className={`
        ${showConvos ? 'fixed inset-y-0 left-0 z-40 w-72 flex' : 'hidden'} lg:static lg:flex
        lg:w-64 border-r border-slate-200 bg-white flex-col shrink-0
      `}>
        {showConvos && (
          <div className="lg:hidden flex items-center justify-between px-3 py-2 border-b border-slate-200">
            <span className="text-sm font-semibold text-slate-700">Conversations</span>
            <button onClick={() => setShowConvos(false)} className="text-slate-400 p-1">✕</button>
          </div>
        )}
        <ConversationList
          key={convRefresh}
          activeId={activeConversation}
          onSelect={(id) => { setActiveConversation(id); setShowConvos(false); }}
          onNew={handleNewConversation}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-2 px-3 py-3 border-b border-slate-200 bg-white safe-top">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-semibold text-slate-800 text-sm">
            <span className="text-blue-600">Omni</span>AI
          </h1>
          <div className="flex-1" />
          <button
            onClick={() => setShowConvos(!showConvos)}
            className={`p-2 rounded-xl transition-colors text-sm ${showConvos ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            💬
          </button>
          <button
            onClick={() => setShowFiles(!showFiles)}
            className={`p-2 rounded-xl transition-colors text-sm ${showFiles ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            📎
          </button>
        </div>

        {/* File upload panel */}
        {showFiles && (
          <div className="border-b border-slate-200 bg-white p-4 fade-in">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Files & Uploads</h3>
                <button onClick={() => setShowFiles(false)} className="text-xs text-slate-400 hover:text-slate-600">✕ Close</button>
              </div>
              <FileUpload />
            </div>
          </div>
        )}

        <ChatInterface
          key={activeConversation || chatKey}
          conversationId={activeConversation}
          onConversationCreated={handleConversationCreated}
        />

        {/* Desktop file toggle */}
        <div className="hidden lg:block border-t border-slate-200 bg-white">
          <button
            onClick={() => setShowFiles(!showFiles)}
            className="w-full px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 flex items-center gap-2"
          >
            <span>{showFiles ? '▼' : '▶'}</span>
            <span>📎 Files & Uploads</span>
          </button>
        </div>
      </main>
    </div>
  );
}
