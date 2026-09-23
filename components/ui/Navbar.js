'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useWelcomeGate } from '@/context/WelcomeGateContext';
import { signOutUser } from '@/lib/firebase/auth';
import { useRouter, usePathname } from 'next/navigation';

const NAV = [
  { label: 'Introduction', href: '/introduction' },
  { label: 'Gallery',      href: '/gallery' },
];

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const { ready, active: welcomeActive } = useWelcomeGate();
  const router            = useRouter();
  const pathname          = usePathname();
  const isAppRoute =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/login');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    document.cookie = '__auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  };

  if (!ready || isAppRoute || welcomeActive) return null;

  const overHero = pathname === '/' && !scrolled;
  const brandColor = overHero ? '#FFF7ED' : '#0F2A1F';
  const linkColor = overHero ? 'rgba(255,247,237,0.82)' : 'rgba(15,42,31,0.62)';
  const linkHover = '#A8C4B4';

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: scrolled || pathname !== '/' ? 'rgba(255,255,255,0.94)' : 'transparent',
        backdropFilter: scrolled || pathname !== '/' ? 'blur(20px) saturate(1.4)' : 'none',
        borderBottom: scrolled || pathname !== '/' ? '1px solid rgba(15, 42, 31,0.2)' : 'none',
        transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
      }}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1.4rem',
              fontWeight: 400,
              color: brandColor,
              letterSpacing: '0.02em',
              transition: 'color 0.3s',
              textShadow: overHero ? '0 1px 18px rgba(0,0,0,0.28)' : 'none',
            }}
          >
            Perinba Vilas
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV.map((item) => {
            const isActive =
              (item.href === '/introduction' && pathname === '/introduction') ||
              (item.href === '/gallery' && pathname === '/gallery');
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: isActive ? linkHover : linkColor,
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  textShadow: overHero ? '0 1px 12px rgba(0,0,0,0.22)' : 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = linkHover)}
                onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? linkHover : linkColor)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: overHero ? 'rgba(168, 196, 180,0.92)' : 'rgba(15, 42, 31,0.7)',
                    textDecoration: 'none',
                  }}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard/family-book"
                className="px-5 py-2 text-xs tracking-widest uppercase transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-inter)',
                  border: overHero ? '1px solid rgba(255,247,237,0.75)' : '1px solid rgba(15, 42, 31,0.45)',
                  color: overHero ? '#FFF7ED' : '#0F2A1F',
                  textDecoration: 'none',
                  letterSpacing: '0.14em',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0F2A1F';
                  e.currentTarget.style.color = '#FFF7ED';
                  e.currentTarget.style.borderColor = '#0F2A1F';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = overHero ? '#FFF7ED' : '#0F2A1F';
                  e.currentTarget.style.borderColor = overHero ? 'rgba(255,247,237,0.75)' : 'rgba(15, 42, 31,0.45)';
                }}
              >
                Portal
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: overHero ? 'rgba(255,247,237,0.55)' : 'rgba(26,16,8,0.35)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c03020')}
                onMouseLeave={(e) => (e.currentTarget.style.color = overHero ? 'rgba(255,247,237,0.55)' : 'rgba(26,16,8,0.35)')}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2.5 text-xs tracking-widest uppercase transition-all duration-300"
              style={{
                fontFamily: 'var(--font-inter)',
                border: overHero ? '1px solid rgba(255,247,237,0.88)' : '1px solid rgba(15, 42, 31,0.5)',
                color: overHero ? '#FFF7ED' : '#0F2A1F',
                textDecoration: 'none',
                letterSpacing: '0.14em',
                background: overHero ? 'transparent' : 'rgba(255,255,255,0.4)',
                backdropFilter: overHero ? 'none' : 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = overHero ? 'rgba(255,247,237,0.12)' : '#0F2A1F';
                e.currentTarget.style.color = overHero ? '#A8C4B4' : '#FFF7ED';
                e.currentTarget.style.borderColor = overHero ? '#A8C4B4' : '#0F2A1F';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = overHero ? 'transparent' : 'rgba(255,255,255,0.4)';
                e.currentTarget.style.color = overHero ? '#FFF7ED' : '#0F2A1F';
                e.currentTarget.style.borderColor = overHero ? 'rgba(255,247,237,0.88)' : 'rgba(15, 42, 31,0.5)';
              }}
            >
              Member Login
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2 flex flex-col gap-1.5"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: 'block',
                width: 22,
                height: 1.5,
                background: overHero ? '#FFF7ED' : '#0F2A1F',
                borderRadius: 1,
                transition: 'transform 0.3s ease, opacity 0.3s ease, background 0.3s',
                transform: menuOpen
                  ? i === 0 ? 'rotate(45deg) translate(4px,4px)'
                  : i === 1 ? 'scaleX(0)'
                  : 'rotate(-45deg) translate(4px,-4px)'
                  : 'none',
                opacity: menuOpen && i === 1 ? 0 : 1,
              }}
            />
          ))}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden px-6 py-5 flex flex-col gap-5 border-t"
            style={{
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(15, 42, 31,0.14)',
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {NAV.map((item) => {
              const isActive =
                (item.href === '/introduction' && pathname === '/introduction') ||
                (item.href === '/gallery' && pathname === '/gallery');
              return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: isActive ? '#0F2A1F' : 'rgba(15,42,31,0.65)',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {item.label}
              </Link>
              );
            })}
            <Link
              href={user ? '/dashboard/family-book' : '/login'}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-center text-xs tracking-widest uppercase"
              style={{
                fontFamily: 'var(--font-inter)',
                border: '1px solid rgba(15, 42, 31,0.45)',
                color: '#0F2A1F',
                textDecoration: 'none',
                letterSpacing: '0.14em',
              }}
            >
              {user ? 'Portal' : 'Member Login'}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
