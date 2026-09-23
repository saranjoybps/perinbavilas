'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signOutUser } from '@/lib/firebase/auth';
import { formatName } from '@/lib/formatters';

const NAV = [
  { label: 'Family Book',   short: 'Book',   href: '/dashboard/family-book',   icon: '▣' },
  { label: 'My Profile',    short: 'Me',     href: '/dashboard/profile',       icon: '◈' },
  { label: 'Gallery',       short: 'Photos', href: '/dashboard/gallery',       icon: '◫' },
  { label: 'Announcements', short: 'News',   href: '/dashboard/announcements', icon: '◎' },
  { label: 'Events',        short: 'Events', href: '/dashboard/events',        icon: '◷' },
];

function isActive(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardLayout({ children }) {
  const { user, userData, loading, isAdmin } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOutUser();
    document.cookie = '__auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  };

  if (loading) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #F4F7F5 0%, #E7EFEA 100%)' }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1.5px solid rgba(15, 42, 31,0.2)',
            borderTopColor: '#0F2A1F',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
    );
  }

  if (!user) return null;

  const displayName = formatName(userData?.displayName || user.displayName) || 'Family Member';

  const sidebarNav = (
    <nav className="flex flex-col gap-0.5 flex-1" style={{ padding: '0 0.75rem' }}>
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{
              fontFamily: 'var(--font-inter)',
              textDecoration: 'none',
              borderLeft: active ? '2px solid #0F2A1F' : '2px solid transparent',
              background: active ? 'rgba(15, 42, 31,0.07)' : 'transparent',
              color: active ? '#0F2A1F' : 'rgba(26,16,8,0.55)',
              fontSize: '0.825rem',
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}

      {isAdmin && (
        <>
          <div
            style={{
              margin: '1rem 0 0.5rem',
              padding: '0 1rem',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.6rem',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'rgba(15, 42, 31,0.55)',
            }}
          >
            Admin
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-2.5"
            style={{
              fontFamily: 'var(--font-inter)',
              textDecoration: 'none',
              color: 'rgba(26,16,8,0.45)',
              fontSize: '0.825rem',
              borderLeft: '2px solid transparent',
            }}
          >
            <span style={{ fontSize: '0.75rem' }}>⚙</span> Admin Panel
          </Link>
        </>
      )}
    </nav>
  );

  return (
    <div
      className="min-h-dvh flex"
      style={{ background: 'linear-gradient(180deg, #F7FAF8 0%, #EEF3F0 100%)' }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: 240,
          minHeight: '100dvh',
          background: 'rgba(255,255,255,0.92)',
          borderRight: '1px solid rgba(15, 42, 31,0.1)',
          padding: '2rem 0',
          position: 'sticky',
          top: 0,
          height: '100dvh',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '0 1.5rem 2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.3rem', color: '#0F2A1F' }}>
              Perinba Vilas
            </span>
          </Link>
          <span className="gold-rule" style={{ width: 40, margin: '10px 0 8px' }} />
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.65rem',
              color: 'rgba(26,16,8,0.35)',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              marginTop: '0.2rem',
            }}
          >
            Family Portal
          </p>
        </div>

        {sidebarNav}

        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(26, 61, 46,0.12)', marginTop: 'auto' }}>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.75rem',
              color: '#1A1008',
              fontWeight: 500,
              marginBottom: '0.2rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.68rem',
              color: 'rgba(26,16,8,0.35)',
              marginBottom: '1rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.email}
          </p>
          <button
            onClick={handleSignOut}
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(26,16,8,0.35)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4"
        style={{
          height: '3.25rem',
          paddingTop: 'env(safe-area-inset-top)',
          background: 'rgba(247,250,248,0.96)',
          borderBottom: '1px solid rgba(15, 42, 31,0.1)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link href="/dashboard/family-book" style={{ textDecoration: 'none', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.15rem', color: '#0F2A1F' }}>
            Perinba Vilas
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="Open menu"
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            border: '1px solid rgba(15, 42, 31,0.18)',
            background: '#fff',
            color: '#0F2A1F',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {(displayName || 'U').charAt(0).toUpperCase()}
        </button>
      </header>

      {/* Mobile account sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0"
            style={{ background: 'rgba(15, 42, 31,0.35)' }}
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute left-0 right-0 bottom-0 px-5 pt-4"
            style={{
              background: '#fff',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
              boxShadow: '0 -8px 40px rgba(15, 42, 31,0.12)',
            }}
          >
            <div
              className="mx-auto mb-4"
              style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(15,42,31,0.12)' }}
            />
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.25rem', color: '#0F2A1F', marginBottom: 2 }}>
              {displayName}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.78rem',
                color: 'rgba(26,16,8,0.4)',
                marginBottom: '1.25rem',
                wordBreak: 'break-all',
              }}
            >
              {user.email}
            </p>

            <div className="flex flex-col gap-1 mb-3">
              <Link
                href="/dashboard/profile"
                onClick={() => setMoreOpen(false)}
                className="py-3 px-1"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.9rem',
                  color: '#0F2A1F',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(15,42,31,0.08)',
                }}
              >
                My Profile
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMoreOpen(false)}
                  className="py-3 px-1"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    color: '#0F2A1F',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(15,42,31,0.08)',
                  }}
                >
                  Admin Panel
                </Link>
              )}
              <Link
                href="/"
                onClick={() => setMoreOpen(false)}
                className="py-3 px-1"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.9rem',
                  color: '#0F2A1F',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(15,42,31,0.08)',
                }}
              >
                Back to website
              </Link>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-3.5 mt-1"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#b03030',
                background: 'rgba(176,48,48,0.06)',
                border: '1px solid rgba(176,48,48,0.18)',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 w-full">
        <div
          className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 lg:px-10 pt-[calc(3.75rem+env(safe-area-inset-top))] pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:py-10"
        >
          {children}
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.97)',
          borderTop: '1px solid rgba(15, 42, 31,0.1)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          backdropFilter: 'blur(14px)',
        }}
        aria-label="Portal navigation"
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            height: '3.75rem',
          }}
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 min-w-0"
                style={{
                  textDecoration: 'none',
                  color: active ? '#0F2A1F' : 'rgba(15,42,31,0.42)',
                  background: active ? 'rgba(15, 42, 31,0.05)' : 'transparent',
                }}
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>{item.icon}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.58rem',
                    letterSpacing: '0.02em',
                    lineHeight: 1.2,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    padding: '0 2px',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {item.short}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
