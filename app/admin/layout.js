'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { signOutUser } from '@/lib/firebase/auth';

const NAV = [
  { label: 'Overview',      href: '/admin',               icon: '◇' },
  { label: 'Family',        href: '/admin/family',         icon: '◈' },
  { label: 'Requests',      href: '/admin/requests',       icon: '◎' },
  { label: 'Users',         href: '/admin/users',          icon: '◉' },
  { label: 'Audit Logs',    href: '/admin/audit',          icon: '▤' },
  { label: 'Gallery',       href: '/admin/gallery',        icon: '▣' },
  { label: 'Events',        href: '/admin/events',         icon: '◷' },
  { label: 'Announcements', href: '/admin/announcements',  icon: '◎' },
];

export default function AdminLayout({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user)     router.push('/login');
    if (!loading && !isAdmin)  router.push('/dashboard/family-book');
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOutUser();
    document.cookie = '__auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #F4F7F5 0%, #E7EFEA 100%)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(15, 42, 31,0.2)', borderTopColor: '#0F2A1F', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (!user || !isAdmin) return null;

  const sidebarContent = (
    <>
      <div style={{ padding: '0 1.5rem 2rem' }}>
        <Link href="/" style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.3rem', color: '#0F2A1F' }}>Perinba Vilas</span>
        </Link>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.6rem', color: 'rgba(15, 42, 31,0.55)', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: '0.2rem' }}>
          Admin Panel
        </p>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1" style={{ padding: '0 0.75rem' }}>
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
              style={{
                fontFamily: 'var(--font-inter)', textDecoration: 'none',
                borderLeft: active ? '2px solid #0F2A1F' : '2px solid transparent',
                background: active ? 'rgba(15, 42, 31,0.07)' : 'transparent',
                color: active ? '#0F2A1F' : 'rgba(26,16,8,0.55)',
                fontSize: '0.825rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <div style={{ margin: '1rem 0 0.25rem 1rem', fontFamily: 'var(--font-inter)', fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(26,16,8,0.25)' }}>
          Back
        </div>
        <Link href="/dashboard/family-book" className="flex items-center gap-3 px-4 py-2.5" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.825rem', textDecoration: 'none', color: 'rgba(26,16,8,0.4)', borderLeft: '2px solid transparent' }}>
          ← Dashboard
        </Link>
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(26, 61, 46,0.12)', marginTop: 'auto' }}>
        <button
          onClick={handleSignOut}
          style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(15, 42, 31,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#b03030')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(15, 42, 31,0.4)')}
        >
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(180deg, #F7FAF8 0%, #EEF3F0 100%)' }}>
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(247,250,248,0.96)', borderBottom: '1px solid rgba(15, 42, 31,0.1)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem', color: '#0F2A1F' }}>Perinba Vilas</span>
        </Link>
        <button onClick={() => setMobileOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: '#0F2A1F', padding: '0.25rem', lineHeight: 1 }}>
          ☰
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col"
        style={{
          width: 240,
          minHeight: '100vh',
          background: 'rgba(255,255,255,0.92)',
          borderRight: '1px solid rgba(15, 42, 31,0.1)',
          padding: '2rem 0',
          position: 'sticky', top: 0,
          height: '100vh', overflowY: 'auto',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(15, 42, 31,0.35)' }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <aside className="md:hidden fixed top-0 left-0 z-50 h-full"
        style={{
          width: 260,
          background: 'rgba(255,255,255,0.98)',
          borderRight: '1px solid rgba(15, 42, 31,0.1)',
          padding: '2rem 0',
          overflowY: 'auto',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div style={{ padding: '0 1.5rem 1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setMobileOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#0F2A1F', padding: '0.25rem', lineHeight: 1 }}>
            ✕
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="p-5 md:p-6 lg:p-10"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
