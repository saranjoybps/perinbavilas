'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext(null);

function preferNativeScroll() {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(max-width: 1023px)').matches ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );
}

export default function LenisProvider({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Native touch scroll on phones/tablets — Lenis often locks mobile scrolling
    if (preferNativeScroll()) {
      lenisRef.current = null;
      return undefined;
    }

    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 0,
    });

    lenisRef.current = lenis;

    const onTick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef}>
      {children}
    </LenisContext.Provider>
  );
}

export function useLenis() {
  return useContext(LenisContext);
}
