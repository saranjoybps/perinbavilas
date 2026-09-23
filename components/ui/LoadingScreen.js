'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWelcomeGate } from '@/context/WelcomeGateContext';

export default function LoadingScreen() {
  const { ready, active: welcomeActive } = useWelcomeGate();
  const skipAfterWelcome = useRef(false);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState('init'); // init | reveal | done

  useEffect(() => {
    if (!ready) {
      setVisible(false);
      return undefined;
    }
    // Welcome gate replaces the loader — never stack both
    if (welcomeActive) {
      skipAfterWelcome.current = true;
      setVisible(false);
      document.documentElement.classList.remove('pv-home-booting');
      return undefined;
    }
    if (skipAfterWelcome.current) {
      setVisible(false);
      document.documentElement.classList.remove('pv-home-booting');
      return undefined;
    }

    setVisible(true);
    setPhase('init');
    // Hand off from dark boot cover → loading screen (no welcome flash)
    document.documentElement.classList.remove('pv-home-booting');
    const t1 = setTimeout(() => setPhase('reveal'), 400);
    const t2 = setTimeout(() => setPhase('done'), 1800);
    const t3 = setTimeout(() => setVisible(false), 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [ready, welcomeActive]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#0F2A1F' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        >
          <div
            className="relative flex flex-col items-center gap-6"
            style={{ zIndex: 2 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1.5px solid rgba(168, 196, 180,0.22)',
                borderTopColor: '#A8C4B4',
              }}
            />

            <AnimatePresence>
              {phase !== 'init' && (
                <motion.div
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.48em',
                      textTransform: 'uppercase',
                      color: 'rgba(168, 196, 180,0.85)',
                    }}
                  >
                    Welcome to
                  </p>
                  <h1
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '2.4rem',
                      fontWeight: 300,
                      color: '#FFF7ED',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Perinba{' '}
                    <em style={{ fontStyle: 'italic', color: '#A8C4B4', fontWeight: 300 }}>
                      Vilas
                    </em>
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
