/**
 * src/Layout.jsx
 *
 * Sidebar navigation layout wrapping all pages.
 */

import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',         label: 'Dashboard',  sub: 'Overview & briefing' },
  { to: '/chat',     label: 'Chat',       sub: 'Multi-AI conversations' },
  { to: '/settings', label: 'Settings',   sub: 'Config & status' },
];

function SidebarLink({ to, label, sub }) {
  return (
    <NavLink
      to={to}
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
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
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
        }}
      >
        {/* Logo */}
        <div style={{ padding: '8px 4px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
          <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>
            Omni<span style={{ color: '#64b5f6' }}>AI</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '0.5px', marginTop: '2px' }}>
            MULTI-AI PLATFORM
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 4px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
          <div style={{ color: '#4caf50', fontWeight: 600 }}>Secure</div>
          <div style={{ color: '#888', marginTop: '2px' }}>All AI calls are server-side.</div>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#fafafa' }}>
        <Outlet />
      </main>
    </div>
  );
}
