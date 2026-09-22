'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWelcomeGate } from '@/context/WelcomeGateContext';

const HERO_VIDEO =
  'https://res.cloudinary.com/bsaqrrl4/video/upload/q_auto:eco/v1790068368/11904662_1280_720_60fps_nhnbbv.mp4';
const HERO_POSTER =
  'https://res.cloudinary.com/bsaqrrl4/video/upload/so_2,w_1600,q_auto,f_jpg/v1790068368/11904662_1280_720_60fps_nhnbbv.jpg';

export default function LoadingScreen() {
  const { ready, active: welcomeActive } = useWelcomeGate();
  const skipAfterWelcome = useRef(false);
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState('init'); // init | reveal | done

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
    const t2 = setTimeout(() => setPhase('done'), 2600);
    const t3 = setTimeout(() => setVisible(false), 3200);
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
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            style={{ zIndex: 0, pointerEvents: 'none' }}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={HERO_POSTER}
            aria-hidden="true"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              background:
                'linear-gradient(180deg, rgba(10,28,20,0.72) 0%, rgba(10,28,20,0.45) 45%, rgba(10,28,20,0.7) 100%)',
            }}
            aria-hidden="true"
          />

          <div
            className="relative flex flex-col items-center gap-6"
            style={{ zIndex: 2 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '1.5px solid rgba(168, 196, 180,0.22)',
                borderTopColor: '#A8C4B4',
              }}
            />

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
                      color: 'rgba(168, 196, 180,0.85)',
                    }}
                  >
                    Welcome to
                  </p>
                  <h1
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '2.6rem',
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
                  <span
                    style={{
                      display: 'block',
                      width: 48,
                      height: 1,
                      marginTop: 8,
                      background:
                        'linear-gradient(90deg, transparent, rgba(168, 196, 180,0.85), transparent)',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
