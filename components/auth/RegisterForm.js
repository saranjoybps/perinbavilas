'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signUpWithEmail } from '@/lib/firebase/auth';

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8)       { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await signUpWithEmail(form.email, form.password, form.name);
      router.push('/dashboard/family-book');
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'That email is already registered.' : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.58)',
    border: '1px solid rgba(26, 61, 46,0.22)',
    padding: '0.8rem 1rem',
    fontFamily: 'var(--font-inter)',
    fontSize: '0.875rem',
    color: '#1A1008',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {error && (
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#b03030', padding: '0.6rem 1rem', background: 'rgba(176,48,48,0.06)', border: '1px solid rgba(176,48,48,0.15)' }}>
          {error}
        </p>
      )}

      {[
        { name: 'name',     type: 'text',     label: 'Full Name',       placeholder: 'Your full name' },
        { name: 'email',    type: 'email',    label: 'Email',           placeholder: 'you@example.com' },
        { name: 'password', type: 'password', label: 'Password',        placeholder: 'Min. 8 characters' },
        { name: 'confirm',  type: 'password', label: 'Confirm Password', placeholder: 'Repeat password' },
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
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#0F2A1F')}
            onBlur={(e)  => (e.target.style.borderColor = 'rgba(26, 61, 46,0.22)')}
          />
        </div>
      ))}

      <motion.button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 text-sm tracking-widest uppercase mt-2"
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
        {loading ? 'Creating account…' : 'Create Account'}
      </motion.button>

      <p style={{ textAlign: 'center', fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'rgba(26,16,8,0.45)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#0F2A1F', textDecoration: 'none' }}>Sign in</Link>
      </p>
    </form>
  );
}
