import { useState } from 'react';
import { supabase, isSupabaseInitialized } from '../supabaseClient';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage({ onBack, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const validatePassword = (pass) => {
    if (pass.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isSupabaseInitialized()) {
        throw new Error('Supabase is not initialized. Please check environment variables.');
      }

      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }

      // Handle auto-confirm case where session already exists
      if (data.session) {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isSupabaseInitialized()) {
        throw new Error('Supabase is not initialized. Please check environment variables.');
      }

      // Validate password for sign up
      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      const { error, data } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        throw error;
      }

      // Handle auto-confirm case (session exists immediately after signup)
      if (data.session) {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setError('Check your email for a confirmation link.');
        setIsSignUp(false);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResetSent(false);

    try {
      if (!isSupabaseInitialized()) {
        throw new Error('Supabase is not initialized. Please check environment variables.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#recovery`,
      });

      if (error) throw error;

      setResetSent(true);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        {onBack && (
          <button onClick={onBack} className="btn-ghost absolute -top-12 left-0">
            <ArrowLeft size={14} /> Back to Home
          </button>
        )}

        <div className="modal-panel p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-5">
              <img src="/favicon.svg" alt="ChartAI logo" className="w-8 h-8" />
              <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
                ChartAI
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              {showResetForm ? 'Reset your password' : isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
              {showResetForm
                ? 'Enter your email and we\u2019ll send a reset link.'
                : isSignUp
                  ? 'Start analyzing charts with AI in minutes.'
                  : 'Sign in to continue to ChartAI.'}
            </p>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bearish-glow)',
                border: '1px solid rgba(242, 54, 69, 0.3)',
                color: 'var(--bearish)',
              }}
            >
              {error}
            </div>
          )}

          {resetSent && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bullish-glow)',
                border: '1px solid rgba(8, 153, 129, 0.3)',
                color: 'var(--bullish)',
              }}
            >
              Password reset link sent! Check your email.
            </div>
          )}

          {showResetForm ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="label block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="field"
                  placeholder="you@example.com"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setShowResetForm(false); setError(''); setResetSent(false); }}
                  className="text-sm hover:underline transition-all"
                  style={{ color: 'var(--muted)' }}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <div>
              <label className="label block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="label block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="field"
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => { setShowResetForm(true); setError(''); }}
                className="text-xs hover:underline transition-all"
                style={{ color: 'var(--muted)' }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-sm hover:underline transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
