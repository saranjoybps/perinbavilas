'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLenis } from '@/context/LenisContext';

export const WELCOME_STORAGE_KEY = 'pv-welcome-opened';

const WelcomeGateContext = createContext({
  ready: false,
  active: false,
  complete: () => {},
});

export default function WelcomeGateProvider({ children }) {
  const pathname = usePathname();
  const lenisRef = useLenis();
  const dismissedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (pathname !== '/') {
      setActive(false);
      setReady(true);
      return;
    }

    if (dismissedRef.current) {
      setActive(false);
      setReady(true);
      return;
    }

    const force = new URLSearchParams(window.location.search).get('welcome') === '1';
    const opened = window.localStorage.getItem(WELCOME_STORAGE_KEY) === '1';
    setActive(force || !opened);
    setReady(true);
  }, [pathname]);

  useEffect(() => {
    const lenis = lenisRef?.current;
    if (!ready) return;

    if (active) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      lenis?.stop();
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      lenis?.start();
    }

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      lenis?.start();
    };
  }, [active, ready, lenisRef]);

  const complete = () => {
    dismissedRef.current = true;
    try {
      window.localStorage.setItem(WELCOME_STORAGE_KEY, '1');
    } catch {
      /* ignore quota / private mode */
    }
    setActive(false);
  };

  return (
    <WelcomeGateContext.Provider value={{ ready, active, complete }}>
      {children}
    </WelcomeGateContext.Provider>
  );
}

export function useWelcomeGate() {
  return useContext(WelcomeGateContext);
}
