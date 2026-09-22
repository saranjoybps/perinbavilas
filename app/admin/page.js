'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPendingEditRequests, getAllUsers, getGalleryItems, getEvents, getAnnouncements } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export default function AdminPage() {
  const { loading: authLoading, isAdmin } = useAuth();
  const [stats, setStats] = useState({ requests: '—', users: '—', gallery: '—', events: '—', announcements: '—' });

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    async function load() {
      try {
        const [req, users, gallery, events, announcements] = await Promise.all([
          getPendingEditRequests(),
          getAllUsers(),
          getGalleryItems(),
          getEvents(),
          getAnnouncements(),
        ]);
        setStats({ requests: req.length, users: users.length, gallery: gallery.length, events: events.length, announcements: announcements.length });
      } catch { /* ignore */ }
    }
    load();
  }, [authLoading, isAdmin]);

  const CARDS = [
    { label: 'Pending Requests', value: stats.requests, href: '/admin/requests',     icon: '◎', accent: '#C09030' },
    { label: 'Total Users',      value: stats.users,    href: '/admin/users',         icon: '◉', accent: '#5A8FAA' },
    { label: 'Gallery Photos',   value: stats.gallery,  href: '/admin/gallery',       icon: '▣', accent: '#6BA888' },
    { label: 'Events',           value: stats.events,   href: '/admin/events',        icon: '◷', accent: '#7A9BB5' },
    { label: 'Announcements',    value: stats.announcements, href: '/admin/announcements', icon: '◎', accent: '#6BA888' },
  ];

  return (
    <>
      <div className="mb-10">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(15, 42, 31,0.65)', marginBottom: '0.4rem' }}>
          Admin
        </p>
        <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', fontWeight: 300, color: '#1A1008' }}>Overview</h1>
        <span className="gold-rule block mt-3" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {CARDS.map((c) => (
          <Link key={c.label} href={c.href} style={{ textDecoration: 'none' }}>
            <div className="glass-warm shadow-cloud p-6 transition-all duration-200" style={{ cursor: 'pointer', borderTop: `2px solid ${c.accent}40` }}>
              <div className="flex items-center gap-3 mb-4">
                <span style={{ fontSize: '1.1rem', color: c.accent }}>{c.icon}</span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)' }}>
                  {c.label}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '3rem', fontWeight: 300, color: '#1A1008', lineHeight: 1 }}>
                {c.value}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
