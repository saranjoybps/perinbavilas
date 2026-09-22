'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useWelcomeGate } from '@/context/WelcomeGateContext';

const VERSE =
  'For I know the plans I have for you, declares the Lord — plans to give you a hope and a future.';
const REFERENCE = 'Jeremiah 29:11';

function Typewriter({ text, start, onDone, className }) {
  const [shown, setShown] = useState('');
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!start || finished) return undefined;
    setShown('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setFinished(true);
        onDone?.();
      }
    }, 28);
    return () => window.clearInterval(id);
  }, [start, text, finished, onDone]);

  const display = finished ? text : shown;

  return (
    <p className={className} aria-live="polite">
      {display}
      {start && !finished && <span className="promise-caret" aria-hidden="true" />}
    </p>
  );
}

export default function EnvelopeGate() {
  const pathname = usePathname();
  const { ready, active, complete } = useWelcomeGate();
  // boot → typing → invite (ask click) → sealed (seal shows) → opening (go home)
  const [phase, setPhase] = useState('boot');
  const [typingKey, setTypingKey] = useState(0);

  const booting = pathname === '/' && !ready;
  const visible = booting || (ready && active);
  const showCopy = phase === 'typing' || phase === 'invite' || phase === 'sealed' || phase === 'opening';
  const showRef = phase === 'invite' || phase === 'sealed' || phase === 'opening';

  useEffect(() => {
    if (!ready || !active || booting) return undefined;
    setPhase('typing');
    setTypingKey((k) => k + 1);
  }, [ready, active, booting]);

  const handleVerseDone = useCallback(() => {
    window.setTimeout(() => setPhase('invite'), 500);
  }, []);

  const handleClickPromise = () => {
    if (phase !== 'invite') return;
    setPhase('sealed');
  };

  useEffect(() => {
    if (phase !== 'sealed') return undefined;
    const goHome = window.setTimeout(() => {
      setPhase('opening');
      window.setTimeout(complete, 900);
    }, 2800);
    return () => window.clearTimeout(goHome);
  }, [phase, complete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="promise-gate"
          className="promise-gate"
          initial={{ opacity: 1 }}
          animate={
            phase === 'opening'
              ? { opacity: 0, filter: 'blur(8px)', scale: 1.02 }
              : { opacity: 1, filter: 'blur(0px)', scale: 1 }
          }
          exit={{ opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Family promise"
        >
          <div className="promise-gate-bg" aria-hidden="true" />
          <div className="promise-gate-glow promise-gate-glow--tl" aria-hidden="true" />
          <div className="promise-gate-glow promise-gate-glow--br" aria-hidden="true" />

          {/* Decorative florals — same bouquet both corners */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/decorative-2.png"
            alt=""
            aria-hidden="true"
            className="promise-decor promise-decor--tr"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/decorative-2.png"
            alt=""
            aria-hidden="true"
            className="promise-decor promise-decor--bl"
          />

          {!booting && (
            <div className="promise-stage">
              <div className="promise-paper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/paper-sm.png?v=2"
                  alt=""
                  className="promise-paper-img promise-paper-img--sm"
                  draggable={false}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/paper-md-lg.png?v=2"
                  alt=""
                  className="promise-paper-img promise-paper-img--lg"
                  draggable={false}
                />

                <div className="promise-panel">
                  <div className="promise-copy">
                    <p className="promise-kicker">A promise for our family</p>

                    <Typewriter
                      key={typingKey}
                      text={VERSE}
                      start={showCopy}
                      onDone={handleVerseDone}
                      className="promise-verse"
                    />

                    <AnimatePresence>
                      {showRef && (
                        <motion.p
                          className="promise-ref"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          — {REFERENCE}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="promise-action">
                    <AnimatePresence mode="wait">
                      {phase === 'invite' && (
                        <motion.button
                          key="invite-cta"
                          type="button"
                          className="promise-click-btn"
                          onClick={handleClickPromise}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.4 }}
                        >
                          Click to receive the promise
                        </motion.button>
                      )}

                      {(phase === 'sealed' || phase === 'opening') && (
                        <motion.div
                          key="seal-reveal"
                          className="promise-seal-wrap"
                          initial={{ opacity: 0, scale: 0.7, y: 12 }}
                          animate={
                            phase === 'opening'
                              ? { opacity: 0, scale: 1.12, y: -8 }
                              : { opacity: 1, scale: 1, y: 0 }
                          }
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/seal_image.png"
                            alt=""
                            className="promise-seal-img"
                            draggable={false}
                          />
                          <span className="promise-seal-label">Promise sealed</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
