'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import CloudLayer from '@/components/clouds/CloudLayer';
import { useWelcomeGate } from '@/context/WelcomeGateContext';

function EnvelopeArt({ opening }) {
  return (
    <div className={`envelope ${opening ? 'is-open' : ''}`}>
      <motion.div
        className="envelope-letter"
        animate={opening ? { y: -78, opacity: 1 } : { y: 10, opacity: 0 }}
        transition={{ duration: 0.65, delay: opening ? 0.22 : 0, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="gold-rule" style={{ width: 36, margin: '0 auto 8px' }} />
        <p className="envelope-letter-kicker">Welcome home</p>
        <p className="envelope-letter-title">Perinba Vilas</p>
      </motion.div>

      <svg
        className="envelope-svg"
        viewBox="0 0 380 240"
        width="380"
        height="240"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="envPaper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF8EE" />
            <stop offset="100%" stopColor="#EED9B4" />
          </linearGradient>
          <linearGradient id="envPocket" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7E8CC" />
            <stop offset="100%" stopColor="#E6C994" />
          </linearGradient>
          <linearGradient id="envFlap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFDF8" />
            <stop offset="100%" stopColor="#E8D0A4" />
          </linearGradient>
          <filter id="envShadow" x="-12%" y="-12%" width="124%" height="130%">
            <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#1A1008" floodOpacity="0.16" />
          </filter>
        </defs>

        <rect x="8" y="58" width="364" height="174" rx="6" fill="url(#envPaper)" filter="url(#envShadow)" />
        <path d="M8 70 L190 168 L372 70 L372 232 Q372 232 366 232 L14 232 Q8 232 8 232 Z" fill="url(#envPocket)" />
        <path d="M8 70 L190 168 L372 70" fill="none" stroke="rgba(196,155,26,0.28)" strokeWidth="1.2" />
      </svg>

      <div className="envelope-flap-wrap">
        <svg viewBox="0 0 380 130" width="380" height="130" aria-hidden="true">
          <defs>
            <linearGradient id="envFlap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFDF8" />
              <stop offset="100%" stopColor="#E8D0A4" />
            </linearGradient>
          </defs>
          <path d="M8 8 L372 8 L190 122 Z" fill="url(#envFlap)" stroke="rgba(196,155,26,0.22)" strokeWidth="1" />
        </svg>
      </div>

      <p className="envelope-family">The Perinba Family</p>

      <motion.div
        className="envelope-seal"
        animate={opening ? { scale: 0.35, opacity: 0, y: 16 } : { scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 72 72" width="72" height="72">
          <defs>
            <radialGradient id="sealGold" cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#F0D878" />
              <stop offset="45%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8A6A10" />
            </radialGradient>
          </defs>
          <circle cx="36" cy="36" r="34" fill="url(#sealGold)" />
          <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,248,220,0.5)" strokeWidth="1.2" />
          <text
            x="36"
            y="43"
            textAnchor="middle"
            fill="#5C4308"
            style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 20, fontWeight: 500 }}
          >
            PV
          </text>
        </svg>
      </motion.div>
    </div>
  );
}

function Envelope({ opening, onOpen }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      disabled={opening}
      aria-label="Open invitation"
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      whileHover={opening ? undefined : { y: -8, scale: 1.02 }}
      whileTap={opening ? undefined : { scale: 0.99 }}
      className="envelope-stage"
    >
      <EnvelopeArt opening={opening} />
      <span className="envelope-cta">Click to open</span>
    </motion.button>
  );
}

export default function EnvelopeGate() {
  const pathname = usePathname();
  const { ready, active, complete } = useWelcomeGate();
  const [opening, setOpening] = useState(false);

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(complete, 1450);
  };

  const booting = pathname === '/' && !ready;
  const visible = booting || (ready && active);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="envelope-gate"
          className="fixed inset-0 z-[180] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Family welcome"
        >
          <div className="absolute inset-0 sky-gradient" />

          <div className="absolute inset-0 pointer-events-none opacity-55" aria-hidden="true">
            <motion.div
              animate={opening ? { y: '-18%', opacity: 0.3 } : { y: 0, opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <CloudLayer depth="far" />
            </motion.div>
          </div>

          <div
            className="absolute pointer-events-none"
            style={{
              top: '6%',
              right: '12%',
              width: 420,
              height: 420,
              background: 'radial-gradient(ellipse 65% 55% at 55% 40%, rgba(255,224,80,0.28) 0%, transparent 68%)',
              filter: 'blur(28px)',
              animation: 'sunPulse 8s ease-in-out infinite',
            }}
            aria-hidden="true"
          />

          {!booting && (
            <div className="relative z-10 flex flex-col items-center px-6">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.46em',
                  textTransform: 'uppercase',
                  color: '#C49B1A',
                  marginBottom: '1.75rem',
                }}
              >
                Est. Generations Past
              </motion.p>

              <Envelope opening={opening} onOpen={handleOpen} />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
