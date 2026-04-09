/**
 * src/ThemeContext.jsx
 *
 * Dark/light theme context with localStorage persistence.
 */

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEMES = {
  light: {
    name: 'light',
    bg: '#fafafa',
    bgCard: '#fff',
    bgInput: '#fff',
    text: '#222',
    textSecondary: '#555',
    textMuted: '#888',
    border: '#e8e8e8',
    borderLight: '#f0f0f0',
    userBubble: '#1976d2',
    userBubbleText: '#fff',
    aiBubble: '#f0f0f0',
    aiBubbleText: '#222',
    toolbarBg: '#fff',
    primaryCardBg: '#f0f7ff',
    primaryCardBorder: '#90caf9',
    qaCardBg: '#fff8e1',
    qaCardBorder: '#ffcc02',
    codeBg: '#f5f5f5',
    costBg: '#e8f5e9',
    costText: '#2e7d32',
    infoBannerBg: '#fff3e0',
    infoBannerText: '#e65100',
    infoBannerBorder: '#ffe0b2',
    errorBg: '#ffebee',
    errorText: '#c62828',
    chipBg: '#e3f2fd',
    chipText: '#1565c0',
    hoverBg: 'rgba(0,0,0,0.04)',
    markdownTable: '#ddd',
    markdownTableHeaderBg: '#f5f5f5',
    blockquoteBorder: '#ccc',
    blockquoteText: '#555',
  },
  dark: {
    name: 'dark',
    bg: '#121212',
    bgCard: '#1e1e1e',
    bgInput: '#2a2a2a',
    text: '#e0e0e0',
    textSecondary: '#bbb',
    textMuted: '#888',
    border: '#333',
    borderLight: '#2a2a2a',
    userBubble: '#1565c0',
    userBubbleText: '#fff',
    aiBubble: '#2a2a2a',
    aiBubbleText: '#e0e0e0',
    toolbarBg: '#1e1e1e',
    primaryCardBg: '#1a2a3a',
    primaryCardBorder: '#1565c0',
    qaCardBg: '#2a2210',
    qaCardBorder: '#f9a825',
    codeBg: '#2a2a2a',
    costBg: '#1b3a1b',
    costText: '#66bb6a',
    infoBannerBg: '#2a1f10',
    infoBannerText: '#ffb74d',
    infoBannerBorder: '#3a2a10',
    errorBg: '#3a1515',
    errorText: '#ef9a9a',
    chipBg: '#1a2a3a',
    chipText: '#64b5f6',
    hoverBg: 'rgba(255,255,255,0.06)',
    markdownTable: '#444',
    markdownTableHeaderBg: '#2a2a2a',
    blockquoteBorder: '#555',
    blockquoteText: '#aaa',
  },
};

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    try {
      return localStorage.getItem('omni_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('omni_theme', themeName); } catch {}
    document.body.style.background = THEMES[themeName].bg;
    document.body.style.color = THEMES[themeName].text;
  }, [themeName]);

  const theme = THEMES[themeName];
  const toggleTheme = () => setThemeName((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, themeName, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
