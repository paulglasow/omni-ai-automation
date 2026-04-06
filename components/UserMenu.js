'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from '../lib/supabase/client';

export default function UserMenu() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      {user.user_metadata?.avatar_url && (
        <img
          src={user.user_metadata.avatar_url}
          alt=""
          className="w-8 h-8 rounded-full"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {user.user_metadata?.full_name || user.email}
        </div>
        <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
      </div>
      <button
        onClick={signOut}
        className="text-[10px] text-slate-500 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
        title="Sign out"
      >
        ↪
      </button>
    </div>
  );
}
