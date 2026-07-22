'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getAnnouncements } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/formatters';

export default function AnnouncementsPage() {
  const { user, loading: authLoading } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    getAnnouncements().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, [authLoading, user]);

  return (
    <>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.65)', marginBottom: '0.4rem' }}>
          Portal
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>Announcements</h1>
        <span className="gold-rule block mt-3" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(196,155,26,0.2)', borderTopColor: '#C49B1A', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-warm shadow-cloud p-6 md:p-10 text-center max-w-md">
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', color: '#D4AF37', marginBottom: '0.75rem' }}>◎</p>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.45)' }}>No announcements yet. Check back soon.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 max-w-2xl">
          {items.map((item) => (
            <div key={item.id} className="glass-warm shadow-cloud p-5 md:p-7" style={{ borderLeft: '3px solid rgba(212,175,55,0.45)' }}>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,155,26,0.6)', marginBottom: '0.5rem' }}>
                {item.createdAt?.toDate
                  ? formatDate(item.createdAt)
                  : ''}
              </p>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '0.6rem' }}>
                {item.title}
              </h2>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.6)', lineHeight: 1.8 }}>
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
