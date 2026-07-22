'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import EditRequestForm from '@/components/dashboard/EditRequestForm';
import { formatDate, formatName } from '@/lib/formatters';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const [editing, setEditing] = useState(false);

  const fields = [
    { label: 'Full Name',  value: formatName(userData?.displayName || user?.displayName) || '—' },
    { label: 'Email',      value: user?.email || '—'                                 },
    { label: 'Code',       value: userData?.code       || '—'                        },
    { label: 'Phone',      value: userData?.phone       || '—'                       },
    { label: 'Branch',     value: userData?.branch      || '—'                       },
    { label: 'Profession', value: userData?.profession  || '—'                       },
    { label: 'Location',   value: userData?.location    || '—'                       },
    { label: 'Address',    value: userData?.address     || '—'                       },
    { label: 'Date of Birth', value: formatDate(userData?.dateOfBirth) || '—'        },
    { label: 'Role',       value: userData?.role        || 'member'                  },
  ];

  return (
    <>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.65)', marginBottom: '0.4rem' }}>
          Account
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>My Profile</h1>
        <span className="gold-rule block mt-3" />
      </div>

      <div className="max-w-2xl">
        <div className="glass-warm shadow-cloud p-5 md:p-8 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6">
            {fields.map((f) => (
              <div key={f.label}>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.35)', marginBottom: '0.4rem' }}>
                  {f.label}
                </p>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#1A1008' }}>{f.value}</p>
              </div>
            ))}
          </div>

          {userData?.bio && (
            <div>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.35)', marginBottom: '0.4rem' }}>
                About Me
              </p>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.7)', lineHeight: 1.7 }}>{userData.bio}</p>
            </div>
          )}
        </div>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-7 py-3 text-xs tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-inter)',
              border: '1px solid rgba(196,155,26,0.45)',
              color: '#C49B1A',
              background: 'transparent',
              cursor: 'pointer',
              letterSpacing: '0.14em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C49B1A'; }}
          >
            Request Profile Edit
          </button>
        ) : (
          <div className="glass-warm shadow-cloud p-5 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400 }}>Propose Changes</h2>
              <button onClick={() => setEditing(false)} style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(26,16,8,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'rgba(26,16,8,0.45)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Changes are reviewed by an admin before being applied.
            </p>
            <EditRequestForm currentData={userData || {}} onSubmitted={() => setEditing(false)} />
          </div>
        )}
      </div>
    </>
  );
}
