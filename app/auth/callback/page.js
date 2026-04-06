'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '../../../lib/supabase/client';

export default function AuthCallback() {
  const [status, setStatus] = useState('Signing you in...');

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus('Supabase not configured');
      return;
    }

    // Supabase automatically picks up the session from the URL hash/params
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Successfully signed in — redirect to dashboard
        window.location.href = '/dashboard';
      } else if (event === 'TOKEN_REFRESHED') {
        window.location.href = '/dashboard';
      }
    });

    // Also check if we already have a session (in case the event already fired)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/dashboard';
      } else {
        // Wait a moment for the hash to be processed
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            window.location.href = '/dashboard';
          } else {
            setStatus('Sign in failed. Please try again.');
            setTimeout(() => { window.location.href = '/login'; }, 2000);
          }
        }, 2000);
      }
    });
  }, []);

  return (
    <div className="h-[100dvh] flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🔐</div>
        <div className="text-slate-600 font-medium">{status}</div>
      </div>
    </div>
  );
}
