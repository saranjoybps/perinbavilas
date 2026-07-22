'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { submitEditRequest } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/formatters';

const FIELDS = [
  { name: 'displayName', label: 'Full Name',   type: 'text'     },
  { name: 'phone',       label: 'Phone',        type: 'text'     },
  { name: 'branch',      label: 'Branch',       type: 'text'     },
  { name: 'profession',  label: 'Profession',   type: 'text'     },
  { name: 'location',    label: 'Location',     type: 'text'     },
  { name: 'address',     label: 'Address',      type: 'text'     },
  { name: 'dateOfBirth', label: 'Date of Birth', type: 'date'    },
  { name: 'bio',         label: 'About Me',     type: 'textarea' },
];

export default function EditRequestForm({ currentData = {}, onSubmitted }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    displayName: currentData.displayName || '',
    phone:       currentData.phone       || '',
    branch:      currentData.branch      || '',
    profession:  currentData.profession  || '',
    location:    currentData.location    || '',
    address:     currentData.address     || '',
    dateOfBirth: formatDate(currentData.dateOfBirth),
    bio:         currentData.bio         || '',
  });
  const [status,  setStatus]  = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await submitEditRequest(user.uid, form);
      setStatus('success');
      onSubmitted?.();
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Failed to submit request. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2rem', color: '#D4AF37', display: 'block', marginBottom: '1rem' }}>✦</span>
        <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', marginBottom: '0.4rem' }}>Request submitted</p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'rgba(26,16,8,0.5)' }}>An admin will review your changes shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {status === 'error' && (
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#b03030', padding: '0.6rem 1rem', background: 'rgba(176,48,48,0.06)', border: '1px solid rgba(176,48,48,0.15)' }}>
          {message}
        </p>
      )}

      {FIELDS.map((f) => (
        <div key={f.name}>
          <label style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', display: 'block', marginBottom: '0.45rem' }}>
            {f.label}
          </label>
          {f.type === 'textarea' ? (
            <textarea
              rows={4}
              value={form[f.name]}
              onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
              style={{
                width: '100%', resize: 'vertical',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(212,175,55,0.22)',
                padding: '0.75rem 1rem',
                fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: '#1A1008',
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C49B1A')}
              onBlur={(e)  => (e.target.style.borderColor = 'rgba(212,175,55,0.22)')}
            />
          ) : (
            <input
              type={f.type === 'date' ? 'text' : f.type}
              inputMode={f.type === 'date' ? 'numeric' : undefined}
              placeholder={f.type === 'date' ? 'DD-MM-YYYY' : undefined}
              value={form[f.name]}
              onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(212,175,55,0.22)',
                padding: '0.75rem 1rem',
                fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: '#1A1008',
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C49B1A')}
              onBlur={(e)  => (e.target.style.borderColor = 'rgba(212,175,55,0.22)')}
            />
          )}
        </div>
      ))}

      <motion.button
        type="submit"
        disabled={status === 'loading'}
        className="py-3 text-xs tracking-widest uppercase mt-2"
        style={{
          fontFamily: 'var(--font-inter)',
          background: '#1A1008', color: '#FFF7ED',
          letterSpacing: '0.14em',
          cursor: status === 'loading' ? 'wait' : 'pointer',
          opacity: status === 'loading' ? 0.7 : 1,
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {status === 'loading' ? 'Submitting…' : 'Submit Edit Request'}
      </motion.button>
    </form>
  );
}
