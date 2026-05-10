import { useState } from 'react';
import { supabase, isSupabaseInitialized } from '../supabaseClient';
import { LogIn, ArrowLeft } from 'lucide-react';

export default function LoginPage({ onBack, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-md relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute -top-12 left-0 flex items-center gap-2 text-sm text-muted hover:text-main transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
        )}
        <div className="card p-8 border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl mx-auto bg-accent flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--accent)' }}>
              <LogIn size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>ChartAI</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              {isSignUp ? 'Create your account' : 'Sign in to continue'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <div>
              <label className="label block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 transition-all"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
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
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 transition-all"
                style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-sm hover:underline transition-all"
              style={{ color: 'var(--muted)' }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
