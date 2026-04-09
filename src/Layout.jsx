/**
 * src/Layout.jsx
 *
 * Sidebar navigation layout wrapping all pages.
 * Responsive: collapses to hamburger menu on mobile (<768px).
 */

import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { listConversations, deleteConversation } from './conversations.js';

const NAV_ITEMS = [
  { to: '/',         label: 'Dashboard',  sub: 'Overview & briefing' },
  { to: '/chat',     label: 'Chat',       sub: 'Multi-AI conversations' },
  { to: '/settings', label: 'Settings',   sub: 'Config & status' },
];

const MOBILE_BREAKPOINT = 768;

function SidebarLink({ to, label, sub, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={({ isActive }) => ({
        display: 'block',
        padding: '12px 16px',
        borderRadius: '8px',
        textDecoration: 'none',
        color: isActive ? '#fff' : '#ccc',
        background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
        marginBottom: '2px',
        transition: 'background 0.15s',
      })}
    >
      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{label}</div>
      <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>{sub}</div>
    </NavLink>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [conversations, setConversations] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Refresh conversation list when navigating
  useEffect(() => {
    setConversations(listConversations());
  }, [location]);

  // Track viewport width
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const showSidebar = !isMobile || sidebarOpen;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: 1001,
            background: sidebarOpen ? 'rgba(255,255,255,0.2)' : '#1a2332',
            border: 'none',
            color: '#fff',
            fontSize: '1.4rem',
            padding: '6px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            lineHeight: 1,
          }}
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? '\u2715' : '\u2630'}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <nav
          style={{
            width: '240px',
            flexShrink: 0,
            background: '#1a2332',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 12px',
            overflowY: 'auto',
            ...(isMobile ? {
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 1000,
              boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
            } : {}),
          }}
        >
          {/* Logo */}
          <div style={{ padding: isMobile ? '40px 4px 20px' : '8px 4px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>
              Omni<span style={{ color: '#64b5f6' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '0.5px', marginTop: '2px' }}>
              MULTI-AI PLATFORM
            </div>
          </div>

          {/* Nav links */}
          <div>
            {NAV_ITEMS.map((item) => (
              <SidebarLink key={item.to} {...item} onClick={isMobile ? () => setSidebarOpen(false) : undefined} />
            ))}
          </div>

          {/* Recent conversations */}
          {conversations.length > 0 && (
            <div style={{ flex: 1, marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 4px 8px' }}>
                Recent Chats
              </div>
              {conversations.slice(0, 15).map((conv) => (
                <div
                  key={conv.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#bbb',
                    fontSize: '0.8rem',
                    transition: 'background 0.15s',
                    marginBottom: '1px',
                  }}
                  onClick={() => {
                    navigate(`/chat?c=${conv.id}`);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                      setConversations(listConversations());
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      padding: '0 2px',
                      fontSize: '0.75rem',
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                    title="Delete conversation"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '12px 4px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
            <div style={{ color: '#4caf50', fontWeight: 600 }}>Secure</div>
            <div style={{ color: '#888', marginTop: '2px' }}>All AI calls are server-side.</div>
          </div>
        </nav>
      )}

      {/* Main content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: '#fafafa',
        ...(isMobile ? { paddingTop: '48px' } : {}),
      }}>
        <Outlet />
      </main>
    </div>
  );
}
