'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signInWithEmail } from '@/lib/firebase/auth';

export default function LoginForm() {
  const router = useRouter();
  const [form,    setForm]   = useState({ email: '', password: '' });
  const [error,   setError]  = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(form.email, form.password);
      router.push('/dashboard');
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Email form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#b03030', padding: '0.6rem 1rem', background: 'rgba(176,48,48,0.06)', border: '1px solid rgba(176,48,48,0.15)' }}>
            {error}
          </p>
        )}

        {[
          { name: 'email',    type: 'email',    label: 'Email',    placeholder: 'you@example.com' },
          { name: 'password', type: 'password', label: 'Password', placeholder: '••••••••' },
        ].map((f) => (
          <div key={f.name}>
            <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: '0.45rem' }}>
              {f.label}
            </label>
            <input
              type={f.type}
              required
              value={form[f.name]}
              onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
              placeholder={f.placeholder}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.58)',
                border: '1px solid rgba(212,175,55,0.22)',
                padding: '0.8rem 1rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                color: '#1A1008',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e)  => (e.target.style.borderColor = '#C49B1A')}
              onBlur={(e)   => (e.target.style.borderColor = 'rgba(212,175,55,0.22)')}
            />
          </div>
        ))}

        <div className="flex justify-end">
          <Link
            href="/login/forgot-password"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(196,155,26,0.7)', textDecoration: 'none' }}
          >
            Forgot password?
          </Link>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 text-sm tracking-widest uppercase"
          style={{
            fontFamily: 'var(--font-inter)',
            border: '1px solid rgba(196,155,26,0.45)',
            color: '#C49B1A',
            background: 'transparent',
            letterSpacing: '0.14em',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; } }}
          onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C49B1A'; } }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </motion.button>
      </form>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/invalid-credential':      'Incorrect email or password.',
    'auth/user-not-found':          'No account found with that email.',
    'auth/wrong-password':          'Incorrect password.',
    'auth/too-many-requests':       'Too many attempts — please try again later.',
    'auth/network-request-failed':  'Network error. Check your connection.',
  };
  return map[code] || 'Sign-in failed. Please try again.';
}
