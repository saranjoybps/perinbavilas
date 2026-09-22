'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { resetPassword } from '@/lib/firebase/auth';

export default function ForgotPasswordForm() {
  const [email,   setEmail]   = useState('');
  const [status,  setStatus]  = useState('idle'); // idle | sent | error
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setStatus('sent');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'sent') {
    return (
      <div className="text-center py-4">
        <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2.5rem', color: '#1A3D2E', display: 'block', marginBottom: '1rem' }}>◇</span>
        <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', color: '#1A1008', marginBottom: '0.5rem' }}>Check your inbox</p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'rgba(26,16,8,0.5)', marginBottom: '1.5rem' }}>A password reset link has been sent to {email}.</p>
        <Link href="/login" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#0F2A1F', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {status === 'error' && (
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#b03030', padding: '0.6rem 1rem', background: 'rgba(176,48,48,0.06)', border: '1px solid rgba(176,48,48,0.15)' }}>
          Could not send reset email. Check the address and try again.
        </p>
      )}
      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.55)', lineHeight: 1.7 }}>
        Enter your email and we'll send you a link to reset your password.
      </p>
      <div>
        <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: '0.45rem' }}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.58)',
            border: '1px solid rgba(26, 61, 46,0.22)',
            padding: '0.8rem 1rem',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.875rem',
            color: '#1A1008',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#0F2A1F')}
          onBlur={(e)  => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
        />
      </div>
      <motion.button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 text-sm tracking-widest uppercase"
        style={{
          fontFamily: 'var(--font-inter)',
          background: '#1A1008',
          color: '#FFF7ED',
          letterSpacing: '0.14em',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? 'Sending…' : 'Send Reset Link'}
      </motion.button>
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'rgba(26,16,8,0.45)' }}>
        <Link href="/login" style={{ color: '#0F2A1F', textDecoration: 'none' }}>Back to Sign In</Link>
      </p>
    </form>
  );
}
