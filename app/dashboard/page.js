'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getAnnouncements, getEvents, getFamilyMembers } from '@/lib/firebase/firestore';
import { formatName } from '@/lib/formatters';

const STAT_LINKS = [
  { label: 'Family Members', key: 'members', href: '/dashboard/family',        icon: '◉', color: '#0F2A1F' },
  { label: 'Events',         key: 'events',  href: '/dashboard/events',         icon: '◷', color: '#7A9BB5' },
  { label: 'Announcements',  key: 'ann',     href: '/dashboard/announcements',  icon: '◎', color: '#6BA888' },
];

export default function DashboardPage() {
  const { user, userData, loading } = useAuth();
  const [stats, setStats] = useState({ members: '—', events: '—', ann: '—' });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    if (loading || !user) return;
    async function load() {
      try {
        const [members, events, ann] = await Promise.all([
          getFamilyMembers(),
          getEvents(),
          getAnnouncements(),
        ]);
        setStats({ members: members.length, events: events.length, ann: ann.length });
        const items = ann.slice(0, 3).map((a) => ({ ...a, type: 'Announcement' }));
        setRecent(items);
      } catch { /* silently skip */ }
    }
    load();
  }, [loading, user]);

  const firstName = formatName(userData?.displayName || user?.displayName || 'there').split(' ')[0];

  return (
    <>
      {/* Header */}
      <div className="mb-10">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(15, 42, 31,0.65)', marginBottom: '0.5rem' }}>
          Welcome back
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', fontWeight: 300, color: '#1A1008', lineHeight: 1.2 }}>
          Hello, {firstName}
        </h1>
        <span className="gold-rule block mt-3" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
        {STAT_LINKS.map((s) => (
          <Link key={s.key} href={s.href} style={{ textDecoration: 'none' }}>
            <div
              className="glass-warm shadow-cloud p-6 transition-all duration-200"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(26, 61, 46,0.18)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.1rem', color: s.color }}>{s.icon}</span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)' }}>
                  {s.label}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '2.8rem', fontWeight: 300, color: '#1A1008', lineHeight: 1 }}>
                {stats[s.key]}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.1rem', color: '#1A1008', marginBottom: '1.5rem', fontWeight: 400 }}>
            Recent Announcements
          </h2>
          <div className="flex flex-col gap-4">
            {recent.map((item) => (
              <div key={item.id} className="glass shadow-cloud p-5" style={{ borderLeft: '3px solid rgba(26, 61, 46,0.35)' }}>
                <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '0.95rem', color: '#1A1008', marginBottom: '0.4rem' }}>{item.title}</p>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'rgba(26,16,8,0.5)', lineHeight: 1.6 }}>
                  {item.content?.slice(0, 140)}{item.content?.length > 140 ? '…' : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
