'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CloudLayer from '@/components/clouds/CloudLayer';
import { useWelcomeGate } from '@/context/WelcomeGateContext';

export default function LoadingScreen() {
  const { ready, active: welcomeActive } = useWelcomeGate();
  const skipAfterWelcome = useRef(false);
  const [visible, setVisible] = useState(true);
  const [phase,   setPhase]   = useState('init'); // init | reveal | done

  useEffect(() => {
    if (!ready) {
      setVisible(false);
      return;
    }
    if (welcomeActive) {
      skipAfterWelcome.current = true;
      setVisible(false);
      return;
    }
    if (skipAfterWelcome.current) {
      setVisible(false);
      return;
    }
    setVisible(true);
    setPhase('init');
    const t1 = setTimeout(() => setPhase('reveal'), 500);
    const t2 = setTimeout(() => setPhase('done'),  2600);
    const t3 = setTimeout(() => setVisible(false), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [ready, welcomeActive]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #B8DFF8 0%, #D8F0FB 30%, #F4FAFE 60%, #FFF7ED 100%)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          {/* Cloud layers */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <CloudLayer depth="far" />
            <CloudLayer depth="mid" />
          </div>

          {/* Sunlight */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '-5%', right: '12%',
              width: 480, height: 480,
              background: 'radial-gradient(ellipse 65% 55% at 55% 40%, rgba(255,224,80,0.2) 0%, transparent 68%)',
              filter: 'blur(36px)',
            }}
            aria-hidden="true"
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6" style={{ zIndex: 1 }}>
            {/* Spinner */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '1.5px solid rgba(196,155,26,0.18)',
                borderTopColor: '#C49B1A',
              }}
            />

            {/* Text reveal */}
            <AnimatePresence>
              {phase !== 'init' && (
                <motion.div
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.48em',
                      textTransform: 'uppercase',
                      color: 'rgba(196,155,26,0.7)',
                    }}
                  >
                    Welcome to
                  </p>
                  <h1
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '2.6rem',
                      fontWeight: 300,
                      color: '#1A1008',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Perinba Vilas
                  </h1>
                  <span className="gold-rule" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
