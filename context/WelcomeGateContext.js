'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from '@/context/LenisContext';

gsap.registerPlugin(ScrollTrigger);

export const WELCOME_STORAGE_KEY = 'pv-welcome-opened';
const EXIT_UNLOCK_MS = 900;

const WelcomeGateContext = createContext({
  ready: false,
  active: false,
  complete: () => {},
});

function lockScroll(scrollY) {
  const body = document.body;
  body.dataset.pvScrollY = String(scrollY);
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.style.overscrollBehavior = 'none';
}

function unlockScroll() {
  const body = document.body;
  const y = Number(body.dataset.pvScrollY || 0);
  body.style.position = '';
  body.style.top = '';
  body.style.left = '';
  body.style.right = '';
  body.style.width = '';
  body.style.overflow = '';
  document.documentElement.style.overflow = '';
  document.documentElement.style.overscrollBehavior = '';
  delete body.dataset.pvScrollY;
  window.scrollTo(0, y);
}

export default function WelcomeGateProvider({ children }) {
  const pathname = usePathname();
  const lenisRef = useLenis();
  const dismissedRef = useRef(false);
  const unlockTimerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(false);

  useEffect(() => {
    if (pathname !== '/') {
      setActive(false);
      setScrollLocked(false);
      setReady(true);
      return;
    }

    const force = new URLSearchParams(window.location.search).get('welcome') === '1';
    if (force) {
      dismissedRef.current = false;
      try {
        window.localStorage.removeItem(WELCOME_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setActive(true);
      setScrollLocked(true);
      setReady(true);
      return;
    }

    if (dismissedRef.current) {
      setActive(false);
      setScrollLocked(false);
      setReady(true);
      return;
    }

    const opened = window.localStorage.getItem(WELCOME_STORAGE_KEY) === '1';
    const show = !opened;
    setActive(show);
    setScrollLocked(show);
    setReady(true);
  }, [pathname]);

  // Clear pre-hydration covers once React knows welcome state
  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.remove('pv-welcome-pending');
    // Returning visitors: keep pv-home-booting until LoadingScreen takes over
    if (active) {
      document.documentElement.classList.remove('pv-home-booting');
    }
  }, [ready, active]);

  useEffect(() => {
    const lenis = lenisRef?.current;
    if (!ready) return undefined;

    if (scrollLocked) {
      if (unlockTimerRef.current) {
        window.clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = null;
      }
      lockScroll(window.scrollY || 0);
      lenis?.stop();
    } else {
      unlockScroll();
      lenis?.start();
      // Let layout settle after welcome unlock
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    }

    return () => {
      if (unlockTimerRef.current) {
        window.clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = null;
      }
      unlockScroll();
      lenis?.start();
    };
  }, [scrollLocked, ready, lenisRef]);

  const complete = useCallback(() => {
    if (dismissedRef.current && !active) return;
    dismissedRef.current = true;
    try {
      window.localStorage.setItem(WELCOME_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }

    // Fade starts; keep scroll locked until exit animation finishes
    setActive(false);
    window.scrollTo(0, 0);
    if (document.body.dataset.pvScrollY) {
      document.body.dataset.pvScrollY = '0';
    }

    if (unlockTimerRef.current) window.clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = window.setTimeout(() => {
      setScrollLocked(false);
      unlockTimerRef.current = null;
    }, EXIT_UNLOCK_MS);
  }, [active]);

  return (
    <WelcomeGateContext.Provider value={{ ready, active, complete }}>
      {children}
    </WelcomeGateContext.Provider>
  );
}

export function useWelcomeGate() {
  return useContext(WelcomeGateContext);
}
