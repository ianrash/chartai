import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseInitialized } from '../supabaseClient';

const SESSION_TIMEOUT = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

const AuthContext = createContext(undefined);

function AuthProviderInner({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const timeoutRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const clearSessionTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const clearRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    clearSessionTimeout();
    clearRefreshInterval();
    if (isSupabaseInitialized()) {
      await supabase.auth.signOut();
    }
    setSession(null);
  }, [clearSessionTimeout, clearRefreshInterval]);

  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const checkSessionTimeout = useCallback(() => {
    const elapsed = Date.now() - lastActivityRef.current;
    if (elapsed >= SESSION_TIMEOUT && session) {
      console.log('Session expired due to inactivity');
      logout();
    }
  }, [session, logout]);

  const refreshToken = useCallback(async () => {
    if (!isSupabaseInitialized()) return;
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Token refresh failed:', error.message);
        logout();
      }
    } catch (e) {
      console.error('Token refresh error:', e.message);
    }
  }, [logout]);

  useEffect(() => {
    if (!isSupabaseInitialized()) {
      console.error('Supabase client is not initialized. Check environment variables.');
      setLoading(false);
      return;
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) resetActivityTimer();
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error getting session:', error.message);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session) resetActivityTimer();
    });

    return () => {
      subscription.unsubscribe();
      clearSessionTimeout();
      clearRefreshInterval();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetActivityTimer, { passive: true });
    });

    timeoutRef.current = setInterval(checkSessionTimeout, 60000);
    refreshIntervalRef.current = setInterval(refreshToken, 5 * 60 * 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetActivityTimer);
      });
      clearSessionTimeout();
      clearRefreshInterval();
    };
  }, [session, resetActivityTimer, checkSessionTimeout, clearSessionTimeout, clearRefreshInterval, refreshToken]);

  return (
    <AuthContext.Provider value={{ session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}