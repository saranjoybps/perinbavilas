'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useWelcomeGate } from '@/context/WelcomeGateContext';
import { signOutUser } from '@/lib/firebase/auth';
import { useRouter, usePathname } from 'next/navigation';

const NAV = [
  { label: 'Values',   href: '#values'   },
  { label: 'Timeline', href: '#timeline' },
  { label: 'Gallery',  href: '#gallery'  },
  { label: 'Legacy',   href: '#legacy'   },
];

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const { ready, active: welcomeActive } = useWelcomeGate();
  const router            = useRouter();
  const pathname          = usePathname();
  const isAppRoute        = pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard');
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

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: scrolled ? 'rgba(248,250,252,0.94)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(1.5)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(212,175,55,0.14)' : 'none',
        transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
      }}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1.4rem',
              fontWeight: 400,
              color: scrolled ? '#C49B1A' : 'rgba(26,16,8,0.75)',
              letterSpacing: '0.02em',
              transition: 'color 0.3s',
            }}
          >
            Perinba Vilas
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.78rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: scrolled ? 'rgba(26,16,8,0.6)' : 'rgba(26,16,8,0.55)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#C49B1A')}
              onMouseLeave={(e) => (e.target.style.color = scrolled ? 'rgba(26,16,8,0.6)' : 'rgba(26,16,8,0.55)')}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Auth action */}
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
                    color: 'rgba(196,155,26,0.7)',
                    textDecoration: 'none',
                  }}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="px-5 py-2 text-xs tracking-widest uppercase transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-inter)',
                  border: '1px solid rgba(196,155,26,0.45)',
                  color: '#C49B1A',
                  textDecoration: 'none',
                  letterSpacing: '0.14em',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C49B1A'; }}
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
                  color: 'rgba(26,16,8,0.35)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c03020')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(26,16,8,0.35)')}
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
                border: '1px solid rgba(196,155,26,0.5)',
                color: '#C49B1A',
                textDecoration: 'none',
                letterSpacing: '0.14em',
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#C49B1A'; e.currentTarget.style.color = '#FFF7ED'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#C49B1A'; }}
            >
              Member Login
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
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
                background: '#C49B1A',
                borderRadius: 1,
                transition: 'transform 0.3s ease, opacity 0.3s ease',
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

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden px-6 py-5 flex flex-col gap-5 border-t"
            style={{
              background: 'rgba(248,250,252,0.97)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(212,175,55,0.12)',
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(26,16,8,0.6)',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </a>
            ))}
            <Link
              href={user ? '/dashboard' : '/login'}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-center text-xs tracking-widest uppercase"
              style={{
                fontFamily: 'var(--font-inter)',
                border: '1px solid rgba(196,155,26,0.45)',
                color: '#C49B1A',
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
