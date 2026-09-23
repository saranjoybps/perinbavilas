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
    }, 22);
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
  // typing → invite → sealed → (complete fades gate away)
  const [phase, setPhase] = useState('boot');
  const [typingKey, setTypingKey] = useState(0);

  // Only mount when we know welcome should show — never flash during localStorage check
  const visible = pathname === '/' && ready && active;
  const showCopy = phase === 'typing' || phase === 'invite' || phase === 'sealed';
  const showRef = phase === 'invite' || phase === 'sealed';

  useEffect(() => {
    if (!visible) return undefined;
    setPhase('typing');
    setTypingKey((k) => k + 1);
  }, [visible]);

  const handleVerseDone = useCallback(() => {
    window.setTimeout(() => setPhase('invite'), 350);
  }, []);

  const handleClickPromise = () => {
    if (phase !== 'invite') return;
    setPhase('sealed');
  };

  useEffect(() => {
    if (phase !== 'sealed') return undefined;
    // Seal shows briefly, then home fades in (was ~3.7s — felt stuck)
    const id = window.setTimeout(() => complete(), 1200);
    return () => window.clearTimeout(id);
  }, [phase, complete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="promise-gate"
          className="promise-gate"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Family promise"
        >
          <div className="promise-gate-bg" aria-hidden="true" />
          <div className="promise-gate-glow promise-gate-glow--tl" aria-hidden="true" />
          <div className="promise-gate-glow promise-gate-glow--br" aria-hidden="true" />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/decorative-2.png"
            alt=""
            aria-hidden="true"
            className="promise-decor promise-decor--tr"
            decoding="async"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/decorative-2.png"
            alt=""
            aria-hidden="true"
            className="promise-decor promise-decor--bl"
            decoding="async"
          />

          {phase !== 'boot' && (
            <div className="promise-stage">
              <div className="promise-paper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/paper-sm.png?v=2"
                  alt=""
                  className="promise-paper-img promise-paper-img--sm"
                  draggable={false}
                  decoding="async"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/paper-md-lg.png?v=2"
                  alt=""
                  className="promise-paper-img promise-paper-img--lg"
                  draggable={false}
                  decoding="async"
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
                          transition={{ duration: 0.4 }}
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
                          transition={{ duration: 0.35 }}
                        >
                          Click to receive the promise
                        </motion.button>
                      )}

                      {phase === 'sealed' && (
                        <motion.div
                          key="seal-reveal"
                          className="promise-seal-wrap"
                          initial={{ opacity: 0, scale: 0.82, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/seal_image.png"
                            alt=""
                            className="promise-seal-img"
                            draggable={false}
                            decoding="async"
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
