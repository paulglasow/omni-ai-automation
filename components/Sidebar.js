'use client';

import Link from 'next/link';
import UserMenu from './UserMenu';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠', desc: 'Overview & briefing' },
  { href: '/chat', label: 'Chat', icon: '💬', desc: 'Multi-AI conversations' },
  { href: '/tasks', label: 'Tasks', icon: '✅', desc: 'Priority task manager' },
  { href: '/meetings', label: 'Meetings', icon: '🎙️', desc: 'Transcript analysis' },
  { href: '/wealth', label: 'Wealth', icon: '💰', desc: 'Finance & analysis' },
  { href: '/learning', label: 'Learning', icon: '📚', desc: 'Topic tracker' },
  { href: '/github', label: 'GitHub', icon: '🐙', desc: 'Copilot & code' },
  { href: '/shortcuts', label: 'Shortcuts', icon: '🗣️', desc: 'Siri & automation' },
  { href: '/settings', label: 'Settings', icon: '⚙️', desc: 'Config & status' },
];

export default function Sidebar({ activePage, isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 lg:w-60 bg-slate-900 text-white
          flex flex-col h-full shrink-0
          transform transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0 slide-in' : '-translate-x-full lg:translate-x-0'}
          safe-top
        `}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-blue-400">Omni</span>AI
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
              Multi-AI Platform
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.href.slice(1);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }
                `}
              >
                <span className="text-base">{item.icon}</span>
                <div className="min-w-0">
                  <div className="truncate">{item.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                    {item.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div className="border-t border-slate-800 mx-2.5 pt-2.5 mb-1">
          <UserMenu />
        </div>

        {/* Footer */}
        <div className="p-3 mx-2.5 mb-2.5 rounded-xl bg-slate-800/50 text-[10px] text-slate-500 leading-relaxed">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-green-400 font-medium">Secure</span>
          </div>
          All AI calls are server-side.
        </div>
      </aside>
    </>
  );
}
