'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getFamilyMembers } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export default function FamilyPage() {
  const { user, loading: authLoading } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    getFamilyMembers().then(setMembers).catch(console.error).finally(() => setLoading(false));
  }, [authLoading, user]);

  return (
    <>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.65)', marginBottom: '0.4rem' }}>
          Portal
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>Family Members</h1>
        <span className="gold-rule block mt-3" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(196,155,26,0.2)', borderTopColor: '#C49B1A', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : members.length === 0 ? (
        <div className="glass-warm shadow-cloud p-10 text-center max-w-md">
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', color: '#D4AF37', marginBottom: '0.75rem' }}>◇</p>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.45)' }}>No family members added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((m) => (
            <div key={m.id} className="glass-warm shadow-cloud p-6" style={{ borderTop: '2px solid rgba(212,175,55,0.3)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem', color: '#C49B1A' }}>
                  {(m.name || m.displayName || '?')[0]}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '0.95rem', color: '#1A1008', marginBottom: '0.3rem', fontWeight: 400 }}>
                {m.name || m.displayName}
              </h3>
              {m.branch && (
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(26,16,8,0.4)', marginBottom: '0.2rem' }}>
                  {m.branch}
                </p>
              )}
              {m.profession && (
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(26,16,8,0.4)' }}>
                  {m.profession}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
