'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getEvents } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/formatters';

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    getEvents().then(setItems).catch(console.error).finally(() => setLoading(false));
  }, [authLoading, user]);

  return (
    <>
      <div className="mb-8">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(15, 42, 31,0.65)', marginBottom: '0.4rem' }}>
          Portal
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.5rem, 4.5vw, 2rem)', fontWeight: 300, color: '#1A1008' }}>Events</h1>
        <span className="gold-rule block mt-3" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(15, 42, 31,0.2)', borderTopColor: '#0F2A1F', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-warm shadow-cloud p-6 md:p-10 text-center max-w-md">
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.8rem', color: '#1A3D2E', marginBottom: '0.75rem' }}>◷</p>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: 'rgba(26,16,8,0.45)' }}>No upcoming events at the moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 max-w-2xl">
          {items.map((item) => {
            const dateStr = formatDate(item.date);
            return (
              <div key={item.id} className="glass-warm shadow-cloud p-5 md:p-7" style={{ borderTop: '2px solid rgba(26, 61, 46,0.35)' }}>
                <div className="flex items-start gap-2 md:gap-4">
                  {/* Date badge */}
                  <div className="shrink-0" style={{ minWidth: 42, textAlign: 'center', padding: '0.4rem 0.5rem', background: 'rgba(26, 61, 46,0.08)', border: '1px solid rgba(26, 61, 46,0.2)' }}>
                    <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.5rem', color: '#0F2A1F', lineHeight: 1 }}>
                      {item.date?.toDate ? String(item.date.toDate().getDate()).padStart(2, '0') : '—'}
                    </p>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.35)' }}>
                      {item.date?.toDate ? String(item.date.toDate().getMonth() + 1).padStart(2, '0') : ''}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#1A1008', fontWeight: 400, marginBottom: '0.3rem' }}>
                      {item.title}
                    </h2>
                    {dateStr && <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(15, 42, 31,0.7)', marginBottom: '0.4rem' }}>{dateStr}</p>}
                    {item.location && (
                      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(15, 42, 31,0.7)', marginBottom: '0.4rem' }}>
                        📍 {item.location}
                      </p>
                    )}
                    {item.description && (
                      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'rgba(26,16,8,0.55)', lineHeight: 1.7 }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
